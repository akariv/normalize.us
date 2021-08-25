import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { map } from 'rxjs/operators';

import * as showdown from 'showdown';

@Component({
  selector: 'app-about-card',
  templateUrl: './about-card.component.html',
  styleUrls: ['./about-card.component.less']
})
export class AboutCardComponent implements OnInit {

  @Input() showStart = false;
  @Output() start = new EventEmitter<void>();
  
  converter: showdown.Converter;
  html: any;

  constructor(private sanitizer: DomSanitizer, private http: HttpClient) {
    this.converter = new showdown.Converter({
      customizedHeaderId: true,
      openLinksInNewWindow: true,
    });
    this.http.get(`assets/about.md`, {responseType: 'text'}).pipe(
      map((text) => {
        const html = this.converter.makeHtml(text);
        this.html = this.sanitizer.bypassSecurityTrustHtml(html);
      })
    ).subscribe(() => {
      console.log('ABOUT loaded');
    });
  }

  ngOnInit(): void {
  }

}
