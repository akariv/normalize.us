import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { FaceApiService } from './face-api.service';

@Injectable({
  providedIn: 'root'
})
export class FaceProcessorService {

  constructor(private faceapi: FaceApiService, private config: ConfigService) { }

  processFaces(el: HTMLElement) {
    const compositionFrame = this.getCompositionFrame();

    
  }

  getCompositionFrame(): HTMLCanvasElement {
    const compositionFrame: HTMLCanvasElement = document.createElement('canvas');
    compositionFrame.width = this.config.NUM_FEATURES * this.config.IMAGE_SIZE;
    compositionFrame.height = this.config.COLLECTED_FRAMES * this.config.IMAGE_SIZE;
    return compositionFrame;
  }
}
