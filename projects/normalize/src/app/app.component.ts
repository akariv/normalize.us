import { AfterViewInit, Component, ElementRef } from '@angular/core';
import { LayoutService } from './layout.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements AfterViewInit {

  constructor(private layout: LayoutService, private el: ElementRef) {
    alert('(v1.10) Normalizi.ng is in early testing phase, please do not share this link yet and send any bug or feedback to mushon@shual.com');
  }

  ngAfterViewInit() { 
    setTimeout(() => {
      this.layout.updateView(this.el.nativeElement);
    }, 0);
  }
}
