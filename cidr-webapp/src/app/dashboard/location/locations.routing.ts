import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LocationComponent } from './location.component';
import { FormComponent } from './form/form.component';
import { ListingComponent } from './listing/listing.component';
const routes: Routes = [
  {
    path: '',
    component: LocationComponent,
    data: { title: 'Locations' },
    children: [
      { path: '', component: ListingComponent, data: { title: 'New' } },
      { path: 'new', component: FormComponent, data: { title: 'New' } },
      { path: ':id/edit', component: FormComponent, data: { title: 'Edit' } },
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class LocationsRoutingModule { }
