import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  COLLECTED_FRAMES = 7;
  IMAGE_SIZE = 300;
  NUM_FEATURES = 5;
  FEATURES = {
    eyes: {ratio: 0.5},
    mouth: {ratio: 0.5},
    forehead: {ratio: 0.5},
    face: {ratio: 1},
    nose: {ratio: 1.5},
  };
  TINY = false;

  constructor() { }
}
