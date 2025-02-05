import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectItem } from 'primeng/components/common/selectitem';
import { RoutesService } from "../routes.service";
import { SpinnerVisibilityService } from 'ng-http-loader';
import {ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environments/environment';
import { SharedService } from '../../../services/shared.service';

@Component({
  selector: 'app-route',
  templateUrl: './route.component.html',
  styleUrls: ['./route.component.css']
})
export class RouteComponent implements OnInit {
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
  showPoints:boolean=false;
  location:any[]=[];
  terminals: SelectItem[];
  locationDisplay:boolean=false;
  zoom: number = 8;
  mapData:any[]=[];
  sourceRequired:boolean=false;
  destinationRequired:boolean=false;
  showMapBoolean:boolean=true;
  locationlength:Number=0;
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
  Routeresults:any;
  selectedLocation:any;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private klassService: RoutesService,
    private spinner: SpinnerVisibilityService,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private sharedService: SharedService,
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
      this.addEditForm.patchValue({
        locationId:  this.locations[0]._id
      });
      this.selectedLocation=this.getSelectedLocationDetails(this.locations[0]._id);
      this.showPoints=true
    });
    this.spinner.hide();
  }

  schemaToWaypoints(terminals:any){
    return terminals.map((terminal)=>{
      let pt = {lat: terminal.point.geometry.location.lat, lng: terminal.point.geometry.location.lng};
      let wpt = {location: pt, stopover: true}
      return wpt;
    })
  }

  locationChange(event){
    this.selectedLocation=this.getSelectedLocationDetails(event);
    if(event){this.showPoints=true; }else{this.showPoints=false;}
  }

  getSelectedLocationDetails(locId: any){
      return this.locations.find(locationDet => locationDet._id === locId)
  }

  getDefaultLocations(){
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;
      })
      this.showMapBoolean=true;
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
    let destinationLoc=event.data.formatted_address;
    this.spinner.show();
    this.checkDistance(destinationLoc).then((resultDistance)=>{
      console.log("resultDistance",resultDistance);
      if(resultDistance){
        this.routeForm.patchValue({point:event.data})
        this.pointRequired=false;
        this.spinner.hide();
      }else{
        this.showMap();
        this.spinner.hide();
        this.errorMessage();
      }
    });

  }
  updatePoint(event:any, index=null){
    let destinationLoc=event.data.formatted_address;
    this.locationDisplay=false;
    this.spinner.show();
    this.checkDistance(destinationLoc).then((resultDistance)=>{
      if(resultDistance){
      this.location[index].point=event.data
      this.showMap();
      this.spinner.hide();
    }else{
      this.showMap();
      this.spinner.hide();
      this.errorMessage();
    }
  });
  }

  checkDistance(destinationLoc){
    return new Promise((resolve,reject)=>{
      let sourceLoc=this.selectedLocation.zone.formattedAddress
      this.klassService.getDistanceByOriginDestination(`${environment.config.API_VERSION ? environment.config.API_VERSION+'/' : '' }admin/routes/getDistanceByOriginDestination?src=${sourceLoc}&&des=${destinationLoc}`)
      .subscribe((responseListData) => {
        let responseList=responseListData.data;
        console.log("responseList",responseList);
        if(responseList && responseList.rows && responseList.rows.length>0 && responseList.rows[0].elements && responseList.rows[0].elements.length>0 && responseList.rows[0].elements.status!=="ZERO_RESULTS" && responseList.rows[0].elements[0].distance && responseList.rows[0].elements[0].distance.text ){
          var distanceArr=responseList.rows[0].elements[0].distance.text.split(" ");
          // var distance=parseInt(distanceArr[0]) * 1.60934;
          var distance=parseInt(distanceArr[0]);
          var sourceRadius=parseInt(this.selectedLocation.radius);
          if(sourceRadius>=distance){
            return resolve(true);
          }else{
            return resolve(false);
          }
        }else{
          return resolve(false);
        }
      },
      e => {
        console.log(`onError: ${e}`);
        return resolve(false);
      },
      () => console.log('onCompleted'))
    })

  }

  errorMessage(){
    this.routeForm.patchValue({point:""})
    this.showPoints=false;
    setTimeout(()=>{
      this.showPoints=true;
      this.pointRequired=false;
    },0);
    this.toastr.error( "You can't add this location, Because this is not comes under your radius",'Error', {
      timeOut: 4000
    });
  }

  changeTerminal(ter:any, index=null){
    this.location[index].isTerminal=ter
    this.showMap();
  }

  removeTerminal(id){
    this.location.splice(id,1);
    this.showMap();
  }

  showMap(){
    this.locationDisplay=false;
    this.showPoints=false;
    this.showMapBoolean=false;
    if(this.location && this.location.length>0){
      var length= this.location.length;
      this.origin=this.location[0].point.geometry.location;
      this.destination=this.location[length-1].point.geometry.location;
      this.waypoints=this.schemaToWaypoints(this.location);
    }else{
      this.location=[];
      this.waypoints=[];
      this.origin='';
      this.destination='';
      this.getDefaultLocations();
    }
    this.locationlength=this.location.length;
    setTimeout(()=>{
      this.locationDisplay=true;
      this.showMapBoolean=true;
      this.showPoints=true;
    },0);
  }

  updateItem() {
    this.submitted = true;
    if (this.addEditForm.invalid) {
      return;
    }

    if (this.location && this.location.length<=0) {
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
      this.toastr.error( 'Please select Destination','Error', {
        timeOut: 1000
      });
      return;
    }
    let admin:any = JSON.parse(localStorage.getItem("currentUser"));
      let routeTerminals = this.geoLocToTerminals(this.location,admin);
      let reqPayload = {
        adminId: admin._id,
        locationId: this.addEditForm.value.locationId,
        name: this.addEditForm.value.name,
        terminals: routeTerminals
      }
      this.klassService.addItem(reqPayload, `${environment.config.API_VERSION ? environment.config.API_VERSION+'/' : '' }admin/routes/add?id=${this.itemID}`)
      .subscribe((res) => {
        this.isLoading = false;
        let responseData = res;
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

  upTerminal(index){
    let new_index=index-1
    this.changePosition(index,new_index);
  }

  downTerminal(index){
    let new_index=index+1
    this.changePosition(index,new_index);
  }

   changePosition(index,new_index){
      this.location.splice(new_index, 0, this.location.splice(index, 1)[0]);
      this.showMap();
   }

  //////////// End ////////////////////
}
