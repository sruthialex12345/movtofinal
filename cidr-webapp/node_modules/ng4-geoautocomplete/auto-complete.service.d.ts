import { GlobalRef } from './windowRef.service';
import { Http } from '@angular/http';
import { LocalStorageService } from './storage.service';
import 'rxjs/Rx';
export declare class AutoCompleteSearchService {
    private _http;
    private platformId;
    private _global;
    private _localStorageService;
    constructor(_http: Http, platformId: Object, _global: GlobalRef, _localStorageService: LocalStorageService);
    getPredictions(url: string, query: string): Promise<any>;
    getLatLngDetail(url: string, lat: number, lng: number): Promise<any>;
    getPlaceDetails(url: string, placeId: string): Promise<any>;
    getGeoCurrentLocation(): Promise<any>;
    getGeoLatLngDetail(latlng: any): Promise<any>;
    getGeoPrediction(params: any): Promise<any>;
    getGeoPlaceDetail(placeId: string): Promise<any>;
    getGeoPaceDetailByReferance(referance: string): Promise<any>;
    addRecentList(localStorageName: string, result: any, itemSavedLength: number): any;
    getRecentList(localStorageName: string): Promise<any>;
    private getUniqueResults(arr);
    private geoPredictionCall(placesService, queryInput);
}
