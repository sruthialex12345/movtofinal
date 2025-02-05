import { Http, Response, RequestOptions, Headers } from '@angular/http';
import {Observable} from "rxjs";
import { environment } from '../../environments/environment';
import {Router} from '@angular/router';
import { NotificationsService } from '../shared/notifications.service';

export class BaseService {
  http: Http;
  url = new Map;
  notifier: NotificationsService = null;
  router: Router;
  constructor(http, notifier, suffix) {
    this.http = http;
    this.notifier = notifier;

    this.url.set('socket', environment.config.SOCKET_URL);
    this.url.set('base', environment.config.BASE_URL);
    this.url.set('api', environment.config.API_URL);
    this.url.set('suffix', suffix);
  }

  authToken() {
    const headers = new Headers(
      {
        'Authorization': `${localStorage.getItem('authorization')}`
      });

    return new RequestOptions({ headers: headers });
  }

  getHeader() {
    const headers = new Headers(
      {
        'Authorization': `${localStorage.getItem('authorization')}`
      }
    );

    return new RequestOptions({ headers: headers });
  }

  getUrl(suffix) {
    return this.url.get('api') + (suffix ? suffix : this.url.get('suffix'));
  }

  getItems(suffix = null) {
    return this.http.get(this.getUrl(suffix));
  }

  getXItems(obj, suffix = null) {
    return this.http.post(this.getUrl(suffix), obj);
  }

  getItem(id, suffix = null) {
    return this.http.get(this.getUrl(suffix) + '/' + id)
  }

  addItem(obj, suffix = null) {
    return this.http.post(this.getUrl(suffix), obj)
  }
  // getCountryCodes(suffix) {
  //   return this.http.get(this.getUrl(suffix));
  // }
  updateItem(id, obj, suffix = null) {
    return this.http.put(this.getUrl(suffix) + '/' + id, obj)
  }

  removeItem(id, suffix = null) {
    return this.http.delete(this.getUrl(suffix) + '/' + id)
  }

  deleteItem(obj, suffix = null) {
    const headers = new Headers({ user_id:localStorage.getItem('userID'), userID:localStorage.getItem('userID'), 'Authorization': `Bearer ${localStorage.getItem('token')}`});
    return this.http.delete(this.getUrl(suffix))
  }

  toggleStatus(obj, suffix = null) {
    return this.http.put(this.getUrl(suffix), obj)
  }

  getCountries(language) {
    // return this.getItems(language, 'countries');
  }

  validateOtp(obj, suffix = null) {
    return this.http.post(this.getUrl(suffix), obj)
  }

  validatePartnerOtp(obj, suffix = null) {
    return this.http.put(this.getUrl(suffix), obj)
  }

  handleError(error,status=null) {
    if(status != null){
      if(status===400){
        this.notifier.notify('error', JSON.parse(error.response).msg);
      }
      if(error.hasOwnProperty('status')) {
        if(error.status===403){
          this.notifier.notify('error', 'Unauthorized Access.');
        }else if(error.headers._headers.get('content-type')[0] == "application/json; charset=utf-8") {
          this.notifier.notify('error', error.json().msg);
        } else {
          this.notifier.notify('error', 'Unable process your request.');
        }
      }
      return null;
    }
  }
}
