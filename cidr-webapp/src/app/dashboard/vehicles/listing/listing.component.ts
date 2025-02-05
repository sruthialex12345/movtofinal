import { Component, OnInit, ViewChild } from '@angular/core';

import { VehiclesService } from '../vehicles.service';
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

  // displayedColumns: any = ['firstName', 'ticNumber', 'vatNumber','actions'];
  // fileList:any;
  // fileName:any;
  // fileReaded:any;

  constructor(
    private klassService: VehiclesService,
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
    this.notificationsService.updateBreadCrumbs([{lable:'Vehicles',url:`/vehicles`}]);
    this.getItems();
    this.getAllLocations()
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
    this.klassService.getItems(`admin/vehicles?locationId=${locationId}`)
    .subscribe((res: any) => {
      if(!res){
        this.isLoading = false;
        this.isLoading = false;
        this.spinner.hide();
        return true;
      } else if (res.data) {
        this.isLoading = false;
        this.items = res.data;
        this.spinner.hide();
      }else{
        this.items='';
        this.spinner.hide();
      }
    });
  }

  removeItem1(item) {
    this.isLoading = true;
    this.spinner.show();
    this.klassService.removeItem(`admin/vehicles?vehicleId=${item._id}`).subscribe((res) => {
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

  removeItem() {
    // this.busy = this.klassService.removeItem(this.item._id).subscribe((res) => {
    //   if(!res)
    //     return true;
    //   this.item = null;
    //   this.getItems();
    //   this.notificationsService.notify('success', '');
    // });
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
