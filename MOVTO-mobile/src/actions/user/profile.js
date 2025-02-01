import RestClient from "../../helpers/RestClient";
import { serverError } from "../app";
import * as Types from "../../actionTypes/index";
import { toastMessage } from "../../config/navigators";
import Constants from "../../constants";
import * as appActions from "../../actions";
/*
Api for registeration of rider
*/

export const updateName = (postData, navigator) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.NAME_UPDATE_REQUEST });
    RestClient.restCall("users/name", postData, accessToken, "put")
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.UPDATE_NAME, payload: res.data.name });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          dispatch({ type: Types.NAME_UPDATE_REQUEST_SUCESS });
        } else {
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
          dispatch({ type: Types.NAME_UPDATE_REQUEST_FAIL });
        }
      })
      .catch(() => {
        dispatch({ type: Types.NAME_UPDATE_REQUEST_FAIL });
        serverError(navigator);
      });
  };
};

export const changePassword = (postData, navigator) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.CHANGE_PASSWORD_REQUEST });
    appActions.showProgressBar(navigator);
    RestClient.restCall("users/resetpassword", postData, accessToken)
      .then(res => {
        appActions.hideProgressBar(navigator);
        if (res.success) {
          dispatch({ type: Types.CHANGE_PASSWORD_SUCESS });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          navigator.pop();
        } else {
          dispatch({ type: Types.CHANGE_PASSWORD_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        appActions.hideProgressBar(navigator);
        dispatch({ type: Types.CHANGE_PASSWORD_FAIL });
        serverError(navigator);
        //  console.log(error);
      });
  };
};

export const updateProfileImage = (image, navigator) => {
  return (dispatch, getState) => {
    let data = {
      avtar: "base64," + image.data
    };
    let { accessToken } = getState().user;
    dispatch({ type: Types.PROFILE_IMAGE_REQUEST });
    RestClient.restCall("users/upload/local", data, accessToken, "PUT")
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.PROFILE_IMAGE_URL, payload: res.data.profileUrl });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          dispatch({ type: Types.PROFILE_IMAGE_SUCESS });
          navigator.pop();
        } else {
          dispatch({ type: Types.PROFILE_IMAGE_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.PROFILE_IMAGE_FAIL });
        serverError(navigator);
        //  console.log(error);
      });
  };
};
export const updateMobile = (postData, navigator) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.MOBILE_UPDATE_REQUEST });
    RestClient.restCall("users/mobile-phone", postData, accessToken, "put")
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.UPDATE_MOBILE, payload: postData });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          dispatch({ type: Types.MOBILE_UPDATE_REQUEST_SUCESS });
          navigator.push({
            screen: "OTPScreen",
            animated: true,
            animationType: "slide-horizontal",
            passProps: {}
          });
        } else {
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
          dispatch({ type: Types.MOBILE_UPDATE_REQUEST_FAIL });
        }
      })
      .catch(() => {
        dispatch({ type: Types.MOBILE_UPDATE_REQUEST_FAIL });
        serverError(navigator);
      });
  };
};

export const getRideHistory = (pageNo, navigator) => {
  return (dispatch, getState) => {
    let { _id, accessToken } = getState().user;
    if (pageNo === 1) {
      dispatch({ type: "RESET_HISTORY" });
    }
    dispatch({ type: Types.RIDER_RIDE_HISTORY_REQUEST });
    RestClient.getCall(`/users/rideHistory?id=${_id}&pageNo=${pageNo}`, accessToken)
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.RIDER_HISTORY, payload: res.data });
          dispatch({ type: Types.RIDER_RIDE_HISTORY_SUCESS });
        } else {
          dispatch({ type: Types.RIDER_RIDE_HISTORY_FAIL });
          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.PROVIDER_REQUEST_FAILS });
        serverError(navigator);
      });
  };
};

export const getUpcomingRides = navigator => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.UPCOMING_RIDE_REQUEST });
    RestClient.getCall("schedulerequests?limit=20", accessToken)
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.UPCOMING_RIDE, payload: res.data });
          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          //navigator.pop();
        } else {
          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
          dispatch({ type: Types.UPCOMING_REQUEST_FAIL });
        }
      })
      .catch(() => {
        dispatch({ type: Types.UPCOMING_REQUEST_FAIL });
        serverError(navigator);
      });
  };
};

export const scheduleRideRider = (postData, navigator) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.SCHEDULE_RIDE_REQUEST });
    RestClient.restCall("schedulerequests", postData, accessToken, "post")
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.SCHEDULE_RIDE, payload: res.data });
          dispatch(getUpcomingRides(navigator));
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          navigator.pop();
        } else {
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
          dispatch({ type: Types.SCHEDULE_RIDE_REQUEST_FAIL });
        }
      })
      .catch(() => {
        dispatch({ type: Types.SCHEDULE_RIDE_REQUEST_FAIL });
        serverError(navigator);
      });
  };
};

export const cancelRideRider = (data, navigator) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.CANCEL_TRIP_RIDER_REQUEST });
    RestClient.restCall("schedulerequests/cancel", data, accessToken, "PUT")
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.CANCEL_TRIP_RIDER_SUCCESS, payload: res.data });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          dispatch(getUpcomingRides(navigator));
          // navigator.pop();
        } else {
          dispatch({ type: Types.CANCEL_TRIP_RIDER_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.CANCEL_TRIP_RIDER_FAIL });
        serverError(navigator);
        //  console.log(error);
      });
  };
};
