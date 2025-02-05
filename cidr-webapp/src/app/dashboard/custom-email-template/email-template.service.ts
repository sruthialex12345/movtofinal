
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

export class EmailTemplateService extends BaseService{
  constructor(
    private _router: Router,
    public http: Http,
    public notificationsService: NotificationsService) {
      super(http, notificationsService, 'EmailTemplate');
    }

  
  getCustomTemplate(suffix = null) {
    return this.http.get(this.getUrl(suffix), this.getHeader())
    .map(res=>res.json())
  }
  
}