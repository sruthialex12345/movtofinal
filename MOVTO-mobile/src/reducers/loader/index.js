/*
AuthorName : Parshant Nagpal
FileName: reducer.js
Description: Contains the reducer regarding the user
Date : 11 Sept 2018  
*/

import * as Types from "../../actionTypes";
const initialState = {
  signupLoader: false,
  loginLoader: false,
  logoutLoader: false,
  forgotLoader: false,
  otpLoader: false,
  changePasswordLoader: false,
  profileImage: false,
  username: false,
  mobileUpdate: false,
  accessCode: false,
  shuttleList: false,
  terminalLoder: false,
  providerList: false,
  riderHistory: false,
  updateTrip: false,
  rideRequests: false,
  tripLoader: false,
  ratingLoader: false,
  rideRequestLoader: false,
  //admin
  shuttleListing: false,
  driverListing: false,
  riderListing: false,
  cmsLoader: false,
  activeTrip: false,
  addPassangers: false,
  //user
  scheduleRide: false,
  upcomingRide: false,
  sendMessage: false,
  saveMessage: false
};

export default (loader = (state = initialState, action) => {
  switch (action.type) {
    /***************************common***************************/
    case Types.SIGNUP_REQUEST:
      return { ...state, signupLoader: true };
    case Types.SIGNUP_SUCESS:
      return { ...state, signupLoader: false };
    case Types.SIGNUP_FAIL:
      return { ...state, signupLoader: false };
    case Types.LOGIN_REQUEST:
      return { ...state, loginLoader: true };
    case Types.LOGIN_SUCESS:
      return { ...state, loginLoader: false };
    case Types.LOGIN_FAIL:
      return { ...state, loginLoader: false };
    case Types.LOGOUT_REQUEST:
      return { ...state, logoutLoader: true };
    case Types.LOGOUT_FAIL:
      return { ...state, logoutLoader: false };
    case Types.LOGOUT_SUCESS:
      return { ...state, logoutLoader: false };

    case Types.FORGOT_REQUEST:
      return { ...state, forgotLoader: true };
    case Types.FORGOT_SUCESS:
      return { ...state, forgotLoader: false };
    case Types.FORGOT_FAIL:
      return { ...state, forgotLoader: false };
    case Types.OTP_REQUEST:
      return { ...state, otpLoader: true };
    case Types.OTP_SUCESS:
      return { ...state, otpLoader: false };
    case Types.OTP_FAIL:
      return { ...state, otpLoader: false };
    case Types.CHANGE_PASSWORD_REQUEST:
      return { ...state, changePasswordLoader: true };
    case Types.CHANGE_PASSWORD_SUCESS:
      return { ...state, changePasswordLoader: false };
    case Types.CHANGE_PASSWORD_FAIL:
      return { ...state, changePasswordLoader: false };
    case Types.PROFILE_IMAGE_REQUEST:
      return { ...state, profileImage: true };
    case Types.PROFILE_IMAGE_SUCESS:
      return { ...state, profileImage: false };
    case Types.PROFILE_IMAGE_FAIL:
      return { ...state, profileImage: false };
    case Types.NAME_UPDATE_REQUEST:
      return { ...state, username: true };
    case Types.NAME_UPDATE_REQUEST_SUCESS:
      return { ...state, username: false };
    case Types.NAME_UPDATE_REQUEST_FAIL:
      return { ...state, username: false };
    case Types.MOBILE_UPDATE_REQUEST:
      return { ...state, mobileUpdate: true };
    case Types.MOBILE_UPDATE_REQUEST_SUCESS:
      return { ...state, mobileUpdate: false };
    case Types.MOBILE_UPDATE_REQUEST_FAIL:
      return { ...state, mobileUpdate: false };
    case Types.ACCESS_CODE_REQUEST:
      return { ...state, accessCode: true };
    case Types.ACCESS_CODE_SUCESS:
      return { ...state, accessCode: false };
    case Types.ACCESS_CODE_FAIL:
      return { ...state, accessCode: false };
    case Types.SHOW_CMS_LOADER:
      return { ...state, cmsLoader: true };
    case Types.HIDE_CMS_LOADER:
      return { ...state, cmsLoader: false };
    case Types.RIDER_RATE_REVIEW_REQUEST:
      return { ...state, ratingLoader: true };
    case Types.RIDER_RATE_REVIEW_SUCESS:
      return { ...state, ratingLoader: false };
    case Types.RIDER_RATE_REVIEW_FAIL:
      return { ...state, ratingLoader: false };
    /***************************user***************************/
    case Types.PICKUP_POINT_REQUEST:
      return { ...state, terminalLoder: true };
    case Types.PICKUP_POINT_SUCESS:
      return { ...state, terminalLoder: false };
    case Types.PICKUP_POINT_REQUEST_FAILS:
      return { ...state, terminalLoder: false };
    case Types.PROVIDER_REQUEST:
      return { ...state, providerList: true };
    case Types.PROVIDER_SUCESS:
      return { ...state, providerList: false };
    case Types.PROVIDER_REQUEST_FAILS:
      return { ...state, providerList: false };
    case Types.RIDER_RIDE_HISTORY_REQUEST:
      return { ...state, riderHistory: true };
    case Types.RIDER_RIDE_HISTORY_SUCESS:
      return { ...state, riderHistory: false };
    case Types.RIDER_RIDE_HISTORY_FAIL:
      return { ...state, riderHistory: false };
    //schedule Ride
    case Types.SCHEDULE_RIDE_REQUEST:
      return { ...state, scheduleRide: true };
    case Types.SCHEDULE_RIDE:
      return { ...state, scheduleRide: false };
    case Types.SCHEDULE_RIDE_REQUEST_FAIL:
      return { ...state, scheduleRide: false };
    //upcoming Rides
    case Types.UPCOMING_RIDE_REQUEST:
      return { ...state, upcomingRide: true };
    case Types.UPCOMING_RIDE:
      return { ...state, upcomingRide: false };
    case Types.UPCOMING_REQUEST_FAIL:
      return { ...state, upcomingRide: false };

    /***************************Driver***************************/
    case Types.SHUTTLE_LIST_REQUEST:
      return { ...state, shuttleList: true };
    case Types.SHUTTLE_LIST_SUCESS:
      return { ...state, shuttleList: false };
    case Types.SHUTTLE_LIST_FAIL:
      return { ...state, shuttleList: false };
    case Types.TRIP_UPDATE_REQUEST:
      return { ...state, updateTrip: true };
    case Types.TRIP_UPDATE_REQUEST_SUCCESS:
      return { ...state, updateTrip: false };
    case Types.TRIP_UPDATE_REQUEST_FAIL:
      return { ...state, updateTrip: false };
    case Types.RIDE_REQUEST_LIST_REQUEST:
      return { ...state, rideRequests: true };
    case Types.RIDE_REQUEST_LIST_SUCESS:
      return { ...state, rideRequests: false };
    case Types.RIDE_REQUEST_LIST_SUCESS:
      return { ...state, rideRequests: false };
    case Types.TRIP_UPDATE_REQUEST_FAIL:
      return { ...state, updateTrip: false };
    case Types.TRIP_HISTORY_REQUEST:
      return { ...state, tripLoader: true };
    case Types.TRIP_HISTORY_REQUEST_SUCESS:
      return { ...state, tripLoader: false };
    case Types.TRIP_HISTORY_REQUEST_FAIL:
      return { ...state, tripLoader: false };
    case Types.TERMINAL_RIDE_REQUEST_LIST_REQUEST:
      return { ...initialState, terminalList: true };
    case Types.TERMINAL_RIDE_REQUEST_LIST_SUCESS:
      return { ...initialState, terminalList: false };
    case Types.TERMINAL_RIDE_REQUEST_LIST_FAIL:
      return { ...initialState, terminalList: false };
    case Types.ADD_RIDER_REQUEST:
      return { ...state, terminalList: false };
    case Types.ADD_RIDER_SUCCESS:
      return { ...state, terminalList: false };
    case Types.ADD_RIDER_FAIL:
      return { ...state, terminalList: false };
    case Types.CLEAR_SESSION_REQUEST:
      return { ...state, clearSessionLoader: true };
    case Types.CLEAR_SESSION_SUCCESS:
      return { ...state, clearSessionLoader: false };
    case Types.CLEAR_SESSION_FAIL:
      return { ...state, clearSessionLoader: false };
    /***************************admin***************************/
    case Types.ADMIN_SHUTTLE_LISTING_REQUEST:
      return { ...initialState, shuttleListing: true };
    case Types.ADMIN_SHUTTLE_LISTING_SUCESS:
      return { ...initialState, shuttleListing: false };
    case Types.ADMIN_SHUTTLE_LISTING_FAIL:
      return { ...initialState, shuttleListing: false };
    case Types.ADMIN_DRIVER_LISTING_REQUEST:
      return { ...initialState, driverListing: true };
    case Types.ADMIN_DRIVER_LISTING_SUCESS:
      return { ...initialState, driverListing: false };
    case Types.ADMIN_DRIVER_LISTING_FAIL:
      return { ...initialState, driverListing: false };
    case Types.ADMIN_RIDER_LISTING_REQUEST:
      return { ...initialState, riderListing: true };
    case Types.ADMIN_RIDER_LISTING_SUCESS:
      return { ...initialState, riderListing: false };
    case Types.ADMIN_RIDER_LISTING_FAIL:
      return { ...initialState, riderListing: false };
    case Types.ADMIN_ACTIVE_TRIPS_REQUEST:
      return { ...initialState, activeTrip: true };
    case Types.ADMIN_ACTIVE_TRIPS_SUCCESS:
      return { ...initialState, activeTrip: false };
    case Types.ADMIN_ACTIVE_TRIPS_FAIL:
      return { ...initialState, activeTrip: false };
    case Types.RIDE_REQUEST:
      return { ...initialState, rideRequestLoader: true };
    case Types.RIDE_REQUEST_SUCESS:
      return { ...initialState, rideRequestLoader: false };
    case Types.RIDE_REQUEST_FAIL:
      return { ...initialState, rideRequestLoader: false };

    case Types.ADMIN_SEND_MESSAGE_REQUEST:
      return { ...initialState, sendMessage: true };
    case Types.ADMIN_SEND_MESSAGE_FAILED:
      return { ...initialState, sendMessage: false };
    case Types.ADMIN_SEND_MESSAGE_SUCCESS:
      return { ...initialState, sendMessage: false };
    case Types.ADMIN_SAVE_MESSAGE_REQUEST:
      return { ...initialState, saveMessage: true };
    case Types.ADMIN_SAVE_MESSAGE_FAILED:
      return { ...initialState, saveMessage: false };
    case Types.ADMIN_SAVE_MESSAGE_SUCCESS:
      return { ...initialState, saveMessage: false };

    default:
      return state;
  }
});
