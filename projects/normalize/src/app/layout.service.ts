import { Injectable } from '@angular/core';
import { fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  nativeElement: HTMLElement;
  mobile: boolean;
  desktop: boolean;
  layout: string;
  height = 0;

  constructor() {
    fromEvent(window, 'resize').subscribe(($event) => {
      this.updateView();
    });
    this.updateView();
  }

  updateView(nativeElement?: HTMLElement) {
    if (nativeElement) {
      this.nativeElement = nativeElement;
    }
    if (this.nativeElement) {
      console.log(this.nativeElement, this.nativeElement.offsetWidth);
      this.mobile = this.nativeElement.offsetWidth < 600;
      this.desktop = this.nativeElement.offsetWidth >= 600;
      this.layout = this.mobile ? 'mobile' : 'desktop';
      this.height = this.nativeElement.offsetHeight;
      console.log('LAYOUT', this.layout);
    }
  }

}
