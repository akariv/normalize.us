import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AnimationManagerService } from '../animation-manager.service';
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
  animationId = '';

  constructor(public config: ConfigService, private animation: AnimationManagerService) { }

  ngOnInit(): void {
    this.x = -this.config.IMAGE_SIZE * this.index;
    this.animationId = 'moving-image-' + this.index;
    this.animation.register(this.animationId, () => this.animationFrame());
    this.animation.enable(this.animationId);
  }

  ngOnDestroy(): void {
    this.animation.deregister(this.animationId);
  }

  animationFrame() {
    this.count -= 1;
    if (this.count <= 0) {
      this.frame += 1;
      if (this.frame >= this.config.COLLECTED_FRAMES) {
        this.frame = -this.config.COLLECTED_FRAMES + 2;
      }
      this.y = -Math.abs(this.frame) * this.config.IMAGE_SIZE;
      this.count = this.ANIMATION_DIVIDER;
    }
    this.animation.go();
  }

}
