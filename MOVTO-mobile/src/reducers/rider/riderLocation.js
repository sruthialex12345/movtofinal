/*
AuthorName : Gurtej Singh
FileName: reducer.js
Description: Contains the reducer regarding the user location
Date : 11 Sept 2018  
*/

import * as Types from "../../actionTypes";
import moment from "moment";
const initialState = {
  terminals: [],
  source: {},
  destination: {},
  locationType: "source",
  person: "1",
  code: "Please enter your code",
  time: null, //@GR - 05/23/2010 - redux-persist-mutation error - init to null - get from payload
  providers: [],
  userProvider: {}
};

const riderLocation = (state = initialState, action) => {
  switch (action.type) {
    case Types.RIDER_SOURCE:
      return { ...state, source: { ...action.payload } };
    case Types.RIDER_DESTINATION:
      return { ...state, destination: { ...action.payload, locationType: "source" } };
    case Types.RIDER_LOCATION_TYPE:
      return { ...state, locationType: action.payload };
    case Types.RIDER_COUNT:
      return { ...state, person: action.payload };
    case Types.CODE_IS:
      return { ...state, code: action.payload };

    case Types.UPDATE_RIDE_TIME:
      return { ...state, time: action.payload };
    case Types.PICKUP_POINT:
      return { ...state, terminals: action.payload };
    case Types.RESET_TERMINAL_LIST:
      return { ...state, terminals: [] };
    case Types.PROVIDERS:
      return { ...state, providers: action.payload };
    case Types.USER_PROVIDER:
      return { ...state, userProvider: action.payload };
    case Types.RESET_LOCATION_DATA:
      return { ...state, source: {}, destination: {}, locationType: "source" };
    case Types.RESET_RIDER_DATA:
      return { ...initialState };
    default:
      return state;
  }
};
export default riderLocation;
