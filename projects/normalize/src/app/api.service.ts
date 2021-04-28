import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  createNew(image) {
    return this.http.post(environment.endpoints.new, {image});
  }

}
