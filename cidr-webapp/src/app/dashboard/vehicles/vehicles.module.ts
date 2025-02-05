import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { VehiclesRoutingModule } from './vehicles.routing';
import { AppSharedModule } from '../../shared/app-shared.module';

import { VehiclesComponent } from './vehicles.component';
import { FormComponent } from './form/form.component';
import { ListingComponent } from './listing/listing.component';

import { VehiclesService } from "./vehicles.service";

import { NgxUploaderModule } from 'ngx-uploader';

@NgModule({
  imports: [
    AppSharedModule,
    VehiclesRoutingModule,
    NgxUploaderModule
  ],
  exports: [],
  declarations: [VehiclesComponent, FormComponent, ListingComponent],
  providers: [VehiclesService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class VehiclesModule { }
