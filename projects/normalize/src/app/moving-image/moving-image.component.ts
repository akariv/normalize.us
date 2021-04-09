import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ConfigService } from '../config.service';

@Component({
  selector: 'app-moving-image',
  templateUrl: './moving-image.component.html',
  styleUrls: ['./moving-image.component.less']
})
export class MovingImageComponent implements OnInit, OnDestroy {

  @Input() src: string;
  @Input() index: number;

  ANIMATION_DIVIDER = 1;

  x = 0;
  y = 0;
  frame = 0;
  count = 0;
  active = true;

  constructor(private config: ConfigService) { }

  ngOnInit(): void {
    this.x = -this.config.IMAGE_SIZE * this.index;
    requestAnimationFrame(() => this.animationFrame());
  }

  ngOnDestroy(): void {
    this.active = false;
  }

  animationFrame() {
    this.count -= 1;
    if (this.count <= 0) {
      this.frame += 1;
      if (this.frame >= this.config.COLLECTED_FRAMES) {
        this.frame = -this.config.COLLECTED_FRAMES + 1;
      }
      this.y = -Math.abs(this.frame) * this.config.IMAGE_SIZE;
      this.count = this.ANIMATION_DIVIDER;
    }
    if (this.active) {
      requestAnimationFrame(() => this.animationFrame());
    }
  }

}
