/*
 * @file: MapDirections.js
 * @description: Fetch direactions between two locations.
 * @date: 04.Jan.2018
 * @author: Gurtej Singh
 */
/* eslint-disable */

("use strict");
import Geocoder from "react-native-geocoding";
import Idx from "./Idx";
import { Linking } from "react-native";
import Constants from "../constants";
import DriverSocket from "./socket/driver";
import { Dimensions, Platform } from "react-native";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";
import promise from "../store/promise";
import geolib from "geolib";
//Guru - 12/29/2019 - Fix for RN0.61.5 Upgrade
import Geolocation from "@react-native-community/geolocation";
import { storeObj } from "../store/setup";
class MapApi {
  static getDirections(source, destination) {
    console.log("source and destingation data------>", source, destination);
    return new Promise((resolve, reject) => {
      let directionsUrl =
        "https://maps.googleapis.com/maps/api/directions/json?origin=" +
        source.latitude +
        "," +
        source.longitude +
        "&destination=" +
        destination.latitude +
        "," +
        destination.longitude +
        "&key=" +
        Constants.DevKeys.map.APIKey;
      fetch(directionsUrl)
        .then(response => response.json())
        .then(responseJson => {
          console.log("JSON RESPONSE- getDirections------->", responseJson);
          if (responseJson.status === "OK") {
            if (responseJson.routes.length && Idx(responseJson, _ => _.routes[0].legs[0].steps)) {
              let steps = this.decodeMapPoints(responseJson.routes[0].overview_polyline.points);
              return resolve(steps);
            }
          } else {
            reject(responseJson);
          }
        })
        .catch(error => {
          console.log("location error", error);
          reject(error);
        });
    });
  }

  // it will decode the map points between source to destination
  static decodeMapPoints(t, e = 5) {
    for (var n, o, u = 0, l = 0, r = 0, d = [], h = 0, i = 0, a = null, c = Math.pow(10, e || 5); u < t.length; ) {
      (a = null), (h = 0), (i = 0);
      do (a = t.charCodeAt(u++) - 63), (i |= (31 & a) << h), (h += 5);
      while (a >= 32);
      (n = 1 & i ? ~(i >> 1) : i >> 1), (h = i = 0);
      do (a = t.charCodeAt(u++) - 63), (i |= (31 & a) << h), (h += 5);
      while (a >= 32);
      (o = 1 & i ? ~(i >> 1) : i >> 1), (l += n), (r += o), d.push([l / c, r / c]);
    }
    return (d = d.map(function(t) {
      return {
        latitude: t[0],
        longitude: t[1]
      };
    }));
  }

  //open google map for navigation

  static googleMapNavigate(source, destination) {
    let url = "";
    url = `http://maps.google.com/maps?saddr=${source.latitude},${source.longitude}&daddr=${destination.latitude},${
      destination.longitude
    }`;
    // console.log('URL ', url);
    Linking.canOpenURL(url).then(supported => {
      if (!supported) {
        console.log("Error", url); //eslint-disable-line
      } else {
        Linking.openURL(url);
      }
    });
  }

  // this function will calculate distance from source to destination

  static calculateDistance(source, destination, unit = "N") {
    //'K' is kilometers
    //'N' is nautical miles
    let radlat1 = (Math.PI * source.lat) / 180;
    let radlat2 = (Math.PI * destination.lat) / 180;
    let theta = source.lng - destination.lng;
    let radtheta = (Math.PI * theta) / 180;
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == "K") {
      dist = dist * 1.609344;
    }
    if (unit == "N") {
      dist = dist * 0.8684;
    }
    return dist.toFixed(1);
  }

  // this function will return formatted address text

  static getAddressText(latitude = 0, longitude = 0) {
    return new Promise((resolve, reject) => {
      Geocoder.getFromLatLng(latitude, longitude)
        .then(response => {
          //console.log(response, "response");
          return response.results;
        })
        .then(result => {
          resolve(result[0].formatted_address);
        })
        .catch(e => {
          reject(e);
        });
    });
  }

  // function will return current position

  static getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (Platform.OS == "android") {
        Geolocation.getCurrentPosition(
          position => {
            let { latitude, longitude, heading } = position.coords;
            console.log("android getCurrentPosition **********************************", position);
            this.getRegionForCoordinates([{ latitude, longitude }]).then(region => {
              region.angle = heading;
              resolve(region);
            });
          },
          error => {
            console.log("error on getting current position", error);
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 1000 }
        );
      } else {
        navigator.geolocation.getCurrentPosition(
          position => {
            console.log("ios getCurrentPosition **********************************", position);
            let { latitude, longitude, heading } = position.coords;
            this.getRegionForCoordinates([{ latitude, longitude }]).then(region => {
              const { getState } = storeObj.store;
              const { iOSAngle } = getState().trip;
              region.angle = iOSAngle;
              resolve(region);
            });
          },
          error => {
            console.log("error on getting current position", error);
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 1000 }
        );
      }
    });
  }

  //this function will return in between points of latLongArray [{longitude,latitude}]

  static getInBetweenRoutePoints(latLngArray) {
    let myPromise = [];
    if (latLngArray.length) {
      for (var i = 0; i < latLngArray.length - 1; i++) {
        myPromise.push(
          new Promise((resolve, reject) => {
            console.log(latLngArray[i], latLngArray[i + 1]);
            this.getDirections(latLngArray[i], latLngArray[i + 1])
              .then(res => {
                resolve(res);
              })
              .catch(error => {
                reject(error);
              });
            // .catch(error => reject(error));
          })
        );
      }
    }
    return new Promise.all(myPromise);
  }

  //this will return all the points after merged using latLongArray[{latitude,longitude}]

  static getRoutePoints(Routes) {
    return new Promise((resolve, reject) => {
      if (!Routes.length) {
        reject("Empty lat long array");
      }
      this.getInBetweenRoutePoints(Routes)
        .then(res => {
          let myArr = [];
          try {
            for (var i = 0; i < res.length; i++) {
              Array.prototype.push.apply(myArr, res[i]);
            }
          } catch (e) {
            reject(e);
          }
          resolve(myArr);
        })
        .catch(error => reject(error));
    });
  }

  //this will return longitude and langitude delta

  static getRegionForCoordinates(points) {
    /* points should be an array of { latitude: X, longitude: Y } */

    return new Promise((resolve, reject) => {
      if (!points.length) {
        reject("empty lat long array");
      }
      let minX, maxX, minY, maxY;
      const window = Dimensions.get("window");
      const { width, height } = window;
      const ASPECT_RATIO = width / height;
      const LATITUDE_DELTA = 0.005; //Very high zoom level
      const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
      // console.log("Points", points);
      // init first point
      try {
        (point => {
          minX = point.latitude;
          maxX = point.latitude;
          minY = point.longitude;
          maxY = point.longitude;
        })(points[0]);

        // calculate rect
        points.map(point => {
          minX = Math.min(minX, point.latitude);
          maxX = Math.max(maxX, point.latitude);
          minY = Math.min(minY, point.longitude);
          maxY = Math.max(maxY, point.longitude);
        });

        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        const deltaX = maxX - minX !== 0 ? maxX - minX : LATITUDE_DELTA;
        const deltaY = maxY - minY !== 0 ? maxY - minY : LONGITUDE_DELTA;
        console.log("region----------------->", {
          latitude: midX,
          longitude: midY,
          latitudeDelta: deltaX,
          longitudeDelta: deltaY
        });
        resolve({
          latitude: midX,
          longitude: midY,
          latitudeDelta: deltaX,
          longitudeDelta: deltaY
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  // function will watch the current location of user

  static watcher() {
    return new Promise((resolve, reject) => {
      if (Platform.OS == "android") {
        Geolocation.watchPosition(
          position => {
            console.log("android watch positon**********************************", position);
            const { latitude, longitude, heading } = position.coords;
            this.getRegionForCoordinates([{ latitude, longitude }]).then(region => {
              region.angle = heading;
              console.log("watcher", region);
              DriverSocket.updateTripLocation(region);
              resolve(region);
            });
          },
          error => reject(error),
          // { enableHighAccuracy: false, distanceFilter: 0.1 }
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000, distanceFilter: 0.2 }
        );
      } else {
        navigator.geolocation.watchPosition(
          position => {
            console.log("ios watch postion **********************************", position);
            const { latitude, longitude, heading } = position.coords;
            this.getRegionForCoordinates([{ latitude, longitude }]).then(region => {
              const { getState } = storeObj.store;
              const { iOSAngle } = getState().trip;
              region.angle = iOSAngle;
              console.log("watcher", region);
              DriverSocket.updateTripLocation(region);
              resolve(region);
            });
          },
          error => reject(error),
          // { enableHighAccuracy: false, distanceFilter: 0.1 }
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000, distanceFilter: 0.7 }
        );
      }
    });
  }

  static getCenterCordinates(latLong) {
    return new Promise((resolve, reject) => {
      if (!latLong.length) {
        reject("empty lat long array");
      }
      this.getRegionForCoordinates(latLong)
        .then(res => {
          let { latitudeDelta, longitudeDelta } = res;
          let num_coords = latLong.length;
          let X = 0.0;
          let Y = 0.0;
          let Z = 0.0;
          latLong.map(item => {
            let lat = (item.latitude * Math.PI) / 180;
            let long = (item.longitude * Math.PI) / 180;
            let a = Math.cos(lat) * Math.cos(long);
            let b = Math.cos(lat) * Math.sin(long);
            let c = Math.sin(lat);
            X += a;
            Y += b;
            Z += c;
          });

          X /= num_coords;
          Y /= num_coords;
          Z /= num_coords;

          let lon = Math.atan2(Y, X);
          let hyp = Math.sqrt(X * X + Y * Y);
          let lat = Math.atan2(Z, hyp);
          let obj = { latitude: (lat * 180) / Math.PI, longitude: (lon * 180) / Math.PI };
          obj.latitudeDelta = latitudeDelta;
          obj.longitudeDelta = longitudeDelta;
          resolve(obj);
        })
        .catch(e => reject(e));
    });
  }

  static getFormattedLatLong = collection => {
    let route = [];
    return new Promise((resolve, reject) => {
      collection &&
        collection.length &&
        collection.map((item, i) => {
          route.push({
            longitude: item.loc[0],
            latitude: item.loc[1]
          });
          if (i == collection.length - 1) {
            resolve(route);
          }
        });
    });
  };

  static getFormattedLatLongAdmin = collection => {
    let route = [];
    return new Promise((resolve, reject) => {
      collection &&
        collection.length &&
        collection.map((item, i) => {
          route.push({
            longitude: item.gpsLoc[0],
            latitude: item.gpsLoc[1]
          });
          if (i == collection.length - 1 || i == 0) {
            resolve(route);
          }
        });
    });
  };
  static getDriversWayPoints = (waypoints, region) => {
    try {
      console.log(waypoints, region);
      let wayPointsMap = null;
      if (waypoints && waypoints.length >= 2) {
        // let ordered =geolib.orderByDistance(region, [region, ...waypoints]);
        if (region && region.latitude) {
          //  wayPointsMap = [region, ...waypoints.slice(1, -1)];
          wayPointsMap = geolib.orderByDistance(region, [region, ...waypoints]);
        } else {
          wayPointsMap = [waypoints.slice(1, -1)];
        }
      } else {
        if (region && region.latitude) {
          wayPointsMap = [region];
        }
      }
      return wayPointsMap;
    } catch (e) {
      console.log("Error getDriversWayPoints", e);
      return null;
    }
  };
}

reactMixin(MapApi.prototype, TimerMixin);
// get directions from source to destination
export default MapApi;
