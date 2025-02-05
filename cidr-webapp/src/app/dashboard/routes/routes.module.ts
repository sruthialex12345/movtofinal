import { CommonModule } from '@angular/common';
import { NgModule , CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { RoutesRoutingModule } from './routing/routing.module';
import { AgmCoreModule } from '@agm/core';
import { AppSharedModule } from '../../shared/app-shared.module';
import { environment } from '../../../environments/environment';


import { RoutesComponent } from './routes.component';
import { RouteComponent } from './route/route.component';
import { RoutesService } from "./routes.service";

import { AgmDirectionModule } from 'agm-direction';
import { ListComponent } from './list/list.component';
import { Ng4GeoautocompleteModule } from 'ng4-geoautocomplete';
import {TableModule} from 'primeng/table';
import {DropdownModule} from 'primeng/dropdown';
import {ButtonModule} from 'primeng/button';
import { ViewRouteComponent } from './view-route/view-route.component';

@NgModule({
  imports: [
    AppSharedModule,
    RoutesRoutingModule,
    TableModule,
    DropdownModule,
    ButtonModule,
    AgmCoreModule.forRoot({
      apiKey: environment.config.GOOGLE_API_KEY
    }),
    Ng4GeoautocompleteModule.forRoot(),
    AgmDirectionModule
  ],
  exports: [],
  declarations: [RoutesComponent, RouteComponent, ListComponent, ViewRouteComponent],
  providers: [RoutesService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RoutesModule { }
