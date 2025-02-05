import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectItem } from 'primeng/components/common/selectitem';
import { RoutesService } from "../routes.service";
import { SpinnerVisibilityService } from 'ng-http-loader';
import {ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-view-route',
  templateUrl: './view-route.component.html',
  styleUrls: ['./view-route.component.css']
})
export class ViewRouteComponent implements OnInit {

// initial(default) center position for the map
lat: number ;
lng: number ;
itemID:string="";
origin:any;
destination:any;
waypoints:any;
zoom: number = 8;
showmap:boolean=true;
addEditForm: FormGroup;
f : any;
locations = [];
routeData:any;

userSettings:any={
  "inputPlaceholderText": "Enter Area Name...",
  "inputString":"",
  "showSearchButton":false
};

constructor(
  private fb: FormBuilder,
  private router: Router,
  private activatedRoute: ActivatedRoute,
  private klassService: RoutesService,
  private spinner: SpinnerVisibilityService,
  private formBuilder: FormBuilder,
  private toastr: ToastrService,
  ) {}

ngOnInit() {
  this.addEditForm = this.formBuilder.group({
    locationId:['', [Validators.required]],
    name: ['', [Validators.required]]
  });
  this.getDefaultLocations();
  this.activatedRoute.params.subscribe((params: Params) => {
    this.itemID = params['id'];
    console.log('itemid', this.itemID)
    if (this.itemID) {
      // this.getItem();
      this.getRouteById();
    }
  });

  // convenience getter for easy access to form fields
  this.f = this.addEditForm.controls;
  /* Initiate the form structure */
  this.getAllLocations()
  this.getDefaultLocations();
}

getDefaultLocations(){
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      this.lat = position.coords.latitude;
      this.lng = position.coords.longitude;
    })
  }
}

getRouteById() {
  this.klassService.getItem( `${environment.config.API_VERSION ? environment.config.API_VERSION+'/' : '' }admin/getRouteById?Id=${this.itemID}`).subscribe((res:any) => {
    if((res != null) && res.data  ){
      this.routeData=res.data;
      this.addEditForm.patchValue(res.data);
      let source = this.findSource(res.data.terminals);
      let destination = this.findDestination(res.data.terminals);
      if (source && destination) {
        this.origin = {lat:source.loc[1], lng: source.loc[0]};
        this.destination = {lat:destination.loc[1], lng: destination.loc[0]};
        this.waypoints = this.schemaToEditWaypoints(res.data.terminals);
      }
      this.showmap=true;
      console.log("this.location , ", this.waypoints);
      return true;
    }
  });
}

findSource(terminals: any) {
  return terminals.find(terminal => terminal.type === 'startTerminal')
}

findDestination(terminals: any) {
  return terminals.find(terminal => terminal.type === 'endTerminal')
}

schemaToEditWaypoints(terminals:any){
  return terminals.map((terminal)=>{
    let pt = {lat: terminal.loc[1], lng: terminal.loc[0]};
    let wpt = {location: pt, stopover: true}
    return wpt;
  })
}

getAllLocations(){
  this.spinner.show();
  this.klassService.getAllLocations(`admin/getLocationsLists`).subscribe((res:any) => {
    this.locations=res.data;
  });
  this.spinner.hide();
}

//////////// End ////////////////////
}
