import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SpinnerVisibilityService } from 'ng-http-loader';
import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';
import {MessageService} from '../message.service';

@Component({
  selector: 'app-on-demand-message',
  templateUrl: './on-demand-message.component.html',
  styleUrls: ['./on-demand-message.component.css']
})
export class OnDemandMessageComponent implements OnInit {
  messageOnDemandForm: FormGroup;
  submitted: boolean = false;
  currentUser: any ={};
  isLoading:boolean = false;
  location: any = {formatted_address: " "};
  display: boolean = false;
  name:string;
  email:string;
  f:any;
  reservationCode:string="";

  constructor(
    private mssageService: MessageService,
    private spinner: SpinnerVisibilityService,
    private toastr: ToastrService,
    private formBuilder: FormBuilder,
  ) { 
    
  }

  ngOnInit() {
    this.messageOnDemandForm = this.formBuilder.group({
      message: ['', [Validators.required]]
    });
    this.f = this.messageOnDemandForm.controls;

    this.currentUser = JSON.parse(localStorage.getItem("currentUser"));
  }

  sendMessage(){
    this.submitted = true;
    if (this.messageOnDemandForm.invalid) {
      return;
    }
    this.isLoading = true;
    this.spinner.show();
    this.mssageService.sendOnDemandMessage(this.messageOnDemandForm.value,`admin/sendOnDemandMessage`).subscribe((res) => {
      if(res && !res.success) {
        this.toastr.error(res.message,'Error', {
          timeOut: 3000
        });
        this.messageOnDemandForm.patchValue({message:""});
        this.submitted = false;
        this.spinner.hide();
        return true;
      }else{
        this.toastr.success(res.message,'Success', {
          timeOut: 3000
        });
        this.submitted = false;
        this.messageOnDemandForm.patchValue({message:""});
        this.spinner.hide();
        return true;
      }
     });
  }

}
