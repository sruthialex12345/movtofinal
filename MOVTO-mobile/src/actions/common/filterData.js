// import RestClient from "../../helpers/RestClient";
// import { toastMessage } from "../../config/navigators";
// import { serverError } from "../app";
import * as Types from "../../actionTypes/index";
// import Constants from "../../constants";

export const setFilterStartDate = payload => {
  return dispatch => {
    dispatch({ type: Types.SET_FILTER_START_DATE, payload });
  };
};

export const setFilterEndDate = payload => {
  return dispatch => {
    dispatch({ type: Types.SET_FILTER_END_DATE, payload });
  };
};

export const setFilterStartTime = payload => {
  return dispatch => {
    dispatch({ type: Types.SET_FILTER_START_TIME, payload });
  };
};

export const setFilterEndTime = payload => {
  return dispatch => {
    dispatch({ type: Types.SET_FILTER_END_TIME, payload });
  };
};

export const setFilterStatus = payload => {
  return dispatch => {
    dispatch({ type: Types.SET_FILTER_STATUS, payload });
  };
};

export const clearFilters = () => {
  return dispatch => {
    dispatch({ type: Types.CLEAR_FILTER });
  };
};
