/*
AuthorName : Gurtej Singh
FileName: reducer.js
Description: Contains the reducer regarding the user
Date : 11 Sept 2018  
*/
/* eslint-disable */
import * as Types from "../../actionTypes";
const initialState = {
  shuttleLocation: {},
  driver: {},
  shuttle: {},
  rateScreen: "",
  isRecentAccepted: false,
  ETA: null,
  rejectMessage: "No Shuttle Found.",
  scheduleNewTripLoader: false
};

export default (riderTrip = (state = initialState, action) => {
  switch (action.type) {
    case Types.UPDATE_TRIP:
      return {
        ...state,
        ...action.payload
      };
    case Types.UPDATE_SHUTTLE_LOCATION:
      return {
        ...state,
        shuttleLocation: action.payload
      };
    case Types.UPDATE_REGION:
      return {
        ...state,
        region: action.payload
      };
    case Types.SAVE_RIDER_DRIVER:
      return {
        ...state,
        driver: action.payload
      };
    case Types.SAVE_RIDER_SHUTTLE:
      return {
        ...state,
        shuttle: action.payload
      };
    case Types.SET_RATE_SCREEN:
      return {
        ...state,
        rateScreen: action.payload
      };
    case Types.UPDATE_ETA: {
      return {
        ...state,
        ETA: action.payload
      };
    }
    case Types.UPDATE_RECENT_UPDATE: {
      return {
        ...state,
        isRecentAccepted: action.payload
      };
    }
    case Types.REJECT_MESSAGE: {
      return {
        ...state,
        rejectMessage: action.payload
      };
    }
    case Types.RESET_RIDER_TRIP:
      return {
        ...initialState
      };

    case Types.SCHEDULE_RIDE_REQUEST: {
      return {
        ...state,
        scheduleNewTripLoader: true
      };
    }
    case Types.SCHEDULE_RIDE: {
      return {
        ...state,
        scheduleNewTripLoader: false
      };
    }
    case Types.SCHEDULE_RIDE_REQUEST_FAIL:
      return {
        ...state,
        scheduleNewTripLoader: false
      };

    default:
      return state;
  }
});
