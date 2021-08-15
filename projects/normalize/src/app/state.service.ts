import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { delay, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  OWN_ID_KEY = 'normalize_own_id';
  OWN_IMAGE_KEY = 'normalize_own_image';
  OWN_MAGIC_KEY = 'normalize_own_magic';
  PLAYED_KEY = 'normalize_played';

  descriptor: any;
  itemID: string;
  imageID: string;
  magic: string;
  played = false;
  handlingRequest = false;
  requests = [];

  constructor() {
    this.itemID = window.localStorage.getItem(this.OWN_ID_KEY);
    this.imageID = window.localStorage.getItem(this.OWN_IMAGE_KEY);
    this.magic = window.localStorage.getItem(this.OWN_MAGIC_KEY);
    this.played = window.localStorage.getItem(this.PLAYED_KEY) === 'true';
    console.log('STATE:', this.imageID, this.played);
  }

  setOwnInfo(value) {
    this.itemID = value.id;
    this.imageID = value.image;
    this.magic = this.magic || value.magic;
    this.descriptor = value.descriptor || this.descriptor;
    window.localStorage.setItem(this.OWN_ID_KEY, this.itemID);
    if (this.imageID && this.imageID.length < 64) {
      window.localStorage.setItem(this.OWN_IMAGE_KEY, this.imageID);
    }
    if (this.magic) {
      window.localStorage.setItem(this.OWN_MAGIC_KEY, this.magic);
    }
  }

  getOwnItemID() {
    return this.itemID ? parseInt(this.itemID) : null;
  }

  getOwnImageID() {
    return this.imageID;
  }

  getMagic() {
    return this.magic;
  }

  getDescriptor() {
    return this.descriptor;
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
}
