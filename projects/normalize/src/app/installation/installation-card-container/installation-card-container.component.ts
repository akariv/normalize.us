import { Component, Input, OnInit } from '@angular/core';
import { GridItem, ImageItem } from '../../datatypes';

@Component({
  selector: 'app-installation-card-container',
  templateUrl: './installation-card-container.component.html',
  styleUrls: ['./installation-card-container.component.less']
})
export class InstallationCardContainerComponent implements OnInit {

  @Input() items: GridItem[];

  constructor() { }

  ngOnInit(): void {
  }

}
