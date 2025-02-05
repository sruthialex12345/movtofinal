import { Component, OnInit, ViewChild } from '@angular/core';
import { environment } from '../../../../environments/environment';

import { DriversService } from '../drivers.service';
import { NotificationsService } from '../../../shared/notifications.service';

import { Listing } from '../../../shared/listing';
import { LocationGuard } from "../../../services/location.guard.service";
import { SpinnerVisibilityService } from 'ng-http-loader';

import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';
@Component({
  selector: 'app-listing',
  templateUrl: './listing.component.html',
  styleUrls: ['./listing.component.css']
})
export class ListingComponent  extends Listing implements OnInit {

  currentUser: any ={};
  isLoading:boolean = false;
  location: any = {formatted_address: " "};
  selectedLocation:any='';
  locations:any;


  constructor(
    private klassService: DriversService,
    private notificationsService: NotificationsService,
    private locationGuard: LocationGuard,
    private spinner: SpinnerVisibilityService,
    private toastr: ToastrService
  ) {
    super();
    this.locationGuard.changeLocation().subscribe((location)=>{
      this.location = location;
    })
  }

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem("currentUser"));
    this.notificationsService.updateBreadCrumbs([{lable:'Drivers',url:`/drivers`}]);
    this.getItems();
    this.getAllLocations();
  }

  getAllLocations(){
    this.spinner.show();
    this.klassService.getAllLocations(`admin/getLocationsLists`).subscribe((res:any) => {
      this.locations=res.data;
    });
    this.spinner.hide();

  }
  onChange(locId){
    this.selectedLocation=locId;
    this.getItems();
  }


  getItems(){
    this.spinner.show();
    var locationId=this.selectedLocation?this.selectedLocation:'';
    this.klassService.getItems(`${environment.config.API_VERSION ? environment.config.API_VERSION+'/' : '' }admin/drivers?locationId=${locationId}`)
    .subscribe((res: any) => {
      console.log("All Driver",res);
      if(!res){
        this.isLoading = false;
        this.isLoading = false;
        this.spinner.hide();
        return true;
      } else if (res.data) {
        this.isLoading = false;
        // this.items = res.data.map((item)=>{return item.userIdDriver});
        this.items = res.data;
        this.spinner.hide();
      }else{
        this.items = '';
        this.spinner.hide();
      }
    });
  }

  removeItem1(item) {
    this.isLoading = true;
    this.spinner.show();
    this.klassService.removeItem(`admin/drivers?driverId=${item._id}`).subscribe((res) => {
      if(res.success){
        this.toastr.success( res.message,'Success', {
          timeOut: 3000
        });
        this.spinner.hide();
      }else{
        this.toastr.error( res.message,'Error', {
          timeOut: 3000
        });
        this.spinner.hide();
        return true;
      }

      this.item = null;
      this.getItems();
      this.notificationsService.notify('success', '');
      this.spinner.hide();
    });
  }

  generateAccesscode(item) {
    console.log("access code for driver>>>>>>>>", item);
    this.isLoading = true;
    this.spinner.show();
    let reqPayload = {userId: item._id};
    this.klassService.patchItem(item._id, reqPayload, `v3/users/accesscode` ).subscribe((res) => {
      if(res.success){
        this.toastr.success( res.message,'Success', {
          timeOut: 3000
        });
        this.spinner.hide();
      }else{
        this.toastr.error( res.message,'Error', {
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

  removeItem() {

  }

  toggleStatus(obj) {
    // let newVal = ( obj.isActive == true ) ? false : true;
    // let item = {'isActive': newVal};
    // this.klassService.updateItem(obj._id, item).subscribe((res) => {
    //   if(!res)
    //     return true;
    //   this.notificationsService.notify('success', '');
    //   this.getItems();
    // });
  }

}
