import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatasetComponent } from './dataset/dataset.component';
import { MainComponent } from './main/main.component';
import { MapComponent } from './map/map.component';
import { SelfieComponent } from './selfie/selfie.component';
import { GameComponent } from './tournament/game/game.component';

const routes: Routes = [
  {path: 'game', component: GameComponent},
  {path: 'dataset-uploader', component: DatasetComponent},
  {path: 'selfie', component: SelfieComponent},
  {path: '', component: MapComponent},
  // {path: '', component: MainComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
