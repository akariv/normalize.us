import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { detectSingleFace, nets, Point, TinyFaceDetectorOptions } from 'face-api.js';
import { config, defer, fromEvent } from 'rxjs';
import { ConfigService } from '../config.service';
import { FaceApiService } from '../face-api.service';
import { first, delay } from 'rxjs/operators';

@Component({
  selector: 'app-selfie',
  templateUrl: './selfie.component.html',
  styleUrls: ['./selfie.component.less']
})
export class SelfieComponent implements OnInit, AfterViewInit {
  
  @ViewChild('inputVideo') inputVideo: ElementRef;

  private videoStream: MediaStream;
  private tempCanvas: HTMLCanvasElement;
  private compositionFrame: HTMLCanvasElement;
  // frames: {el: HTMLCanvasElement, box: any}[] = [];
  private frames = 0;
  public src = '';

  constructor(private faceapi: FaceApiService, private config: ConfigService) {}

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    defer(async () => this.init()).subscribe(() => {
      console.log('initialized');
    });
    // const canvas: HTMLCanvasElement = this.outputImage.nativeElement;
    this.compositionFrame = document.createElement('canvas');
    this.compositionFrame.width = this.config.NUM_FEATURES * this.config.IMAGE_SIZE;
    this.compositionFrame.height = this.config.COLLECTED_FRAMES * this.config.IMAGE_SIZE;
  }

  async init() {
    const videoEl: HTMLVideoElement = this.inputVideo.nativeElement;
    const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
    const videoConstraints: any = {};
    let audioConstraints: any = {};
    if (supportedConstraints.facingMode) { videoConstraints.facingMode = 'user'; }
    this.videoStream = await navigator.mediaDevices
      .getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      });
    videoEl.srcObject = this.videoStream;
    fromEvent(videoEl, 'play').pipe(first(), delay(200)).subscribe(async () => {
      await this.detectFaces();
    });
  }

  extent(...points: Point[]): [number, number, number, number] {
    const minX = Math.min(...points.map((p: Point) => p.x));
    const minY = Math.min(...points.map((p: Point) => p.y));
    const maxX = Math.max(...points.map((p: Point) => p.x));
    const maxY = Math.max(...points.map((p: Point) => p.y));
    return [minX, minY, maxX - minX, maxY - minY];
  }

  center(index, frame, width, height): [number, number, number, number] {
    const ratio = Math.min(this.config.IMAGE_SIZE / width, this.config.IMAGE_SIZE / height);
    const tgtWidth = Math.min(width * ratio, this.config.IMAGE_SIZE);
    const tgtHeight = Math.min(height * ratio, this.config.IMAGE_SIZE);
    const x = (this.config.IMAGE_SIZE - tgtWidth) / 2;
    const y = (this.config.IMAGE_SIZE - tgtHeight) / 2;
    return [index * this.config.IMAGE_SIZE + x, frame * this.config.IMAGE_SIZE + y, tgtWidth, tgtHeight];
  }

  async detectFaces() {
    const videoEl: HTMLVideoElement = this.inputVideo.nativeElement;
    if (!this.tempCanvas) {
      this.tempCanvas = document.createElement('canvas');
    }
    const canvas: HTMLCanvasElement = this.tempCanvas;
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;

    // Copy frame to canvas
    var context = canvas.getContext('2d');
    context.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    const inputSize = 128;
    const scoreThreshold = 0.5;
    const options = new TinyFaceDetectorOptions({ inputSize, scoreThreshold });
    if (!nets.tinyFaceDetector.params) {
      await nets.tinyFaceDetector.load('assets/models');
    }
    if (!nets.faceLandmark68TinyNet.params) {
      await nets.faceLandmark68TinyNet.load('assets/models');
    }
    const result = await detectSingleFace(canvas, options).withFaceLandmarks(true);
    if (result) {
      console.log('SCORE', result.detection.score);
      const landmarks = result.landmarks;
      const nose = landmarks.getNose()
      const mouth = landmarks.getMouth()
      const leftEye = landmarks.getLeftEye()
      const rightEye = landmarks.getRightEye()
      const leftEyeBbrow = landmarks.getLeftEyeBrow()
      const rightEyeBrow = landmarks.getRightEyeBrow()
      const box = result.detection.box;
      const forehead = [{x: box.x, y: box.y}, {x: box.x + box.width, y: this.extent(...leftEyeBbrow, ...rightEyeBrow)[1]}];
      forehead[0].y -= this.extent(...forehead as Point[])[3];
      const face = [{x: box.x, y: box.y}, {x: box.x + box.width, y: box.y + box.height}] as Point[];
      const e = this.extent(...face);
      
      const dstCanvas: HTMLCanvasElement = this.compositionFrame;
      const dstContext = dstCanvas.getContext('2d');
      let index = 0;
      for (const feature of [
        [...nose],
        [...leftEye, ...rightEye, ...leftEyeBbrow, ...rightEyeBrow],
        [...mouth],
        [...forehead as Point[]],
        [...face],
      ]) {
        const extent = this.extent(...feature);
        const center = this.center(index, this.frames, extent[2], extent[3]);
        try {
          dstContext.drawImage(canvas, ...extent, ...center);
        } catch (exception) {
          console.log('FAILED TO COPY', extent, center);
        }
        index++;
      }
      this.frames++;
      console.log('COLLECTED', this.frames);
    }

    if (this.frames < this.config.COLLECTED_FRAMES) {
      setTimeout(() => {
        requestAnimationFrame(() => this.detectFaces());
      }, 33);
    } else {
      console.log('FINISHED');
      requestAnimationFrame(() => this.processFrames());
    }
  }

  processFrames() {
    this.src = this.compositionFrame.toDataURL('png');
    this.videoStream.getVideoTracks()[0].stop();
    (this.inputVideo.nativeElement as HTMLVideoElement).remove();
  }
}