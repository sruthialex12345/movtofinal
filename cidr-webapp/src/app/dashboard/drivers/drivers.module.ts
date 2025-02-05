import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DriversRoutingModule } from './drivers.routing';
import { AgmCoreModule } from '@agm/core';
import { AppSharedModule } from '../../shared/app-shared.module';
import { environment } from '../../../environments/environment';

import { DriversComponent } from './drivers.component';
import { FormComponent } from './form/form.component';
import { ListingComponent } from './listing/listing.component';

import { DriversService } from "./drivers.service";
import { RouteconfigComponent } from './routeconfig/routeconfig.component';
import { AgmDirectionModule } from 'agm-direction';
import { NgxUploaderModule } from 'ngx-uploader';
import { ReviewsComponent } from './reviews/reviews.component';


@NgModule({
  imports: [
    AppSharedModule,
    DriversRoutingModule,
    AgmCoreModule.forRoot({
      // please get your own API key here:
      // https://developers.google.com/maps/documentation/javascript/get-api-key?hl=en
      apiKey: environment.config.GOOGLE_API_KEY
    }),
    AgmDirectionModule,
    NgxUploaderModule
  ],
  exports: [],
  declarations: [DriversComponent, FormComponent, ListingComponent, RouteconfigComponent, ReviewsComponent],
  providers: [DriversService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DriversModule { }
