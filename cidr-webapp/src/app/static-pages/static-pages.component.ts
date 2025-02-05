import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { SpinnerVisibilityService } from 'ng-http-loader';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import {StaticPagesService} from "../services/staticpages.service";
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-static-pages',
  templateUrl: './static-pages.component.html',
  styleUrls: ['./static-pages.component.css']
})
export class StaticPagesComponent implements OnInit {

  pageSlug = "";
  pageContent = "";
  pageHeading = "";
  faqs=[];
  page:any;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private spinner: SpinnerVisibilityService,
    public http: Http,
    private staticPagesService: StaticPagesService,
    private titleService: Title, 
    private meta: Meta
  ) {

  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params: Params) => {
      this.pageSlug = params['pageSlug'];
      if (this.pageSlug && this.pageSlug !="faq") {
        if(this.pageSlug == "privacy") {
          this.pageHeading = "Privacy Policy";
        } else if(this.pageSlug=="terms-conditions") {
          this.pageHeading = "Terms & Conditions";
        } else {
          this.pageHeading = "";
          this.router.navigate(['/']);
        }

        this.spinner.show();
        this.staticPagesService.getItem(`home/staticPageDetails?pageSlug=${this.pageSlug}`)
        .subscribe((res:any) => {
          if(res != null){
            this.pageContent = res.data.content;
            this.pageHeading = res.data.heading;
            this.page = res.data;
            this.setMetaData();
            this.spinner.hide();
            return true;
          }
        });
        this.spinner.hide();
      } else if (this.pageSlug == "faq") {
        this.pageHeading = "FAQs"
        this.spinner.show();
        this.staticPagesService.getItem(`home/staticPageDetails?pageSlug=${this.pageSlug}`)
        .subscribe((res:any) => {
          if(res != null){
            this.staticPagesService.getItem(`home/faq`)
              .subscribe((res:any) => {
                if(res != null){
                  this.faqs = res.data;
                  this.setMetaData();
                  this.spinner.hide();
                  return true;
                }
              });
            this.page = res.data;
            this.setMetaData();
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

  setMetaData() {
    this.titleService.setTitle(this.page.title);
    this.meta.updateTag({ name: 'description', content: this.page.description });
    this.meta.updateTag({ name: 'author', content: this.page.author });
    this.meta.updateTag({ name: 'keywords', content: this.page.keywords });
  }


}
