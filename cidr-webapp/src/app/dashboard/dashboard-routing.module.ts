import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { MainComponent } from './main/main.component';
import { MapComponent } from './map/map.component';
import { ProfileComponent } from './profile/profile.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { SettingsComponent } from './settings/settings.component';
import { CustomEmailTemplateComponent } from './custom-email-template/custom-email-template.component';
// import { ReservationCodeComponent } from './reservation-code/reservation-code.component';
import { LocationGuard } from '../services/location.guard.service';
import { RiderReportComponent } from './rider-report/rider-report.component';
import { PeakTimeReportComponent } from './peak-time-report/peak-time-report.component';
import { NoOfRequestComponent } from './no-of-request/no-of-request.component';
import { from } from 'rxjs';
const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    data: { title: 'dashboard' },
    children: [
      {
        path: '',
        component: MainComponent
      },
      {
        path: 'profile',
        component: ProfileComponent
      },
      {
        path: 'changepassword',
        component: ChangePasswordComponent
      },
      {
        path: 'map',
        component: MapComponent
      },
      {
        path: 'custom-email-template',
        component: CustomEmailTemplateComponent
      },
      {
        path: 'drivers',
        loadChildren: './drivers/drivers.module#DriversModule',
        // canActivate: [LocationGuard]
      },
      {
        path: 'reservation-code',
        loadChildren: './reservation-code/reservation-code.module#ReservationCodeModule',
      },
      {
        path: 'vehicles',
        loadChildren: './vehicles/vehicles.module#VehiclesModule',
        // canActivate: [LocationGuard]
      }
      , {
        path: 'locations',
        loadChildren: './location/location.module#LocationModule',
        // canActivate: [LocationGuard]
      }
      , {
        path: 'superadmin',
        loadChildren: './superadmin/superadmin.module#SuperadminModule',
        // canActivate: [LocationGuard]
      }
      , {
        path: 'routes',
        loadChildren: './routes/routes.module#RoutesModule',
        // canActivate: [LocationGuard]
      }, {
        path: 'message',
        loadChildren: './message/message.module#MessageModule',
      },
      {
        path: 'reports/averagewaitingtime',
        component: RiderReportComponent
      },
      {
        path: 'reports/peaktime',
        component: PeakTimeReportComponent
      },
      {
        path: 'reports/noofrequest',
        component: NoOfRequestComponent
      },
      {
        path: 'reports/noofridersserved',
        component: MainComponent
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
