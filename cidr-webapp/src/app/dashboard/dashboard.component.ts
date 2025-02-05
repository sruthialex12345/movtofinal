import { Component, OnInit } from '@angular/core';

import { SocketService } from '../shared/socket.service';
import { LocationGuard } from '../services/location.guard.service';
import { Event } from '../shared/model/event';
import { Router, ActivatedRoute, Params, NavigationEnd } from '@angular/router';
declare var $:any;
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  userSettings:any={
    "showRecentSearch":true,
    "inputPlaceholderText": "Enter Area Name...",
    "searchIconUrl":"http://downloadicons.net/sites/default/files/identification-search-magnifying-glass-icon-73159.png"
  };

  constructor(
    private socketService: SocketService,
    private activatedRoute: ActivatedRoute,
    public router: Router,
    private locationGuardService: LocationGuard
  ) { }

  autoCompleteCallback1(event:any){
    this.locationGuardService.setLocation(event.data);
  }
  ngOnInit() {
    this.socketService.initSocket();
    this.socketService.onEvent(Event.CONNECT)
    .subscribe(() => {
      this.socketService.emitEvent(Event.HELLO, {content:'Hi, Admin this side', from: 'admin'})
      console.log('connected');
    });

    this.socketService.onEvent(Event.DISCONNECT)
    .subscribe(() => {
      console.log('disconnected');
    });

    this.socketService.onEvent(Event.HELLO_RESPONSE)
    .subscribe((data:any) => {
      console.log('hello response', data);
    });

    // reset recent location
    let location:any = this.locationGuardService.getLocation();
    if(location) {
      this.userSettings.inputString = location.formatted_address;
    }

  }
}

