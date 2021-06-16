import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { AnimationManagerService } from '../animation-manager.service';
import { ConfigService } from '../config.service';

@Component({
  selector: 'app-moving-image',
  templateUrl: './moving-image.component.html',
  styleUrls: ['./moving-image.component.less']
})
export class MovingImageComponent implements OnChanges, OnDestroy {

  @Input() src: string;
  @Input() index: number;

  ANIMATION_DIVIDER = 10;

  x = [0, 0];
  y = [0, 0];
  frame = 0;
  count = 0;
  current = 0;
  animationId = '';
  loaded = false;

  constructor(public config: ConfigService, private animation: AnimationManagerService) { }

  ngOnChanges(): void {
    this.x[0] = -this.config.IMAGE_SIZE * this.index;
    this.x[1] = -this.config.IMAGE_SIZE * this.index;
    const animationId = 'moving-image-' + this.index;
    if (this.animationId !== animationId) {
      if (this.animationId) {
        this.animation.deregister(this.animationId);
      }
      this.animationId = animationId;
      this.animation.register(this.animationId, () => this.animationFrame());
      this.animation.enable(this.animationId);  
    }
  }

  ngOnDestroy(): void {
    this.animation.deregister(this.animationId);
  }

  animationFrame() {
    this.count -= 1;
    if (this.count <= 0) {
      this.frame += 1;
      this.current = 1 - this.current;
      if (this.frame >= this.config.COLLECTED_FRAMES) {
        this.frame = -this.config.COLLECTED_FRAMES + 2;
      }
      this.y[this.current] = -Math.abs(this.frame) * this.config.IMAGE_SIZE;
      this.count = this.ANIMATION_DIVIDER;
    }
    this.animation.go();
  }

}
