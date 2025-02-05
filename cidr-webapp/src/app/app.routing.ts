import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HttpModule } from '@angular/http';

import { AuthGuard } from './services/auth.guard';

import { AppComponent } from './app.component';
import { StaticPagesComponent } from './static-pages/static-pages.component';

import { HomeComponent } from './home/home.component';
import { AboutusComponent } from './aboutus/aboutus.component';
import { RidersComponent } from './riders/riders.component';
import { ServicesComponent } from './services/services.component';
import { PartnerComponent } from './partner/partner.component';
import { ContactComponent } from './contact/contact.component';
import { AdminRegisterComponent } from './admin-register/admin-register.component';
import { AdminLoginAuthComponent } from './admin-login-auth/admin-login-auth.component';
import { AdminForgotPassowordComponent } from './admin-forgot-passoword/admin-forgot-passoword.component';
import{MobilePageComponent} from './mobile-page/mobile-page.component'
import {JoinOurPartnerNetworkComponent} from './join-our-partner-network/join-our-partner-network.component'
import{ BlogsComponent } from './blogs/blogs.component'
import{BlogDetailsComponent} from './blogs/blog-details/blog-details.component'
import {NotFoundComponent} from './not-found/not-found.component'
export const appRoutes: Routes = [
    {
      path: 'dashboard',
      loadChildren: './dashboard/dashboard.module#DashboardModule',
      canActivate: [AuthGuard]
    },
    { path: 'pages/:pageSlug', component: StaticPagesComponent},
    { path: 'mobile-pages/:pageSlug', component: MobilePageComponent},
    { path: 'register', component: AdminRegisterComponent },
    { path: 'join-our-partner-network', component: JoinOurPartnerNetworkComponent },
    { path: '', component: HomeComponent },
    { path: 'about-us', component: AboutusComponent },
    { path: 'riders', component: RidersComponent },
    // { path: 'services', component: ServicesComponent },
    { path: 'partner', component: PartnerComponent },
    { path: 'contact-us', component: ContactComponent },
    { path: 'forgot-passoword', component: AdminForgotPassowordComponent },
    { path: 'login/auth', component: AdminLoginAuthComponent },
    { path: 'blogs', component: BlogsComponent},
    { path: 'blog/:pageSlug', component: BlogDetailsComponent},
    {path: '404', component: NotFoundComponent},
    {path: '**', redirectTo: '/404'}

];

@NgModule({
    imports: [ RouterModule.forRoot(appRoutes,{ useHash: false }),HttpModule ],
    exports: [ RouterModule,HttpModule ]
})

export class RoutingModule { }
