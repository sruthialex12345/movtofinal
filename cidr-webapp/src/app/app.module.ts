import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import {SlideshowModule} from 'ng-simple-slideshow';

import { RoutingModule } from './app.routing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { AgmCoreModule } from '@agm/core';
import {Ng2TelInputModule} from 'ng2-tel-input';

import { AppSharedModule } from './shared/app-shared.module';
import { SocketService } from './shared/socket.service';
import { AppComponent } from './app.component';
import { BaseService } from './services/base-service';
import { UserService } from './services/user.service';
import { AuthGuard } from './services/auth.guard';
import { AuthenticationService } from './services/authentication.service';
import { SharedService } from './services/shared.service';
import { NotificationsService } from './shared/notifications.service';
import { StaticPagesService } from './services/staticpages.service';

import { AdminRegisterComponent } from './admin-register/admin-register.component';
import { AdminLoginAuthComponent } from './admin-login-auth/admin-login-auth.component';
import { AdminForgotPassowordComponent } from './admin-forgot-passoword/admin-forgot-passoword.component';
import { HttpClientModule } from '@angular/common/http'; // <============
import { NgHttpLoaderModule } from 'ng-http-loader';
import { MainHeaderComponent } from './main-header/main-header.component';
import { HomeComponent } from './home/home.component';
import { StaticPagesComponent } from './static-pages/static-pages.component'
import { MainFooterComponent } from './main-footer/main-footer.component';
import { AboutusComponent } from './aboutus/aboutus.component';
import { RidersComponent } from './riders/riders.component';
import { ServicesComponent } from './services/services.component';
import { PartnerComponent } from './partner/partner.component';
import { ContactComponent } from './contact/contact.component';
import { MobilePageComponent } from './mobile-page/mobile-page.component';
import { JoinOurPartnerNetworkComponent } from './join-our-partner-network/join-our-partner-network.component';
import { BlogsComponent } from './blogs/blogs.component';
import { BlogDetailsComponent } from './blogs/blog-details/blog-details.component';
import { NotFoundComponent } from './not-found/not-found.component'; // <============

@NgModule({
  declarations: [
    AppComponent,
    AdminRegisterComponent,
    AdminLoginAuthComponent,
    AdminForgotPassowordComponent,
    MainHeaderComponent,
    HomeComponent,
    MainFooterComponent,
    StaticPagesComponent,
    AboutusComponent,
    RidersComponent,
    ServicesComponent,
    PartnerComponent,
    ContactComponent,
    MobilePageComponent,
    JoinOurPartnerNetworkComponent,
    BlogsComponent,
    BlogDetailsComponent,
    NotFoundComponent
  ],
  imports: [
    SlideshowModule,
    Ng2TelInputModule,
    BrowserModule,
    AgmCoreModule.forRoot({
      // please get your own API key here:
      // https://developers.google.com/maps/documentation/javascript/get-api-key?hl=en
      apiKey: 'AIzaSyAnOIeq4UUKE_T1RRpXCGY_H3o88Aa_mNg'
    }),
    FormsModule,
    AppSharedModule,
    RoutingModule,
    BrowserAnimationsModule, // required animations module
    ToastrModule.forRoot(),
    HttpClientModule, // <============ (Perform http requests with this module)
    NgHttpLoaderModule, // <============
  ],
  providers: [StaticPagesService, SharedService, AuthGuard, NotificationsService, UserService, AuthenticationService, SocketService],
  bootstrap: [AppComponent]
})
export class AppModule { }
