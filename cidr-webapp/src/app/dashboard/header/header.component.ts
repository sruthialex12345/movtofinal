import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { SharedService } from "../../services/shared.service";
declare var $: any;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  userDetails:any;
  name:String;
  img:String;
  constructor(
    private router: Router,
    private sharedService: SharedService
  ) { 
    this.sharedService.getImage().subscribe(data => {
      if (data.upload == 'imageupload') {
        this.img = data.image;
      }
    });
    this.sharedService.getName().subscribe(data => {
      if (data.namechange == 'namechange') {
        this.name = data.name;
      }
    });

  }

  ngOnInit() {
    this.userDetails=JSON.parse(localStorage.getItem('currentUser'));
    this.name=this.userDetails.name;
    this.img=this.userDetails.profileUrl;
  }

  logout(){
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authorization');
    this.router.navigate['/'];
  }
  addclass(){
    $(".left-sidebar").toggleClass('sidebartoggle');
    $(".page-wrapper").toggleClass('bodycontent');
  }
}
