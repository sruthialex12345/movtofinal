import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { NotificationsService } from '../shared/notifications.service';
import { AuthenticationService } from '../services/authentication.service';
import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';
import { BaseForm } from '../shared/base-form';

@Component({
  selector: 'app-admin-forgot-passoword',
  templateUrl: './admin-forgot-passoword.component.html',
  styleUrls: ['./admin-forgot-passoword.component.css']
})
export class AdminForgotPassowordComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  submitted: boolean = false;
  fp : any;
  constructor(
    private authenticationService: AuthenticationService,
    private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private notificationsService: NotificationsService,
    private toastr: ToastrService
  ) {

  }

  ngOnInit() {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
    this.fp = this.forgotPasswordForm.controls;
  }


  forgotPassword() {
    this.submitted = true;
    if (this.forgotPasswordForm.invalid) {
      return;
    }
    this.authenticationService.forgotPassword(this.forgotPasswordForm.value.email,'admin')
    .subscribe((res)=> {
      let responseData = res;
      // login successful if there's a jwt token in the response
      if (responseData) {
        // store user details and jwt token in local storage to keep user logged in between page refreshes
        // this.dataService.currentUser.next(user);
        if(responseData.success){
          this.toastr.success( responseData.message,'Success', {
            timeOut: 3000
          });
          this.router.navigate(['/login/auth']);
        }else{
          this.toastr.error( responseData.message,'Error', {
            timeOut: 3000
          });
        }
     }
    },
    (err) => {
      let error = err.error;
      this.toastr.error( error.message,'Error', {
        timeOut: 3000
      });
    })
  }
}
