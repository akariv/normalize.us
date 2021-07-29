import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as L from 'leaflet';
import * as geojson from 'geojson';

import { ReplaySubject, Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { ImageFetcherService } from '../image-fetcher.service';
import { NormalityLayer } from './normality-layer';
import { StateService } from '../state.service';
import { LayoutService } from '../layout.service';
import { Router } from '@angular/router';

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
  grid = new Subject<any[]>();

  hasSelfie = false;
  info = true;

  @ViewChild('map') mapElement:  ElementRef;

  constructor(private hostElement: ElementRef, private api: ApiService,
              private fetchImage: ImageFetcherService, private state: StateService,
              private layout: LayoutService, private router: Router) {
    this.hasSelfie = this.state.imageID || this.state.ownRecord;
  }

  ngOnInit(): void {
    this.api.getMapConfiguration().subscribe((config) => {
      this.configuration = config;
      this.dim = this.configuration.dim;
      this.ready.next();
    });
  }

  ngAfterViewInit() {
    this.ready.pipe(first()).subscribe(() => {
      this.maxZoom = this.configuration.max_zoom;
      // Create map
      this.map = L.map(this.mapElement.nativeElement, {
        crs: L.CRS.Simple,
        maxZoom: this.maxZoom,
        minZoom: this.configuration.min_zoom,
        maxBounds: [[-this.configuration.dim, 0], [0, this.configuration.dim]],
        center: [-this.configuration.dim/2, this.configuration.dim/2],
        zoom: this.maxZoom,
        zoomControl: false,
      });
      if (this.layout.desktop) {
        new L.Control.Zoom({ position: 'bottomleft' }).addTo(this.map);
      }

      // Tile layers
      for (const feature of ['faces', 'mouths', 'eyes', 'noses', 'foreheads']) {
        this.tileLayers[feature] = L.tileLayer(`https://normalizing-us-files.fra1.cdn.digitaloceanspaces.com/feature-tiles/0/${feature}/{z}/{x}/{y}`, {
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
      // Normality layer
      this.normalityLayer = new NormalityLayer(this.map, this.grid);
      this.grid.next(this.configuration.grid);
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
    this.router.navigate(['/selfie']);
  }
}
