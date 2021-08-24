import { EventEmitter } from '@angular/core';
import { Component, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.less']
})
export class ModalComponent implements OnInit {

  @Input() submit_text = 'OK';
  @Input() cancel_text = '';
  @Input() open = true;
  @Output() closed = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit(): void {
  }

  close(result) {
    this.closed.next(result);
  }

}
