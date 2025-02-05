import { Component, OnInit,EventEmitter } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseForm } from '../../shared/base-form';
import { UserService } from '../../services/user.service';
import { NotificationsService } from '../../shared/notifications.service';

import { ToastrService} from 'ngx-toastr';
import { SpinnerVisibilityService } from 'ng-http-loader';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  placeholder: any ;
  validation: any ;
  changePasswordForm : FormGroup;
  submitted: boolean = false;
  token: any;
  userType:string;
  passcheck: boolean = false;
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute, 
    private router: Router, 
    private userService: UserService,
    private toastr: ToastrService,
    private spinner: SpinnerVisibilityService
    ) {
    this.changePasswordForm = this.fb.group({
      // currentpwd: [null, [Validators.required, Validators.minLength(6),Validators.maxLength(30)]],
      password: [null, [Validators.required, Validators.minLength(6),Validators.maxLength(30)]],
      confirm_password: [null, Validators.required]
    }, { validator: this.passwordConfirming }
    );
    this.route.params.subscribe(params => {
      this.token = params.token;  
    })

    this.placeholder = {
      current_password: "Current Password",
      enter_new_password: "Enter new Passpord",
      confirm_new_password: "Confirm Password"
    }
    this.validation = {
      confirm_password: "Confirm password did not match",
      password_is_required:"Password is required",
      password_length:"Confirm password did not match",
    }
  }
  ngOnInit() {
    
  }
  /* 
  * Function: passwordConfirming
  * Des: checking password and confirm password match or not
  */
  passwordConfirming(c: any): any {
    if (c.get('password').value !== c.get('confirm_password').value) {
      return c.get('confirm_password').setErrors({ 'confirmError': true });
    }
  }

  // This function is used to check for current password match
  // chkCrntPass(val) {
  //   this.spinner.show();
  //   this.passcheck = false;
  //   if (!val) {
  //     this.passcheck = true;
  //     this.spinner.hide();
  //     return;
  //   }
  //   var chkpass={
  //     password:val
  //   }
  //   this.userService.chkPass(chkpass, 'admin/checkCurrentPassword').subscribe(res => {
  //     if (!res.success) {
  //       this.passcheck = true;
  //       this.submitted = true;
  //     }
  //     this.spinner.hide();
  //     return;
  //   })   
  //   this.spinner.hide();
  // }
  /* 
  * Function: changePassword
  * Des: function is use to chnage password based
  */
  changePassword() {    
    this.spinner.show();     
    if (this.changePasswordForm.invalid) {
      this.submitted = true;
      this.spinner.hide();
      return;
    } 
    // if (this.passcheck) {
    //   this.submitted = true;
    //   this.spinner.hide();
    //   return;
    // }
    this.userService.changePassword(this.changePasswordForm.value, 'admin/changePasswordAdmin').subscribe(res => {
      this.spinner.hide();
      if(!res.success){
        this.toastr.error(res.message,'Error', {
          timeOut: 3000
        });        
      }else{ 
        this.toastr.success(res.message,'Success', {
          timeOut: 3000
        });
      }
      this.spinner.hide();
      this.router.navigate(['/dashboard']);
    })

  }

}
