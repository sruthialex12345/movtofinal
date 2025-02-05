import { NgModule , CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { LocationsRoutingModule } from './locations.routing';
import { AgmCoreModule } from '@agm/core';
import { AppSharedModule } from '../../shared/app-shared.module';
import { environment } from '../../../environments/environment';


import { LocationComponent } from './location.component';
import { FormComponent } from './form/form.component';
import { LocationsService } from "./locations.service";

import { AgmDirectionModule } from 'agm-direction';
import { ListingComponent } from './listing/listing.component';
import { Ng4GeoautocompleteModule } from 'ng4-geoautocomplete';

@NgModule({
  imports: [
    AppSharedModule,
    LocationsRoutingModule,
    AgmCoreModule.forRoot({
      apiKey: environment.config.GOOGLE_API_KEY
    }),
    Ng4GeoautocompleteModule.forRoot(),
    AgmDirectionModule
  ],
  exports: [],
  declarations: [LocationComponent, FormComponent, ListingComponent],
  providers: [LocationsService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LocationModule { }
