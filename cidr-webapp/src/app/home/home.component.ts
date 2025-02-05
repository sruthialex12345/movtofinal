import { Component, OnInit } from '@angular/core';
import {StaticPagesService} from "../services/staticpages.service";
import { Meta, Title } from '@angular/platform-browser';
declare var $: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  imageUrlArray: any;
  public innerWidth: any;
  public innerHeight: any;
  page:any;
  constructor(
    private staticPagesService: StaticPagesService,
    private titleService: Title,
    private meta: Meta
    ) {
   }

  ngOnInit() {
    this.imageUrlArray = [
      "../../assets/images/about-icon/provider.png",
      "../../assets/images/about-icon/provider.png"
    ]
    this.innerWidth = window.innerWidth-120;
    this.innerHeight = window.innerHeight-80;
    this.getmetaData();
  }

  getmetaData(){
    var pageSlug='home';
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


  stopVideo(){
    $("#videoModalPopup").on('hidden.bs.modal', function (e) {
      $("#videoModalPopup iframe").attr("src", $("#videoModalPopup iframe").attr("src"));
  });

  }

}
