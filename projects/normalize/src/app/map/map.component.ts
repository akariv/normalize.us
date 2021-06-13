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
      this.configuration.grid.forEach((g) => {
        g.pos.x = Math.round(g.pos.x * (this.dim - 1));
        g.pos.y = Math.round(g.pos.y * (this.dim - 1));
      });
      this.ready.next();
    });
  }

  ngAfterViewInit() {
    this.ready.pipe(first()).subscribe(() => {
      const host = this.mapElement.nativeElement as HTMLElement;
      this.maxZoom = Math.log2(Math.min(host.offsetHeight, host.offsetWidth));
      console.log(host.offsetHeight, host.offsetWidth, this.maxZoom);
      this.map = L.map(this.mapElement.nativeElement, {
        crs: L.CRS.Simple,
        maxZoom: this.maxZoom
      });
      const bounds: L.LatLngTuple[] = [[0,0], [this.dim, this.dim]];
      const image = L.imageOverlay('https://normalizing-us-files.fra1.digitaloceanspaces.com/tsne.png', bounds).addTo(this.map);
      this.map.fitBounds(bounds);
      this.map.on('zoomend', (ev) => { return this.onZoomChange(); });
      this.map.on('moveend', (ev) => { return this.onBoundsChange(); });
      const features: geojson.Feature[] = [];
      this.configuration.grid.forEach((g) => {
        const x = g.pos.x;
        const y = this.dim - g.pos.y - 1;
        const r = Math.random() * 0.24;
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
      L.geoJSON(geoJson, {
        style: {
          fill: true,
          fillColor: '#eae7df',
          stroke: false,
          fillOpacity: 1  
        }
      }).addTo(this.map);
      console.log('ADDED GEOJSON');
    });
  }

  onZoomChange() {
    // console.log('ZOOM END', this.map.getZoom());
    this.zoomedMax = this.map.getZoom() === this.maxZoom;
    this.onBoundsChange();
  }

  onBoundsChange() {
    let x = -1;
    let y = -1;
    if (this.zoomedMax) {
      const bounds = this.map.getBounds();
      const pos = bounds.getCenter();
      x = Math.floor(pos.lng);
      y = this.dim - Math.ceil(pos.lat);
    }
    // console.log({x,y});
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
          // console.log(x, y, posX, posY);
          if (x === posX && y === posY) {
            const id = item.id;
            const lat = this.dim - y - 1;
            const lon = x;
            const bounds: L.LatLngTuple[] = [[lat + 0.24, lon + 0.24], [lat + 0.76, lon + 0.76]];
            this.focusedLayerPhoto = L.imageOverlay(
              this.fetchImage.fetchFaceImage(id), bounds
            ).addTo(this.map);
            break;
          }
        }
      }
    }
  }
}
