import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as L from 'leaflet';
import * as geojson from 'geojson';

import { forkJoin, from, merge, Observable, ReplaySubject, Subject } from 'rxjs';
import { catchError, delay, first, last, map, mergeMap, switchMap, tap } from 'rxjs/operators';
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
  ownGI = null;

  hasSelfie = false;
  focusedItem: GridItem = null;
  breatheOverlay: L.ImageOverlay = null;
  overlay = true;
  _drawerOpen = true;

  consentModalOpen = false;
  redirectModalOpen = false;
  emailModalOpen = false;
  deleteModalOpen = false;

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
    this.hasSelfie = this.state.imageID || this.state.descriptor;
  }

  ngAfterViewInit() {
    console.log('HAS SELFIE', this.state.imageID, this.state.descriptor);
    setTimeout(() => {
      this.hasSelfie = this.state.imageID || this.state.descriptor;
    }, 0);
    let start = from([true]);
    this.state.needsEmail.subscribe(() => {
      if (this.state.getOwnItemID() && !this.state.getAskedForEmail()) {
        this.emailModalOpen = true;
        start = this.emailModal.closed.pipe(
          tap(() => {
            this.state.setAskedForEmail();
          })
        );
      }
    });
    start.pipe(
      switchMap(() => {
        console.log('WAITING FOR READY');
        return this.ready;
      }),
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
                break;
              }
            }
          }
          if (current !== proposed || proposed === null) {
            this.drawerOpen = false;
          }
          if (proposed !== null) {
            setTimeout(() => {
              this.focusedItem = proposed;
              this.drawerOpen = true;
            }, 500);
          }
        });        
      }),
      tap(() => { // SET UP NORMALITY LAYER
        this.normalityLayer = new NormalityLayer(this.map, this.grid);
      }),
      tap(() => { // SET UP TSNE OVERLAY
        this.tsneOverlay = new TSNEOverlay(this.map, this.grid, this.configuration.dim, this.fetchImage, this.maxZoom);
        const items: Observable<ImageItem>[] = [];

        let expectedId = this.state.getOwnItemID();
        if (this.state.getOwnImageID()) {
          if (this.state.getDescriptor()) {
            const item: ImageItem = {
              id: this.state.getOwnItemID(),
              image: this.state.getOwnImageID(),
              descriptor: this.state.getDescriptor(),
              votes: this.state.getVotedSelf(),
              tournaments: 1,
              votes_0: 0,
              tournaments_0: 0,
              votes_1: 0,
              tournaments_1: 0,
              votes_2: 0,
              tournaments_2: 0,
              votes_3: 0,
              tournaments_3: 0,
              votes_4: this.state.getVotedSelf(),
              tournaments_4: 1,
              created_timestamp: new Date().toUTCString(),
              landmarks: this.state.getLandmarks(),
              gender_age: this.state.getGenderAge(),
              geolocation: this.state.getGeolocation(),
            };
            items.push(from([item]));
          } else {
            items.push(
              this.api.getImage(this.state.getOwnItemID()).pipe(
                catchError(() => {
                  return from([{} as ImageItem]);
                }),
                tap((item) => {
                  this.state.checkItem(item);
                }),
              )
            );
            expectedId = null;
          }
        }
        const sharedId = this.state.urlSearchParam('id');
        console.log('share', sharedId);
        if (sharedId) {
          expectedId = parseInt(sharedId);
          items.push(
            this.api.getImage(expectedId)
          );
        }
        if (items.length > 0) {
          let targetGi = null;
          merge(...items).pipe(
            mergeMap((item) => {
              return this.tsneOverlay.addImageLayer(item);
            }),
            tap((gi) => {
              if (gi.item.id === expectedId) {
                targetGi = gi;
              }
              if (gi.item.id === this.state.getOwnItemID()) {
                this.ownGI = gi;
              }
            }),
            last(),
            map(() => {
              let center: L.LatLngExpression = null;
              if (targetGi !== null) {
                this.overlay = false;
                this.drawerOpen = false;
                this.normalityLayer.refresh();

                const pos = targetGi.pos;
                center = [-pos.y - 0.5, pos.x + 0.5];
                this.map.flyTo(this.map.getCenter(), this.maxZoom - 5, {animate: true, duration: 1});
              }
              return center;
            }),
            delay(3000),
          ).subscribe((center) => {
            if (targetGi !== null) {
              this.map.flyTo(center, this.maxZoom, {animate: true, duration: 1});
              this.focusedItem = targetGi;
              this.drawerOpen = true;
            }
          });          
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
    const bounds = this.map.getBounds();
    const weights = [0.5, 0.5];
    if (this.drawerOpen) {
      if (this.layout.mobile) {
        weights[1] = 0.875;
      } else {
        weights[0] = (0.5 - (200 / window.innerWidth));
      }  
    }
    const pos = {
      lng: bounds.getWest() + (bounds.getEast() - bounds.getWest()) * weights[0],
      lat: bounds.getSouth() + (bounds.getNorth() - bounds.getSouth()) * weights[1]
    };
    const x = Math.floor(pos.lng);
    const y = -Math.ceil(pos.lat);
    if (this.focusedLayerPos.x !== x || this.focusedLayerPos.x !== y) {
      this.focusedLayerPos = {x, y};
      for (const item of this.configuration.grid) {
        const posX = item.pos.x;
        const posY = item.pos.y;
        if (x === posX && y === posY) {
          this.focusedItem = item;
          // if (this.drawerOpen) {
          this.updateBreatheOverlay(this.focusedItem.pos);
          // }
          // const id = item.id;
          // const lat = -1 - y;
          // const lon = x;
          // const imgTop = lat -0.09050195011;
          // const imgLeft = lon + 0.20588;
          // const imgSide = 1.08597721996;
          // const bounds: L.LatLngTuple[] = [[imgTop, imgLeft], [imgTop + imgSide, imgLeft + imgSide]];
          // this.focusedLayerPhoto = L.imageOverlay(
          //   '/assets/img/normalizi.ng_arrest_card.svg', bounds, {zIndex: 2}
          // ).addTo(this.map);
          // break;
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

  start(skipConsent?: boolean) {
    if (this.layout.mobile) {
      if (!skipConsent) {
        this.consentModalOpen = true;
      } else {
        this.router.navigate(['/selfie']);
      }
    } else {
      this.redirectModalOpen = true;
    }
    this.drawerOpen = false
  }

  delete() {
    this.drawerOpen = false
    this.deleteModalOpen = true
  }

  focusOnSelf() {
    this.drawerOpen = false;
    const pos = this.ownGI.pos;
    const center: L.LatLngExpression = [-pos.y - 0.5, pos.x + 0.5];
    this.map.flyTo(center, this.maxZoom, {animate: true, duration: 1});
    setTimeout(() => {
      this.focusedItem = this.ownGI;
      this.drawerOpen = true;  
    }, 3000);
  }

  updateBreatheOverlay(pos) {
    if (this.breatheOverlay) {
      // precaution
      this.breatheOverlay.remove();
    }
    this.breatheOverlay = new L.ImageOverlay('/assets/img/breathe.svg', 
        [[-pos.y - 0.75, pos.x + 0.25], [-pos.y - 0.25, pos.x + 0.75]]).addTo(this.map);
  }

  set drawerOpen(open: boolean) {
    this._drawerOpen = open;
    if (this.map && this.focusedItem) {
      const zoom = this.map.getZoom();
      if (open) {
        let options: any = {animate: true};
        if (this.layout.mobile) {
          options.paddingBottomRight = [0, open ? window.innerHeight * 0.73 : 70]
        } else {
          options.paddingBottomRight = [open ? 400 : 0, 0];
        }
        this.map.fitBounds(
          [[-this.focusedItem.pos.y - 1, this.focusedItem.pos.x], [-this.focusedItem.pos.y, this.focusedItem.pos.x + 1]], options
        );
        this.updateBreatheOverlay(this.focusedItem.pos);
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
