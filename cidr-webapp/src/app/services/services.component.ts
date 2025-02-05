import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {
  imageUrlArray: any;
  constructor() { }

  ngOnInit() {
    this.imageUrlArray = [
      "../../assets/images/services-slider-slide1.png",
      "../../assets/images/services-slider-slide2.png",
      "../../assets/images/services-slider-slide3.png",
      "../../assets/images/services-slider-slide4.png",
      "../../assets/images/services-slider-slide5.png"
    ]
  }

}
