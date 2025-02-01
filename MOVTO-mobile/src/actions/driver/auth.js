import RestClient from "../../helpers/RestClient";
import { toastMessage } from "../../config/navigators";
import { changeAppRoot, serverError } from "../app";
import * as Types from "../../actionTypes/index";
import Constants from "../../constants";

export const signInDriver = (postData, navigator) => {
  return dispatch => {
    dispatch({ type: Types.LOGIN_REQUEST });
    RestClient.restCall("auth/logindriver", postData)
      .then(res => {
        if (res.success) {
          //response includes trip if any exist for driver
          let { user, shuttle, response, jwtAccessToken, driverRoute } = res.data;
          let { userType } = user;
          if (userType == Constants.AppConstants.UserTypes.Driver && response) {
            let tripdata = {
              response,
              driverRoute
            };
            dispatch({ type: Types.SELECTED_SHUTTLE, payload: shuttle });
            dispatch({ type: Types.UPDATE_TRIP_DATA, payload: tripdata });
          }
          dispatch({ type: Types.LOGIN_SUCESS });
          dispatch({ type: Types.SAVE_ACCESS_TOKEN, payload: jwtAccessToken });
          dispatch({ type: Types.SAVE_USER, payload: user });
          dispatch(changeAppRoot("after-login-driver-admin"));
          //dispatch(changeAppRoot("after-login-driver"));
        } else {
          dispatch({ type: Types.LOGIN_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.LOGIN_FAIL });
        serverError(navigator);
      });
  };
};

export const verifyDriverAccessCode = (postData, navigator) => {
  return (dispatch, getState) => {
    dispatch({ type: Types.ACCESS_CODE_REQUEST });
    let { trip } = getState();
    RestClient.restCall("auth/logindriver/accesscode", postData, getState().user.accessToken)
      .then(res => {
        if (res.success) {
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          // dispatch({ type: Types.SAVE_USER, payload: res.data });
          dispatch({ type: Types.ACCESS_CODE_SUCESS });
          navigator.setDrawerEnabled({
            side: "left",
            enabled: true
          });

          if (getState().user.userType == Constants.AppConstants.UserTypes.Driver) {
            if (trip.response && trip.response.activeStatus) {
              navigator.resetTo({
                screen: "Maps",
                animated: true,
                animationType: "slide-horizontal",
                passProps: {}
              });
            } else {
              navigator.resetTo({
                screen: "SelectShuttle",
                animated: true,
                animationType: "slide-horizontal",
                passProps: {}
              });
            }
          } else {
            alert("Under Development");
          }
        } else {
          dispatch({ type: Types.ACCESS_CODE_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.ACCESS_CODE_FAIL });
        serverError(navigator);
      });
  };
};

export const clearSession = (clearSessionData, navigator) => {
  // let { email, password, accessCode } = clearSessionData;
  // const {userType, ...sessionData} =  clearSessionData;
  return (dispatch, getState) => {
    dispatch({ type: Types.CLEAR_SESSION_REQUEST });
    RestClient.restCall("auth/clearSession", clearSessionData, getState().user.accessToken)
      .then(res => {
        if (res.success) {
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          dispatch({ type: Types.CLEAR_SESSION_SUCCESS });
          let { user, shuttle, response, jwtAccessToken, driverRoute } = res.data;
          let { userType } = user;
          if (userType == Constants.AppConstants.UserTypes.Driver && response) {
            let tripdata = {
              response,
              driverRoute
            };
            dispatch({ type: Types.SELECTED_SHUTTLE, payload: shuttle });
            dispatch({ type: Types.UPDATE_TRIP_DATA, payload: tripdata });
          }
          dispatch({ type: Types.LOGIN_SUCESS });
          dispatch({ type: Types.SAVE_ACCESS_TOKEN, payload: jwtAccessToken });
          dispatch({ type: Types.SAVE_USER, payload: user });
          dispatch(changeAppRoot("after-login-driver-admin"));
        } else {
          dispatch({ type: Types.CLEAR_SESSION_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.CLEAR_SESSION_FAIL });
        serverError(navigator);
      });
  };
};
