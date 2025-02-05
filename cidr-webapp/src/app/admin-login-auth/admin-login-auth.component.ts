import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { NotificationsService } from '../shared/notifications.service';
import { AuthenticationService } from '../services/authentication.service';
import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';
import { BaseForm } from '../shared/base-form';
import { SpinnerVisibilityService } from 'ng-http-loader';

@Component({
  selector: 'app-admin-login-auth',
  templateUrl: './admin-login-auth.component.html',
  styleUrls: ['./admin-login-auth.component.css']
})
export class AdminLoginAuthComponent implements OnInit {
  loginAuthForm: FormGroup;
  submitted: boolean = false;
  loginByOtp: boolean = false;
  loginByAccessCode: boolean = false;
  accessCode:string="";
  loginData:any;
  accessCodeRequires:boolean=false
  f : any;
  constructor(
    private authenticationService: AuthenticationService,
    private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private notificationsService: NotificationsService,
    private toastr: ToastrService,
    private spinner: SpinnerVisibilityService,
  ) {

  }

  ngOnInit() {
    this.loginAuthForm = this.formBuilder.group({
      email: ['', [Validators.required,Validators.email]],
      password: ['', [Validators.required]]
    });
    this.f = this.loginAuthForm.controls;
  }


  login() {
    this.submitted = true;
    if (this.loginAuthForm.invalid) {
      return;
    }
    this.spinner.show();
    this.authenticationService.login(this.loginAuthForm.value.email, this.loginAuthForm.value.password)
    .subscribe((res)=> {
    this.loginData=res;
    if (this.loginData && this.loginData.data && this.loginData.data.jwtAccessToken && this.loginData.data.user && this.loginData.data.user.userType=="superAdmin") {
      if(this.loginData.success){
        localStorage.setItem('currentUser', JSON.stringify(this.loginData.data.user));
        localStorage.setItem('authorization', this.loginData.data.jwtAccessToken);
        this.router.navigate(['/dashboard']);
        this.toastr.success( this.loginData.message,'Success', {
          timeOut: 3000
        });
        this.spinner.hide();
      }else{
        this.toastr.error( this.loginData.message,'Error', {
          timeOut: 3000
        });
        this.spinner.hide();
      }
    }else{
      this.loginByAccessCode=true;
      this.spinner.hide();
    }

    },
    (err) => {
      this.spinner.hide();
      let error = err.error;
      this.toastr.error( error.message,'Error', {
        timeOut: 3000
      });
      this.spinner.hide();
    })
  }

  loginWithAccessCode(accesscode){
    this.accessCode=accesscode;
    if(this.accessCode==""){
      this.accessCodeRequires=true
      return;
    }
    this.spinner.show();
    this.accessCodeRequires=false
      // login successful if there's a jwt token in the response
      if (this.loginData && this.loginData.data && this.loginData.data.jwtAccessToken && this.loginData.data.user && (this.accessCode==this.loginData.data.user.accessCode)) {
        // store user details and jwt token in local storage to keep user logged in between page refreshes
        // this.dataService.currentUser.next(user);
        if(this.loginData.success){
          localStorage.setItem('currentUser', JSON.stringify(this.loginData.data.user));
          localStorage.setItem('authorization', this.loginData.data.jwtAccessToken);
          this.router.navigate(['/dashboard/profile']);
          this.toastr.success( this.loginData.message,'Success', {
            timeOut: 3000
          });
          this.spinner.hide();
        }else{
          this.toastr.error( this.loginData.message,'Error', {
            timeOut: 3000
          });
          this.spinner.hide();
        }
     }else{
      this.toastr.error( "Access code does not match.",'Error', {
        timeOut: 3000
      });
      this.spinner.hide();
     }

  }
  backToLogin(){
    this.loginByAccessCode=false;
  }
}
