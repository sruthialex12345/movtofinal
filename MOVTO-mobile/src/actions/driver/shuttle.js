import RestClient from "../../helpers/RestClient";
import { toastMessage } from "../../config/navigators";
import { serverError } from "../app";
import * as Types from "../../actionTypes/index";
import Constants from "../../constants";
import * as appActions from "../../actions";
import moment from "moment";

export const getDriverShuttle = navigator => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.SHUTTLE_LIST_REQUEST });
    RestClient.getCall("users/drivers/shuttles", accessToken)
      .then(res => {
        if (res.success) {
          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          dispatch({ type: Types.SHUTTLE_LIST, payload: res.data });
          dispatch({ type: Types.SHUTTLE_LIST_SUCESS });
        } else {
          dispatch({ type: Types.SHUTTLE_LIST_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.SHUTTLE_LIST_FAIL });
        serverError(navigator);
      });
  };
};

export const changeVechicle = (data, navigator) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    appActions.showProgressBar(navigator);
    RestClient.restCall("users/vehiclechange", data, accessToken, "POST")
      .then(res => {
        if (res.success) {
          appActions.dismissModalAnimated(navigator).then(() => {
            toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
            dispatch({ type: Types.SELECTED_SHUTTLE, payload: data.shuttle });
            setTimeout(() => {
              navigator.handleDeepLink({
                link: "Maps",
                payload: {
                  push: true
                }
              });
            }, 700);
          });
        } else {
          appActions.dismissModalAnimated(navigator).then(() => {
            toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
          });
        }
      })
      .catch(() => {
        appActions.dismissModalAnimated(navigator).then(() => {
          serverError(navigator);
        });
      });
  };
};
export const updateTripStatus = (data, navigator) => {
  // data={
  //   shuttle:{},
  //   tripId:"",
  //   status:true/false, shuttle status for updation
  //   driverId:""
  // }
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.TRIP_UPDATE_REQUEST });
    appActions.showProgressBar(navigator);
    RestClient.restCall(
      `v2/users/drivers/updateShuttleStatus?shuttleId=${data.shuttle._id}&driverId=${data.driverId}&activeStatus=${
        data.status
      }&id=${data.tripId}`,
      {},
      accessToken,
      "PUT"
    )
      .then(res => {
        if (res.success) {
          appActions.dismissModalAnimated(navigator).then(() => {
            dispatch({ type: Types.TRIP_UPDATE_REQUEST_SUCCESS });
            toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
            if (data.status) {
              dispatch({ type: Types.SELECTED_SHUTTLE, payload: data.shuttle });
              dispatch({ type: Types.UPDATE_TRIP_DATA, payload: res.data });
              setTimeout(() => {
                navigator.handleDeepLink({
                  link: "Maps",
                  payload: {
                    push: true
                  }
                });
              }, 700);
            } else {
              setTimeout(() => {
                navigator.handleDeepLink({
                  link: "SelectShuttle"
                });
              }, 100);

              dispatch({ type: Types.RESET_TRIP });
            }
          });
        } else {
          appActions.dismissModalAnimated(navigator).then(() => {
            dispatch({ type: Types.TRIP_UPDATE_REQUEST_FAIL });
            toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
          });
        }
      })
      .catch(() => {
        appActions.dismissModalAnimated(navigator).then(() => {
          dispatch({ type: Types.TRIP_UPDATE_REQUEST_FAIL });
          serverError(navigator);
        });
      });
  };
};

/**
 *
 * @param {*} navigator
 */
export const getRideRequests = navigator => {
  return (dispatch, getState) => {
    let { accessToken, userType } = getState().user;
    let { response } = getState().trip;
    let { currentTrip } = getState().listing;
    let terminalId = "";
    dispatch({ type: Types.RIDE_REQUEST_LIST_REQUEST });
    RestClient.getCall(
      `users/drivers/terminalRideRequests?tripId=${
        userType === Constants.AppConstants.UserTypes.Driver ? response._id : currentTrip
      }&terminalId=${terminalId}`,
      accessToken
    )
      .then(res => {
        if (res.success) {
          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          dispatch({ type: Types.RIDE_REQUEST_LIST, payload: res.data });
          dispatch({ type: Types.RIDE_REQUEST_LIST_SUCESS });
        } else {
          dispatch({ type: Types.RIDE_REQUEST_LIST_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.RIDE_REQUEST_LIST_FAIL });
        serverError(navigator);
      });
  };
};

export const getTripHistory = (page, navigator) => {
  return (dispatch, getState) => {
    let { accessToken, _id } = getState().user;
    if (page == 1) {
      dispatch({ type: "RESET_HISTORY" });
    }
    dispatch({ type: Types.TRIP_HISTORY_REQUEST });
    RestClient.getCall(`v1/users/drivers/driverHistory?id=${_id}&pageNo=${page}`, accessToken)
      .then(res => {
        if (res.success) {
          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          dispatch({ type: Types.TRIP_HISTORY, payload: res.data });
          dispatch({ type: Types.TRIP_HISTORY_REQUEST_SUCESS });
        } else {
          dispatch({ type: Types.TRIP_HISTORY_REQUEST_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.TRIP_HISTORY_REQUEST_FAIL });
        serverError(navigator);
      });
  };
};

export const getTerminalListing = (terminalId, navigator) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    let { response } = getState().trip;
    dispatch({ type: Types.TERMINAL_RIDE_REQUEST_LIST_REQUEST });
    RestClient.getCall(
      `users/drivers/terminalRideRequests?tripId=${response && response._id}&terminalId=${terminalId}`,
      accessToken
    )
      .then(res => {
        if (res.success) {
          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          dispatch({ type: Types.TERMINAL_RIDE_REQUEST_LIST, payload: res.data });
          dispatch({ type: Types.TERMINAL_RIDE_REQUEST_LIST_SUCESS });
        } else {
          dispatch({ type: Types.TERMINAL_RIDE_REQUEST_LIST_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.TERMINAL_RIDE_REQUEST_LIST_FAIL });
        serverError(navigator);
      });
  };
};
export const addPassangers = (postData, navigator) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.ADD_RIDER_REQUEST });
    RestClient.restCall("v1/users/location/driverAddRider", postData, accessToken)
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.ADD_RIDER_SUCCESS });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          navigator.resetTo({
            screen: "Maps"
          });
        } else {
          dispatch({ type: Types.ADD_RIDER_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.ADD_RIDER_FAIL });
        serverError(navigator);
      });
  };
};

//new add passengers

export const addPassangersDynamic = (postData, navigator) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    // dispatch({ type: Types.ADD_RIDER_REQUEST });
    appActions.showProgressBar(navigator);
    RestClient.restCall("v1/users/location/driverAddDynamicRider", postData, accessToken)
      .then(res => {
        // console.log("response from Add Passenfgers  DYNAMIC api=>>", res);
        appActions.dismissModalAnimated(navigator).then(() => {
          if (res.success) {
            dispatch({ type: Types.ADD_RIDER_SUCCESS });
            toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
            navigator.resetTo({
              screen: "Maps"
            });
          } else {
            dispatch({ type: Types.ADD_RIDER_FAIL });
            toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
          }
        });
      })
      .catch(() => {
        appActions.dismissModalAnimated(navigator).then(() => {
          dispatch({ type: Types.ADD_RIDER_FAIL });
          serverError(navigator);
        });
      });
  };
};

export const updateTripData = payload => {
  return dispatch => {
    dispatch({ type: Types.UPDATE_TRIP_DATA, payload });
  };
};
export const updateDriverMapRef = payload => {
  return dispatch => {
    dispatch({ type: Types.UPDATE_DRIVER_MAP_REF, payload });
  };
};
export const updateiOSAngle = payload => {
  return dispatch => {
    dispatch({ type: Types.UPDATE_IOS_ANGLE, payload });
  };
};

export const getScheduleListingDriver = navigator => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.GET_SCHEDULED_TRIPS_DRIVER_REQUEST });
    RestClient.getCall(
      `schedulerequests?fromDate=${getState().common.startDate == null ? "" : getState().common.startDate}&toDate=${
        getState().common.endDate == null ? "" : getState().common.endDate
      }&fromTime=${
        getState().common.startTime == null ? "" : moment(getState().common.startTime).format("HH:mm")
      }&toTime=${getState().common.endTime == null ? "" : moment(getState().common.endTime).format("HH:mm")}&status=${
        getState().common.status
      }&limit=30`,
      accessToken
    )
      .then(res => {
        if (res.success) {
          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
          dispatch({ type: Types.GET_SCHEDULED_TRIPS_DRIVER_SUCCESS, payload: res.data });
        } else {
          dispatch({ type: Types.GET_SCHEDULED_TRIPS_DRIVER_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.GET_SCHEDULED_TRIPS_DRIVER_FAIL });
        serverError(navigator);
      });
  };
};

export const acceptTripRequest = (data, navigator) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.ACCEPT_TRIP_REQUEST });
    RestClient.restCall("schedulerequests/accept", data, accessToken, "PUT")
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.ACCEPT_TRIP_REQUEST_SUCCESS, payload: res.data });
          dispatch(getScheduleListingDriver(navigator));
        } else {
          dispatch({ type: Types.ACCEPT_TRIP_REQUEST_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.ACCEPT_TRIP_REQUEST_FAIL });
        serverError(navigator);
      });
  };
};

export const rejectTripRequest = (data, navigator) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.REJECT_TRIP_REQUEST });
    RestClient.restCall("schedulerequests/reject", data, accessToken, "PUT")
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.REJECT_TRIP_REQUEST_SUCCESS, payload: res.data });
          dispatch(getScheduleListingDriver(navigator));
        } else {
          dispatch({ type: Types.REJECT_TRIP_REQUEST_FAIL });
          toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.REJECT_TRIP_REQUEST_FAIL });
        serverError(navigator);
      });
  };
};
