import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-definition',
  templateUrl: './definition.component.html',
  styleUrls: ['./definition.component.less']
})
export class DefinitionComponent implements OnInit {

  @Output() closed = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
  }

}
