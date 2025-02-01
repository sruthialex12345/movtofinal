import RestClient from "../../helpers/RestClient";
import { toastMessage } from "../../config/navigators";
import { changeAppRoot, serverError } from "../app";
import * as Types from "../../actionTypes/index";
import Constants from "../../constants";
// import { disconnectSocket } from "../../helpers/socket";
import UserSocket from "../../helpers/socket/rider";
import DriverSocket from "../../helpers/socket/driver";
import AdminSocket from "../../helpers/socket/admin";
import * as appActions from "../../actions";
/*
Api for registeration of rider
*/

export const registeration = (postData, navigator) => {
  return dispatch => {
    dispatch({ type: Types.SIGNUP_REQUEST });
    RestClient.restCall("users/register", postData)
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.SIGNUP_SUCESS });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          dispatch({ type: Types.SAVE_ACCESS_TOKEN, payload: res.data.jwtAccessToken });
          dispatch({ type: Types.SAVE_USER, payload: res.data.user });
          navigator.push({
            screen: "OTPScreen",
            animated: true,
            animationType: "slide-horizontal",
            passProps: { user: res.data.user }
          });
        } else {
          dispatch({ type: Types.SIGNUP_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.SIGNUP_FAIL });
        serverError(navigator);
      });
  };
};

export const signIn = (postData, navigator) => {
  return (dispatch, getState) => {
    dispatch({ type: Types.LOGIN_REQUEST });
    RestClient.restCall("auth/login", postData)
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.LOGIN_SUCESS });
          dispatch({ type: Types.SAVE_ACCESS_TOKEN, payload: res.data.jwtAccessToken });
          dispatch({ type: Types.SAVE_USER, payload: res.data.user });
          if (getState().user.mobileVerified) {
            dispatch(changeAppRoot("after-login"));
          } else {
            navigator.push({
              screen: "OTPScreen",
              animated: true,
              animationType: "slide-horizontal",
              passProps: {}
            });
          }
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

export const forgotPassword = (postData, navigator) => {
  return dispatch => {
    dispatch({ type: Types.FORGOT_REQUEST });
    RestClient.restCall("config/forgot", postData)
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.FORGOT_SUCESS });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          navigator.resetTo({
            screen: "LoginScreen",
            animated: true,
            animationType: "slide-horizontal",
            passProps: {}
          });
        } else {
          dispatch({ type: Types.FORGOT_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.FORGOT_FAIL });
        serverError(navigator);
      });
  };
};

export const verifyOTP = (postData, navigator) => {
  return (dispatch, getState) => {
    dispatch({ type: Types.OTP_REQUEST });
    RestClient.restCall("verify/mobile", postData, getState().user.accessToken)
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.OTP_SUCESS });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          dispatch({ type: Types.SAVE_USER, payload: res.data });
          setTimeout(() => {
            if (getState().app.root == "after-login") {
              navigator.popToRoot({
                animated: true,
                animationType: "fade"
              });
            } else {
              dispatch(changeAppRoot("after-login"));
            }
          }, 2000);
          navigator.push({
            screen: "OTPSucess",
            animated: true,
            animationType: "slide-horizontal",
            passProps: {}
          });
        } else {
          dispatch({ type: Types.OTP_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.OTP_FAIL });
        serverError(navigator);
      });
  };
};

export const resendOTP = (postData, navigator) => {
  return (dispatch, getState) => {
    dispatch({ type: Types.OTP_REQUEST });
    RestClient.restCall("users/resendOtp", postData, getState().user.accessToken)
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.OTP_SUCESS });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
        } else {
          dispatch({ type: Types.OTP_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.OTP_FAIL });
        serverError(navigator);
      });
  };
};
export const clearLogoutLoader = () => {
  return dispatch => {
    dispatch({ type: Types.LOGOUT_SUCESS });
  };
};
export const logout = navigator => {
  return (dispatch, getState) => {
    let { trip, user } = getState();
    let { accessToken, deviceToken, deviceType, userType } = user;
    let postData = { device: { token: deviceToken, type: deviceType } };
    dispatch({ type: Types.LOGOUT_REQUEST });
    appActions.showProgressBar(navigator);
    RestClient.restCall("auth/logout", postData, accessToken, "PUT")
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.LOGOUT_SUCESS });
          appActions.dismissModalAnimated(navigator).then(() => {
            if (userType === Constants.AppConstants.UserTypes.Admin) {
              AdminSocket.disconnectSocketAdmin();
            } else if (userType === Constants.AppConstants.UserTypes.Driver) {
              let { myShuttle } = trip;
              let { _id } = myShuttle;
              if (_id) {
                toastMessage(navigator, {
                  type: Constants.AppConstants.Notificaitons.Error,
                  message: "Please deactivate shuttle first"
                });
                return;
              }
              DriverSocket.disconnectSocket();
            } else {
              UserSocket.disconnectSocket();
            }
            dispatch({ type: Types.RESET_RIDER_DATA });
            dispatch({ type: Types.RESET_TRIP });
            dispatch({ type: Types.RESET_SHUTTLE });
            dispatch({ type: Types.RESET_TERMINAL_LISTING });
            dispatch({ type: Types.RESET_USER });
            dispatch({ type: Types.RESET_RIDER_TRIP });
            dispatch({ type: Types.RESET_APP });
          });
        } else {
          appActions.dismissModalAnimated(navigator).then(() => {
            toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
          });
        }
      })
      .catch(() => {
        appActions.dismissModalAnimated(navigator).then(() => {
          dispatch({ type: Types.LOGOUT_FAIL });
          serverError(navigator);
        });
      });

    // it will navigate to login screen and then other data will be clear
  };
};
export const updateNotificationsInfo = payload => {
  return dispatch => {
    dispatch({ type: Types.UPDATE_NOTIFICATIONS_INFO, payload: payload });
  };
};
export const ClearSession = (navigator, resMessage) => {
  toastMessage(navigator, {
    type: Constants.AppConstants.Notificaitons.Error,
    message: resMessage
  });
  return (dispatch, getState) => {
    let { user } = getState();
    let { userType } = user;
    if (userType === Constants.AppConstants.UserTypes.Admin) {
      AdminSocket.disconnectSocketAdmin();
    } else if (userType === Constants.AppConstants.UserTypes.Driver) {
      DriverSocket.disconnectSocket();
    } else {
      UserSocket.disconnectSocket();
    }
    dispatch({ type: Types.LOGOUT_SUCESS });
    dispatch({ type: Types.RESET_RIDER_DATA });
    dispatch({ type: Types.RESET_TRIP });
    dispatch({ type: Types.RESET_SHUTTLE });
    dispatch({ type: Types.RESET_TERMINAL_LISTING });
    dispatch({ type: Types.RESET_USER });
    dispatch({ type: Types.RESET_RIDER_TRIP });
    dispatch({ type: Types.RESET_APP });
    dispatch({ type: Types.LOGIN_FAIL });
  };
};
//Get CMS Content
export const getCMSContent = (uri, navigator, callback) => {
  return dispatch => {
    dispatch({ type: Types.SHOW_CMS_LOADER });
    RestClient.getCall(uri)
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.HIDE_CMS_LOADER });
          if (callback) {
            callback(res);
          }
        } else {
          dispatch({ type: Types.HIDE_CMS_LOADER });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.HIDE_CMS_LOADER });
        serverError(navigator);
      });
  };
};
