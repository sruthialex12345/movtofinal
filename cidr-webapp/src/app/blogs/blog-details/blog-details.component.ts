import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { SpinnerVisibilityService } from 'ng-http-loader';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import {StaticPagesService} from "../../services/staticpages.service";
import { Meta, Title } from '@angular/platform-browser';


@Component({
  selector: 'app-blog-details',
  templateUrl: './blog-details.component.html',
  styleUrls: ['./blog-details.component.css']
})
export class BlogDetailsComponent implements OnInit {

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
        this.spinner.show();
        this.staticPagesService.getItem(`home/blogDetails?pageSlug=${this.pageSlug}`)
        .subscribe((res:any) => {
          if(res != null){
            this.pageContent = res.data.content;
            this.pageHeading = res.data.heading;
            this.page = res.data;
            this.spinner.hide();
            this.setMetaData();
            return true;
          }
        });
        this.spinner.hide();
    });
  }
  setMetaData() {
    this.titleService.setTitle(this.page.title);
    this.meta.updateTag({ name: 'description', content: this.page.description });
    this.meta.updateTag({ name: 'author', content: this.page.author });
    this.meta.updateTag({ name: 'keywords', content: this.page.keywords });
  }

}
