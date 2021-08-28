import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { delay, first } from 'rxjs/operators';
import { ImageItem } from './datatypes';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  OWN_ID_KEY = 'normalize_own_id';
  OWN_IMAGE_KEY = 'normalize_own_image';
  OWN_MAGIC_KEY = 'normalize_own_magic';
  PLAYED_KEY = 'normalize_played';
  ASKED_FOR_EMAIL_KEY = 'normalize_email';

  descriptor: any;
  landmarks: any;
  gender_age: any;
  itemID: number;
  imageID: string;
  geolocation: number[];
  magic: string;
  played = false;
  askedForEmail = false;
  handlingRequest = false;
  requests = [];

  constructor() {
    this.checkUrlParameters();
    try {      
      this.itemID = parseInt(window.localStorage.getItem(this.OWN_ID_KEY));
    } catch (e) {
      this.itemID = null;
    }
    this.imageID = window.localStorage.getItem(this.OWN_IMAGE_KEY);
    this.magic = window.localStorage.getItem(this.OWN_MAGIC_KEY);
    this.played = window.localStorage.getItem(this.PLAYED_KEY) === 'true';
    this.askedForEmail = window.localStorage.getItem(this.ASKED_FOR_EMAIL_KEY) === 'true';
    console.log('STATE:', this.imageID, this.played);
    console.log('PRIVATE STATE', this.getPrivateUrl());
  }

  checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemID = urlParams.get('i');
    const imageID = urlParams.get('u');
    const magic = urlParams.get('m');
    if (itemID && imageID && magic) {
      this.setPlayed();
      this.setAskedForEmail();
      window.localStorage.setItem(this.OWN_ID_KEY, itemID);
      window.localStorage.setItem(this.OWN_IMAGE_KEY, imageID);
      window.localStorage.setItem(this.OWN_MAGIC_KEY, magic);
      window.location.search = '';
    }
  }

  getPrivateUrl() {
    return `https://normalizi.ng/?i=${this.itemID}&u=${this.imageID}&m=${this.magic}`;
  }

  setOwnInfo(value) {
    this.itemID = value.id;
    this.imageID = value.image;
    this.magic = this.magic || value.magic;
    this.descriptor = value.descriptor || this.descriptor;
    this.landmarks = value.landmarks || this.landmarks;
    this.gender_age = value.gender_age || this.gender_age;
    window.localStorage.setItem(this.OWN_ID_KEY, this.itemID + '');
    if (this.imageID && this.imageID.length < 64) {
      window.localStorage.setItem(this.OWN_IMAGE_KEY, this.imageID);
    }
    if (this.magic) {
      window.localStorage.setItem(this.OWN_MAGIC_KEY, this.magic);
    }
  }

  setGeolocation(geolocation: number[]) {
    console.log('SETTING GEO', geolocation);
    this.geolocation = geolocation;
  }

  getOwnItemID() {
    return this.itemID;
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

  getLandmarks() {
    return this.landmarks;
  }

  getGenderAge() {
    return this.gender_age;
  }

  getGeolocation() {
    return this.geolocation;
  }
  
  setPlayed() {
    this.played = true;
    window.localStorage.setItem(this.PLAYED_KEY, 'true');
  }

  setAskedForEmail() {
    this.askedForEmail = true;
    window.localStorage.setItem(this.ASKED_FOR_EMAIL_KEY, 'true');
  }

  getAskedForEmail() {
    return this.askedForEmail;
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

  clear() {
    window.localStorage.removeItem(this.OWN_ID_KEY);
    window.localStorage.removeItem(this.OWN_IMAGE_KEY);
    window.localStorage.removeItem(this.OWN_MAGIC_KEY);
    window.localStorage.removeItem(this.PLAYED_KEY);
    window.localStorage.removeItem(this.ASKED_FOR_EMAIL_KEY);
  }

  checkItem(item: ImageItem) {
    if (
      (item.id !== this.getOwnItemID()) ||
      (item.image !== this.getOwnImageID())
    ) {
      this.clear();
      window.location.reload();
    }
    return true;
  }

  urlSearchParam(key) {
    const params = new URLSearchParams(location.search);
    return params.get(key);
  }
}
