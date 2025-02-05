import { NgModule , CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { ReservationRoutingModule } from './reservation-code.routing';
import { AppSharedModule } from '../../shared/app-shared.module';
import { environment } from '../../../environments/environment';


import { ReservationCodeComponent } from './reservation-code.component';
import { ReservationCodeService } from "./reservation-code.service";


@NgModule({
  imports: [
    AppSharedModule,
    ReservationRoutingModule,
  ],
  exports: [],
  declarations: [ReservationCodeComponent],
  providers: [ReservationCodeService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReservationCodeModule { }
