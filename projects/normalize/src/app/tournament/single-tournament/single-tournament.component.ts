import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { ConfigService } from '../../config.service';
import { ImageFetcherService } from '../../image-fetcher.service';

@Component({
  selector: 'app-single-tournament',
  templateUrl: './single-tournament.component.html',
  styleUrls: ['./single-tournament.component.less']
})
export class SingleTournamentComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() candidates: any[];
  @Input() index: number;
  @Output() results = new EventEmitter<number[]>();

  scales = [1, 1];
  sizes = [50, 50];
  position = 0;
  baseScale = 1;
  direction = true;

  constructor(public imageFetcher: ImageFetcherService, private el: ElementRef, private config: ConfigService) { }

  set location(value) {
    this.position = 100 * value/2;
    if (value > 0) {
      this.direction = true;
    }
    if (value < 0) {
      this.direction = false;
    }
    if (value > 0) {
      this.scales = [this.baseScale * (1 + value), this.baseScale];
      this.sizes = [50 * (1 + value), 50];
    } else {
      this.scales = [this.baseScale, this.baseScale * (1 - value)];
      this.sizes = [50, 50 * (1 - value)];
    }
  }

  ngOnInit(): void {
  }

  ngOnChanges() {
    if (this.el.nativeElement) {
      this.updateScales();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.updateScales();
    }, 0);
  }

  updateScales() {
    this.baseScale = this.el.nativeElement.offsetWidth / (2 * this.config.IMAGE_SIZE_BY_INDEX[this.index].width);
    this.scales = [this.baseScale, this.baseScale];  
  }

  select(candidate) {
    console.log('WINNER', candidate.id);
    const winner = candidate.id
    let loser = -1;
    for (const c of this.candidates) {
      if (c.id !== winner) {
        loser = c.id;
        break;
      }
    }
    this.results.emit([winner, loser]);
  }

  finish(sliderPosition) {
    if (sliderPosition === 1) {
      this.select(this.candidates[0]);
    } else if (sliderPosition === -1) {
      this.select(this.candidates[1]);
    }
  }
}
