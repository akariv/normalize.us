import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SelfieComponent } from './selfie/selfie.component';
import { MovingImageComponent } from './moving-image/moving-image.component';
import { DatasetComponent } from './dataset/dataset.component';
import { GameComponent } from './tournament/game/game.component';
import { SingleTournamentComponent } from './tournament/single-tournament/single-tournament.component';
import { MapComponent } from './map/map.component';
import { MainComponent } from './main/main.component';

@NgModule({
  declarations: [
    AppComponent,
    SelfieComponent,
    MovingImageComponent,
    DatasetComponent,
    GameComponent,
    SingleTournamentComponent,
    MapComponent,
    MainComponent
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
