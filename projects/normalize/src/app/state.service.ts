import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { delay, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  OWN_ID_KEY = 'normalize_own_id';
  PLAYED_KEY = 'normalize_played';

  ownRecord: any;
  imageID: string;
  played = false;
  handlingRequest = false;
  requests = [];

  constructor() {
    this.imageID = window.localStorage.getItem(this.OWN_ID_KEY);
    this.played = window.localStorage.getItem(this.PLAYED_KEY) === 'true';
    console.log('STATE:', this.imageID, this.played);
  }

  setOwnId(value) {
    this.imageID = value;
    window.localStorage.setItem(this.OWN_ID_KEY, value);
  }

  getOwnId() {
    return this.imageID ? parseInt(this.imageID) : null;
  }

  setPlayed() {
    this.played = true;
    window.localStorage.setItem(this.PLAYED_KEY, 'true');
  }

  pushRequest(request) {
    this.requests.push(request);
    this.handleRequest();
  }

  handleRequest() {
    if (this.handlingRequest) {
      return;
    }
    if (this.requests.length === 0) {
      return
    }
    const request = this.requests.shift();
    this.handlingRequest = true;
    request.pipe(
      first(),
      delay(0),
    ).subscribe(() => {
      this.handlingRequest = false;
      this.handleRequest();
    });
  }

  setRecord(ownRecord: { id: string; descriptor: any; image: any; }) {
    this.ownRecord = ownRecord;
  }
}
