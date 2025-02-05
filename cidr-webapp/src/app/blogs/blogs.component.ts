import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { SpinnerVisibilityService } from 'ng-http-loader';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import {StaticPagesService} from "../services/staticpages.service";
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-blogs',
  templateUrl: './blogs.component.html',
  styleUrls: ['./blogs.component.css']
})
export class BlogsComponent implements OnInit {
  pageSlug = "blogs";
  pageContent = "";
  pageHeading = "";

  blogs=[];
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
        this.spinner.show();
        this.staticPagesService.getItem(`home/blogs`)
        .subscribe((res:any) => {
          if(res != null){
            console.log(res.data)
            this.blogs = res.data;
            this.spinner.hide();
            return true;
          }
        });
        this.spinner.hide();
        this.getBlogTitle()
  }
  getBlogTitle(){
    this.spinner.show();
    this.staticPagesService.getItem(`home/staticPageDetails?pageSlug=${this.pageSlug}`)
        .subscribe((res:any) => {
          if(res != null){
            this.pageHeading = res.data.heading;
            this.page = res.data;
            console.log("Page Contect",this.page);
            this.setMetaData();
            this.spinner.hide();
            return true;
          }
        });
        this.spinner.hide();
  }

  setMetaData() {
    this.titleService.setTitle(this.page.title);
    this.meta.updateTag({ name: 'description', content: this.page.description });
    this.meta.updateTag({ name: 'author', content: this.page.author });
    this.meta.updateTag({ name: 'keywords', content: this.page.keywords });
  }

}
