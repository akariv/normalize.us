import { Injectable } from '@angular/core';
import * as faceapi from 'face-api.js';
import { defer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FaceApiService {

  constructor() {
    defer(this.loadModels).subscribe(() => {
      console.log('FACEAPI LOADED', faceapi.nets);
    });
  }

  async loadModels() {
    await faceapi.loadFaceLandmarkTinyModel('assets/models');
    await faceapi.loadTinyFaceDetectorModel('assets/models');
  }
}

