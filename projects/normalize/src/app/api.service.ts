import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  createNew(image, descriptor, landmarks) {
    return this.http.post(environment.endpoints.new, {image, descriptor, landmarks});
  }

  getGame() {
    return this.http.get(environment.endpoints.getGame);
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
