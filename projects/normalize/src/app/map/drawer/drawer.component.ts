import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { LayoutService } from '../../layout.service';

@Component({
  selector: 'app-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.less'],
  host: {
    'class': 'drawer',
    '[class.open]': 'open && !hidden',
    '[class.hidden]': 'hidden',
    '[class.desktop]': 'layout.desktop',
    '[class.mobile]': 'layout.mobile',
  }
})
export class DrawerComponent implements OnInit, OnChanges {

  @Input() open = false;
  @Input() hidden = false;
  @Output() changed = new EventEmitter<boolean>();

  @ViewChild('content') content: ElementRef;

  constructor(public layout: LayoutService) { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    if (!this.open && this.content.nativeElement) {
      const el: HTMLElement = this.content.nativeElement;
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  state(value) {
    this.changed.emit(value);
  }

}
