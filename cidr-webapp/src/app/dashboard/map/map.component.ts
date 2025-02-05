import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectItem } from 'primeng/components/common/selectitem';
import { RoutesService } from "../routes/routes.service";
import { SpinnerVisibilityService } from 'ng-http-loader';
import {ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})

export class MapComponent implements OnInit {

  // initial(default) center position for the map
  lat: number ;
  lng: number ;
  itemID:String = null;
  routeForm: FormGroup;
  origin:any;
  destination:any;
  waypoints:any;
  pointRequired:boolean=false;
  point:any="";
  showPoints:boolean=true;
  location:any[]=[];
  terminals: SelectItem[];
  locationDisplay:boolean=false;
  zoom: number = 8;
  mapData:any[]=[];
  sourceRequired:boolean=false;
  destinationRequired:boolean=false;
  showmap:boolean=true;
  pointMessage:string="Please select Location";
  defautlSettings:any={
    "inputPlaceholderText": "Enter Area Name...",
    "showSearchButton":false
  };
  userSettings:any={
    "inputPlaceholderText": "Enter Area Name...",
    "inputString":"",
    "showSearchButton":false
  };
  locations = [];
  submitted: Boolean;
  isLoading: Boolean;
  addEditForm: FormGroup;
  f : any;
  isEditable: boolean;

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
    // convenience getter for easy access to form fields
    this.f = this.addEditForm.controls;


    /* Initiate the form structure */
    this.getAllLocations()
    this.routeForm = this.fb.group({
      point: ['', [Validators.required]],
    });
    this.getDefaultLocations();
  }

  getAllLocations(){
    this.spinner.show();
    this.klassService.getAllLocations(`admin/getLocationsLists`).subscribe((res:any) => {
      this.locations=res.data;
    });
    this.spinner.hide();
  }

  getDefaultLocations(){
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;
      })
    }
  }


  /////// This is new /////////////////

  save() {
    if(this.routeForm.value.point==""){
      this.pointRequired=true;
      return;
    }
    this.userSettings.inputString=this.routeForm.value.point.formatted_address
    // this.routeForm.value.inputString=this.userSettings.inputString;
    this.location.push(this.routeForm.value);
    this.routeForm.patchValue({point:""})
    this.showPoints=false;
    setTimeout(()=>{
      this.showPoints=true;
      this.pointRequired=false;
    },0);
    this.showMap();
  }
  
  terminalPoint(event:any){
    console.log("event.data ",event.data)
    this.routeForm.patchValue({point:event.data})
    this.pointRequired=false;
  }

  updatePoint(event:any, index=null){
    this.location[index].point=event.data
    this.showMap();
  }

  changeTerminal(ter:any, index=null){
    this.location[index].isTerminal=ter
    this.showMap();
  }

  removeTerminal(id){
    this.location.splice(id,1);
    this.showMap();
  }


  positionChanged(event){
    console.log(event);
  }

  showMap(){
    this.locationDisplay=false;
    this.showPoints=false;
    this.showmap=false

    var length= this.location.length;
    this.origin=this.location[0].point.geometry.location;
    this.destination=this.location[length-1].point.geometry.location;
    this.waypoints=this.schemaToWaypoints(this.location);
    
    setTimeout(()=>{
      this.locationDisplay=true;
      this.showmap=true;
      this.showPoints=true;
    },0);

    // if(this.location && this.location.length<=0){
    //   this.getDefaultLocations();
    // }

  }
  schemaToWaypoints(terminals:any){
    return terminals.map((terminal)=>{
      let pt = {lat: terminal.point.geometry.location.lat, lng: terminal.point.geometry.location.lng};
      let wpt = {location: pt, stopover: true}
      return wpt;
    })
  }

  updateItem() {
    this.submitted = true;
    console.log(this.location.length);
    if (this.addEditForm.invalid) {
      return;
    }

    if (this.location && this.location.length<=0) {
      console.log("IN SOURCD ",this.location);
      this.pointRequired=true;
      this.pointMessage="Please select Source";
      this.toastr.error( 'Please select Source','Error', {
        timeOut: 1000
      });
      return;
    }
    
    if (this.location && this.location.length<= 1) {
      this.pointRequired=true;
      this.pointMessage="Please select Destination";
      console.log("IN Destination ",this.location);
      this.toastr.error( 'Please select Destination','Error', {
        timeOut: 1000
      });
      return;
    }
    let admin:any = JSON.parse(localStorage.getItem("currentUser"));
      console.log("waypoints with details", this.location);
      let routeTerminals = this.geoLocToTerminals(this.location,admin);
      console.log('routTerminals', routeTerminals);
      let reqPayload = {
        adminId: admin._id,
        locationId: this.addEditForm.value.locationId,
        name: this.addEditForm.value.name,
        terminals: routeTerminals
      }
      console.log("Final POst Data -- > ", reqPayload);
      this.klassService.addItem(reqPayload, `${environment.config.API_VERSION ? environment.config.API_VERSION+'/' : '' }admin/routes/add?id=${this.itemID}`)
      .subscribe((res) => {
        this.isLoading = false;

        console.log('response', res);
        let responseData = res;
        console.log('response', responseData);
        if(responseData.success){
          this.toastr.success( responseData.message,'Success', {
            timeOut: 3000
          });
          this.router.navigate([`dashboard/routes`]);
        }else{
          this.toastr.error( responseData.message,'Error', {
            timeOut: 3000
          });
        }

      },
      (err) => {
        let error = err;
        console.log('error', error);
        console.log('response error',err.message);
        this.toastr.error( err.message,'Error', {
          timeOut: 3000
        });
      });
    }

  geoLocToTerminals(terminalLocs,admin){
    console.log("terminalLoc" , terminalLocs);
    
    return terminalLocs.map((terminalLoc:any, index)=>{
      let terminalObj:any = {
        "isSelected": false,
        "adminId": admin._id,
        "loc":[terminalLoc.point.geometry.location.lng, terminalLoc.point.geometry.location.lat],
        "address": terminalLoc.point.formatted_address,
        "name":name==""?terminalLoc.point.formatted_address:name
        // "name": this.formatedAddress(terminalLoc.results[0].address_components)
      }

      if(index === 0) {
        terminalObj.type = "startTerminal",
        terminalObj.isSelected = true
      } else if (index === (terminalLocs.length-1)) {
        terminalObj.type = "endTerminal"
      } else {
        terminalObj.type = "terminal"
      }
      return terminalObj;
    })
  }

  removeRoute(routeId){

  }


  // sourcePoint(event:any){
  //   this.origin={point:event.data,isTerminal:'startTerminal'}
  // }

  // destinationPoint(event:any){
  //   this.destination={point:event.data,isTerminal:'endTerminal'}
  // }
  // showMap(){
  //   if(this.location && this.location.length>0){
  //     this.mapData=this.location;
  //   }
    
  //   if(this.origin && this.origin.point){
  //     this.mapData.splice(0, 1)
  //     this.mapData.splice(0, 0, this.origin)
  //     this.origin={};
  //   }

  //   if(this.destination && this.destination.point){
  //     var length=this.mapData.length>0?this.mapData.length:0;
  //     this.mapData.splice(length, 1)
  //     this.mapData.splice(length+1, 0, this.destination);
  //     this.destination={};
  //   }
    
  //   console.log("Shop Map -- > ", this.mapData); 
  // } 
  
  //////////// End ////////////////////
}