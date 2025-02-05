import { Component, OnInit } from '@angular/core';
import {StaticPagesService} from "../services/staticpages.service";
import { Meta, Title } from '@angular/platform-browser';

declare var $ :any;

@Component({
  selector: 'app-partner',
  templateUrl: './partner.component.html',
  styleUrls: ['./partner.component.css']
})
export class PartnerComponent implements OnInit {
  page:any;
  imageUrlArray: any;
  public innerWidth: any;
  public innerHeight: any;
  selectedTab = "Partner";
  serviceHeading= `<p class="col-md-12 col-lg-12 text-format">  
  <p>
      Providers can track how many passengers are being served at any given point of time, know the drivers and vehicles location, and can message drivers as well as riders. CircularDrive also generates reports based on key metrics to improve efficiency and reduce operationing costs.
  </p>
</p>`;
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

  changeTab(tab) {
    this.selectedTab = tab;
    if(tab == 'Driver') {
      this.serviceHeading = `<p> "As a driver, your CircularDrive app allows you to"</p>`
    } else {
      this.serviceHeading = `<p class="col-md-12 col-lg-12 text-format">
      <p>
          Providers can track how many passengers are being served at any given point of time, know the drivers and vehicles location, and can message drivers as well as riders. CircularDrive also generates reports based on key metrics to improve efficiency and reduce operationing costs.
      </p>
    </p>`;
    }
  }
  getmetaData(){
    var pageSlug='partners';
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
