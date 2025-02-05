import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SpinnerVisibilityService } from 'ng-http-loader';
import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';
import {MessageService} from '../message.service';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-user-message',
  templateUrl: './user-message.component.html',
  styleUrls: ['./user-message.component.css']
})
export class UserMessageComponent implements OnInit {

  messageOnDemandForm: FormGroup;
  messageOnUserForm: FormGroup;
  submitted: boolean = false;
  submittedMessage: boolean = false;
  currentUser: any ={};
  f:any;
  m:any;
  isEditable:boolean=false
  messageId:any;
  message:any
  allMessage:any=[];
  public invoiceForm: FormGroup;
  constructor(
    private mssageService: MessageService,
    private spinner: SpinnerVisibilityService,
    private toastr: ToastrService,
    private formBuilder: FormBuilder,
  ) {

  }

  ngOnInit() {
    this.messageOnDemandForm = this.formBuilder.group({
      isdCode:['1', [Validators.required]],
      phoneNo: ['', [Validators.required,Validators.pattern("[0-9]+")]],
      // message: ['Run your business on the go. Download CircularDrive.  \n\nAnroid : https://bit.ly/2SXLD3H \niOS: https://apple.co/2Tn7OiW', [Validators.required]]
    });

    this.messageOnUserForm = this.formBuilder.group({
      message: ["", [Validators.required]]
    });

    this.f = this.messageOnDemandForm.controls;
    this.m = this.messageOnUserForm.controls;

    this.currentUser = JSON.parse(localStorage.getItem("currentUser"));
    this.getMessageOnUser();
  }


  addMessage(){
    this.submitted = true;
    if (this.messageOnDemandForm.invalid) {
      return;
    }
    var flg=0;
    if(this.allMessage && this.allMessage.length){
      this.allMessage.map(num=>{
        if((num.isdCode==this.messageOnDemandForm.value.isdCode) && (num.phoneNo==this.messageOnDemandForm.value.phoneNo)){
          this.toastr.error("Number already Added",'Error', {
            timeOut: 3000
          });
          flg=1;
          return true;
        }
      })
    }
    if(flg==0){
      this.allMessage.push(this.messageOnDemandForm.value);
    }
    this.messageOnDemandForm.patchValue({isdCode:"1",phoneNo:""});
    this.submitted=false;
  }

  deleteRow(index){
    this.allMessage.splice(index, 1);
  }

  getMessageOnUser() {
    this.spinner.show();
    this.mssageService.getNotifyMessage(`admin/getNotifyMessage`).subscribe((res:any) => {
      if(res && res.data !=null){
        this.isEditable = true;
        this.messageId=res.data._id;
        this.message=res.data.message
      }
      let  msg=(res && res.data)?res.data:"";
      this.messageOnUserForm.patchValue(msg);
      this.spinner.hide();
      return true;

    });
    this.spinner.hide();
  }


  save(){
    this.submittedMessage = true;
    if (this.messageOnUserForm.invalid) {
      return;
    }
    this.spinner.show();
    this.mssageService.addNotifyMessage(this.messageOnUserForm.value, `admin/saveToNotifyMessage`) .subscribe((res: any) => {
        if(!res){
          this.spinner.hide();
          this.toastr.error(res.message,'Error', {
            timeOut: 3000
          });
        } else if (res.data) {
          this.spinner.hide();
          this.toastr.success(res.message,'Success', {
            timeOut: 3000
          });
        }else{
          this.spinner.hide();
        }
        this.getMessageOnUser();
      });
  }

  Update(){
    this.submittedMessage = true;
    if (this.messageOnUserForm.invalid) {
      return;
    }
    this.spinner.show();
    this.messageOnUserForm.value._id=this.messageId;
    this.mssageService.updateNotifyMessage(this.messageOnUserForm.value, `admin/updateToNotifyMessage`) .subscribe((res: any) => {
        if(!res){
          this.spinner.hide();
          this.toastr.error(res.message,'Error', {
            timeOut: 3000
          });
        } else if (res.data) {
          this.spinner.hide();
          this.toastr.success(res.message,'Success', {
            timeOut: 3000
          });
        }else{
          this.spinner.hide();
        }
        this.getMessageOnUser();
      });
  }

  sendMessage(){
    if (!this.message) {
      this.toastr.error("Please add message to send.",'Error', {
        timeOut: 3000
      });
      return true;
    }
    if(this.allMessage && this.allMessage.length){
      this.spinner.show();
      var msg={itemRows:this.allMessage,message:this.message}
      this.mssageService.sendToCustomerMessage(msg,`admin/sendToCustomerMessage`).subscribe((res) => {
      if(res && !res.success) {
        this.toastr.error(res.message.message,'Error', {
          timeOut: 3000
        });
      }else{
        this.toastr.success(res.message,'Success', {
          timeOut: 3000
        });
      }
      this.messageOnDemandForm.patchValue({isdCode:"1",phoneNo:""});
      this.submitted = false;
      this.spinner.hide();
      this.allMessage=[];
      return true;
     });
    }else{
      this.toastr.error("Please add number.",'Error', {
        timeOut: 3000
      });
      this.submitted=true;
    }
  }
}

