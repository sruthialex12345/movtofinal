import { Component, OnInit } from '@angular/core';
import { RoutesService } from '../routes.service';
import { NotificationsService } from '../../../shared/notifications.service';
import { environment } from '../../../../environments/environment';

import { Listing } from '../../../shared/listing';
import { LocationGuard } from "../../../services/location.guard.service";
import { SpinnerVisibilityService } from 'ng-http-loader';
import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';


@Component({
  selector: 'routes-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent  extends Listing implements OnInit {

  currentUser: any ={};
  isLoading:boolean = false;
  location: any = {formatted_address: " "};
  selectedLocation:any='';
  locations:any;
  constructor(
    private RoutesService: RoutesService,
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
    this.RoutesService.getAllLocations(`admin/getLocationsLists`).subscribe((res:any) => {
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
    this.RoutesService.getAllLocations(`${environment.config.API_VERSION ? environment.config.API_VERSION+'/' : '' }admin/routes?locationId=${this.selectedLocation}`)
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

  removeRoute(routeId){
    this.isLoading = true;
    this.spinner.show();
    this.RoutesService.removeItem(`${environment.config.API_VERSION ? environment.config.API_VERSION+'/' : '' }admin/routes?routeId=${routeId}`).subscribe((res) => {
      if(!res){
        this.spinner.hide();
        return true;
      }
      this.getItems();
      this.getAllLocations();
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


