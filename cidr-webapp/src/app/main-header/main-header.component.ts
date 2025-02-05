import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params, NavigationEnd} from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-main-header',
  templateUrl: './main-header.component.html',
  styleUrls: ['./main-header.component.css']
})
export class MainHeaderComponent implements OnInit {
  currentUrl = "";
  constructor(
    private router: Router,
    private location: Location
  ) {
    router.events.subscribe((val) => {
      if(location.path() != ''){
        this.currentUrl = location.path();
      } else {
        this.currentUrl = ''
      }
    });
  }

  ngOnInit() {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
          return;
      }
      window.scrollTo(0, 0)
    });
  }

}
