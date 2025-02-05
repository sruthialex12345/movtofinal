import { NgModule , CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppSharedModule } from '../../shared/app-shared.module';
import { SuperadminService } from "./superadmin.service";

import { SuperadminRoutingModule } from './superadmin-routing.module';
import { SuperadminComponent } from './superadmin.component';
import { UsersComponent } from './users/users.component';
import { AdminsComponent } from './admins/admins.component';
import { ReviewsComponent } from './reviews/reviews.component';
import { ViewRidesComponent } from './users/view-rides/view-rides.component';
import { ViewVehiclesComponent } from './admins/view-vehicles/view-vehicles.component';
import { ViewDriversComponent } from './admins/view-drivers/view-drivers.component';
import { ViewRatingComponent } from './admins/view-rating/view-rating.component';
import { FormComponent } from './admins/form/form.component';
import { CmsComponent } from './cms/cms.component';
import { EditCmsComponent } from './cms/edit-cms/edit-cms.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { ViewComponent } from './contact-us/view/view.component';
import {EditorModule} from 'primeng/editor';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { FaqComponent } from './faq/faq.component';
import { FaqFormComponent } from './faq/faq-form/faq-form.component';

import { NgxUploaderModule } from 'ngx-uploader';
import { JoinPartnersComponent } from './join-partners/join-partners.component';
import { BlogManagementComponent } from './blog-management/blog-management.component';
import { EditBlogComponent } from './blog-management/edit-blog/edit-blog.component';

@NgModule({
  imports: [
    CommonModule,
    SuperadminRoutingModule,
    AppSharedModule,
    EditorModule,
    AngularFontAwesomeModule,
    NgxUploaderModule
  ],
  declarations: [
    SuperadminComponent,
    UsersComponent,
    AdminsComponent,
    ReviewsComponent,
    ViewRidesComponent,
    ViewVehiclesComponent,
    ViewDriversComponent,
    ViewRatingComponent,
    FormComponent,
    CmsComponent,
    ContactUsComponent,
    EditCmsComponent,
    ViewComponent,
    FaqComponent,
    FaqFormComponent,
    JoinPartnersComponent,
    BlogManagementComponent,
    EditBlogComponent
  ],
  providers: [SuperadminService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SuperadminModule { }
