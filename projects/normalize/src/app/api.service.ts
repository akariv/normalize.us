import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  createNew(image, descriptor) {
    return this.http.post(environment.endpoints.new, {image, descriptor});
  }

  getGame() {
    return this.http.get(environment.endpoints.getGame);
  }

  getImage(id) {
    return this.http.get(environment.endpoints.getImage, {params: {id}, responseType: 'text'});
  }

  saveGameResults(results) {
    return this.http.post(environment.endpoints.gameResults, {results});
  }

}
