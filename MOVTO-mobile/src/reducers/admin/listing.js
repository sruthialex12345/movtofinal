import * as types from "../../actionTypes";

const initialState = {
  shuttles: [],
  drivers: [],
  riders: [],
  shuttleMeta: {},
  driverMeta: {},
  ridersMeta: {},
  filters: {},
  activeTrips: [],
  region: {},
  currentTrip: "",
  tripData: {},
  tripRoute: {},
  schedulingDrivers: [],
  scheduleList: [],
  riderLocation: {},
  scheduleTripsLoader: false,
  driverFetchAdminLoader: false,
  scheduleNewTripLoader: false
};

export default function listing(state = initialState, action = {}) {
  switch (action.type) {
    case types.ADMIN_SHUTTLE_LIST:
      return {
        ...state,
        shuttles: state.shuttles.concat(action.payload)
      };
    case types.ADMIN_SHUTTLE_META:
      return {
        ...state,
        shuttleMeta: action.payload
      };
    case types.ADMIN_RIDER_META:
      return {
        ...state,
        ridersMeta: action.payload
      };
    case types.ADMIN_DRIVER_META:
      return {
        ...state,
        driverMeta: action.payload
      };
    case types.ADMIN_DRIVER_LIST:
      return {
        ...state,
        drivers: action.payload
      };
    case types.ADMIN_RIDER_LIST:
      return {
        ...state,
        riders: action.payload
      };
    case types.ADMIN_SHUTTLE_LISTING_RESET:
      return {
        ...state,
        shuttles: []
      };
   /* @GR - 05/07/2020 - Added missing reducers for the events to be used later.
   case types.ADMIN_DRIVER_LISTING_RESET:
      return {
        ...state,
        drivers: [],
        driverMeta: {},
        riderLocation : {}
      };
    case types.ADMIN_RIDER_LISTING_RESET:
      return {
        ...state,
        riders: [],
        riderMeta: {},
        riderLocation : {}
      };*/
    case types.UPDATE_FILTERS:
      return { ...state, filters: action.payload };
    case types.ADMIN_ACTIVE_TRIPS:
      return { ...state, activeTrips: action.payload };
    case types.UPDATE_REGION:
      return { ...state, region: action.payload };
    case types.ADMIN_UPDATE_CURRENT_TRIP:
      return { ...state, currentTrip: action.payload };
    case types.RIDE_REQUEST_LIST:
      return { ...state, tripData: action.payload };
    case types.ADMIN_CURRENT_TRIP_ROUTE:
      return { ...state, tripRoute: action.payload };
    case types.RESET_LISTING:
      return {
        ...initialState
      };

    case types.DRIVERS_LISTING_ADMIN_REQUEST:
      return {
        ...state,
        schedulingDrivers: [],
        driverFetchAdminLoader: true
      };
    case types.DRIVERS_LISTING_ADMIN_SUCCESS:
      return {
        ...state,
        schedulingDrivers: action.payload,
        driverFetchAdminLoader: false
      };
    case types.DRIVERS_LISTING_ADMIN_FAIL:
      return {
        ...state,
        schedulingDrivers: [],
        driverFetchAdminLoader: false
      };

    case types.GET_SCHEDULING_LIST_ADMIN_REQUEST:
      return {
        ...state,
        scheduleList: [],
        scheduleTripsLoader: true
      };
    case types.GET_SCHEDULING_LIST_ADMIN_SUCCESS:
      return {
        ...state,
        scheduleList: action.payload,
        scheduleTripsLoader: false
      };
    case types.GET_SCHEDULING_LIST_ADMIN_FAIL:
      return {
        ...state,
        scheduleList: [],
        scheduleTripsLoader: false
      };

    case types.SCHEDULE_RIDE_REQUEST:
      return {
        ...state,
        scheduleNewTripLoader: true
      };
    case types.SCHEDULE_RIDE:
      return {
        ...state,
        scheduleNewTripLoader: false
      };
    case types.SCHEDULE_RIDE_REQUEST_FAIL:
      return {
        ...state,
        scheduleNewTripLoader: false
      };

    default:
      return state;
  }
}
