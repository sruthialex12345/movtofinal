import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListingComponent } from './listing/listing.component';
import { DriversComponent } from './drivers.component';
import { FormComponent } from './form/form.component';
import { RouteconfigComponent } from './routeconfig/routeconfig.component';
import { ReviewsComponent } from './reviews/reviews.component'
const routes: Routes = [
  {
    path: '',
    component: DriversComponent,
    data: { title: 'Drivers' },
    children: [
      { path: '', component: ListingComponent, data: { title: '' } },
      { path: 'new', component: FormComponent, data: { title: 'New' } },
      { path: ':id/edit', component: FormComponent, data: { title: 'Edit' } },
      { path: ':id/routeconfig', component: RouteconfigComponent, data: { title: 'EditRoute' } },
      { path: 'reviews/:driverId', component: ReviewsComponent, data: { title: 'viewRating' } },
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class DriversRoutingModule { }
