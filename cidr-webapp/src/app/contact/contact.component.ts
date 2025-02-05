import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params} from '@angular/router';
import { Location } from '@angular/common';
import { UserService } from '../services/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';
import { SpinnerVisibilityService } from 'ng-http-loader';
import { SharedService } from "../services/shared.service";
import {StaticPagesService} from "../services/staticpages.service";
import { Meta, Title } from '@angular/platform-browser';
declare var $: any;

import {
  animate,
  keyframes,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { MAX_LENGTH_VALIDATOR } from '@angular/forms/src/directives/validators';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent implements OnInit {
  requestDemoForm: FormGroup;
  formated_address: string = "";
  contactForm: FormGroup;
  submitted = false;
  submittedRequest = false;
  page:any;

  constructor(
    private location: Location,
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

  }

  ngOnInit() {
    this.contactForm = this.formBuilder.group({
      // isAgree: [null, [Validators.required]],
      name: ['', [Validators.required]],
      email: ['', [Validators.required,Validators.email]],
      // password: [null, [Validators.required, Validators.pattern("^(?=.*?[a-zA-Z])(?=.*?[0-9]).{8,}$"),Validators.minLength(8)]],
      phoneNo: [null, [Validators.required, Validators.pattern("^[0-9]*$")]],
      isdCode:['1', [Validators.required]],
      subject: ['', [Validators.required]],
      message: ['', [Validators.required]],
    });

    this.requestDemoForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      email: ['', [Validators.required,Validators.email]],
      phoneNo: [null, [Validators.required, Validators.pattern("^[0-9]*$")]],
      isdCode:['1', [Validators.required]],
      company: ['', [Validators.required]],
    });
    this.getmetaData();
  }

  get f() { return this.contactForm.controls; }

  onSubmit() {
    this.submitted = true;

    if (this.contactForm.controls.name.errors ||
      this.contactForm.controls.email.errors ||
      this.contactForm.controls.phoneNo.errors ||
      this.contactForm.controls.subject.errors ||
      this.contactForm.controls.message.errors ||
      this.contactForm.controls.isdCode.errors) {
        console.log('return here');
      return;
  }
  this.spinner.show();
    let contactFormData:any={
      name: this.contactForm.controls.name.value,
      phoneNo:this.contactForm.controls.phoneNo.value,
      email:this.contactForm.controls.email.value,
      isdCode: this.contactForm.controls.isdCode.value,
      message: this.contactForm.controls.message.value,
      subject: this.contactForm.controls.subject.value,
    }
    console.log("formdata", contactFormData);

    this.klassService.addItem(contactFormData,'home/contactus').subscribe(
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
        this.contactForm.patchValue({
          name:"",phoneNo: "",email: "",isdCode: "1",message: "",subject: ""
       });
      this.submitted = false;
      this.spinner.hide();
      },
      (err) => {
        let error = JSON.parse(err._body);
        this.toastr.error( error.message,'  ', {
          timeOut: 3000
        });
        this.spinner.hide();
      }
    );
  }

  getmetaData(){
    var pageSlug='contactus';
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
    this.meta.updateTag({ name: 'description', content: this.page.description });
    this.meta.updateTag({ name: 'author', content: this.page.author });
    this.meta.updateTag({ name: 'keywords', content: this.page.keywords });
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
