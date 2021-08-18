import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, ReplaySubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { ImageItem } from './datatypes';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  game: ReplaySubject<any>;

  constructor(private http: HttpClient) { }

  createNew(imageItem: ImageItem) {
    const params = {image: imageItem.image, descriptor: imageItem.descriptor, landmarks: imageItem.landmarks};
    return this.http.post(environment.endpoints.new, params);
  }

  getGame() {
    if (this.game) {
      return this.game;
    }
    this.game = new ReplaySubject<any>(1);
    return this.http.get(environment.endpoints.getGame).pipe(
      tap((game) => {
        this.game.next(game);
      }),
    );
  }

  getImage(id) {
    return this.http.get(environment.endpoints.getImage, {params: {id}});
  }

  saveGameResults(results) {
    return this.http.post(environment.endpoints.gameResults, {results});
  }

  getMapConfiguration() {
    return this.http.get('https://normalizing-us-files.fra1.digitaloceanspaces.com/tsne.json');
  }
}
