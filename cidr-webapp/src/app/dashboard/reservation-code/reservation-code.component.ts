import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ReservationCodeService } from './reservation-code.service';

import { Listing } from '../../shared/listing';
import { SpinnerVisibilityService } from 'ng-http-loader';
import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';


@Component({
  selector: 'app-reservation-code',
  templateUrl: './reservation-code.component.html',
  styleUrls: ['./reservation-code.component.css']
})
export class ReservationCodeComponent extends Listing implements OnInit {

  shareCodeForm: FormGroup;
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
    private reservationCodeService: ReservationCodeService,
    private spinner: SpinnerVisibilityService,
    private toastr: ToastrService,
    private formBuilder: FormBuilder,
  ) {
    super();
  }

  ngOnInit() {
    this.shareCodeForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      name:['',[Validators.required]]
    });
    this.f = this.shareCodeForm.controls;

    this.currentUser = JSON.parse(localStorage.getItem("currentUser"));
    this.getItems();
    
  }

  getItems(){
    this.reservationCodeService.getReservationCode(`admin/getReservationCode`)
    .subscribe((res: any) => {
      if(!res){
        this.isLoading = false;
        this.spinner.hide();
        this.reservationCode = '';
        return true;
      } else if (res.data) {
        this.isLoading = false;
        this.reservationCode = res.data.reservationCode;
        this.spinner.hide();
      }else{
        this.reservationCode = '';
        this.spinner.hide();
      }
    });
  }

  removeItem() {
  }

  toggleStatus(obj) {
  }

  generateCode(){
    this.isLoading = true;
    this.spinner.show();
    this.reservationCodeService.addReservationCode(null,`admin/generateReservationCode`).subscribe((res) => {
      if(!res){
        this.spinner.hide();
        return true;
      }
      if(!res.success) {
        this.toastr.error(res.message,'Error', {
          timeOut: 3000
        });
        this.spinner.hide();
        return true;
      }
      this.item = null;
      this.getItems();
      this.spinner.hide();
    });
  }

  openDialog() {
    this.display = true;
    this.submitted = false;
  }

  closeDialog(){
    this.display = false;
    this.submitted = false;
    this.shareCodeForm.reset();
  }

  shareCode(){
    this.submitted = true;
    if (this.shareCodeForm.invalid) {
      return;
    }
    this.isLoading = true;
    this.spinner.show();
    var obj={
      data:{
        'reservationCode':this.reservationCode,
        'name': this.shareCodeForm.value.name ,
        'email': this.shareCodeForm.value.email
      }
    };
    this.reservationCodeService.shareReservationCode(obj,`admin/shareReservationCode`).subscribe((res) => {
      if(!res){
        this.display = false;
        this.spinner.hide();
        return true;
      }
      if(!res.success) {
        this.toastr.error(res.message,'Error', {
          timeOut: 3000
        });
        this.display = false;
        this.spinner.hide();
        return true;
      }
      this.toastr.success(res.message,'Success', {
        timeOut: 3000
      });
      this.display = false;
      this.spinner.hide();
    });
  }

}

