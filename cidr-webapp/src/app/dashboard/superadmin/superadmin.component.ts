import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
@Component({
  selector: 'app-superadmin',
  templateUrl: './superadmin.component.html',
  styleUrls: ['./superadmin.component.css']
})
export class SuperadminComponent implements OnInit {
  userDetails:any;
  constructor(
    private router: Router
    ) {      
  }

  ngOnInit() {
    this.userDetails=JSON.parse(localStorage.getItem('currentUser'));
    if(this.userDetails && this.userDetails.userType !=="superAdmin"){
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authorization');
      this.router.navigate['/login/auth'];      
    }
  }

}
