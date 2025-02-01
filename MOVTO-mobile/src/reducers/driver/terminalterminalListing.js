/*
AuthorName : Gurtej Singh
FileName: reducer.js
Description: Contains the reducer regarding the ride
Date : 11 Sept 2018  
*/

import * as Types from "../../actionTypes";

const initialState = {
  rides: [],
  meta: {}
};

var terminalListing = (state = initialState, action) => {
  switch (action.type) {
    case Types.TERMINAL_RIDE_REQUEST_LIST:
      return { ...state, ...action.payload };
    case Types.RESET_TERMINAL_LISTING:
      return { ...initialState };
    default:
      return state;
  }
};
export default terminalListing;
