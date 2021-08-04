import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { from, ReplaySubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ImageFetcherService {

  constructor(private api: ApiService, private sanitizer: DomSanitizer) { }

  fetchImage(id: string) {
    if (id.indexOf('data:') === 0) {
      return id;
    }
    return `https://normalizing-us-files.fra1.cdn.digitaloceanspaces.com/photos/${id}_full.png`;
  }

  fetchFaceImage(id) {
    return `https://normalizing-us-files.fra1.cdn.digitaloceanspaces.com/photos/${id}_face.png`;
  }
}
