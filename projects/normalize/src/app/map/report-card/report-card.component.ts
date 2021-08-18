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
      console.log('REPORT CARD ITEM', this.item);
      this.normality = (this.item.tournaments ? (this.item.votes * 1.0) / this.item.tournaments : 0.5).toFixed(2);
    }
  }

  get age() {
    return this.item.gender_age.age.toFixed(0);
  }

  get gender() {
    return this.item.gender_age.gender[0].toUpperCase();
  }
}
