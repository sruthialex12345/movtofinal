import RestClient from "../../helpers/RestClient";
import { serverError } from "../app";
import * as Types from "../../actionTypes";
import { toastMessage } from "../../config/navigators";
import Constants from "../../constants";

export const getPreviousMessage = navigator => async (dispatch, getState) => {
  const { accessToken } = getState().user;
  dispatch({ type: Types.ADMIN_SEND_MESSAGE_REQUEST });
  try {
    const message = await RestClient.getCall("admin/getNotifyMessage", accessToken);
    if (message.success) {
      dispatch({ type: Types.ADMIN_SEND_MESSAGE, message: message.data });
      dispatch({ type: Types.ADMIN_SEND_MESSAGE_SUCCESS });
      return new Promise(res => res({ success: true }));
    } else {
      dispatch({ type: Types.ADMIN_SEND_MESSAGE_FAILED });
      serverError(navigator);
      return new Promise(res => res({ success: true }));
    }
  } catch (error) {
    dispatch({ type: Types.ADMIN_SEND_MESSAGE_FAILED });
    serverError(navigator);
    return new Promise(res => res({ success: true }));
  }
};

export const sendMessage = (navigator, postData) => async (dispatch, getState) => {
  const { accessToken } = getState().user;
  dispatch({ type: Types.ADMIN_SEND_MESSAGE_REQUEST });
  try {
    const message = await RestClient.restCall("admin/sendToCustomerMessage", postData, accessToken);
    if (message.success) {
      dispatch({ type: Types.ADMIN_SEND_MESSAGE_SUCCESS });
      toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: message.message });
    } else {
      dispatch({ type: Types.ADMIN_SEND_MESSAGE_FAILED });
      serverError(navigator);
    }
  } catch (error) {
    dispatch({ type: Types.ADMIN_SEND_MESSAGE_FAILED });
    serverError(navigator);
  }
};

export const saveMessage = (navigator, postData) => async (dispatch, getState) => {
  const { accessToken } = getState().user;
  dispatch({ type: Types.ADMIN_SAVE_MESSAGE_REQUEST });
  try {
    let url = postData._id ? "admin/updateToNotifyMessage" : "admin/saveToNotifyMessage";
    const message = await RestClient.restCall(url, postData, accessToken);
    if (message.success) {
      dispatch({ type: Types.ADMIN_SAVE_MESSAGE_SUCCESS });
      dispatch({ type: Types.ADMIN_SEND_MESSAGE, message: postData });
      toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: message.message });
    } else {
      dispatch({ type: Types.ADMIN_SAVE_MESSAGE_FAILED });
      serverError(navigator);
    }
  } catch (error) {
    dispatch({ type: Types.ADMIN_SAVE_MESSAGE_FAILED });
    serverError(navigator);
  }
};
