import { Component, OnInit } from '@angular/core';
import {LocationGuard} from '../../services/location.guard.service';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';
import { SharedService } from "../../services/shared.service";

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  location: any = {
    formatted_address: ' '
  };
  userDetails:any;
  dashboardBool:boolean;
  showRoute:boolean;
  tripType:String;
  constructor(
    private locationGuardService: LocationGuard,
    private router: Router,
    private toastr: ToastrService,
    private sharedService: SharedService
  ) {

   }

  ngOnInit() {
    this.location = this.locationGuardService.getLocation() ? this.locationGuardService.getLocation() : this.location
    this.userDetails=JSON.parse(localStorage.getItem('currentUser'));
    this.showRoute = (this.userDetails && this.userDetails.adminTripTypes && this.userDetails.adminTripTypes.length && (this.userDetails.adminTripTypes[0] === 'dynamicRoute'))?false:true;
    this.sharedService.getRouteType().subscribe(data => {
      if (data.tripTypeChange == 'tripTypeChange' && data.tripType== 'dynamicRoute') {
        this.showRoute = false
      }else if(data.tripTypeChange == 'tripTypeChange' && data.tripType== 'circularStaticRoute'){
        this.showRoute = true
      }
    });

  }

  navigateLocations() {
    this.router.navigate([`/dashboard/location`]);
  }

  navigateDrivers() {
    // console.log('this.route address', this.location);
    // let location = this.locationGuardService.getLocation() ? this.locationGuardService.getLocation() : this.location;
    // if(!location.formatted_address || location.formatted_address.trim() === "") {
    //   this.toastr.error( "Please select location",'Error', {
    //     timeOut: 3000
    //   });
    //   return;
    // }
    this.router.navigate([`/dashboard/drivers`]);
  }

  navigateVehicles() {
    // let location = this.locationGuardService.getLocation() ? this.locationGuardService.getLocation() : this.location;
    // if(!location.formatted_address || location.formatted_address.trim() === "") {
    //   this.toastr.error( "Please select location",'Error', {
    //     timeOut: 3000
    //   });
    //   return;
    // }
    this.router.navigate([`/dashboard/vehicles`]);
  }

}
