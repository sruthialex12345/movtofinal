/*
AuthorName : Gurtej Singh
FileName: reducer.js
Description: Contains the reducer regarding the trip
Date : 11 Sept 2018  
*/

import * as Types from "../../actionTypes";
const initialState = {
  driverMapRef: null,
  myShuttle: {},
  rides: [],
  meta: {},
  addPassangersFromTerminal: {},
  addPassangersToTerminal: {},
  driverRoute: [],
  waypoints: [],
  scheduledTrips: [],
  // region: {
  //   latitude: 36.1233,
  //   longitude: 71.2343,
  //   latitudeDelta: 0.12,
  //   longitudeDelta: 0.12
  // },
  region: {},
  acceptTripRequestLoader: false,
  currentTerminal: null,
  scheduledTripsLoader: false,
  iOSAngle: 0
};

var trips = (state = initialState, action) => {
  switch (action.type) {
    case Types.UPDATE_TRIP_DATA:
      return {
        ...state,
        ...action.payload
      };
    case Types.SELECTED_SHUTTLE:
      return {
        ...state,
        myShuttle: action.payload
      };
    case Types.RIDE_REQUEST_LIST:
      return {
        ...state,
        ...action.payload
      };
    case Types.UPDATE_RIDES:
      return {
        ...state,
        rides: [action.payload, ...state.rides]
      };
    case Types.REMOVE_RIDES:
      // Find item index using _.findIndex
      return {
        ...state,
        rides: action.payload
      };
    case Types.UPDATE_RIDES_META:
      return {
        ...state,
        meta: {
          ...state.meta,
          newRequestsCount: action.payload
        }
      };
    case Types.RESET_TRIP:
      return {
        ...initialState
      };
    case Types.UPDATE_REGION:
      return {
        ...state,
        region: action.payload
      };
    case Types.UPDATE_CURRENT_TERMINAL:
      return {
        ...state,
        currentTerminal: action.payload
      };
    case Types.UPDATE_DRIVER_MAP_REF:
      return {
        ...state,
        driverMapRef: action.payload
      };
    case Types.UPDATE_IOS_ANGLE:
      return {
        ...state,
        iOSAngle: action.payload
      };

    case Types.GET_SCHEDULED_TRIPS_DRIVER_REQUEST:
      return {
        ...state,
        scheduledTripsLoader: true
      };
    case Types.GET_SCHEDULED_TRIPS_DRIVER_SUCCESS:
      return {
        ...state,
        scheduledTrips: action.payload,
        scheduledTripsLoader: false
      };
    case Types.GET_SCHEDULED_TRIPS_DRIVER_FAIL:
      return {
        ...state,
        scheduledTripsLoader: false
      };

    case Types.ACCEPT_TRIP_REQUEST:
      return {
        ...state,
        acceptTripRequestLoader: true
      };
    case Types.ACCEPT_TRIP_REQUEST_SUCCESS:
      return {
        ...state,
        acceptTripRequestLoader: false
      };
    case Types.ACCEPT_TRIP_REQUEST_FAIL:
      return {
        ...state,
        acceptTripRequestLoader: false
      };

    case Types.REJECT_TRIP_REQUEST:
      return {
        ...state,
        acceptTripRequestLoader: true
      };
    case Types.REJECT_TRIP_REQUEST_SUCCESS:
      return {
        ...state,
        acceptTripRequestLoader: false
      };
    case Types.REJECT_TRIP_REQUEST_FAIL:
      return {
        ...state,
        acceptTripRequestLoader: false
      };

    default:
      return state;
  }
};
export default trips;
