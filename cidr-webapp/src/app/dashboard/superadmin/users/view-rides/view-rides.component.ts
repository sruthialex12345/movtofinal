import { Component, OnInit} from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { SuperadminService } from '../../superadmin.service';
import { SpinnerVisibilityService } from 'ng-http-loader';
import { NotificationsService } from '../../../../shared/notifications.service';
import {Location} from '@angular/common';
import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';

import { Listing } from '../../../../shared/listing';

@Component({
  selector: 'app-view-rides',
  templateUrl: './view-rides.component.html',
  styleUrls: ['./view-rides.component.css']
})
export class ViewRidesComponent extends Listing implements OnInit {
  currentUser: any ={};
  isLoading:boolean = false;
  items:any='';
  keyword:any;
  rider_id:string;

  constructor(
    private superAdminService: SuperadminService,
    private spinner: SpinnerVisibilityService,
    private notificationsService: NotificationsService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private _location: Location
  ) {
    super();
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params: Params) => {
      this.rider_id = params['riderId'];      
    });
    console.log("Rider ID --- >",this.rider_id);
    // this.notificationsService.updateBreadCrumbs([{lable:'Drivers',url:`/drivers`}]);
    this.getItems();
  }

  getItems(){
    this.spinner.show();
    var keyword=this.keyword?this.keyword:'';
    var rider_id=this.rider_id?this.rider_id:'';
    this.superAdminService.getItem(`admin/viewRiders?keyword=${keyword}&rider=${rider_id}`)
    .subscribe((res: any) => {
      console.log(res.data);
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
        this.items = '';
        this.spinner.hide();
      }
    });
  }
   
  removeItem() {

  }

  toggleStatus(obj) {
  }
  backTo(){
    this._location.back();
  }
}
