import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatasetComponent } from './dataset/dataset.component';
import { SelfieComponent } from './selfie/selfie.component';
import { GameComponent } from './tournament/game/game.component';

const routes: Routes = [
  {path: 'game', component: GameComponent},
  {path: 'dataset-uploader', component: DatasetComponent},
  {path: '', component: SelfieComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
