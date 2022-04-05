import { Component, OnInit } from '@angular/core';
import { InstallationBase } from '../InstallationBase';

@Component({
  selector: 'app-installation-h',
  templateUrl: './installation-h.component.html',
  styleUrls: ['./installation-h.component.less']
})
export class InstallationHComponent extends InstallationBase {

  ngOnInit(): void {
      this.baseFlyToParams = {
        paddingBottomRight: [960, 0],
      };
  }
}
