import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { from } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ApiService } from '../../api.service';
import { ImageFetcherService } from '../../image-fetcher.service';
import { StateService } from '../../state.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.less']
})
export class GameComponent implements OnInit {

  TUPLES_PER_FEATURE = 3;
  FEATURES = [
    0, 3, 2, 1, 4
  ];

  game: any;
  index = -1;
  feature = -1;
  maxIndex = 5;
  tuples = [];
  candidates = [];
  results = [];
  Array = Array;
  loaded = false;
  definition = true;
  idsCount = {};

  constructor(private api: ApiService, private state: StateService, public imageFetcher: ImageFetcherService, private router: Router) {
    api.getGame().subscribe((game) => {
      this.game = game;
      console.log('GOT GAME', game);
      this.next();
    })
  }

  ngOnInit(): void {
    this.definition = true;
  }

  next() {
    if (this.index < this.maxIndex) {
      if (this.tuples.length === 0) {
        this.index += 1;
        this.feature = this.FEATURES[this.index];
        // console.log('INDEX = ', this.index, 'FEATURE=', this.feature);
        const forbidden = Object.keys(this.idsCount).filter((id) => this.idsCount[id] > 2).map((id) => parseInt(id, 10));
        this.tuples = this.randomTuples(this.TUPLES_PER_FEATURE, forbidden);
        this.tuples.forEach((t) => {
          for (let item of t) {
            const id = item.id;
            this.idsCount[id] = (this.idsCount[id] || 0) + 1;
          }
        });
        // console.log('TUP', this.tuples.length, this.tuples);
        if (this.feature === 4) {
          if (this.state.getOwnImageID()) {
            this.tuples[this.tuples.length - 1][1] = {id: -1, image: this.state.getOwnImageID()};
          }
        }
      }
      this.candidates = this.tuples.shift();
      // console.log('CANDIDATES', this.candidates);
      if (this.index === this.maxIndex) {
        this.saveGameResults();
      }
    }
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
  }

  randomTuples(count, forbidden) {
    const ret = [];
    const records = [...this.game.records];
    this.shuffleArray(records);
    records.sort((a, b) => {
      return (this.idsCount[a.id] || 0) - (this.idsCount[b.id] || 0);
    });
    for (const i of records) {
      for (const j of records) {
        if (i.id <= j.id) {
          continue;
        }
        if (forbidden.indexOf(i.id) !== -1 || forbidden.indexOf(j.id) !== -1) {
          continue;
        }
        if (Math.random() > 0.5) {
          ret.push([i, j]);
        } else {
          ret.push([j, i]);
        }
      }
    }
    
    const used = [];
    const ret2 = [];
    for (const t of ret) {
      if (used.indexOf(t[0].id) === -1 && used.indexOf(t[1].id) === -1) {
        ret2.push(t);
        used.push(t[0].id);
        used.push(t[1].id);
      }
      if (ret2.length === count) {
        return ret2;
      }
    }
    return ret2;
  }

  addResults(single) {
    if (single[0] === -1) {
      this.state.setVotedSelf();
    }
    this.results.push(single);
    this.next();
  }

  saveGameResults() {
    if (this.results && this.results.length) {
      this.state.pushRequest(
        from([this.results]).pipe(
          map((results) => {
            return results.map((t) => t.map((c) => c === -1 ? this.state.getOwnItemID() : c));
          }),
          switchMap((results) => {
            return this.api.saveGameResults(results);
          }),
          tap(() => {
            console.log('SAVED');
            this.results = [];
          })
        )
      );
      this.state.setPlayed();
      this.router.navigate(['/']);  
    }
  }
}
