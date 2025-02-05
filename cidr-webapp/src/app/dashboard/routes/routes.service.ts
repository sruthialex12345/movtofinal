
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from '@angular/http';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

import {BaseService} from "../../services/base-service";
import { NotificationsService } from '../../shared/notifications.service';

@Injectable()
export class RoutesService extends BaseService {
  constructor(
    private _router: Router,
    public http: Http,
    public notificationsService: NotificationsService) {
      super(http, notificationsService, 'drivers');
  }

  addItem(obj, suffix = null) {
    return this.http.put(this.getUrl(suffix), obj, this.getHeader())
    .map(res=>res.json())
  }

  getItems(suffix = null) {
    return this.http.get(this.getUrl(suffix), this.getHeader())
    .map(res=>res.json())
  }

  getItem(suffix = null) {
    return this.http.get(this.getUrl(suffix), this.getHeader())
    .map(res=>res.json())
  }
  getAllLocations(suffix = null) {
    return this.http.get(this.getUrl(suffix), this.getHeader())
    .map(res=>res.json())
  }

  updateItem(id, obj, suffix = null) {
    obj.driverId = id;
    return this.http.put(this.getUrl(suffix), obj, this.getHeader())
    .map(res=>res.json())
  }

  removeItem(suffix = null) {
    return this.http.delete(this.getUrl(suffix), this.getHeader())
    .map(res=>res.json())
  }

  getDistanceByOriginDestination(suffix = null) {
    return this.http.get(this.getUrl(suffix), this.getHeader())
    .map(res=>res.json())
  }
}
