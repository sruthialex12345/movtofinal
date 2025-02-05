import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgForm } from '@angular/forms';

import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule,HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';

import { DataTableModule } from "angular-6-datatable";
import { SweetAlert2Module } from '@toverux/ngx-sweetalert2';
import { DialogModule } from 'primeng/dialog';

import { NgxUploaderModule } from 'ngx-uploader';
import { NotificationsService } from './notifications.service';
import { NotificationsComponent } from "./notifications.component";

import { JwtInterceptor } from './jwt.interceptor';

// import { LoaderComponent } from "../commonComponents/loader/loader.component";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    DataTableModule,
    SweetAlert2Module.forRoot(),
    DialogModule,
    NgxUploaderModule
  ],
  exports: [
    HttpModule,
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    DataTableModule,
    SweetAlert2Module,
    DialogModule,
    NotificationsComponent,
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
  providers: [
    NotificationsService,
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ],
  declarations: [
    NotificationsComponent
  ]
})
export class AppSharedModule { }
