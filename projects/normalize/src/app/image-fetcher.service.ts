import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { from, ReplaySubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ImageFetcherService {

  private cache: any = {};

  constructor(private api: ApiService, private sanitizer: DomSanitizer) { }

  fetchImage(id) {
    if (!this.cache[id]) {
      console.log('ID', id, 'NOT IN CACHE');
      const rs = new ReplaySubject<SafeUrl>(1);
      this.cache[id] = rs;
      this.api.getImage(id).subscribe((image) => {
        rs.next(this.sanitizer.bypassSecurityTrustUrl(image));
      })
    }
    return this.cache[id].pipe(first());
  }
}
