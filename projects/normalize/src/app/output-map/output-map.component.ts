import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

import * as L from 'leaflet';
import { ApiService } from '../api.service';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-output-map',
  templateUrl: './output-map.component.html',
  styleUrls: ['./output-map.component.less']
})
export class OutputMapComponent implements OnInit {

  @ViewChild('map') mapElement: ElementRef;
  map: L.Map;
  tileLayers: any = {};
  _feature = 'faces';
  
  constructor(private layout: LayoutService) {}

  ngOnInit(): void {
  }

  ngAfterViewInit() {
  }

  getMap(configuration) {
    if (!this.map) {
      this.map = L.map(this.mapElement.nativeElement, {
        crs: L.CRS.Simple,
        maxZoom: configuration.max_zoom,
        minZoom: configuration.min_zoom,
        maxBounds: [[-configuration.dim * 2, -configuration.dim], [configuration.dim, configuration.dim * 2]],
        center: [-configuration.dim/2, configuration.dim/2],
        zoom: configuration.min_zoom + 2,
        zoomControl: false,
      });
      if (this.layout.desktop) {
        new L.Control.Zoom({ position: 'bottomleft' }).addTo(this.map);
      }
      // Tile layers
      for (const feature of ['faces', 'mouths', 'eyes', 'noses', 'foreheads']) {
        this.tileLayers[feature] = L.tileLayer(`https://normalizing-us-files.fra1.cdn.digitaloceanspaces.com/feature-tiles/${configuration.set}/${feature}/{z}/{x}/{y}`, {
          maxZoom: 9,
          minZoom: configuration.min_zoom,
          bounds: [[-configuration.dim - 1, 0], [-1, configuration.dim]],
          errorTileUrl: '/assets/img/empty.png'
        });
      }  
    }
    return this.map;
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

}
