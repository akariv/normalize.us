import { AfterViewInit, Component, ElementRef } from '@angular/core';
import { LayoutService } from './layout.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements AfterViewInit {

  constructor(private layout: LayoutService, private el: ElementRef) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.layout.updateView(this.el.nativeElement);
    }, 0);
  }
}
