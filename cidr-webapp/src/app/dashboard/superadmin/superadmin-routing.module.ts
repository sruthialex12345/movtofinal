import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SuperadminComponent } from './superadmin.component';
import { UsersComponent } from './users/users.component';
import { AdminsComponent } from './admins/admins.component';
import { ReviewsComponent } from './reviews/reviews.component';
import { ViewRidesComponent } from './users/view-rides/view-rides.component';
import { ViewDriversComponent } from './admins/view-drivers/view-drivers.component';
import { ViewVehiclesComponent } from './admins/view-vehicles/view-vehicles.component';
import{ViewRatingComponent} from './admins/view-rating/view-rating.component';
import{FormComponent} from './admins/form/form.component';
import { CmsComponent } from './cms/cms.component';
import { EditCmsComponent } from './cms/edit-cms/edit-cms.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { ViewComponent } from './contact-us/view/view.component';
import { FaqComponent } from './faq/faq.component'
import { FaqFormComponent } from './faq/faq-form/faq-form.component'
import {JoinPartnersComponent} from './join-partners/join-partners.component'
import{BlogManagementComponent} from './blog-management/blog-management.component'
 import{EditBlogComponent} from './blog-management/edit-blog/edit-blog.component'

const routes: Routes = [
  { path: '',component: SuperadminComponent,data: { title: 'superadmin' },
    children: [
      // { path: 'superadmin', component: SuperadminComponent, data: { title: 'Dashboard' } },
      // users  / Rider Routings
      { path: 'users', component: UsersComponent, data: { title: 'users' } },
      { path: 'users/viewRides/:riderId', component: ViewRidesComponent, data: { title: 'viewRides' } },
      // Reviews Routings
      { path: 'reviews', component: ReviewsComponent, data: { title: 'reviews' } },
      // admin routing under superadmin Routings
      { path: 'admins', component: AdminsComponent, data: { title: 'admins' } },
      { path: 'admins/new', component: FormComponent, data: { title: 'New' } },
      { path: 'admins/:id/edit', component: FormComponent, data: { title: 'Edit' } },
      { path: 'admins/viewDrivers/:adminId', component: ViewDriversComponent, data: { title: 'viewDrivers' } },
      { path: 'admins/viewVehicles/:adminId', component: ViewVehiclesComponent, data: { title: 'viewVehicles' } },
      { path: 'admins/viewRating/:adminId', component: ViewRatingComponent, data: { title: 'viewRating' } },

      // CMS Routings
      { path: 'cms', component: CmsComponent, data: { title: 'cms' } },
      { path: 'cms/edit/:id', component: EditCmsComponent, data: { title: 'cms' } },
      // Blog Routings
      { path: 'blog', component: BlogManagementComponent, data: { title: 'BlogList' } },
      { path: 'blog/new', component: EditBlogComponent, data: { title: 'BlogNew' } },
      { path: 'blog/edit/:id', component: EditBlogComponent, data: { title: 'BlogUpdate' } },
       // Contact US Routings
      { path: 'contactUs/:id', component: ViewComponent, data: { title: 'contactUs' } },
      { path: 'contactUs', component: ContactUsComponent, data: { title: 'contactUs' } },
      { path: 'join-partners-list', component: JoinPartnersComponent, data: { title: 'Join partners list' } },
      

      // Faq Routings
      { path: 'faq', component: FaqComponent, data: { title: 'faqs' } },
      { path: 'faq/new', component: FaqFormComponent, data: { title: 'New' } },
      { path: 'faq/:id/edit', component: FaqFormComponent, data: { title: 'Edit' } },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SuperadminRoutingModule { }
