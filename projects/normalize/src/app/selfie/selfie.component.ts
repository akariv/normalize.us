import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { detectSingleFace, FaceLandmarks68, nets, Point, TinyFaceDetectorOptions } from 'face-api.js';
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
  private tempCanvas2: HTMLCanvasElement;
  private compositionFrame: HTMLCanvasElement;
  // frames: {el: HTMLCanvasElement, box: any}[] = [];
  private skipFrames = 5;
  private frames = 0;
  public preview = '';
  public src = '';
  public transform = '';
  public transformOrigin = '';

  public scoreThresholdHigh = new TinyFaceDetectorOptions({inputSize: 256, scoreThreshold: 0.75});;
  public scoreThresholdLow = new TinyFaceDetectorOptions({inputSize: 256, scoreThreshold: 0.5});;
  public detectorOptions = this.scoreThresholdHigh;

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
    fromEvent(videoEl, 'play').pipe(first()).subscribe(() => {
      setTimeout(() => {
        this.triggerDetectFaces();
      }, 1000);
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

  triggerDetectFaces() {
    // setTimeout(() => {
      requestAnimationFrame(() => this.detectFaces());
    // }, 33);
  }

  async detectFaces() {
    const videoEl: HTMLVideoElement = this.inputVideo.nativeElement;
    if (!this.tempCanvas) {
      this.tempCanvas = document.createElement('canvas');
    }
    const canvas: HTMLCanvasElement = this.tempCanvas;
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ratio = Math.min(videoEl.offsetWidth / videoEl.videoWidth);
    if (!this.tempCanvas2) {
      this.tempCanvas2 = document.createElement('canvas');
    }
    const canvas2: HTMLCanvasElement = this.tempCanvas2;
    canvas2.width = videoEl.videoWidth;
    canvas2.height = videoEl.videoHeight;

    // Copy frame to canvas
    const context = canvas.getContext('2d');
    const context2 = canvas2.getContext('2d');

    if (!nets.tinyFaceDetector.params) {
      await nets.tinyFaceDetector.load('assets/models');
    }
    if (!nets.faceLandmark68TinyNet.params) {
      await nets.faceLandmark68TinyNet.load('assets/models');
    }

    context.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    let result = await detectSingleFace(canvas, this.detectorOptions).withFaceLandmarks(true);
    if (result) {
      console.log('SCORE', result.detection.score);
      this.detectorOptions = this.scoreThresholdLow;

      const landmarks: FaceLandmarks68 = result.landmarks;
      const topPoint = landmarks.positions[27];
      const bottomPoint = landmarks.positions[8];
      const center = topPoint.add(bottomPoint).div(new Point(2, 2));
      const sub = topPoint.sub(bottomPoint);
      // if (sub.y === 0) {
      //   sub._y += 0.00001;
      // }
      const rotation = Math.atan(sub.x / (sub.y ? sub.y : 0.00001));
      const scale = 0.4 * window.innerHeight / (sub.magnitude() * ratio);
      // context.save();
      // // const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      // context2.clearRect(0, 0, canvas2.width, canvas2.height);
      // context2.translate(canvas2.width/2, canvas2.height/2);
      // // context.translate(center.x, center.y);
      // context2.rotate(rotation);
      // context2.translate(-center.x, -center.y);
      // // context.rotate(rotation);
      // // context.translate(-canvas.width/2, -canvas.height/2);
      // context2.drawImage(canvas, 0, 0, canvas2.width, canvas2.height);
      // this.preview = canvas2.toDataURL('png');
      // console.log('ROTATED', rotation/Math.PI*180);

      this.transformOrigin = `${center.x * ratio}px ${center.y * ratio}px`;
      this.transform = `translate(${videoEl.offsetWidth*0.5-center.x * ratio}px,${videoEl.offsetHeight*0.4-center.y * ratio}px)rotate(${rotation}rad)scale(${scale})`;
      // this._transform = `translate(-${videoEl.offsetWidth/2}px,-${videoEl.offsetHeight/2}px)`;//rotate(${rotation}rad)translate(${center.x * ratio}px,${center.y * ratio}px)`;
      // result = await detectSingleFace(canvas2, this.detectorOptions).withFaceLandmarks(true);
      // if (result) {
      //   console.log('SCORE', result.detection.score);
      //   const landmarks: FaceLandmarks68 = result.landmarks;
      //   const nose = landmarks.getNose()
      //   const mouth = landmarks.getMouth()
      //   const leftEye = landmarks.getLeftEye()
      //   const rightEye = landmarks.getRightEye()
      //   const leftEyeBbrow = landmarks.getLeftEyeBrow()
      //   const rightEyeBrow = landmarks.getRightEyeBrow()
      //   const box = result.detection.box;
      //   const forehead = [{x: box.x, y: box.y}, {x: box.x + box.width, y: this.extent(...leftEyeBbrow, ...rightEyeBrow)[1]}];
      //   forehead[0].y -= this.extent(...forehead as Point[])[3];
      //   const face = [{x: box.x, y: box.y}, {x: box.x + box.width, y: box.y + box.height}] as Point[];
        
      //   const dstCanvas: HTMLCanvasElement = this.compositionFrame;
      //   const dstContext = dstCanvas.getContext('2d');
      //   let index = 0;
      //   if (this.skipFrames <= 0) {
      //     for (const feature of [
      //       [...nose],
      //       [...leftEye, ...rightEye, ...leftEyeBbrow, ...rightEyeBrow],
      //       [...mouth],
      //       [...forehead as Point[]],
      //       [...face],
      //     ]) {
      //       const extent = this.extent(...feature);
      //       const center = this.center(index, this.frames, extent[2], extent[3]);
      //       try {
      //         dstContext.drawImage(canvas2, ...extent, ...center);
      //       } catch (exception) {
      //         console.log('FAILED TO COPY', extent, center);
      //       }
      //       index++;
      //     }
      //     // this.frames++;
      //   } else {
      //     this.skipFrames--;
      //   }
      //   console.log('COLLECTED', this.frames);
      // }
    } else {
      this.detectorOptions = this.scoreThresholdHigh;
      // this.transformOrigin = `0 0`;
      // this.transform = `translate(0,0)rotate(0)scale(1)`;  
    }

    if (this.frames < this.config.COLLECTED_FRAMES) {
      this.triggerDetectFaces();
    } else {
      console.log('FINISHED');
      requestAnimationFrame(() => this.processFrames());
    }
  }

  processFrames() {
    this.src = this.compositionFrame.toDataURL('png');
    this.preview = '';
    this.videoStream.getVideoTracks()[0].stop();
    (this.inputVideo.nativeElement as HTMLVideoElement).remove();
  }

}