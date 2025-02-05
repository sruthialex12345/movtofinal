import { Component, OnInit, OnDestroy } from '@angular/core';

import { ToastrService } from 'ngx-toastr';
import { NotificationsService } from './notifications.service';

import { Subscription } from 'rxjs/Subscription';

import * as $ from 'jquery';

@Component({
  selector: 'app-notifications',
  template: ''
})
export class NotificationsComponent implements OnInit, OnDestroy {
  subscription: Subscription;

  constructor(
    private notificationsService: NotificationsService,
    private toastrService: ToastrService
  ) { }

  ngOnInit() {
    this.subscribeToNotifications();
    this.subscribeToBreadCrumbs();
  }

  subscribeToNotifications() {
    this.subscription = this.notificationsService.notificationChange
    .subscribe(notification => {
      this.showAlert(notification);
    });
  }

  subscribeToBreadCrumbs() {
    this.subscription = this.notificationsService.breadCrumbsChange
    .subscribe(details => {
      let str='<li><a href="/#/dashboard"><i class="fa fa-home" aria-hidden="true"></i> Dashboard</a></li>';
      details['detail'].map(function(value){
        str+=`<li class="active-bre" ><a href="/#${value.url}">${value.lable}</a></li>`;
      })


      $("#breadcrumbs").html(str);

    });
  }

  showAlert(obj) {
    switch(obj['severity']) {
      case 'success': {
        this.toastrService.success(obj['detail']);
        break;
      }
      case 'info': {
        this.toastrService.info(obj['detail'],'',{timeOut:7000});
        break;
      }
      case 'warning': {
        this.toastrService.warning(obj['detail']);
        break;
      }
      case 'error': {
        this.toastrService.error(obj['detail']);
        break;
      }
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
