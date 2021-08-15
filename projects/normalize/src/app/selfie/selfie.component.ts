import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { defer, fromEvent, interval, ReplaySubject, Subscription } from 'rxjs';
import { ConfigService } from '../config.service';
import { delay, filter, first, map, switchMap, take, tap } from 'rxjs/operators';
import { FaceProcessorService } from '../face-processor.service';
import { ApiService } from '../api.service';
import { StateService } from '../state.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-selfie',
  templateUrl: './selfie.component.html',
  styleUrls: ['./selfie.component.less']
})
export class SelfieComponent implements OnInit, AfterViewInit {
  
  @ViewChild('inputVideo') inputVideo: ElementRef;

  private videoStream: MediaStream;
  private completed = new ReplaySubject(1);
  private countdown: Subscription = null;

  public flashActive = false;
  public countdownText = '';
  public videoHeight = 0;

  public started = false;
  public detected = false;
  public src = '';
  public transform = '';
  public maskTransform = '';
  public transformOrigin = '';

  public orientation = '';
  public scale = '';
  public distance = '';
  public maskOverlayTransform = 'scale(1)';


  constructor(private faceProcessor: FaceProcessorService, private api: ApiService, private state: StateService,
              private router: Router, private el: ElementRef) {}

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    defer(async () => this.init()).subscribe(() => {
      console.log('initialized');
    });
  }

  async init() {
    const videoEl: HTMLVideoElement = this.inputVideo.nativeElement;
    const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
    console.log('SUPPORTED', JSON.stringify(supportedConstraints));
    const videoConstraints: any = {};
    if (supportedConstraints.facingMode) { videoConstraints.facingMode = {exact: 'user'}; }
    if (supportedConstraints.height) { videoConstraints.height = {exact: 1280}; }
    if (supportedConstraints.width) { videoConstraints.width = {exact: 720}; }
    console.log('CONSTRAINTS', JSON.stringify(supportedConstraints));
    try {
      this.videoStream = await navigator.mediaDevices
        .getUserMedia({
          video: videoConstraints,
        });
    } catch (e) {
      delete videoConstraints.width;
      delete videoConstraints.height;
      this.videoStream = await navigator.mediaDevices
        .getUserMedia({
          video: videoConstraints,
        });
    }
    console.log('STREAM', this.videoStream.getVideoTracks()[0].getSettings());
    console.log('STREAM SIZE', this.videoStream.getVideoTracks()[0].getSettings().width, this.videoStream.getVideoTracks()[0].getSettings().height);

    videoEl.srcObject = this.videoStream;
    fromEvent(videoEl, 'play').pipe(first()).subscribe(() => {
      setTimeout(() => {
        this.videoHeight = videoEl.offsetHeight;
        console.log('DEFAULT SCALE:', this.el.nativeElement.offsetHeight, videoEl.offsetHeight, this.el.nativeElement.offsetHeight/videoEl.offsetHeight);
        this.faceProcessor.defaultScale = Math.max(
          this.el.nativeElement.offsetWidth/videoEl.offsetWidth,
          this.el.nativeElement.offsetHeight/videoEl.offsetHeight,
          1
        );
        this.maskOverlayTransform = `scale(${videoEl.offsetHeight * 0.675 / 254 * this.faceProcessor.defaultScale})`;
        this.triggerDetectFaces();
      }, 1000);
    });
  }

  triggerDetectFaces() {
    const videoEl: HTMLVideoElement = this.inputVideo.nativeElement;
    this.faceProcessor.processFaces(videoEl, 5)
      .subscribe((event) => {
        // console.log('EVENT', event);
        if (event.kind === 'start') {
          console.log('STARTED!');
          this.started = true;
        } else if (event.kind === 'transform') {
          this.transform = event.transform;
          this.transformOrigin = event.transformOrigin;
          this.maskTransform = event.maskTransform;
          this.distance = (event.distance as Number).toFixed(2);
          this.orientation = (event.orientation as Number).toFixed(1);;
          this.scale = (event.scale as Number).toFixed(2);;
          this.detected = event.snapped;
          console.log('TRANSFORM', event.transform);
        // } else if (event.kind === 'detection') {
          // if (event.detected) {
          //   console.log('DETECTED');
          //   if (!this.countdown) {
          //     console.log('STARTING COUNTDOWN');
          //     this.countdown = this.doCountdown().subscribe((x) => {
          //       console.log('COUNTDOWN DONE', x);
          //       this.completed.next();
          //     })
          //   }
          // } else {
          //   if (this.countdown) {
          //     this.countdown.unsubscribe();
          //     this.countdown = null;
          //     this.countdownText = '';
          //   }
          // }
          // this.detected = event.detected;
        } else if (event.kind === 'done') {
          console.log('GOT EVENT DONE');
          // this.src = event.content;
          console.log('STARTING COUNTDOWN');
          this.countdown = this.doCountdown().subscribe((x) => {
            console.log('COUNTDOWN DONE', x);
            this.completed.next();
          });
          this.state.setOwnInfo({id: 'pending', descriptor: event.descriptor, image: event.image});
          this.state.pushRequest(
            this.api.createNew(event)
            .pipe(
              switchMap((result: any) => {
                if (result.success) {
                  this.state.setOwnInfo(result);
                }
                return this.completed;
              })
            )
          );
          this.completed.pipe(first()).subscribe(() => {
            console.log('completed');
            (this.inputVideo.nativeElement as HTMLVideoElement).remove();
            this.videoStream.getVideoTracks()[0].stop();
            this.router.navigate(['/game']);  
          });
        }
      });
  }

  doCountdown() {
    this.countdownText = '3';
    return interval(1000).pipe(
      take(3),
      map((num) => {
        const count = 2 - num;
        this.countdownText = '' + count;
        if (count === 0) {
          this.flashActive = true;
        }
        return count;
      }),
      filter((count) => count === 0),
      delay(3000)
    );
  }

}