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
export class SuperadminService extends BaseService {

  constructor(
    private _router: Router,
    public http: Http,
    public notificationsService: NotificationsService) {
    super(http, notificationsService, 'superadmin');
  }

  getAll(suffix = null) {
    return this.http.get(this.getUrl(suffix), this.getHeader())
    .map(res=>res.json())
  }
  getReport(obj, suffix = null) {
    return this.http.post(this.getUrl(suffix),obj, this.getHeader())
    .map(res=>res.json())
  }
  getExportXls(obj, suffix = null) {
    return this.http.post(this.getUrl(suffix),obj, this.getHeader())
    .map(res=>res.json())
  }

  getItem(suffix = null) {
    return this.http.get(this.getUrl(suffix), this.getHeader())
    .map(res=>res.json())
  }

  updateStatus(obj, suffix = null) {
    return this.http.put(this.getUrl(suffix), obj, this.getHeader())
    .map(res=>res.json())
  }
  adminRemove(obj, suffix = null) {
    return this.http.put(this.getUrl(suffix), obj, this.getHeader())
    .map(res=>res.json())
  }

  addItem(obj, suffix = null) {
    return this.http.post(this.getUrl(suffix), obj, this.getHeader())
    .map(res=>res.json())
  }

  updateSettingItem(id, obj, suffix = null) {
    obj.adminId = id;
    return this.http.put(this.getUrl(suffix), obj, this.getHeader())
    .map(res=>res.json())
  }
  updateItem(id, obj, suffix = null) {
    obj.adminId = id;
    return this.http.put(this.getUrl(suffix), obj, this.getHeader())
    .map(res=>res.json())
  }
  updateStaticPage(slug, obj, suffix = null) {
    obj.slug = slug;
    return this.http.put(this.getUrl(suffix), obj, this.getHeader())
    .map(res=>res.json())
  }
  updatFaq(id, obj, suffix = null) {
    obj.faqId = id;
    return this.http.put(this.getUrl(suffix), obj, this.getHeader())
    .map(res=>res.json())
  }
  updatBlog(id, obj, suffix = null) {
    obj.blogId = id;
    return this.http.put(this.getUrl(suffix), obj, this.getHeader())
    .map(res=>res.json())
  }
  getRider(obj, suffix = null) {
    return this.http.post(this.getUrl(suffix),obj, this.getHeader())
    .map(res=>res.json())
  }
}

