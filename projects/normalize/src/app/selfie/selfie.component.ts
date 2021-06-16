import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { defer, fromEvent } from 'rxjs';
import { ConfigService } from '../config.service';
import { first } from 'rxjs/operators';
import { FaceProcessorService } from '../face-processor.service';

@Component({
  selector: 'app-selfie',
  templateUrl: './selfie.component.html',
  styleUrls: ['./selfie.component.less']
})
export class SelfieComponent implements OnInit, AfterViewInit {
  
  @ViewChild('inputVideo') inputVideo: ElementRef;

  private videoStream: MediaStream;
  public detected = false;
  public src = '';
  public transform = '';
  public transformOrigin = '';

  public orientation = '';
  public scale = '';
  public distance = '';

  constructor(private faceProcessor: FaceProcessorService) {}

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    defer(async () => this.init()).subscribe(() => {
      console.log('initialized');
    });
  }

  async init() {
    const videoEl: HTMLVideoElement = this.inputVideo.nativeElement;
    const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
    console.log('SUPPORTED', supportedConstraints);
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

  triggerDetectFaces() {
    const videoEl: HTMLVideoElement = this.inputVideo.nativeElement;
    this.faceProcessor.processFaces(videoEl, 50)
      .subscribe((event) => {
        if (event.kind === 'transform') {
          this.transform = event.transform;
          this.transformOrigin = event.transformOrigin;
          this.distance = (event.distance as Number).toFixed(2);
          this.orientation = (event.orientation as Number).toFixed(1);;
          this.scale = (event.scale as Number).toFixed(2);;
        } else if (event.kind === 'detection') {
          this.detected = event.detected;
        } else if (event.kind === 'done') {
          console.log('GOT EVENT DONE');
          this.src = event.content;
          this.videoStream.getVideoTracks()[0].stop();
          (this.inputVideo.nativeElement as HTMLVideoElement).remove();      
        }
      });
  }

}