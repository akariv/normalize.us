import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SelfieComponent } from './selfie/selfie.component';
import { MovingImageComponent } from './moving-image/moving-image.component';
import { DatasetComponent } from './dataset/dataset.component';
import { GameComponent } from './tournament/game/game.component';
import { SingleTournamentComponent } from './tournament/single-tournament/single-tournament.component';
import { MapComponent } from './map/map.component';
import { MainComponent } from './main/main.component';
import { SliderComponent } from './tournament/slider/slider.component';
import { FeatureSelectorComponent } from './map/feature-selector/feature-selector.component';
import { DrawerComponent } from './map/drawer/drawer.component';
import { StartButtonComponent } from './map/start-button/start-button.component';
import { ReportCardComponent } from './map/report-card/report-card.component';
import { LoaderComponent } from './tournament/loader/loader.component';
import { GamePreloaderComponent } from './game-preloader/game-preloader.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ModalComponent } from './modal/modal.component';
import { ConsentModalComponent } from './map/consent-modal/consent-modal.component';
import { FormsModule } from '@angular/forms';
import { EmailModalComponent } from './map/email-modal/email-modal.component';
import { AboutCardComponent } from './map/about-card/about-card.component';
import { RedirectModalComponent } from './map/redirect-modal/redirect-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    SelfieComponent,
    MovingImageComponent,
    DatasetComponent,
    GameComponent,
    SingleTournamentComponent,
    MapComponent,
    MainComponent,
    SliderComponent,
    FeatureSelectorComponent,
    DrawerComponent,
    StartButtonComponent,
    ReportCardComponent,
    LoaderComponent,
    GamePreloaderComponent,
    ModalComponent,
    ConsentModalComponent,
    EmailModalComponent,
    AboutCardComponent,
    RedirectModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatSlideToggleModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
