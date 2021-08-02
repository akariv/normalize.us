import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.less'],
  host: {
    'class': 'drawer',
    '[class.open]': 'open'
  }
})
export class DrawerComponent implements OnInit {

  @Input() open = false;
  @Output() changed = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit(): void {
  }

  state(value) {
    this.changed.emit(value);
  }

}
