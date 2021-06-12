import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { ImageFetcherService } from '../../image-fetcher.service';

@Component({
  selector: 'app-single-tournament',
  templateUrl: './single-tournament.component.html',
  styleUrls: ['./single-tournament.component.less']
})
export class SingleTournamentComponent implements OnInit, OnChanges {

  @Input() candidates: any[];
  @Input() index: number;
  @Output() results = new EventEmitter<number[]>();

  constructor(public imageFetcher: ImageFetcherService) { }

  ngOnInit(): void {
  }

  ngOnChanges() {
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
}
