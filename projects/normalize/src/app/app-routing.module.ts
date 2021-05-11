import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatasetComponent } from './dataset/dataset.component';
import { SelfieComponent } from './selfie/selfie.component';

const routes: Routes = [
  {path: 'dataset-uploader', component: DatasetComponent},
  {path: '', component: SelfieComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
