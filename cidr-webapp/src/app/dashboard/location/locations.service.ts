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
export class LocationsService extends BaseService{
  constructor(
    private _router: Router,
    public http: Http,
    public notificationsService: NotificationsService) {
      super(http, notificationsService, 'locations');
  }

  addLocation(obj, suffix = null) {
    console.log("Object", obj);
    console.log("suffix",suffix );
    return this.http.post(this.getUrl(suffix), obj, this.getHeader())
    .map(res=>res.json())
  }

  getLocationsLists(suffix = null) {
    return this.http.get(this.getUrl(suffix), this.getHeader())
    .map(res=>res.json())
  }
  getLocationById(suffix = null) {
    return this.http.get(this.getUrl(suffix), this.getHeader())
    .map(res=>res.json())
  }

  removeLocation(suffix = null) {
    return this.http.delete(this.getUrl(suffix), this.getHeader())
    .map(res=>res.json())
    //return this.http.delete(this.getUrl(suffix) + '/' + id)
  }

  // getItem(suffix = null) {
  //   return this.http.get(this.getUrl(suffix), this.getHeader())
  //   .map(res=>res.json())
  // }

  updateItem(obj, suffix = null) {
    return this.http.put(this.getUrl(suffix), obj, this.getHeader())
    .map(res=>res.json())
  }

  // removeItem(suffix = null) {
  //   return this.http.delete(this.getUrl(suffix), this.getHeader())
  //   .map(res=>res.json())
  // }
}
