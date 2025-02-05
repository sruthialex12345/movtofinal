import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute,Params} from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocationsService } from "../locations.service";
import { LocationGuard } from "../../../services/location.guard.service";

import { NotificationsService } from '../../../shared/notifications.service';

import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';
import { SpinnerVisibilityService } from 'ng-http-loader';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {

  userSettings:any={
    "inputPlaceholderText": "Enter Area Name...",
    "inputString":"",
    "showSearchButton":false
  };

  addEditForm: FormGroup;
  currentUser: any = {};
  f : any;
  submitted: boolean = false;
  isLoading: boolean = false;
  isEditable: boolean;
  zoneLocation:any
  radius=0;
  location: any = {formatted_address: " "};
  locationID:string="";
  name:string="";
  addressEditable:any;
  currentLatLong:any;
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private klassService: LocationsService,
    private notificationsService: NotificationsService,
    private locationGuard: LocationGuard,
    private toastr: ToastrService,
    private spinner: SpinnerVisibilityService
  ) {
    // this.dataService.currentUser.subscribe( currentUser => this.currentUser = currentUser );
    this.currentUser = JSON.parse(localStorage.getItem("currentUser"));

  }
  autoCompleteCallback1(event:any){
    this.zoneLocation=event.data
    this.locationGuard.setLocation(event.data);
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params: Params) => {
      this.locationID = params['id'];
      if (this.locationID) {
        this.isEditable = true;
        this.getItem();
      }
    });
  }

  getItem() {
    this.spinner.show();
    this.klassService.getLocationById(`admin/getLocationById?locationID=${this.locationID}`).subscribe((res:any) => {
      if(res != null){
        let address = Object.assign({}, this.userSettings, {
          inputString: res.data.zone.formattedAddress
        });
       
        this.userSettings = address;
        this.addressEditable=res.data.zone
        this.radius=res.data.radius;
        this.name=res.data.name;
        this.spinner.hide();
        return true;
      }
    });
    this.spinner.hide();
  }
  
  radiusAdd(radiusVal){
    this.radius=parseInt(radiusVal);
  }

  addName(name){
    this.name=name;
  }


  createItem() {
    if(!this.name){
      this.toastr.error('Please enter name.','Error', {
        timeOut: 3000
      });
      return true;
    }
    if(!this.radius && this.radius<=0){
      this.toastr.error('Please enter radius in Miles.','Error', {
        timeOut: 3000
      });
      return true;
    }
    if(!this.zoneLocation){
      this.toastr.error('Please select location.','Error', {
        timeOut: 3000
      });
      return true;
    }
   
    var locationObj={
      zone:{
          location: [this.zoneLocation.geometry.location.lng, this.zoneLocation.geometry.location.lat],
          formattedAddress: this.zoneLocation.formatted_address
      },
      radius:this.radius?this.radius:0,
      name:this.name?this.name:""
    }
    this.klassService.addLocation(locationObj, "admin/addLocation").subscribe(
      (res) => {
        this.isLoading = false;
        if(!res){
          this.notificationsService.notify('error','errorrrr');
          return true;
        }
        this.notificationsService.notify('success', 'Location added successfully');
        this.spinner.hide();
        this.toastr.success(res.message,'Success', {
          timeOut: 3000
        });
        this.router.navigate(['/dashboard/locations']);
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
    let zoneUpdate=true;
    if(!this.name){
      this.toastr.error('Please enter name.','Error', {
        timeOut: 3000
      });
      return true;
    }

    if(!this.radius && this.radius<=0){
      this.toastr.error('Please enter radius in Miles.','Error', {
        timeOut: 3000
      });
      return true;
    }
    if(!this.zoneLocation && !this.addressEditable){
      this.toastr.error('Please select location again.','Error', {
        timeOut: 3000
      });
      zoneUpdate=false;
      return true;
    }
    if(!this.zoneLocation && this.addressEditable){
      zoneUpdate=false;
    }
   
    this.spinner.show();
    var locationObj={
      locationID:this.locationID,
      zoneUpdate:zoneUpdate,
      zone:{
          location: this.zoneLocation?[this.zoneLocation.geometry.location.lng, this.zoneLocation.geometry.location.lat]:"",
          formattedAddress: this.zoneLocation?this.zoneLocation.formatted_address:this.addressEditable.formattedAddress
      },
      radius:this.radius?this.radius:0,
      currentAddress:this.addressEditable,
      name:this.name?this.name:""
    }
    this.klassService.updateItem(locationObj, 'admin/updateLocation').subscribe((res) => {
      this.isLoading = false;
      if(!res){
        this.notificationsService.notify('error','errorrrr');
        return true;
      }
      this.spinner.hide();
      this.toastr.success(res.message,'Success', {
        timeOut: 3000
      });
      this.router.navigate(['/dashboard/locations']);
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
}
