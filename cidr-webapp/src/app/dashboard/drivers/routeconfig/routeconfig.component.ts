import { Component, OnInit } from '@angular/core';
import { MouseEvent } from '@agm/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
// import { InfoWindow } from '@agm/core/services/google-maps-types'
import { SharedService } from '../../../services/shared.service';
import { Observable } from 'rxjs/Rx';
import { forkJoin } from 'rxjs';
import { ToastrModule, ToastrService, Toast, ToastPackage } from 'ngx-toastr';
import { environment } from '../../../../environments/environment';
import { DriversService } from "../drivers.service";
import { NotificationsService } from '../../../shared/notifications.service';
import { LocationGuard } from "../../../services/location.guard.service";

@Component({
  selector: 'app-routeconfig',
  templateUrl: './routeconfig.component.html',
  styleUrls: ['./routeconfig.component.css']
})
export class RouteconfigComponent implements OnInit {
  location: any = {formatted_address: " "};
  // google maps zoom level
  zoom: number = 8;
  markers: marker[] = [];

  // initial(default) center position for the map
  lat: number ;
  lng: number ;

  public markerOptions = {
    origin: {
      // label: 'Origin',
      draggable: true,
    },
    destination: {
      // label: 'Destination',
      draggable: true,
    }
  }

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private klassService: DriversService,
    private notificationsService: NotificationsService,
    private locationGuard: LocationGuard,
    private sharedService: SharedService,
    private toastr: ToastrService
  ) {
  //   if (navigator.geolocation) {
  //     navigator.geolocation.getCurrentPosition(position => {
  //       var cordinates = position.coords;
  //       var latLong = cordinates.latitude + ',' + cordinates.longitude;

  //   // this.locationGuard.changeLocation().subscribe((location:any)=>{
  //   //   console.log('location changes edit form', location);
  //      this.location = position;

  //   })
  //  }
  }
  origin:any;
  destination: any;
  itemID:String = null;
  submitted: Boolean;
  isLoading: Boolean;

  ngOnInit() {
    // subscribe to router event
    this.activatedRoute.params.subscribe((params: Params) => {
      this.itemID = params['id'];
      console.log('itemid', this.itemID)
      if (this.itemID) {
        this.getItem();
      }
    });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {        
        this.lat = position.coords.latitude;
      this.lng = position.coords.longitude;
      this.zoom=15;
    })
   }
  }

  public waypoints: any = []
  public renderOptions = {
      draggable: true,
  }
  public change(event: any) {
    this.waypoints = event.request.waypoints;
    console.log('waypoints', this.waypoints);
  }

  clickedMarker(label: string, index: number) {
    console.log(`clicked the marker: ${label || index}`)
  }

  mapClicked($event: MouseEvent) {
    console.log("map clicked", $event.coords)
    if(!this.origin) {
      this.origin = { lat: $event.coords.lat, lng: $event.coords.lng}
    } else if(!this.destination) {
      this.destination = { lat: $event.coords.lat, lng: $event.coords.lng}
    }

    if(this.origin && this.destination) {
      this.markers = [];
    }

    this.markers.push({
      lat: $event.coords.lat,
      lng: $event.coords.lng,
      draggable: true
    });
    console.log('this.markersthis.markersthis.markers',this.markers);
  }

  waypointsToSchema(waypoints){
    return waypoints.map((point)=>{
      let wpt = [point.location.location.lng(), point.location.location.lat()]
      return wpt;
    })
  }

  findSource(terminals: any) {
    return terminals.find(terminal => terminal.type === 'startTerminal')
  }

  findDetination(terminals: any) {
    return terminals.find(terminal => terminal.type === 'endTerminal')
  }

  filterWaypoints(terminals:any) {
    return  terminals.filter(terminal=>{
      return ((terminal.type !== "startTerminal") && (terminal.type !== "endTerminal"))
    })
  }

  schemaToWaypoints(terminals:any){
    return terminals.map((point)=>{
      console.log('point', point);
      let pt = {lat: point.loc[1], lng: point.loc[0]};
      let wpt = {location: pt, stopover: true}
      return wpt;
    })
  }

  getWaypointsWithDetail(terminals: any){
    this.sharedService.getDetailsOfTerminals(terminals)
    .subscribe((responseList) => {
      console.log("waypoints with details", responseList);
    },
    e => {console.log(`onError: ${e}`)},
    () => console.log('onCompleted'))
  }

  markerDragEnd(m: any, $event: any) {
    console.log('marker dragEnd', m, $event);
    m.lat = $event.coords.lat;
    m.lng = $event.coords.lng;
    console.log('markers', this.markers);
    if(this.waypoints) {
      this.waypoints = this.waypoints.map(item=>item);
      let pt = {lat: m.lat, lng: m.lng};
      let wpt = {location: pt, stopover: true}
      this.waypoints.push(wpt);
    } else {
      this.waypoints = this.markers.map((point)=>{
        let pt = {lat: point.lat, lng: point.lng};
        let wpt = {location: pt, stopover: true}
        return wpt;
      })
    }
    this.markers = [];
  }

  formatedAddress(collection){
    let street_number='';
    let sublocality_level_1='';
    let sublocality_level_2='';
    let sublocality_level_3='';
    let city='';

    collection.forEach((address_component) => {
      if (address_component.types[0] == "sublocality_level_3"){
        sublocality_level_3 = address_component.long_name;
      }
      if (address_component.types[0] == "sublocality_level_2"){
        sublocality_level_2 = address_component.long_name;
      }
      if (address_component.types[0] == "sublocality_level_1"){
        sublocality_level_1 = address_component.long_name;
      }

      if (address_component.types[0] == "locality"){
        city = address_component.long_name;
      }

      if (address_component.types[0] == "street_number"){
        street_number = address_component.long_name;
      }
    });
    return `${street_number} ${sublocality_level_1} ${sublocality_level_2} ${sublocality_level_3} ${city}`
  }

  geoLocToTerminals(terminalLocs){
    let admin:any = JSON.parse(localStorage.getItem("currentUser"));
    return terminalLocs.map((terminalLoc:any, index)=>{
      let terminalObj:any = {
        "isSelected": false,
        "adminId": admin._id,
        "driverId": this.itemID,
        "loc":[terminalLoc.results[0].geometry.location.lng, terminalLoc.results[0].geometry.location.lat],
        "address": terminalLoc.results[0].formatted_address,
        "name":name==""?terminalLoc.results[0].formatted_address:name
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

  getItem() {
    this.klassService.getItem(`${environment.config.API_VERSION ? environment.config.API_VERSION+'/' : '' }admin/drivers/route?driverId=${this.itemID}`).subscribe((res:any) => {
      console.log("res.  ---  >",res);
      if((res != null) && res.data  ){
        console.log("driver", res);
        let source = this.findSource(res.data);
        let destination = this.findDetination(res.data);
        console.log('origin, destination', this.origin, this.destination);
        if (source && destination) {
          this.origin = {lat:source.loc[1], lng: source.loc[0]};
          this.destination = {lat:destination.loc[1], lng: destination.loc[0]};
          let waypoints = this.filterWaypoints(res.data);
          this.waypoints = this.schemaToWaypoints(waypoints);
        }
        return true;
      }
    });
  }

  updateItem() {
    this.submitted = true;
    let origin = [this.origin.lng, this.origin.lat];
    let destination = [this.destination.lng, this.destination.lat];
    let waypoints = this.waypointsToSchema(this.waypoints);
    waypoints.splice(0, 0, origin);
    waypoints.splice(waypoints.length, 0, destination);

    console.log("way points ",waypoints);
    this.sharedService.getDetailsOfTerminals(waypoints)
    .subscribe((responseList) => {
      console.log("waypoints with details", responseList);
      let routeTerminals = this.geoLocToTerminals(responseList);
      console.log('routTerminals', routeTerminals);

      this.klassService.addItem({"terminals": routeTerminals}, `admin/drivers/route?id=${this.itemID}`)
      .subscribe((res) => {
        this.isLoading = false; 

        console.log('response', res);
        let responseData = res;
        console.log('response', responseData);
        if(responseData.success){
          this.toastr.success( responseData.message,'Success', {
            timeOut: 3000
          });
          this.router.navigate([`dashboard/drivers`]);
        }else{
          this.toastr.error( responseData.message,'Error', {
            timeOut: 3000
          });
        }

      },
      (err) => {
        console.log('error2sdf', err.error);
        let error = err.error;
        console.log('error', error);
        console.log('response error',error.message);
        this.toastr.error( error.message,'Error', {
          timeOut: 3000
        });
      });
    },
    e => {console.log(`onError: ${e}`)},
    () => console.log('onCompleted'))
  }

}

// just an interface for type safety.
interface marker {
	lat: number;
	lng: number;
	label?: string;
	draggable: boolean;
}
