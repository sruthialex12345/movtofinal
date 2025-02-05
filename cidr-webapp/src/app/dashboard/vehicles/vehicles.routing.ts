import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListingComponent } from './listing/listing.component';
import { VehiclesComponent } from './vehicles.component';
import { FormComponent } from './form/form.component';

const routes: Routes = [
  {
    path: '',
    component: VehiclesComponent,
    data: { title: 'Vehicles' },
    children: [
      { path: '', component: ListingComponent, data: { title: '' } },
      { path: 'new', component: FormComponent, data: { title: 'New' } },
      { path: ':id/edit', component: FormComponent, data: { title: 'Edit' } }
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class VehiclesRoutingModule { }
