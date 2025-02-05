import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params} from '@angular/router';
import { UserService } from '../services/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';
import { SpinnerVisibilityService } from 'ng-http-loader';
import {StaticPagesService} from "../services/staticpages.service";
import { Meta, Title } from '@angular/platform-browser';
import { SharedService } from "../services/shared.service";
import {
  animate,
  keyframes,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { MAX_LENGTH_VALIDATOR } from '@angular/forms/src/directives/validators';
declare var $: any;
@Component({
  selector: 'app-admin-register',
  templateUrl: './admin-register.component.html',
  styleUrls: ['./admin-register.component.css']
})
export class AdminRegisterComponent implements OnInit {
  registerForm: FormGroup;
  requestDemoForm: FormGroup;
  formated_address: string = "";
  // managerForm: FormGroup;
  otpForm: FormGroup;
  submitted = false;
  submittedRequest = false;
  loginByOtp:boolean=false;
  submittedOtp = false;
  userid:String='';
  tripType= [];
  page:any;
  typeTrip:String='dynamicRoute';
  locationObj:any;
  /*public name = "";
  public email = "";
  public password = "";
  public emailFormat = "/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/";
  public mobile = "";*/
  constructor(
    private router: Router,
    private klassService: UserService,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private spinner: SpinnerVisibilityService,
    private staticPagesService: StaticPagesService,
    private titleService: Title,
    private meta: Meta,
    private sharedService: SharedService
  ) {
    // this.showSuccess();
  }

  ngOnInit() {
    this.getGeoLocation();
    this.registerForm = this.formBuilder.group({
        // isAgree: [null, [Validators.required]],
        name: ['', [Validators.required]],
        name_manager: ['', [Validators.required]],
        // tripType:['circularStaticRoute', [Validators.required]],
        email: ['', [Validators.required,Validators.email]],
        email_manager: ['', [Validators.required,Validators.email]],
        // password: [null, [Validators.required, Validators.pattern("^(?=.*?[a-zA-Z])(?=.*?[0-9]).{8,}$"),Validators.minLength(8)]],
        phoneNo: [null, [Validators.required,Validators.pattern("^[0-9]*$")]],
        isdCode:['1', [Validators.required]],
        isdCode_manager:['1', [Validators.required]],
        phoneNo_manager: [null, [Validators.required,Validators.pattern("^[0-9]*$")]],
        address:['', [Validators.required]],
    });
    this.otpForm = this.formBuilder.group({
      otp: [null, [Validators.required]],
    });
    this.requestDemoForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      email: ['', [Validators.required,Validators.email]],
      phoneNo: [null, [Validators.required, Validators.pattern("^[0-9]*$")]],
      isdCode:['1', [Validators.required]],
      company: ['', [Validators.required]],
    });
  //   this.managerForm = this.formBuilder.group({
  //     // isAgree: [null, [Validators.required]],
  //     name: ['', []],
  //     email: ['', []],
  //     phoneNo: [null, []],
  //     isdCode:['1', []],
  // });

    this.getmetaData();
    // this.getCountryCodes();
  }
  get f() { return this.registerForm.controls; }
  get o() { return this.otpForm.controls; }
  // get m() { return this.managerForm.controls; }
  // getCountryCodes(){
  //   this.klassService.getCountryCodes('users/getCountryCode').subscribe((res) => {
  //     console.log('response', res);
  //     let responseData = res.json();
  //     console.log('response', responseData);
  //     if(responseData.success){
  //       this.toastr.success( responseData.message,'Success', {
  //         timeOut: 3000
  //       });
  //       this.router.navigate(['/login/auth']);
  //     }else{
  //       this.toastr.error( responseData.message,'Error', {
  //         timeOut: 3000
  //       });
  //     }

  //   },
  //   (err) => {
  //     let error = JSON.parse(err._body);
  //     console.log('response error',error.message);
  //     this.toastr.error( error.message,'Error', {
  //       timeOut: 3000
  //     });
  //   });
  // }

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
              this.locationObj={
                zone:{
                    location: [results.results[0].geometry.location.lng, results.results[0].geometry.location.lat],
                    formattedAddress: results.results[0].formatted_address
                },
                radius:50,
                name:results.results[0].formatted_address
              }
              this.registerForm.patchValue({
                address: this.formated_address
              });
              this.requestDemoForm.patchValue({
                address: this.formated_address
              });
            }
          }
        });
      });
    }
  }

  getmetaData(){
    var pageSlug='signup';
    this.staticPagesService.getItem(`home/staticPageDetails?pageSlug=${pageSlug}`)
    .subscribe((res:any) => {
      if(res != null){
        this.page = res.data;
        this.setMetaData();
        return true;
      }
    });
   }

  setMetaData() {
    this.titleService.setTitle(this.page.title);
    this.meta.updateTag({ name: 'description', content: this.page.description});
    this.meta.updateTag({ name: 'author', content: this.page.author });
    this.meta.updateTag({ name: 'keywords', content: this.page.keywords });
  }

  onSubmit() {
    this.submitted = true;
    this.tripType.push(this.typeTrip)

    if (this.registerForm.controls.name.errors ||
      this.registerForm.controls.email.errors ||
      this.registerForm.controls.phoneNo.errors ||
      this.registerForm.value.name_manager.errors ||
      this.registerForm.value.email_manager.errors ||
      this.registerForm.value.phoneNo_manager.errors ||
      this.registerForm.value.isdCode_manager.errors ||
      this.registerForm.value.address.errors ||
      this.registerForm.controls.isdCode.errors) {
        this.tripType = [];
      return;
  }
   this.spinner.show();
  var managerDetails = {
    name: this.registerForm.value.name_manager,
    email: this.registerForm.value.email_manager,
    phoneNo: this.registerForm.value.phoneNo_manager,
    isdCode: this.registerForm.value.isdCode_manager
  }
    let user:any={
      name: this.registerForm.controls.name.value,
      phoneNo:this.registerForm.controls.phoneNo.value,
      email:this.registerForm.controls.email.value,
      // password: this.registerForm.controls.password.value,
      isdCode: this.registerForm.controls.isdCode.value,
      address: this.registerForm.controls.address.value,
      userType: 'admin',
      tripType :this.typeTrip,
      adminTripTypes:this.tripType,
      managerDetails: managerDetails,
      locationObject:this.locationObj?this.locationObj:""
    }

    this.klassService.addItem(user,'users/signUpProvider').subscribe(
      (res) => {
        this.tripType = [];
        let responseData = res.json();
        console.log(responseData);

        if(responseData.success){
          this.toastr.success( responseData.message,'Success', {
            timeOut: 3000
          });
          this.userid=responseData.data.user._id;
          // this.loginByOtp=true;
          this.spinner.hide();
          this.router.navigate(['/login/auth']);
        }else{
          this.tripType = [];
          this.toastr.error( responseData.message,'Error', {
            timeOut: 3000
          });
        }
        this.spinner.hide();
      },
      (err) => {
        console.log("err",err);
        this.tripType = [];
        let error = JSON.parse(err._body);
        this.toastr.error( error.message,'  ', {
          timeOut: 3000
        });
        this.spinner.hide();
      }
    );
  }

  otpValidate(){

    this.submittedOtp = true;
    if (this.otpForm.controls.otp.errors) {
          console.log('return here');
        return;
    }
    this.spinner.show();
    let user:any={
      otpValue: parseInt(this.otpForm.controls.otp.value),
      userType: 'admin',
      userId:this.userid
    }
    this.klassService.validateOtp(user,'verify/mobileVerifyWeb').subscribe(
      (res) => {
        let responseData = res.json();
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
        this.spinner.hide();
      },
      (err) => {
        let error = JSON.parse(err._body);
        this.toastr.error( error.message,'Error', {
          timeOut: 3000
        });
        this.spinner.hide();
      }
    );
  }

  showSuccess() {
  }

  showForm(){
    $(".demo-form").slideDown("medium");
  }
  closeForm(){
      $(".demo-form").slideUp("medium");
      this.submittedRequest = false;
      this.requestDemoForm.patchValue({
        name:"",phoneNo: "",email: "",isdCode: "1",message: "",subject: ""
     });
  }
  get r() { return this.requestDemoForm.controls; }

  onSubmitRequest() {
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

}
