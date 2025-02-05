import { Component, OnInit} from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { SuperadminService } from '../superadmin.service';
import { SpinnerVisibilityService } from 'ng-http-loader';
import { NotificationsService } from '../../../shared/notifications.service';

import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';

import { Listing } from '../../../shared/listing';
import {Location} from '@angular/common';

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css']
})
export class ReviewsComponent extends Listing implements OnInit {

 
  currentUser: any ={};
  isLoading:boolean = false;
  items:any='';
  keyword:any;
  _id:string;

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
    this.currentUser = JSON.parse(localStorage.getItem("currentUser"));
    this.activatedRoute.params.subscribe((params: Params) => {
      this._id =  this.currentUser._id;      
    });
    this.getItems();
  }

  getItems(){
    this.spinner.show();
    var keyword=this.keyword?this.keyword:'';
    var _id=this._id?this._id:'';
    this.superAdminService.getItem(`admin/viewRating?keyword=${keyword}&_id=${_id}&type=superAdmin`)
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
