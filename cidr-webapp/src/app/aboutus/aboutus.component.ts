import { Component, OnInit } from '@angular/core';
import {StaticPagesService} from "../services/staticpages.service";
import { Meta, Title } from '@angular/platform-browser';
@Component({
  selector: 'app-aboutus',
  templateUrl: './aboutus.component.html',
  styleUrls: ['./aboutus.component.css']
})
export class AboutusComponent implements OnInit {
  page:any;
  constructor(
    private staticPagesService: StaticPagesService,
    private titleService: Title, 
    private meta: Meta
    ) {
   }

  ngOnInit() {
    this.getmetaData();
  }

  getmetaData(){
    var pageSlug='about';
    this.staticPagesService.getItem(`home/staticPageDetails?pageSlug=${pageSlug}`)
    .subscribe((res:any) => {
      if(res != null){
        this.page = res.data;
        this.setMetaData();
        return true;
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
