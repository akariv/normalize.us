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

  public detected = false;
  public src = '';
  public transform = '';
  public maskTransform = '';
  public transformOrigin = '';

  public orientation = '';
  public scale = '';
  public distance = '';


  constructor(private faceProcessor: FaceProcessorService, private api: ApiService, private state: StateService, private router: Router) {}

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
    if (supportedConstraints.facingMode) { videoConstraints.facingMode = 'user'; }
    this.videoStream = await navigator.mediaDevices
      .getUserMedia({
        video: videoConstraints,
      });
    videoEl.srcObject = this.videoStream;
    fromEvent(videoEl, 'play').pipe(first()).subscribe(() => {
      setTimeout(() => {
        this.videoHeight = videoEl.offsetHeight;
        this.triggerDetectFaces();
      }, 1000);
    });
  }

  triggerDetectFaces() {
    const videoEl: HTMLVideoElement = this.inputVideo.nativeElement;
    this.faceProcessor.processFaces(videoEl, 5)
      .subscribe((event) => {
        if (event.kind === 'transform') {
          this.transform = event.transform;
          this.transformOrigin = event.transformOrigin;
          this.maskTransform = event.maskTransform;
          this.distance = (event.distance as Number).toFixed(2);
          this.orientation = (event.orientation as Number).toFixed(1);;
          this.scale = (event.scale as Number).toFixed(2);;
          this.detected = event.snapped;
        } else if (event.kind === 'detection') {
          if (event.detected) {
            console.log('DETECTED');
            if (!this.countdown) {
              console.log('STARTING COUNTDOWN');
              this.countdown = this.doCountdown().subscribe((x) => {
                console.log('COUNTDOWN DONE', x);
                this.completed.next();
              })
            }
          } else {
            if (this.countdown) {
              this.countdown.unsubscribe();
              this.countdown = null;
              this.countdownText = '';
            }
          }
          // this.detected = event.detected;
        } else if (event.kind === 'done') {
          console.log('GOT EVENT DONE');
          // this.src = event.content;
          this.state.setRecord({id: 'pending', descriptor: event.descriptor, image: event.content});
          this.state.pushRequest(
            this.api.createNew(event.content, event.descriptor, event.landmarks)
            .pipe(
              switchMap((result: any) => {
                if (result.success) {
                  this.state.setOwnId(result.id);
                }
                return this.completed;
              })
            )
          );
          this.completed.pipe(first()).subscribe(() => {
            console.log('completed');
            (this.inputVideo.nativeElement as HTMLVideoElement).remove();
            this.videoStream.getVideoTracks()[0].stop();
            this.router.navigate(['/']);  
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