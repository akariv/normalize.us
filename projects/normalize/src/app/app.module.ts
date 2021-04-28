import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SelfieComponent } from './selfie/selfie.component';
import { MovingImageComponent } from './moving-image/moving-image.component';

@NgModule({
  declarations: [
    AppComponent,
    SelfieComponent,
    MovingImageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
