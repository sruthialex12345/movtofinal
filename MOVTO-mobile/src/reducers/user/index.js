/*
AuthorName : Parshant Nagpal
FileName: reducer.js
Description: Contains the reducer regarding the user
Date : 11 Sept 2018  
*/

import * as Types from "../../actionTypes";
const initialState = {
  history: {
    meta: {},
    rides: [],
    scheduleRide: {},
    upcomingRide: []
  },
  deviceToken: null,
  deviceType: null,
  route : {}
};

export default (user = (state = initialState, action) => {
  console.log("state user================", action.payload);
  switch (action.type) {
    case Types.USER_REGISTERATION:
      return { ...state, ...action.data };
    case Types.SAVE_USER:
      return { ...state, ...action.payload };
    case Types.SAVE_ACCESS_TOKEN:
      return { ...state, accessToken: action.payload };
    case Types.PROFILE_IMAGE_URL:
      return { ...state, profileUrl: action.payload };
    case Types.UPDATE_NAME:
      return { ...state, name: action.payload };
    case Types.UPDATE_GPS_LOCATION:
      return { ...state, gpsLoc: action.payload };
    case Types.UPDATE_MOBILE:
      return {
        ...state,
        phoneNo: action.payload.phoneNo,
        isdCode: action.payload.isdCode,
        countryCode: action.payload.countryCode
      };
    //@GR - 05/06/2020 - Added reducer for providerId update
    case Types.UPDATE_USER_PROVIDERID:
      return {
        ...state,
        route: action.payload
      };
    case Types.RIDER_HISTORY:
      return {
        ...state,
        history: {
          rides: state.history.rides.concat(action.payload.rides),
          meta: action.payload.meta
        }
      };
    case Types.TRIP_HISTORY:
      return {
        ...state,
        history: {
          rides: state.history.rides.concat(action.payload.rides),
          meta: action.payload.meta
        }
      };
    case "RESET_HISTORY":
      return {
        ...state,
        history: {
          meta: {},
          rides: []
        }
      };
    case Types.UPDATE_NOTIFICATIONS_INFO:
      return {
        ...state,
        deviceToken: action.payload.deviceToken,
        deviceType: action.payload.deviceType
      };
    case Types.RESET_USER:
      return { ...initialState };
    //Schedule Ride
    case Types.SCHEDULE_RIDE:
      return {
        ...state,
        scheduleRide: action.payload
      };
    //Upcoming Rides
    case Types.UPCOMING_RIDE:
      return {
        ...state,
        upcomingRide: action.payload
      };
    default:
      return state;
  }
});
