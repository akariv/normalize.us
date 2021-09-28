import { EventEmitter } from '@angular/core';
import { Component, Input, OnChanges, OnInit, Output } from '@angular/core';
import { ImageItem } from '../../datatypes';
import { ImageFetcherService } from '../../image-fetcher.service';
import { StateService } from '../../state.service';

@Component({
  selector: 'app-report-card',
  templateUrl: './report-card.component.html',
  styleUrls: ['./report-card.component.less'],
  host: {
    '[class.focused]': 'focused'
  }
})
export class ReportCardComponent implements OnInit, OnChanges {

  @Input() item: ImageItem;
  @Output() delete = new EventEmitter<void>();
  @Output() start = new EventEmitter<void>();

  // 'nose', 'eyes', 'mouth', 'forehead', 'face
  normality = '0.50';
  nose_normality = '0.50';
  eyes_normality = '0.50';
  mouth_normality = '0.50';
  forehead_normality = '0.50';
  face_normality = '0.50';

  itemImage = null;
  focused = true;

  constructor(public imageFetcher: ImageFetcherService, private state: StateService) { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    if (this.item) {
      let delay = 0;
      const item = this.item;
      if (this.itemImage) {
        delay = 500;
      }
      this.focused = false;
      setTimeout(() => {
        this.focused = true;
        this.itemImage = this.imageFetcher.fetchImage(item.image)
        this.normality = ImageItem.normality(item).toFixed(2);
        this.nose_normality = ImageItem.normalityText(item, 0);
        this.eyes_normality = ImageItem.normalityText(item, 1);
        this.mouth_normality = ImageItem.normalityText(item, 2);
        this.forehead_normality = ImageItem.normalityText(item, 3);
        this.face_normality = ImageItem.normalityText(item, 4);
      }, delay);
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
      title: url,
      text: url,
      url: url
    }).then((result) => {
      console.log('Share result:', result);
    });
  }
}
