
import { NgModule } from '@angular/core';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Http, Response, RequestOptions, Headers } from '@angular/http';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

import {BaseService} from "../../services/base-service";
import { NotificationsService } from '../../shared/notifications.service';

@Injectable({
  providedIn: 'root'
})

export class MessageService extends BaseService{
  constructor(
    private _router: Router,
    public http: Http,
    public notificationsService: NotificationsService) {
      super(http, notificationsService, 'Message');
  }

  sendOnDemandMessage(obj, suffix = null) {
    return this.http.post(this.getUrl(suffix), obj, this.getHeader())
    .map(res=>res.json())
  }

  sendToCustomerMessage(obj, suffix = null) {
    return this.http.post(this.getUrl(suffix), obj, this.getHeader())
    .map(res=>res.json())
  }
  getNotifyMessage(suffix = null) {
    return this.http.get(this.getUrl(suffix), this.getHeader())
    .map(res=>res.json())
  }
  addNotifyMessage(obj, suffix = null) {
    return this.http.post(this.getUrl(suffix), obj, this.getHeader())
    .map(res=>res.json())
  }
  updateNotifyMessage(obj, suffix = null) {
    return this.http.post(this.getUrl(suffix), obj, this.getHeader())
    .map(res=>res.json())
  }

  updateCustomMessage(obj, suffix = null) {
    return this.http.post(this.getUrl(suffix), obj, this.getHeader())
    .map(res=>res.json())
  }
  getMessageCustom(suffix = null) {
    return this.http.get(this.getUrl(suffix), this.getHeader())
    .map(res=>res.json())
  }

}
