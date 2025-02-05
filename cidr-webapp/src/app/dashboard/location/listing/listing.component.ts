import { Component, OnInit } from '@angular/core';
import { LocationsService } from '../locations.service';
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
export class ListingComponent extends Listing implements OnInit {

  currentUser: any ={};
  isLoading:boolean = false;
  location: any = {formatted_address: " "};

  constructor(
    private LocationsService: LocationsService,
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
    this.notificationsService.updateBreadCrumbs([{lable:'Locations',url:`/locations`}]);
    this.getItems();
  }


  getItems(){
   // this.spinner.show();
    this.LocationsService.getLocationsLists(`admin/getLocationsLists`)
    .subscribe((res: any) => {
      if(!res){
        this.isLoading = false;
        this.spinner.hide();
        return true;
      } else if (res.data) {
        this.isLoading = false;
        this.items = res.data;
        this.spinner.hide();
      }else{
        this.items = '';
        this.spinner.hide();
      }
    });
  }

  removeItem1(locationID) {
    this.isLoading = true;
    this.spinner.show();
    this.LocationsService.removeLocation(`admin/removeLocation?locationID=${locationID}`).subscribe((res) => {
      if(!res){
        this.spinner.hide();
        return true;
      }
      if(!res.success) {
        this.toastr.error(res.message,'Error', {
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

