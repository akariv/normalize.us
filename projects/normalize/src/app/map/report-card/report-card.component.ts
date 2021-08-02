import { Component, Input, OnInit } from '@angular/core';
import { ImageItem } from '../../datatypes';
import { ImageFetcherService } from '../../image-fetcher.service';

@Component({
  selector: 'app-report-card',
  templateUrl: './report-card.component.html',
  styleUrls: ['./report-card.component.less']
})
export class ReportCardComponent implements OnInit {

  @Input() item: ImageItem;

  constructor(public imageFetcher: ImageFetcherService) { }

  ngOnInit(): void {
  }

}
