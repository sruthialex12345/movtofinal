import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { SpinnerVisibilityService } from 'ng-http-loader';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import {StaticPagesService} from "../services/staticpages.service";

@Component({
  selector: 'app-mobile-page',
  templateUrl: './mobile-page.component.html',
  styleUrls: ['./mobile-page.component.css']
})
export class MobilePageComponent implements OnInit {

  pageSlug = "";
  pageContent = "";
  pageHeading = "";
  faqs=[];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private spinner: SpinnerVisibilityService,
    public http: Http,
    private staticPagesService: StaticPagesService
  ) {

  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params: Params) => {
      this.pageSlug = params['pageSlug'];
      if (this.pageSlug && this.pageSlug != "faq") {
        if(this.pageSlug == "privacy") {
          this.pageHeading = "Privacy Policy";
        } else if(this.pageSlug=="terms-conditions") {
          this.pageHeading = "Terms & Conditions";
        } else {
          this.pageHeading = "";
          this.router.navigate(['/home']);
        }
        this.spinner.show();
        this.staticPagesService.getItem(`home/staticPageDetails?pageSlug=${this.pageSlug}`)
        .subscribe((res:any) => {
          if(res != null){
            this.pageContent = res.data.content;
            this.pageHeading = res.data.heading;;
            this.spinner.hide();
            return true;
          }
        });
        this.spinner.hide();
      } else if (this.pageSlug == "faq") {
        this.pageHeading = "FAQs"
        this.spinner.show();
        this.staticPagesService.getItem(`home/faq`)
        .subscribe((res:any) => {
          if(res != null){
            this.faqs = res.data;
            this.spinner.hide();
            return true;
          }
        });
        this.spinner.hide();
      } else {
        this.pageHeading = "";
        this.router.navigate(['/home']);
      }
    });
  }

}

