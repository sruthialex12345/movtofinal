import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { error } from 'selenium-webdriver';

import { BaseForm } from '../../../../shared/base-form';

import { SuperadminService } from '../../superadmin.service';
import { LocationGuard } from "../../../../services/location.guard.service";
import { NotificationsService } from '../../../../shared/notifications.service';

import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';
import { SpinnerVisibilityService } from 'ng-http-loader';

@Component({
  selector: 'app-edit-cms',
  templateUrl: './edit-cms.component.html',
  styleUrls: ['./edit-cms.component.css']
})
export class EditCmsComponent extends BaseForm implements OnInit {

  addEditForm: FormGroup;
  currentUser: any = {};
  f : any;
  submitted: boolean = false;
  isLoading: boolean = false;
  location: any = {formatted_address: " "};
  locations:any;
  minLengthError:boolean=false
  contectFlag=true;
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private klassService: SuperadminService,
    private toastr: ToastrService,
    private spinner: SpinnerVisibilityService
  ) {
    super();
  }

  ngOnInit() {
    // subscribe to router event
    this.getAllLocations();
    this.activatedRoute.params.subscribe((params: Params) => {
      this.itemID = params['id'];
      if (this.itemID) {
        if((this.itemID ==='contactus') || (this.itemID ==='faq') || (this.itemID ==='riders') || (this.itemID ==='partners') || (this.itemID ==='home') || (this.itemID ==='about') || (this.itemID ==='signup')||(this.itemID ==='blog')){
          this.contectFlag=false;
        }
        this.isEditable = true;
        this.getItem();
      }
    });

    this.addEditForm = this.formBuilder.group({
      heading: [null, []],
      content: [null, []],
      title: [null, []],
      description: [null, []],
      keywords:[null, []],
      author:[null, []],
    });
    // convenience getter for easy access to form fields
    this.f = this.addEditForm.controls;
  }

  getAllLocations(){
    this.spinner.show();
    this.klassService.getAll(`admin/getLocationsLists`).subscribe((res:any) => {
      this.locations=res.data;
    });
    this.spinner.hide();

  }

  getItem() {
    this.spinner.show();
    this.klassService.getItem(`admin/staticPageDetails?pageSlug=${this.itemID}`).subscribe((res:any) => {
      if(res != null){
        console.log(res.data);
        this.addEditForm.patchValue(res.data);
        this.spinner.hide();
        return true;
      }
      //this.registerForm.patchValue(res);
    });
    this.spinner.hide();
  }

  createItem() {
  }

  updateItem() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.addEditForm.invalid) {
        return;
    }
    console.log("formm values:- ",this.addEditForm.value);
    this.isLoading = true;
    this.spinner.show();
    console.log(this.addEditForm.value);
    this.klassService.updateStaticPage(this.itemID, this.addEditForm.value, 'admin/updateStaticPage').subscribe((res) => {
        this.isLoading = false;
        console.log(res);
        if (!res){
          this.spinner.hide();
          return true;
        }
        this.addEditForm.markAsPristine();
        this.spinner.hide();
        this.router.navigate(['/dashboard/superadmin/cms']);
    });
  }
}
