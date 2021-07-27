import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { defer, from, fromEvent } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { FaceApiService } from '../face-api.service';
import { FaceProcessorService } from '../face-processor.service';
import * as faceapi from 'face-api.js';

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
  images: any[] = [];
  datasetSnap = {
    orientaton: 100,
    size: 100,
    distance: 10
  };
  imageUrl = '';

  constructor(private faceProcessor: FaceProcessorService, private faceApi: FaceApiService, private api: ApiService, private http: HttpClient) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
  }

  testUrl(event: Event) {
    const name = (event.target as HTMLInputElement).value;
    const index_url = `https://storage.googleapis.com/selfie-datasets/${name}/index.json?a`;
    this.http.get(index_url).subscribe((results: any[]) => {
      this.images = results.map(x => `https://storage.googleapis.com/selfie-datasets/${name}/${x}`);
      setTimeout(() => {
        this.getNextImage();
      }, 0);
    });
  }

  pullImage() {
    if (this.images.length > 0) {
      return this.images.shift();
    }
  }

  getNextImage() {
    let observer: any = null;
    this.faceApi.ready
    .pipe(
      switchMap(() => {
        const imageUrl = this.pullImage();
        this.imageUrl = imageUrl;
        return faceapi.fetchImage(imageUrl);
      }),
      switchMap((img) => {
        console.log('LOADED!');
        return this.faceProcessor.processFaces(img, 0, this.datasetSnap);
      }),
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
          this.extracted = event.image;
          if (event.collected) {
            return this.api.createNew(event);
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
  }

  get hasList() : boolean {
    return this.images.length > 0;
  }

}
