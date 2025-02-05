import { Component, OnInit,EventEmitter } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { error } from 'selenium-webdriver';

import { BaseForm } from '../../../../shared/base-form';
import { environment } from '../../../../../environments/environment';
import { SuperadminService } from '../../superadmin.service';
import { LocationGuard } from "../../../../services/location.guard.service";
import { NotificationsService } from '../../../../shared/notifications.service';

import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';
import { SpinnerVisibilityService } from 'ng-http-loader';
import { UploadOutput, UploadInput, UploadFile, humanizeBytes, UploaderOptions } from 'ngx-uploader';
@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent extends BaseForm implements OnInit {

  addEditForm: FormGroup;
  currentUser: any = {};
  f : any;
  submitted: boolean = false;
  isLoading: boolean = false;
  location: any = {formatted_address: " "};
  locations:any;
  minLengthError:boolean=false
  img:String="";
  imgName:String="";
  imageUrl:string="";
  options: UploaderOptions;
  uploadInput: EventEmitter<UploadInput>;
  files: UploadFile[];
  dragOver: boolean;
  humanizeBytes: Function;
  private profileAPIUrl = environment.config.API_URL + 'v1/admin';
  private uploadPath=environment.config.uploadPath+'uploads/avtars';
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
    this.files = []; // local uploading files array
    this.uploadInput = new EventEmitter<UploadInput>(); // input events, we use this to emit data to ngx-uploader
    this.humanizeBytes = humanizeBytes;
  }

  ngOnInit() {
    // subscribe to router event
    this.getAllLocations();
    this.activatedRoute.params.subscribe((params: Params) => {
      this.itemID = params['id'];   
      if (this.itemID) {
        this.isEditable = true;
        this.getItem();
      }
    });

    this.addEditForm = this.formBuilder.group({
      isAgree: [true, [Validators.required]],
      name: ['', [Validators.required]],
      email: ['', [Validators.required,Validators.email]],
      phoneNo: [null, [Validators.required,Validators.pattern("^[0-9]*$")]],
      isdCode:['1', [Validators.required]],
      tripType:['circularStaticRoute',[]],
      profileUrl:[''],
      address:['', [Validators.required]]
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
    this.klassService.getItem(`admin/details?adminId=${this.itemID}`).subscribe((res:any) => {
      if(res != null){
        this.addEditForm.patchValue(res.data);
        this.spinner.hide();
        this.img=res.data.profileUrl;
        this.imgName =this.img.split("/")[5];
        return true;
      }
      //this.registerForm.patchValue(res);
    });
    this.spinner.hide();
  }
  phoneNumber(phoneNo){
    if (phoneNo && phoneNo.length < 10) {
      this.minLengthError=true
      return;
    }else{
      this.minLengthError=false;
      return;
    }
  }

  createItem() {
    
    this.submitted = true;
    // stop here if form is invalid    
    if (this.addEditForm.invalid) {
        return;
    }else if (this.addEditForm.value.phoneNo.length < 10) {
      this.minLengthError=true
        return;
    }else{
      this.minLengthError=false
    }
    this.isLoading = true;
    this.spinner.show();
    this.addEditForm.value.userType = "admin";
    this.addEditForm.value.profileUrl =this.imageUrl?this.imageUrl:"";
    this.klassService.addItem(this.addEditForm.value, "admin/createAdmin").subscribe(
      (res) => {
       
        this.isLoading = false;
        if(!res){
          this.notificationsService.notify('error','errorrrr');
          return true;
        }
        this.item = res;
        this.notificationsService.notify('success', 'Admin added successfully');
        this.spinner.hide();
        this.router.navigate(['/dashboard/superadmin/admins']);
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
    this.addEditForm.value.profileUrl =this.imageUrl?this.imageUrl:"";
    this.klassService.updateItem(this.itemID, this.addEditForm.value, 'admin/updateAdmin').subscribe((res) => {
        this.isLoading = false;
        if (!res){
          this.spinner.hide();
          return true;
        }
        if (!res.success){
          this.spinner.hide();
          this.toastr.error(res.message,'Error', {
            timeOut: 3000
          });
          this.router.navigate(['/dashboard/superadmin/admins']); 
          return true;
        }
        this.toastr.success(res.message,'Success', {
          timeOut: 3000
        });
        this.addEditForm.markAsPristine();
        this.notificationsService.notify('success', '');
        this.spinner.hide();
        this.router.navigate(['/dashboard/superadmin/admins']);  
    });
  }

  onUploadOutput(output: UploadOutput): void {
    this.spinner.show();
    if (output.type === 'allAddedToQueue') { // when all files added in queue
      // uncomment this if you want to auto upload files when added
      const event: UploadInput = {
        type: 'uploadAll',
        url: this.profileAPIUrl + '/uploadProfileImage',
        method: 'POST',
        data: {foo: 'bar'},
        headers:{'Authorization': `${localStorage.getItem('authorization')}`}
      };
      this.uploadInput.emit(event);
      // this.router.navigate(['/profile']);
    } else if (output.type === 'addedToQueue' && typeof output.file !== 'undefined') { // add file to array when added
      this.files.push(output.file);
    } else if (output.type === 'uploading' && typeof output.file !== 'undefined') {
      // update current data in files array for uploading file
      const index = this.files.findIndex(file => typeof output.file !== 'undefined' && file.id === output.file.id);
      this.files[index] = output.file;
    } else if (output.type === 'removed') {
      // remove file from array when removed
      this.files = this.files.filter((file: UploadFile) => file !== output.file);
    } else if (output.type === 'dragOver') {
      this.dragOver = true;
    } else if (output.type === 'dragOut') {
      this.dragOver = false;
    } else if (output.type === 'drop') {
      this.dragOver = false;
    } else if (output.type === 'done') {
      console.log("uploaded_files",output);
      if (output.file.response.code == 200) {
        var uploaded_files = output.file.response.filename;

        if (uploaded_files) {
          this.imageUrl =uploaded_files;
          this.img=this.uploadPath+"/"+uploaded_files;
        }
        this.spinner.hide();
      } else {
        // alert('Error');
      }
    }

  }
}
