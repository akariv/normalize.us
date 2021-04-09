import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  COLLECTED_FRAMES = 7;
  IMAGE_SIZE = 480;
  NUM_FEATURES = 5;

  constructor() { }
}
