import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-definition',
  templateUrl: './definition.component.html',
  styleUrls: ['./definition.component.less'],
  host: {
    '[class.visible]': 'visible'
  }
})
export class DefinitionComponent implements OnInit {

  visible = true;

  @Input() imgSrc: string;
  @Output() closed = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
    this.visible = true;
    setTimeout(() => {
      this.onclose();
    }, 100000);
  }

  onclose() {
    this.visible = false;
    setTimeout(() => {
      this.closed.next();
    }, 300);
  }

}
