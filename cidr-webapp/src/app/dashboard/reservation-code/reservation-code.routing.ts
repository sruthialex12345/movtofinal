import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReservationCodeComponent } from './reservation-code.component';

const routes: Routes = [
  {
    path: '',
    component: ReservationCodeComponent,
    data: { title: 'ReservationCode' },
    children: [
      { path: '', component: ReservationCodeComponent, data: { title: 'New' } },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class ReservationRoutingModule { }
