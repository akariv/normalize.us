import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SelfieComponent } from './selfie/selfie.component';
import { MovingImageComponent } from './moving-image/moving-image.component';
import { DatasetComponent } from './dataset/dataset.component';

@NgModule({
  declarations: [
    AppComponent,
    SelfieComponent,
    MovingImageComponent,
    DatasetComponent
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
