import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SelfieComponent } from './selfie/selfie.component';

const routes: Routes = [
  {path: '', component: SelfieComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
