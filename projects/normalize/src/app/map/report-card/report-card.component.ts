import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ImageItem } from '../../datatypes';
import { ImageFetcherService } from '../../image-fetcher.service';

@Component({
  selector: 'app-report-card',
  templateUrl: './report-card.component.html',
  styleUrls: ['./report-card.component.less']
})
export class ReportCardComponent implements OnInit, OnChanges {

  @Input() item: ImageItem;

  normality = '0.50';

  constructor(public imageFetcher: ImageFetcherService) { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    if (this.item) {
      this.normality = (this.item.tournaments ? (this.item.votes * 1.0) / this.item.tournaments : 0.5).toFixed(2);
    }
  }

}
