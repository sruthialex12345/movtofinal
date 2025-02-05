import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';

import { SharedService } from "../services/shared.service";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';
import { SpinnerVisibilityService } from 'ng-http-loader';
declare var $: any;

@Component({
  selector: 'app-main-footer',
  templateUrl: './main-footer.component.html',
  styleUrls: ['./main-footer.component.css']
})
export class MainFooterComponent implements OnInit {
  requestDemoForm: FormGroup;
  submitted = false;
  page:any;
  formated_address: string = "";
  constructor(
    private klassService: UserService,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private spinner: SpinnerVisibilityService,
    private sharedService: SharedService
  ) { }

  showForm(){
    $(".demo-form").slideDown("medium");
    this.getGeoLocation();
  }
  closeForm(){
      $(".demo-form").slideUp("medium");
      this.submitted = false;
      this.requestDemoForm.patchValue({
        name:"",phoneNo: "",email: "",isdCode: "1",message: "",subject: ""
     });
  }
  ngOnInit() {
    this.requestDemoForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      email: ['', [Validators.required,Validators.email]],
      phoneNo: [null, [Validators.required, Validators.pattern("^[0-9]*$")]],
      isdCode:['1', [Validators.required]],
      company: ['', [Validators.required]],
    });
  }

  get f() { return this.requestDemoForm.controls; }

  onSubmit() {
    this.submitted = true;
    if (this.requestDemoForm.controls.name.errors ||
      this.requestDemoForm.controls.email.errors ||
      this.requestDemoForm.controls.phoneNo.errors ||
      this.requestDemoForm.controls.address.errors ||
      this.requestDemoForm.controls.company.errors ||
      this.requestDemoForm.controls.isdCode.errors) {
      return;
  }

  this.spinner.show();
    let requestDemoFormData:any={
      name: this.requestDemoForm.controls.name.value,
      phoneNo:this.requestDemoForm.controls.phoneNo.value,
      email:this.requestDemoForm.controls.email.value,
      isdCode: this.requestDemoForm.controls.isdCode.value,
      address: this.requestDemoForm.controls.address.value,
      company: this.requestDemoForm.controls.company.value,
    }

    this.klassService.addItem(requestDemoFormData,'home/requestDemo').subscribe(
      (res) => {
        let responseData = res.json();
        if(responseData.success){
          this.toastr.success( responseData.message,'', {
            timeOut: 3000
          });
          //this.router.navigate(['/login/auth']);
        }else{
          this.toastr.error( responseData.message,'', {
            timeOut: 3000
          });
        }
        this.requestDemoForm.patchValue({
          name:"",phoneNo: "",email: "",isdCode: "1",company: "",address: ""
       });
      this.submitted = false;
      this.spinner.hide();
      $(".demo-form").slideUp("medium");
      },
      (err) => {
        let error = JSON.parse(err._body);
        this.toastr.error( error.message,'  ', {
          timeOut: 3000
        });
        this.spinner.hide();
        $(".demo-form").slideUp("medium");
      }
    );
  }

  getGeoLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        var cordinates = position.coords;
        var latLong = cordinates.latitude + "," + cordinates.longitude;
        this.sharedService.getLocation(latLong).subscribe(results => {
          if (results) {
            if (
              results &&
              results.results &&
              results.results[0] &&
              results.results[0].formatted_address
            ) {
              this.formated_address = results.results[0].formatted_address;
              this.requestDemoForm.patchValue({
                address: this.formated_address
              });
            }
          }
        });
      });
    }
  }
}
