import { Component, OnInit} from '@angular/core';

import { SuperadminService } from '../../superadmin.service';
import { SpinnerVisibilityService } from 'ng-http-loader';
import { NotificationsService } from '../../../../shared/notifications.service';

import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';

import { Listing } from '../../../../shared/listing';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css']
})
export class ViewComponent extends Listing implements OnInit {

  currentUser: any ={};
  isLoading:boolean = false;
  items:any='';
  keyword:any;

  constructor(
    private superAdminService: SuperadminService,
    private spinner: SpinnerVisibilityService,
    private notificationsService: NotificationsService,
    private toastr: ToastrService
  ) {
    super();
  }

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem("currentUser"));
    this.notificationsService.updateBreadCrumbs([{lable:'Drivers',url:`/drivers`}]);
    this.getItems();
  }
  onClickSubmit(data) {
    this.keyword=data.keyword;
    this.getItems();
 }
 clear(){
  this.keyword='';
  this.getItems();
 }

  getItems(){
    this.spinner.show();
    var keyword=this.keyword?this.keyword:'';
    this.superAdminService.getAll(`admin/user?keyword=${keyword}&userType=rider`)
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
  updateStatus(_id, status) {
    if (_id) {
      var obj = {
        _id: _id,
        status: status
      }

      this.superAdminService.updateStatus(obj)
      .subscribe(res => {
        if(res.success){
          this.toastr.success( res.message,'Success', {
            timeOut: 3000
          });
        }else{
          this.toastr.error( res.message,'Error', {
            timeOut: 3000
          });
        }
        this.getItems();
      });     
    }
  }

}
