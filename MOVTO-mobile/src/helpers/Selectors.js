/*
 * @file: Selectors.js
 * @description: Selector for reducers.
 * @date: 12.01.2018
 * @author: Ankush Rishi
 * */
"use strict";

// import Idx from "./Idx";
// import _ from "lodash";

export function locationSelector(state) {
  let userLocation = {};
  if (state.location) {
    if (state.location.currentLocation && !state.location.selectedLocation) {
      userLocation.address = state.location.currentLocation.formattedAddress;
      userLocation.position = state.location.currentLocation.position;
      return userLocation;
    }
    if (state.location.selectedLocation) {
      userLocation.position = state.location.selectedLocation.position
        ? state.location.selectedLocation.position
        : state.location.selectedLocation.geometry.location;
      userLocation.address = state.location.selectedLocation.formatted_address
        ? state.location.selectedLocation.formatted_address
        : state.location.selectedLocation.formattedAddress;
      return userLocation;
    }
    return null;
  }
  return null;
}
