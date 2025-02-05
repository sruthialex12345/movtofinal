import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SpinnerVisibilityService } from 'ng-http-loader';
import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';
import {MessageService} from '../message.service';

@Component({
  selector: 'app-custom-message',
  templateUrl: './custom-message.component.html',
  styleUrls: ['./custom-message.component.css']
})
export class CustomMessageComponent implements OnInit {

  messageCustomForm: FormGroup;
  submitted: boolean = false;
  currentUser: any ={};
  messageAvailable:boolean=false;
  removeMessageBool:boolean=false;
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
    this.messageCustomForm = this.formBuilder.group({
      message: ['', [Validators.required]]
    });
    this.f = this.messageCustomForm.controls;
    this.currentUser = JSON.parse(localStorage.getItem("currentUser"));
    this.getCumstomMessage();
  }

  getCumstomMessage(){
    this.spinner.show();
    this.mssageService.getMessageCustom(`admin/getCustomMessage`).subscribe((res) => { 
      if(res.data.custom_message){
        this.messageAvailable=true
      }     
      this.messageCustomForm.patchValue({message:res.data.custom_message});
     });
     this.spinner.hide();
  }

  updateMessage(){
    this.submitted = true;
    if (this.messageCustomForm.invalid) {
      return;
    }
    this.spinner.show();
    if(this.removeMessageBool){
      this.messageCustomForm.value.message="";
    }
    this.mssageService.updateCustomMessage(this.messageCustomForm.value,`admin/updateCustomMessage`).subscribe((res) => {
      this.removeMessageBool=false;
      this.getCumstomMessage();
      if(res && !res.success) {
        this.toastr.error(res.message,'Error', {
          timeOut: 3000
        });
        this.spinner.hide();
        return true;
      }else{
        this.toastr.success(res.message,'Success', {
          timeOut: 3000
        });
        this.spinner.hide();
        return true;
      }
     });
     
  }
  removeMessage(){
    this.removeMessageBool=true;
    this.updateMessage();
  }

}
