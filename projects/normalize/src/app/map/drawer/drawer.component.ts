import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
export class DrawerComponent implements OnInit {

  @Input() open = false;
  @Input() hidden = false;
  @Output() changed = new EventEmitter<boolean>();

  constructor(public layout: LayoutService) { }

  ngOnInit(): void {
  }

  state(value) {
    this.changed.emit(value);
  }

}
