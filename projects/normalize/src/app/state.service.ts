import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  OWN_ID_KEY = 'normalize_own_id';
  PLAYED_KEY = 'normalize_played';

  imageID: string;
  played = false;

  constructor() {
    this.imageID = window.localStorage.getItem(this.OWN_ID_KEY);
    this.played = window.localStorage.getItem(this.PLAYED_KEY) === 'true';
    console.log('STATE:', this.imageID, this.played);
  }

  setOwnId(value) {
    this.imageID = value;
    window.localStorage.setItem(this.OWN_ID_KEY, value);
  }

  setPlayed() {
    this.played = true;
    window.localStorage.setItem(this.PLAYED_KEY, 'true');
  }
}
