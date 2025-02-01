import * as Types from "../../actionTypes";
const initialState = {
  startDate: null,
  endDate: null,
  startTime: null,
  endTime: null,
  status: []
};

var common = (state = initialState, action) => {
  switch (action.type) {
    case Types.SET_FILTER_START_DATE:
      return { ...state, startDate: action.payload };
    case Types.SET_FILTER_END_DATE:
      return { ...state, endDate: action.payload };
    case Types.SET_FILTER_START_TIME:
      return {
        ...state,
        startTime: action.payload
      };
    case Types.SET_FILTER_END_TIME:
      return {
        ...state,
        endTime: action.payload
      };

    case Types.SET_FILTER_STATUS:
      return {
        ...state,
        status: action.payload
      };
    case Types.CLEAR_FILTER:
      return {
        ...state,
        startDate: null,
        endDate: null,
        startTime: null,
        endTime: null,
        status: []
      };
    default:
      return state;
  }
};
export default common;
