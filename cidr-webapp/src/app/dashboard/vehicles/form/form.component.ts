import { Component, OnInit,EventEmitter } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { error } from 'selenium-webdriver';

import { BaseForm } from '../../../shared/base-form';

import { VehiclesService } from "../vehicles.service";

import { NotificationsService } from '../../../shared/notifications.service';
import { LocationGuard } from "../../../services/location.guard.service";
import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';
import { SpinnerVisibilityService } from 'ng-http-loader';
import { environment } from '../../../../environments/environment';
import { UploadOutput, UploadInput, UploadFile, humanizeBytes, UploaderOptions } from 'ngx-uploader';

@Component({
    selector: 'app-form',
    templateUrl: './form.component.html',
    styleUrls: ['./form.component.css']
})
export class FormComponent extends BaseForm implements OnInit {
    addEditForm: FormGroup;
    options: UploaderOptions;
    currentUser: any ={};
    f:any;
    submitted:boolean = false;
    isLoading:boolean = false;
    location: any = {formatted_address: " "};
    locations:any;
    uploadInput: EventEmitter<UploadInput>;
    files: UploadFile[];
    dragOver: boolean;
    imageUrl:string="";
    humanizeBytes: Function;
    img:String="";
    private profileAPIUrl = environment.config.API_URL + 'v1/admin';
    private uploadPath=environment.config.uploadPath+'uploads/avtars';
    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private klassService: VehiclesService,
        private notificationsService: NotificationsService,
        private locationGuard: LocationGuard,
        private toastr: ToastrService,
        private spinner: SpinnerVisibilityService
    ) {
        super();
        // this.dataService.currentUser.subscribe( currentUser => this.currentUser = currentUser );
        this.currentUser = JSON.parse(localStorage.getItem("currentUser"));
        this.locationGuard.changeLocation().subscribe((location)=>{
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
            if(this.itemID) {
                this.isEditable = true;
                this.getItem();
            }
        });

        if(this.itemID==null){
            this.notificationsService.updateBreadCrumbs([
              {lable:'Vehicles',url:`/vehicles`},
              {lable:'Add',url:`/vehicles/new`}
            ]);

        }else{
        this.notificationsService.updateBreadCrumbs([
            {lable:'Vehicles',url:`/vehicles`},
            {lable:'Edit',url:`/vehicles/${this.itemID}/edit`}]);
        }

        // this.addEditForm = this.formBuilder.group({
        //   name: ['', [Validators.required, Validators.pattern("[a-zA-Z]+")]],
        //   company: ['', [Validators.required, Validators.pattern("[a-zA-Z]+")]],
        //   carModel: ['',[Validators.required,]],
        //   vehicleNo: ['',[Validators.required,]],
        //   type: ['', [Validators.required, Validators.pattern("[a-zA-Z]+")]],
        //   regNo: ['', [Validators.required, Validators.pattern("[a-zA-Z]+")]],
        //   RC_ownerName: ['', [ Validators.pattern("[a-zA-Z]+")]],
        //   color: ['',[Validators.required,]],
        //   // imageUrl: [''],
        //   state: ['', [Validators.required, Validators.pattern("[a-zA-Z]+")]],
        //   country: ['USA', [Validators.required, Validators.pattern("[a-zA-Z]+")]],
        // });

        this.addEditForm = this.formBuilder.group({
          name: ['', [Validators.required]],
          company: ['', [Validators.required]],
          carModel: ['',[Validators.required]],
          vehicleNo: ['',[Validators.required,]],
          type: ['', []],
          regNo: ['', [Validators.required]],
          seats:[4, [Validators.required]],
          // RC_ownerName: ['', [ Validators.pattern("[a-zA-Z]+")]],
          color: ['',[]],
          // imageUrl: [''],
          // state: ['', [Validators.required]],
          // country: ['USA', [Validators.required]],
          locationId:['', [Validators.required]]
        });
        // convenience getter for easy access to form fields
        this.f = this.addEditForm.controls;
    }

    getAllLocations(){
      this.spinner.show();
      this.klassService.getAllLocations(`admin/getLocationsLists`).subscribe((res:any) => {
        this.locations=res.data;
        this.addEditForm.patchValue({
          locationId:  this.locations[0]._id
        });
      });
      this.spinner.hide();

    }

    getItem() {
      this.spinner.show();
      this.klassService.getItem(`admin/vehicles/details?vehicleId=${this.itemID}`).subscribe((res:any) => {
        if(res != null){
          this.addEditForm.patchValue(res.data);
          this.spinner.hide();
          this.img=res.data.imageUrl
          return true;
        }
        //this.registerForm.patchValue(res);
      });
    }

    createItem() {
      this.submitted = true;
      // stop here if form is invalid
      if (this.addEditForm.invalid) {
          return;
      }
      this.spinner.show();
      // let zone: any = {
      //   zeometry: {
      //     location: [this.location.geometry.location.lng, this.location.geometry.location.lat]
      //   },
      //   formattedAddress: this.location.formatted_address
      // }

      // this.addEditForm.value.zone = zone;

      this.isLoading = true;
      this.addEditForm.value.imageUrl=this.imageUrl?this.imageUrl:"";
      this.klassService.addItem(this.addEditForm.value, "admin/vehicles").subscribe(
        (res) => {
          this.isLoading = false;
          // if(!res){
          //   this.notificationsService.notify('error','errorrrr');
          //   return true;
          // }
         if(res.success){
            this.toastr.success( res.message,'Success', {
              timeOut: 3000
            });
            this.item = res;
            this.notificationsService.notify('success', 'Vehicle added successfully');
            this.spinner.hide();
            this.router.navigate(['/dashboard/vehicles']);

          }else{
            this.toastr.error( res.message,'Error', {
              timeOut: 3000
            });
            this.spinner.hide();
            this.notificationsService.notify('error','errorrrr');
            return true;
          }

        },
        (err) => {
          this.toastr.error('Something went wrong, Please try again.','Error', {
            timeOut: 3000
          });
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
      this.addEditForm.value.imageUrl=this.imageUrl?this.imageUrl:"";
      this.klassService.updateItem(this.itemID, this.addEditForm.value, 'admin/vehicles').subscribe((res) => {
          this.isLoading = false;
          // let responseData = res.json();
          if(res.success){
            this.toastr.success( res.message,'Success', {
              timeOut: 3000
            });
            this.addEditForm.markAsPristine();
            this.notificationsService.notify('success', '');
            this.spinner.hide();
            this.router.navigate(['/dashboard/vehicles']);

          }else{
            this.toastr.error( res.message,'Error', {
              timeOut: 3000
            });
            this.spinner.hide();
            this.router.navigate(['/dashboard/vehicles']);
          }


      },
      (err) => {
        // let error = JSON.parse(err._body);
        this.toastr.error('Something went wrong, Please try again.','Error', {
          timeOut: 3000
        });
      });
      this.spinner.hide();
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
