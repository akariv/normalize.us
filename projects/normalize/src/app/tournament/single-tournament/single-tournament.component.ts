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

  constructor(private imageFetcher: ImageFetcherService) { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    if (this.candidates) {
      for (const candidate of this.candidates) {
        if (!candidate.image) {
          console.log('FETCHING IMAGE FOR', candidate.id);
          this.imageFetcher.fetchImage(candidate.id).subscribe((image) => {
            candidate.image = image;
          })
        }
      }
    }
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
