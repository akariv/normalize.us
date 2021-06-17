import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { debounceTime, throttle, throttleTime } from 'rxjs/operators';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.less']
})
export class SliderComponent implements OnInit, AfterViewInit, OnDestroy {

  HANDLE_SIZE = 48 + 8;

  @Output() location = new EventEmitter<number>();
  @Output() selected = new EventEmitter<number>();

  @ViewChild('handle') handle: ElementRef;

  subscriptions: Subscription[] = [];
  moveSubscripion: Subscription = null;
  throttled = new Subject<number>();
  width = 0;
  startX = 0;
  position = (window.innerWidth - 16 - this.HANDLE_SIZE) / 2;

  constructor(private el: ElementRef) {
    this.throttled.pipe(
      throttleTime(33),
    ).subscribe((loc) => {
      this.location.next(loc);
    });
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    const handle = this.handle.nativeElement;
    this.width = this.el.nativeElement.offsetWidth - 16 - this.HANDLE_SIZE;
    this.position = this.width / 2;
    this.subscriptions = [
      fromEvent(handle, 'mousedown').subscribe((ev: MouseEvent) => { if (ev.button === 0) { this.mousedown(ev); }}),
      fromEvent(handle, 'touchstart').subscribe((ev: MouseEvent) => { this.mousedown(ev); }),
      
      fromEvent(window, 'mouseup').subscribe((ev: Event) => { this.mouseup(); }),
      fromEvent(window, 'touchend').subscribe((ev: Event) => { this.mouseup(); }),  
    ];
  }

  ngOnDestroy() {
    while (this.subscriptions.length) {
      this.subscriptions.pop().unsubscribe();
    }
  }

  mouseup() {
    if (this.position === this.width) {
      this.selected.next(-1);
    }
    if (this.position === 0) {
      this.selected.next(1);
    }
    this.position = this.width / 2;
    if (this.moveSubscripion) {
      this.moveSubscripion.unsubscribe();
      this.moveSubscripion = null;
    }
    this.location.next(0);
  }

  mousedown(ev) {
    this.startX = this.getX(ev);
    if (this.moveSubscripion) {
      this.moveSubscripion.unsubscribe();
    }
    if (ev instanceof MouseEvent) {
      this.moveSubscripion = fromEvent(window, 'mousemove').subscribe((ev: MouseEvent) => { this.mousemove(ev); });
    } else {
      this.moveSubscripion = fromEvent(window, 'touchmove').subscribe((ev: MouseEvent) => { this.mousemove(ev); });
    }
  }

  mousemove(ev) {
    const x = this.getX(ev);
    this.position = this.width/2 + x - this.startX;
    this.position = Math.min(this.position, this.width);
    this.position = Math.max(this.position, 0);
    this.throttled.next((this.width/2 - this.position) / (this.width/2));
  }

  getX(ev) {
    let x = 0;
    if (ev instanceof MouseEvent) {
      x = ev.clientX;
    } else if (ev instanceof TouchEvent) {
      x = ev.touches.item(0).clientX;
    }
    return x;
  }

}
