/*
AuthorName : Gurtej Singh
FileName: reducer.js
Description: Contains the reducer regarding the Shuttle
Date : 11 Sept 2018  
*/

import * as Types from "../../actionTypes";
const initialState = {};

var shuttle = (state = initialState, action) => {
  switch (action.type) {
    case Types.SHUTTLE_LIST:
      return { ...state, shuttles: action.payload };
    case Types.RESET_SHUTTLE:
      return { ...initialState };
    default:
      return state;
  }
};
export default shuttle;
