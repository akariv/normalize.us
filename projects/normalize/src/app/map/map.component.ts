import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as L from 'leaflet';
import * as geojson from 'geojson';

import { from, ReplaySubject, Subject } from 'rxjs';
import { delay, first, switchMap, tap } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { ImageFetcherService } from '../image-fetcher.service';
import { NormalityLayer } from './normality-layer';
import { StateService } from '../state.service';
import { LayoutService } from '../layout.service';
import { Router } from '@angular/router';
import { GridItem, ImageItem } from '../datatypes';
import { TSNEOverlay } from './tsne-overlay';
import { FaceApiService } from '../face-api.service';
import { EmailModalComponent } from './email-modal/email-modal.component';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.less']
})
export class MapComponent implements OnInit, AfterViewInit {

  map: L.Map;
  maxZoom: number;
  zoomedMax = false;

  focusedLayerPhoto: L.ImageOverlay;
  focusedLayerPos: {x: number, y: number} = {x: -1, y: -1};

  dim = 13;

  ready = new ReplaySubject(1);

  configuration: any = {};
  tileLayers: any = {};
  _feature = null;
  normalityLayer: NormalityLayer;
  tsneOverlay: TSNEOverlay;
  grid = new ReplaySubject<GridItem[]>(1);

  hasSelfie = false;
  focusedItem: GridItem = null;
  breatheOverlay: L.ImageOverlay = null;
  overlay = true;
  _drawerOpen = true;

  consentModalOpen = false;
  redirectModalOpen = false;
  emailModalOpen = false;

  @ViewChild('map') mapElement:  ElementRef;
  @ViewChild(EmailModalComponent) emailModal: EmailModalComponent;
  
  constructor(private hostElement: ElementRef, private api: ApiService,
              private fetchImage: ImageFetcherService, private state: StateService,
              public layout: LayoutService, private router: Router,
              private faceapi: FaceApiService) {
  }

  ngOnInit(): void {
    this.api.getMapConfiguration().subscribe((config) => {
      this.configuration = config;
      this.dim = this.configuration.dim;
      this.ready.next();
    });
  }

  ngAfterViewInit() {
    console.log('HAS SELFIE', this.state.imageID, this.state.descriptor);
    this.hasSelfie = this.state.imageID || this.state.descriptor;
    this.ready.pipe(
      first(),
      tap(() => { // SET UP MAP
        this.maxZoom = this.configuration.max_zoom;
        // Create map
        this.map = L.map(this.mapElement.nativeElement, {
          crs: L.CRS.Simple,
          maxZoom: this.maxZoom,
          minZoom: this.configuration.min_zoom,
          maxBounds: [[-this.configuration.dim * 2, -this.configuration.dim], [this.configuration.dim, this.configuration.dim * 2]],
          center: [-this.configuration.dim/2, this.configuration.dim/2],
          zoom: this.configuration.min_zoom + 2,
          zoomControl: false,
        });
        if (this.layout.desktop) {
          new L.Control.Zoom({ position: 'bottomleft' }).addTo(this.map);
        }
        // Tile layers
        for (const feature of ['faces', 'mouths', 'eyes', 'noses', 'foreheads']) {
          this.tileLayers[feature] = L.tileLayer(`https://normalizing-us-files.fra1.cdn.digitaloceanspaces.com/feature-tiles/${this.configuration.set}/${feature}/{z}/{x}/{y}`, {
            maxZoom: 9,
            minZoom: this.configuration.min_zoom,
            bounds: [[-this.configuration.dim - 1, 0], [-1, this.configuration.dim]],
            errorTileUrl: '/assets/img/empty.png'
          });
        }
        this.feature = 'faces';
        // Map events
        this.map.on('zoomend', (ev) => { return this.onZoomChange(); });
        this.map.on('moveend', (ev) => { return this.onBoundsChange(); });
        this.map.on('click', (ev: L.LeafletMouseEvent) => {
          const latlng = ev.latlng;
          const x = Math.floor(latlng.lng);
          const y = -Math.ceil(latlng.lat);
          const current = this.focusedItem;
          let proposed = null;
          if (x >= 0 && y >= 0) {
            for (const item of this.configuration.grid) {
              const posX = item.pos.x;
              const posY = item.pos.y;
              if (x === posX && y === posY) {
                proposed = item;
                // console.log('CLICKED', x, y, item);
                break;
              }
            }
          }
          if (current !== proposed || proposed === null) {
            this.drawerOpen = false;
          }
          if (proposed !== null) {
            setTimeout(() => {
              // console.log('OPENING...');
              this.focusedItem = proposed;
              this.drawerOpen = true;
            }, 500);
          }
        });        
      }),
      tap(() => { // SET UP NORMALITY LAYER
        this.normalityLayer = new NormalityLayer(this.map, this.grid);
      }),
      switchMap(() => {
        if (this.state.getOwnItemID() && !this.state.getAskedForEmail()) {
          this.emailModalOpen = true;
          return this.emailModal.closed.pipe(
            tap(() => {
              this.state.setAskedForEmail();
            })
          );
        } else {
          return from([true]);
        }
      }),
      tap(() => { // SET UP TSNE OVERLAY
        this.tsneOverlay = new TSNEOverlay(this.map, this.grid, this.configuration.dim, this.fetchImage, this.maxZoom);
        if (this.state.getOwnImageID()) {
          if (this.state.getDescriptor()) {
            // console.log('HAS DESCRIPTOR');
            const item: ImageItem = {
              id: this.state.getOwnItemID() + '',
              image: this.state.getOwnImageID(),
              descriptor: this.state.getDescriptor(),
              votes: 0,
              tournaments: 0,
              landmarks: this.state.getLandmarks(),
              gender_age: this.state.getGenderAge(),
              geolocation: this.state.getGeolocation(),
            };
            this.tsneOverlay.addImageLayer(item).pipe(
              tap(() => {
                this.overlay = false;
                this.drawerOpen = false;
                this.normalityLayer.refresh();
              }),
              delay(3000),
            ).subscribe((gi) => {
              this.focusedItem = gi;
              this.drawerOpen = true;
            });
        } else {
            // console.log('NO DESCRIPTOR', this.state.getOwnItemID());
            this.api.getImage(this.state.getOwnItemID()).subscribe((item: ImageItem) => {
              console.log('MY ITEM', item);
              this.state.checkItem(item);
              this.tsneOverlay.addImageLayer(item as ImageItem).pipe(
                tap(() => {
                  this.overlay = false;
                  this.drawerOpen = false;
                  this.normalityLayer.refresh();
                }),
                delay(3000),
              ).subscribe((gi) => {
                this.focusedItem = gi;
                this.drawerOpen = true;
              });
            });
          }
        }
        this.grid.next(this.configuration.grid);
      })
    ).subscribe(() => {
      console.log('FINISHED VIEW INIT');
    });
  }

  onZoomChange() {
    // this.zoomedMax = this.map.getZoom() >= this.maxZoom;
    this.onBoundsChange();
  }

  onBoundsChange() {
    let x = -1;
    let y = -1;
    // if (this.zoomedMax) {
    //   const bounds = this.map.getBounds();
    //   const pos = bounds.getCenter();
    //   x = Math.floor(pos.lng);
    //   y = -Math.ceil(pos.lat);
    // }
    if (this.focusedLayerPos.x !== x || this.focusedLayerPos.x !== y) {
      this.focusedLayerPos = {x, y};
      if (this.focusedLayerPhoto) {
        this.focusedLayerPhoto.remove();
        this.focusedLayerPhoto = null;
      }
      if (x >= 0 && y >= 0) {
        for (const item of this.configuration.grid) {
          const posX = item.pos.x;
          const posY = item.pos.y;
          if (x === posX && y === posY) {
            const id = item.id;
            const lat = -1 - y;
            const lon = x;
            const imgTop = lat -0.09050195011;
            const imgLeft = lon + 0.20588;
            const imgSide = 1.08597721996;
            const bounds: L.LatLngTuple[] = [[imgTop, imgLeft], [imgTop + imgSide, imgLeft + imgSide]];
            this.focusedLayerPhoto = L.imageOverlay(
              '/assets/img/normalizi.ng_arrest_card.svg', bounds, {zIndex: 2}
            ).addTo(this.map);
            break;
          }
        }
      }
    }
  }

  set feature(feature: string) {
    if (this._feature) {
      this.map.removeLayer(this.tileLayers[this._feature]);
    }
    this._feature = feature;
    this.tileLayers[this._feature].addTo(this.map);
  }

  get feature(): string {
    return this._feature;
  }

  start() {
    if (this.layout.mobile) {
      this.consentModalOpen = true;
    } else {
      this.redirectModalOpen = true;
    }
  }

  set drawerOpen(open: boolean) {
    this._drawerOpen = open;
    if (this.map && this.focusedItem) {
      const zoom = this.map.getZoom();
      if (open) {
        let options: any = {animate: true};
        if (this.layout.mobile) {
          options.paddingBottomRight = [open ? window.innerHeight * 0.73 : 70, 0]
        } else {
          options.paddingBottomRight = [0, open ? 400 : 0];
        }
        this.map.fitBounds(
          [[-this.focusedItem.pos.y - 1, this.focusedItem.pos.x], [-this.focusedItem.pos.y, this.focusedItem.pos.x + 1]], options
        );
        if (this.breatheOverlay) {
          // precaution
          this.breatheOverlay.remove();
        }
        this.breatheOverlay = new L.ImageOverlay('/assets/img/breathe.svg', 
            [[-this.focusedItem.pos.y - 0.75, this.focusedItem.pos.x + 0.25], [-this.focusedItem.pos.y - 0.25, this.focusedItem.pos.x + 0.75]]).addTo(this.map);
      } else {
        this.map.setView([-this.focusedItem.pos.y - 0.5, this.focusedItem.pos.x + 0.5], zoom);
        if (this.breatheOverlay) {
          this.breatheOverlay.remove();
          this.breatheOverlay = null;
        }
        // this.focusedItem = null;
      }
    }
  } 

  get drawerOpen() {
    return this._drawerOpen;
  }

}
