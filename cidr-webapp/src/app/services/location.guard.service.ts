import { Injectable } from '@angular/core';
import { Route, Router, CanLoad, NavigationExtras, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, BehaviorSubject } from "rxjs";


@Injectable({
  providedIn: 'root'
})
export class LocationGuard implements CanLoad {
  private location: Object;
  private locationSubject = new BehaviorSubject({});

  constructor(
    private router: Router
  ) { }

  canLoad(route: Route): boolean {
    let url = `/${route.path}`;
    return this.checkLocation(url);
  }

  setLocation(location: Object){
    this.location = location;
    this.locationSubject.next(this.location);
  }

  getLocation():any{
    return this.location;
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>| Promise<boolean>| boolean {
    let url: string = state.url;
    let self = this;
    return this.checkLocation(url);
  }

  changeLocation(){
    return this.locationSubject;
  }

  checkLocation(url: string): boolean {
    if(!this.location){
      this.router.navigate(['/dashboard']);
      return false;
    }
    else {
      return true;
    }
  }
}
