import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as L from 'leaflet';
import * as geojson from 'geojson';

import { ReplaySubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { ImageFetcherService } from '../image-fetcher.service';
import { features } from 'node:process';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.less']
})
export class MapComponent implements OnInit, AfterViewInit {

  map: L.Map;
  maxZoom: number;
  maxZoom2: number;
  zoomedMax = false;
  focusedLayerPhoto: L.ImageOverlay;
  focusedLayerPos: {x: number, y: number} = {x: -1, y: -1};
  dim = 13;
  ready = new ReplaySubject(1);
  configuration: any = {};

  @ViewChild('map') mapElement:  ElementRef;

  constructor(private hostElement: ElementRef, private api: ApiService,
              private fetchImage: ImageFetcherService) { }

  ngOnInit(): void {
    this.api.getMapConfiguration().subscribe((config) => {
      this.configuration = config;
      this.dim = this.configuration.dim;
      this.ready.next();
    });
  }

  ngAfterViewInit() {
    this.ready.pipe(first()).subscribe(() => {
      const host = this.mapElement.nativeElement as HTMLElement;
      this.maxZoom = Math.log2(Math.min(host.offsetHeight, host.offsetWidth));
      this.maxZoom2 = this.maxZoom - 1;
      // this.configuration.minZoom = 4;
      this.map = L.map(this.mapElement.nativeElement, {
        crs: L.CRS.Simple,
        maxZoom: this.maxZoom,
        minZoom: this.configuration.min_zoom,
        maxBounds: [[-this.configuration.dim - 1, 0], [-1, this.configuration.dim]],
        center: [-this.configuration.dim/2, this.configuration.dim/2],
        zoom: this.maxZoom - Math.log2(this.configuration.dim)
      });
      L.tileLayer('https://normalizing-us-files.fra1.cdn.digitaloceanspaces.com/tiles/{z}/{x}/{y}', {
          maxZoom: 18,
          minZoom: this.configuration.min_zoom,
          bounds: [[-this.configuration.dim - 1, 0], [-1, this.configuration.dim]],
          errorTileUrl: '/assets/img/empty.png'
      }).addTo(this.map);
      // const bounds: L.LatLngTuple[] = [[0,0], [this.dim, this.dim]];
      // const image = L.imageOverlay('https://normalizing-us-files.fra1.digitaloceanspaces.com/tsne.png', bounds).addTo(this.map);
      // this.map.fitBounds(bounds);
      this.map.on('zoomend', (ev) => { return this.onZoomChange(); });
      this.map.on('moveend', (ev) => { return this.onBoundsChange(); });
      const features: geojson.Feature[] = [];
      this.configuration.grid.forEach((g) => {
        const x = g.pos.x;
        const y = - 1 - g.pos.y;
        const r = 0.24 * (1.0 - (g.item.tournaments ? (g.item.votes * 1.0) / g.item.tournaments : 0));
        features.push({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [x + r, y + r], [x + 1 - r, y + r], [x + 1 - r, y + 1 - r], [x + r, y + 1 - r]
              ],
              [
                [x + 0.25, y + 0.25], [x + 0.75, y + 0.25], [x + 0.75, y + 0.75], [x + 0.25, y + 0.75]
              ],
            ]              
          }
        });
      });
      const geoJson: geojson.FeatureCollection<any, any> = {type: 'FeatureCollection', features: features};
      this.map.createPane('borders');
      this.map.getPane('borders').style.zIndex = '10';
      L.geoJSON(geoJson, {
        style: {
          fill: true,
          fillColor: '#eae7df',
          stroke: false,
          fillOpacity: 1  
        },
        pane: 'borders'
      }).addTo(this.map);
    });
  }

  onZoomChange() {
    this.zoomedMax = this.map.getZoom() >= this.maxZoom2;
    this.onBoundsChange();
  }

  onBoundsChange() {
    let x = -1;
    let y = -1;
    if (this.zoomedMax) {
      const bounds = this.map.getBounds();
      const pos = bounds.getCenter();
      x = Math.floor(pos.lng);
      y = -Math.ceil(pos.lat);
    }
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
}
