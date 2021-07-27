import * as L from 'leaflet';
import { Observable } from "rxjs";
import { euclideanDistance } from 'face-api.js';
import { GridItem, ImageItem } from '../datatypes';

class Overlaid {
  image: GridItem;
  overlay: L.ImageOverlay;
}


export class TSNEOverlay {

  grid: GridItem[];
  imageLayers: L.ImageOverlay[] = [];

  constructor(private map: L.Map, private gridObs: Observable<any[]>) {
    this.map.createPane('tsne-overlay');
    this.map.getPane('tsne-overlay').style.zIndex = '9';
    this.gridObs.subscribe(grid => {
      this.grid = grid;
    });
  }
  
  addImageLayer(image: ImageItem) {
    const bestImage = Math.min(...this.grid.map((gi) => {
      const d: number = euclideanDistance(image.descriptor, gi.descriptor);
      return d;
    }));
  }

}