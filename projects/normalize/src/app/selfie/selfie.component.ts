import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { defer, from, fromEvent, interval, ReplaySubject, Subject, Subscription } from 'rxjs';
import { ConfigService } from '../config.service';
import { debounceTime, delay, filter, first, map, switchMap, take, tap, throttleTime } from 'rxjs/operators';
import { FaceProcessorService } from '../face-processor.service';
import { ApiService } from '../api.service';
import { StateService } from '../state.service';
import { Router } from '@angular/router';

const PROMPTS = {
  initial: ['', ''],
  getting_ready: ['Hold on', `we're getting things ready`],
  no_detection: ['Please bring your face', 'into the red frame'],
  too_far: ['Please bring the camera', 'closer to your face'],
  too_close: [`You're too close...`, 'move a bit farther away'],
  not_aligned: ['Please', 'align your face'],
  hold_still: ["Hold still...", 'look straight forward'],
  hold_still2: ["Hold still...", 'just a few more seconds'],
}

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
  public prompts = PROMPTS.getting_ready;
  public promptsStream = new Subject<string[]>();

  public svgHack = false;


  constructor(private faceProcessor: FaceProcessorService, private api: ApiService, private state: StateService,
              private router: Router, private el: ElementRef) {
      this.promptsStream.pipe(
        throttleTime(500),
      ).subscribe((prompts) => {
        this.prompts = prompts;
      });
  }

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
    if (supportedConstraints.height) { videoConstraints.height = {min: 960}; }
    if (supportedConstraints.width) { videoConstraints.width = {min: 540}; }
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
    console.log('STREAM SIZE', this.videoStream.getVideoTracks()[0].getSettings().width, this.videoStream.getVideoTracks()[0].getSettings().height);

    videoEl.srcObject = this.videoStream;
    fromEvent(videoEl, 'play').pipe(
      first(),
      delay(1000),
      tap(() => {
        this.videoHeight = videoEl.offsetHeight;
        this.faceProcessor.defaultScale = Math.max(
          this.el.nativeElement.offsetWidth/videoEl.offsetWidth,
          this.el.nativeElement.offsetHeight/videoEl.offsetHeight,
          1
        );
        this.maskOverlayTransform = `scale(${videoEl.offsetHeight * 0.675 / 254 * this.faceProcessor.defaultScale})`;
        // this.maskOverlayTransform = `scale(${videoEl.offsetHeight * 0.675 / 254})`;
        this.triggerDetectFaces();
      })
    ).subscribe(() => {
        console.log('DETECTING FACES...');
    });
  }

  triggerDetectFaces() {
    const videoEl: HTMLVideoElement = this.inputVideo.nativeElement;
    console.log('DETECTING FACES...');
    this.faceProcessor.processFaces(videoEl, 5)
      .subscribe((event) => {
        // console.log('EVENT', event);
        if (event.kind === 'start') {
          console.log('STARTED!');
          this.prompts = PROMPTS.no_detection;
          this.started = true;
        } else if (event.kind === 'transform') {
          this.transform = event.transform;
          this.transformOrigin = event.transformOrigin;
          this.maskTransform = event.maskTransform;
          this.distance = (event.distance as Number).toFixed(2);
          this.orientation = (event.orientation as Number).toFixed(1);;
          this.scale = (event.scale as Number).toFixed(2);;
          this.detected = event.snapped;
          if (event.snapped) {
            this.promptsStream.next(PROMPTS.hold_still);
          } else {
            setTimeout(() => {
              if (event.problem) {
                this.promptsStream.next(PROMPTS[event.problem]);
              } else {
                this.promptsStream.next(PROMPTS.no_detection);
              }
            });
          }
          // console.log('TRANSFORM', event.transform);
        } else if (event.kind === 'detection') {
          if (!event.detected) {
            this.promptsStream.next(PROMPTS.no_detection);
          }
        } else if (event.kind === 'done') {
          // console.log('GOT EVENT DONE');
          // this.src = event.content;
          // console.log('STARTING COUNTDOWN');
          this.prompts = PROMPTS.hold_still2;
          this.promptsStream.next(PROMPTS.hold_still2);
          this.state.setOwnInfo({id: 'pending', descriptor: event.descriptor, image: event.image, landmarks: event.landmarks, gender_age: event.gender_age});
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
          this.countdown = this.doCountdown().subscribe((x) => {
            // console.log('COUNTDOWN DONE', x);
            this.completed.next();
          });
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
    this.svgHack = true;
    return from([true]).pipe(
      delay(0),
      tap(() => {
        this.svgHack = false;
      }),
      switchMap(() => interval(1000)),
      take(3),
      map((num) => {
        const count = 2 - num;
        this.countdownText = '' + count;
        if (count === 0) {
          this.flashActive = true;
        }
        this.svgHack = true;
        return count;
      }),
      delay(0),
      tap(() => {
        this.svgHack = false;
      }),
      filter((count) => count === 0),
      delay(3000)
    );
  }

}