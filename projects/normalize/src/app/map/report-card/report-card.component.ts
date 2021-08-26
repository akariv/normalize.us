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

  // 'nose', 'eyes', 'mouth', 'forehead', 'face
  nose_normality = '0.50';
  eyes_normality = '0.50';
  mouth_normality = '0.50';
  forehead_normality = '0.50';
  face_normality = '0.50';

  constructor(public imageFetcher: ImageFetcherService) { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    if (this.item) {
      this.nose_normality = ImageItem.normality(this.item, 0).toFixed(2);
      this.eyes_normality = ImageItem.normality(this.item, 1).toFixed(2);
      this.mouth_normality = ImageItem.normality(this.item, 2).toFixed(2);
      this.forehead_normality = ImageItem.normality(this.item, 3).toFixed(2);
      this.face_normality = ImageItem.normality(this.item, 4).toFixed(2);
    }
  }

  get age() {
    return this.item.gender_age.age.toFixed(0);
  }

  get gender() {
    return this.item.gender_age.gender[0].toUpperCase();
  }

  get gender_confidence() {
    return this.item.gender_age.genderProbability.toFixed(2);
  }

  get hasShare() {
    return !!navigator && !!navigator.share;
  }

  share() {
    console.log('SHARING', navigator, navigator.share);
    navigator.share({
      title: 'Normalizi.ng',
      text: 'Normalizi.ng - Discover what *normal* people look like https://normalizi.ng',
      url: 'https://normalizi.ng'
    }).then((result) => {
      console.log('Share result:', result);
    });
  }
}
