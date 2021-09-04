import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-focus-button',
  templateUrl: './focus-button.component.html',
  styleUrls: ['./focus-button.component.less']
})
export class FocusButtonComponent implements OnInit {

  @Output() click = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
  }

}
