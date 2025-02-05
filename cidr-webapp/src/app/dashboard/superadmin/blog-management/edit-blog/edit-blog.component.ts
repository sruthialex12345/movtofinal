import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { BaseForm } from '../../../../shared/base-form';

import { SuperadminService } from '../../superadmin.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerVisibilityService } from 'ng-http-loader';

@Component({
  selector: 'app-edit-blog',
  templateUrl: './edit-blog.component.html',
  styleUrls: ['./edit-blog.component.css']
})
export class EditBlogComponent extends BaseForm implements OnInit {

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
    private toastr: ToastrService,
    private spinner: SpinnerVisibilityService
  ) {
    super();
  }

  ngOnInit() {
    // subscribe to router event
    this.activatedRoute.params.subscribe((params: Params) => {
      this.itemID = params['id'];    
      if (this.itemID) {
        this.isEditable = true;
        this.getItem();
      }
    });

    this.addEditForm = this.formBuilder.group({
      heading: [null, [Validators.required]],
      content: [null, [Validators.required]],
      title: [null, [Validators.required]],
      description: [null, [Validators.required]],
      keywords:[null, [Validators.required]],
      author:[null, [Validators.required]],
    });
    // convenience getter for easy access to form fields
    this.f = this.addEditForm.controls;    
  }
  getItem() {
    this.spinner.show();
    this.klassService.getItem(`admin/blogPageDetails?_id=${this.itemID}`).subscribe((res:any) => {
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
    this.isLoading = true;
    this.spinner.show();
    this.klassService.addItem(this.addEditForm.value, "admin/createBlog").subscribe(
      (res) => {       
        this.isLoading = false;
        if(!res){
          this.toastr.error("Something went wrong",'Error', {
            timeOut: 3000
          });
          return true;
        }
        if (!res.success){
          this.toastr.error(res.message,'Error', {
            timeOut: 3000
          });
          this.spinner.hide();
          return true;  
        }

        this.item = res;
         this.toastr.success(res.message,'Success', {
          timeOut: 3000
        });
        this.spinner.hide();
        this.router.navigate(['/dashboard/superadmin/blog']);
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
    // stop here if form is invalid
    if (this.addEditForm.invalid) {
        return;
    }
    this.isLoading = true;
    this.spinner.show();  
    this.klassService.updatBlog(this.itemID, this.addEditForm.value, 'admin/updateBlogPage').subscribe((res) => {
        this.isLoading = false;
        if (!res){
          this.spinner.hide();
          return true;
        }
        if (!res.success){
          this.toastr.error(res.message,'Error', {
            timeOut: 3000
          });
          this.spinner.hide();
          return true;  
        }
        this.toastr.success(res.message,'Success', {
          timeOut: 3000
        });
        this.spinner.hide();
        this.router.navigate(['/dashboard/superadmin/blog']);  
    });
  }
}
