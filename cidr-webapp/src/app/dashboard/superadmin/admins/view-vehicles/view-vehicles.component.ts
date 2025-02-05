import { Component, OnInit} from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { SuperadminService } from '../../superadmin.service';
import { SpinnerVisibilityService } from 'ng-http-loader';
import { NotificationsService } from '../../../../shared/notifications.service';
import {Location} from '@angular/common';

import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';

import { Listing } from '../../../../shared/listing';


@Component({
  selector: 'app-view-vehicles',
  templateUrl: './view-vehicles.component.html',
  styleUrls: ['./view-vehicles.component.css']
})
export class ViewVehiclesComponent extends Listing implements OnInit {

  currentUser: any ={};
  isLoading:boolean = false;
  items:any='';
  keyword:any;
  admin_id:string;

  constructor(
    private superAdminService: SuperadminService,
    private spinner: SpinnerVisibilityService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private _location: Location
  ) {
    super();
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params: Params) => {
      this.admin_id = params['adminId'];      
    });
    this.getItems();
  }

  getItems(){
    this.spinner.show();
    var keyword=this.keyword?this.keyword:'';
    var admin_id=this.admin_id?this.admin_id:'';
    this.superAdminService.getItem(`admin/viewVehicles?keyword=${keyword}&admin_id=${admin_id}`)
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
