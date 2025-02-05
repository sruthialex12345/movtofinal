import { NgModule,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgmCoreModule } from '@agm/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { AppSharedModule } from './../shared/app-shared.module';
import { DashboardComponent } from './dashboard.component';
import { SettingsComponent } from './settings/settings.component';
import {ChartModule} from 'primeng/chart';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { FooterComponent } from './footer/footer.component';
import { MainComponent } from './main/main.component';
import { MapComponent } from './map/map.component';
import { AgmDirectionModule } from 'agm-direction';
import { Ng4GeoautocompleteModule } from 'ng4-geoautocomplete';
import { LocationGuard } from '../services/location.guard.service';
import { UserService } from '../services/user.service';
import { environment } from '../../environments/environment';
import { RoutesComponent } from './routes/routes.component';
import { RouteComponent } from './routes/route/route.component';
import { ListComponent } from './routes/list/list.component';
import {TableModule} from 'primeng/table';
import {DropdownModule} from 'primeng/dropdown';
import {ButtonModule} from 'primeng/button';
import {RoutesService} from './routes/routes.service'
import {CalendarModule} from 'primeng/calendar';
import { ProfileComponent } from './profile/profile.component';

import { NgxUploaderModule } from 'ngx-uploader';
import { CKEditorModule } from 'ng2-ckeditor';
import { MessageComponent } from './message/message.component';
import { CustomEmailTemplateComponent } from './custom-email-template/custom-email-template.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { ExportAsModule } from 'ngx-export-as';
import { DataTableModule } from "primeng/primeng";
import { ExcelService } from './../services/excel.service';
import { RiderReportComponent } from './rider-report/rider-report.component';
import { PeakTimeReportComponent } from './peak-time-report/peak-time-report.component';
import { NoOfRequestComponent } from './no-of-request/no-of-request.component';
import { ChartsModule } from 'ng2-charts';
// import { ReservationCodeComponent } from './reservation-code/reservation-code.component';


@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    DashboardRoutingModule,
    TableModule,
    DropdownModule,
    ButtonModule,
    ChartModule,
    CalendarModule,
    AppSharedModule,
    DataTableModule,
    CKEditorModule,
    ExportAsModule,
    DataTableModule,
    ChartsModule,
    AgmCoreModule.forRoot({
      // please get your own API key here:
      // https://developers.google.com/maps/documentation/javascript/get-api-key?hl=en
      apiKey: environment.config.GOOGLE_API_KEY
    }),
    Ng4GeoautocompleteModule.forRoot(),
    AgmDirectionModule,
    NgxUploaderModule
  ],
  declarations: [
    DashboardComponent,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    MainComponent,
    MapComponent,
    ProfileComponent,
    MessageComponent,
    CustomEmailTemplateComponent,
    ChangePasswordComponent,
    RiderReportComponent,
    PeakTimeReportComponent,
    NoOfRequestComponent,
    SettingsComponent
    // ReservationCodeComponent
  ],
  providers: [LocationGuard,RoutesService, UserService,ExcelService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DashboardModule { }
