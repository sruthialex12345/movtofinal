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
  selector: 'app-faq-form',
  templateUrl: './faq-form.component.html',
  styleUrls: ['./faq-form.component.css']
})
export class FaqFormComponent extends BaseForm implements OnInit {

  addEditForm: FormGroup;
  currentUser: any = {};
  f : any;
  submitted: boolean = false;
  isLoading: boolean = false;
  location: any = {formatted_address: " "};
  locations:any;
  minLengthError:boolean=false

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private klassService: SuperadminService,
    private notificationsService: NotificationsService,
    private locationGuard: LocationGuard,
    private toastr: ToastrService,
    private spinner: SpinnerVisibilityService
  ) {
    super();
    // this.dataService.currentUser.subscribe( currentUser => this.currentUser = currentUser );
    this.currentUser = JSON.parse(localStorage.getItem("currentUser"));
    this.locationGuard.changeLocation().subscribe((location)=>{
      console.log('location changes edit form', location);
      this.location = location;
    })
  }

  ngOnInit() {
    // subscribe to router event
    this.activatedRoute.params.subscribe((params: Params) => {
      this.itemID = params['id'];
      console.log('itemid', this.itemID)     
      if (this.itemID) {
        this.isEditable = true;
        this.getItem();
      }
    });

    this.addEditForm = this.formBuilder.group({
      question: [null, [Validators.required]],
      answer: [null, [Validators.required]],
    });
    // convenience getter for easy access to form fields
    this.f = this.addEditForm.controls;    
  }
  getItem() {
    this.spinner.show();
    this.klassService.getItem(`admin/faqDetails?faqId=${this.itemID}`).subscribe((res:any) => {
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
    
    this.submitted = true;
    // stop here if form is invalid
    if (this.addEditForm.invalid) {
        return;
    }  
    console.log("After -       >", this.addEditForm.value);
    this.isLoading = true;
    this.spinner.show();
    this.klassService.addItem(this.addEditForm.value, "admin/createFaq").subscribe(
      (res) => {
       
        this.isLoading = false;
        if(!res){
          this.notificationsService.notify('error','errorrrr');
          return true;
        }
        this.item = res;
        this.notificationsService.notify('success', 'Faq added successfully');
        this.spinner.hide();
        this.router.navigate(['/dashboard/superadmin/faq']);
        // this.router.navigate(['/dashboard/drivers']);
      },
      (err) => {
        if(err._body){
          const AC=JSON.parse(err._body);
          this.toastr.error(AC.message,'Error', {
            timeOut: 3000
          });
        }else{
          this.toastr.error('Something went wrong, Please try again.','Error', {
            timeOut: 3000
          });

        }
        
        this.spinner.hide();
      }
    );
  }

  updateItem() {    
    this.submitted = true;
    console.log("formm values:- ",this.addEditForm.value);
    // stop here if form is invalid
    if (this.addEditForm.invalid) {
        return;
    }
    this.isLoading = true;
    this.spinner.show();
    this.klassService.updatFaq(this.itemID, this.addEditForm.value, 'admin/updateFaq').subscribe((res) => {
        this.isLoading = false;
        if (!res){
          this.spinner.hide();
          return true;
        }
        this.addEditForm.markAsPristine();
        this.notificationsService.notify('success', '');
        this.spinner.hide();
        this.router.navigate(['/dashboard/superadmin/faq']);  
    });
  }
}
