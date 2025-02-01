import RestClient from "../../helpers/RestClient";
import { toastMessage } from "../../config/navigators";
import { changeAppRoot, serverError } from "../app";
import * as Types from "../../actionTypes/index";
import Constants from "../../constants";

export const signInAdmin = (postData, navigator) => {
  return dispatch => {
    dispatch({ type: Types.LOGIN_REQUEST });
    RestClient.restCall("auth/loginadmin", postData)
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.LOGIN_SUCESS });
          dispatch({ type: Types.SAVE_ACCESS_TOKEN, payload: res.data.jwtAccessToken });
          dispatch({ type: Types.SAVE_USER, payload: res.data.user });

          dispatch(changeAppRoot("after-login-driver-admin"));
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

export const verifyAdminAccessCode = (postData, navigator) => {
  return (dispatch, getState) => {
    dispatch({ type: Types.ACCESS_CODE_REQUEST });
    RestClient.restCall("auth/logindriver/accesscode", postData, getState().user.accessToken)
      .then(res => {
        if (res.success) {
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          dispatch({ type: Types.ACCESS_CODE_SUCESS });
          navigator.setDrawerEnabled({
            side: "left",
            enabled: true
          });
          navigator.resetTo({
            screen: "AdminDashBoard",
            animated: true,
            animationType: "slide-horizontal",
            passProps: {}
          });
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
