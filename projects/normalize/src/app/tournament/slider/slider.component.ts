import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { debounceTime, throttle, throttleTime } from 'rxjs/operators';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.less']
})
export class SliderComponent implements OnInit, AfterViewInit, OnDestroy {

  HANDLE_SIZE = 48 + 8;

  @Input() state = '';
  @Output() location = new EventEmitter<number>();
  @Output() selected = new EventEmitter<number>();

  @ViewChild('handleLeft') handleLeft: ElementRef;
  @ViewChild('handleRight') handleright: ElementRef;

  subscriptions: Subscription[] = [];
  moveSubscripion: Subscription = null;
  throttled = new Subject<number>();
  width = 0;
  startX = 0;
  position = 0;
  opacity = [null, null]

  constructor(private el: ElementRef) {
    this.throttled.pipe(
      throttleTime(33),
    ).subscribe((loc) => {
      this.location.next(loc);
    });
  }

  ngOnInit(): void {
  }

  ngOnChanges() {
    this.opacity = [1, 1]
    if (this.state === 'start') {
      this.position = 0;
      this.opacity = [1, 1];
      this.location.next(0);
    }
  }

  ngAfterViewInit() {
    const handles = [this.handleLeft, this.handleright];
    this.width = this.el.nativeElement.offsetWidth - 128 - this.HANDLE_SIZE;
    for (const idx of [0, 1]) {
      const handle = handles[idx].nativeElement;
      this.subscriptions.push(...[
        fromEvent(handle, 'mousedown').subscribe((ev: MouseEvent) => { if (ev.button === 0) { this.mousedown(idx, ev); }}),
        fromEvent(handle, 'touchstart').subscribe((ev: MouseEvent) => { this.mousedown(idx, ev); }),
        
        fromEvent(window, 'mouseup').subscribe((ev: Event) => { this.mouseup(idx); }),
        fromEvent(window, 'touchend').subscribe((ev: Event) => { this.mouseup(idx); }),  
      ]);
    }
  }

  ngOnDestroy() {
    while (this.subscriptions.length) {
      this.subscriptions.pop().unsubscribe();
    }
  }

  mouseup(idx) {
    if (this.position >= this.width * 0.35) {
      this.selected.next(-1);
      this.position = this.width / 2;
      this.throttled.next(1);
    }
    else if (this.position <= -this.width * 0.35) {
      this.selected.next(1);
      this.position = -this.width / 2;
      this.throttled.next(-1);
    } else {      
      this.position = 0;
      this.opacity = [1, 1];
      this.location.next(0);
    }
    if (this.moveSubscripion) {
      this.moveSubscripion.unsubscribe();
      this.moveSubscripion = null;
    }
  }

  mousedown(idx, ev) {
    this.startX = this.getX(ev);
    if (this.moveSubscripion) {
      this.moveSubscripion.unsubscribe();
    }
    if (ev instanceof MouseEvent) {
      this.moveSubscripion = fromEvent(window, 'mousemove').subscribe((ev: MouseEvent) => { this.mousemove(idx, ev); });
    } else {
      this.moveSubscripion = fromEvent(window, 'touchmove').subscribe((ev: MouseEvent) => { this.mousemove(idx, ev); });
    }
  }

  mousemove(idx, ev) {
    const x = this.getX(ev);
    this.position = x - this.startX;
    this.position = Math.min(this.position, this.width/2);
    this.position = Math.max(this.position, -this.width/2);
    if (this.position > 0) {
      this.opacity[0] = 1;
      this.opacity[1] = 1 - this.position / (this.width/2);
    } else {
      this.opacity[0] = 1 + this.position / (this.width/2);
      this.opacity[1] = 1;
    }
    this.throttled.next(this.position / (this.width/2));
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
