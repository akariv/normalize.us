import { EventEmitter } from '@angular/core';
import { Component, Input, OnChanges, OnInit, Output } from '@angular/core';
import { ImageItem } from '../../datatypes';
import { ImageFetcherService } from '../../image-fetcher.service';
import { StateService } from '../../state.service';

@Component({
  selector: 'app-report-card',
  templateUrl: './report-card.component.html',
  styleUrls: ['./report-card.component.less']
})
export class ReportCardComponent implements OnInit, OnChanges {

  @Input() item: ImageItem;
  @Output() delete = new EventEmitter<void>();
  @Output() start = new EventEmitter<void>();

  // 'nose', 'eyes', 'mouth', 'forehead', 'face
  nose_normality = '0.50';
  eyes_normality = '0.50';
  mouth_normality = '0.50';
  forehead_normality = '0.50';
  face_normality = '0.50';

  constructor(public imageFetcher: ImageFetcherService, private state: StateService) { }

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

  get geoLocation() {
    if (this.item.geolocation) {
      const c = this.item.geolocation;
      return `${c[0].toFixed(2)}, ${c[1].toFixed(2)}`;
    }
    return '';
  }

  get createdTime() {
    if (this.item.created_timestamp) {
      return this.item.created_timestamp.split('T')[1].split('.')[0] || '';
    }
    return '';
  }

  get createdDate() {
    if (this.item.created_timestamp) {
      return this.item.created_timestamp.split('T')[0] || '';
    }
    return '';
  }

  get hasShare() {
    return !!navigator && !!navigator.share;
  }

  get ownCard() {
    return this.item.id === this.state.getOwnItemID();
  }

  share() {
    const url = `https://normalizi.ng?id=${this.item.id}`;
    navigator.share({
      title: 'Normalizi.ng',
      text: `Normalizi.ng - Discover what *normal* people look like ${url}`,
      url: url
    }).then((result) => {
      console.log('Share result:', result);
    });
  }
}
