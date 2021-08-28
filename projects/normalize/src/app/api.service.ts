import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable, ReplaySubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { ImageItem } from './datatypes';
import { StateService } from './state.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  game: ReplaySubject<any>;

  constructor(private http: HttpClient, private state: StateService) { }

  createNew(imageItem: ImageItem) {
    const params = {image: imageItem.image, descriptor: imageItem.descriptor, landmarks: imageItem.landmarks, gender_age: imageItem.gender_age, geolocation: imageItem.geolocation};
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

  getImage(id): Observable<ImageItem> {
    return this.http.get(environment.endpoints.getImage, {params: {id}}).pipe(
      map(result => result as ImageItem)
    );
  }

  saveGameResults(results) {
    return this.http.post(environment.endpoints.gameResults, {results});
  }

  getMapConfiguration() {
    return this.http.get('https://normalizing-us-files.fra1.digitaloceanspaces.com/tsne.json');
  }

  sendEmail(email) {
    const link = this.state.getPrivateUrl();
    return this.http.post(environment.endpoints.sendEmail, {email, link}).pipe(
      tap((res) => {
        console.log('SENT EMAIL RESULT', res);
      })
    );
  }

  deleteOwnItem() {
    const id = this.state.getOwnItemID();
    const magic = this.state.getMagic();
    return this.http.post(environment.endpoints.deleteItem, {id, magic}).pipe(
      tap((res) => {
        console.log('DELETE ITEM RESULT', res);
      })
    );
  }
}
