import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import { forkJoin } from "rxjs/observable/forkJoin";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../environments/environment";
const httpOptions = {
  headers: new HttpHeaders({
    Authorization: ``,
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD"
  })
};

@Injectable({
  providedIn: "root"
})
export class SharedService {
  private subject = new BehaviorSubject({});

  constructor(private http: HttpClient) {}

  getDetailsOfTerminals(terminals: any): Observable<any[]> {
    return forkJoin(
      terminals.map(terminal => {
        let latLong = `${terminal[1]},${terminal[0]}`;
        return this.http.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latLong}&key=${
            environment.config.GOOGLE_API_KEY
          }`
        );
      })
    );
  }

  getLocation(latLong): Observable<any> {
    return this.http.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latLong}&key=${
        environment.config.GOOGLE_API_KEY
      }`
    );
  }

  getDistance(sources: any, destination: any): Observable<any> {
    return this.http.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${sources}&destinations=${destination}&mode=driving&key=${
        environment.config.GOOGLE_API_KEY
      }`,
      httpOptions
    );
  }

    sendImage(message: string, upload: string) {
      this.subject.next({ image: message, upload: upload });
    }
    getImage(): Observable<any> {
      return this.subject.asObservable();
    }

    sendName(name: string, namechange: string) {
      this.subject.next({ name: name, namechange: namechange });
    }
    getName(): Observable<any> {
      return this.subject.asObservable();
    }

    sendRouteType(tripType: string, tripTypeChange: string) {
      this.subject.next({ tripType: tripType, tripTypeChange: tripTypeChange });
    }

    getRouteType(): Observable<any> {
      return this.subject.asObservable();
    }
}
