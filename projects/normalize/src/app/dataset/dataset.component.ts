import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { from, fromEvent } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { FaceProcessorService } from '../face-processor.service';
import { IMAGES } from './images';

@Component({
  selector: 'app-dataset',
  templateUrl: './dataset.component.html',
  styleUrls: ['./dataset.component.less']
})
export class DatasetComponent implements OnInit, AfterViewInit {

  @ViewChild('image') image: ElementRef;
  url = '';
  preview = '';
  extracted = '';

  constructor(private faceProcessor: FaceProcessorService, private api: ApiService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.getNextImage();
    }, 0);
  }

  pullImage() {
    if (IMAGES.length > 0) {
      this.url = '/assets/selfies/' + IMAGES.shift() + '.jpg';
    }
  }

  getNextImage() {
    this.pullImage();
    const el = this.image.nativeElement;
    let observer: any = null;
    fromEvent(el, 'load').pipe(first()).subscribe(() => {
      console.log('LOADED!');
      this.faceProcessor.processFaces(el, 0)
      .pipe(
        switchMap((event) => {
          if (event.kind === 'start') {
            console.log('START', event);
            observer = event.observer;
          } else if (event.kind === 'transform') {
            this.preview = event.preview;
          } else if (event.kind === 'detection') {
            console.log('DETECTED??', event.detected, event.score);
            if (!event.detected) {
              observer.cancel();
            }
          } else if (event.kind === 'done') {
            console.log('GOT EVENT DONE', event.collected);
            this.extracted = event.content;
            if (event.collected) {
              return this.api.createNew(this.extracted, event.descriptor);
            } else {
              return from([false]);
            }
          }
          return from([]);
        })
      ).subscribe((res) => {
        console.log('UPLOADED', res);
        this.getNextImage(); 
      });
    });
  }
}
