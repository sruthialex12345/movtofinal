import RestClient from "../../helpers/RestClient";
import { Platform } from "react-native";
import { toastMessage } from "../../config/navigators";
import { serverError } from "../app";
import * as Types from "../../actionTypes/index";
import MapApi from "../../helpers/Maps";
import moment from "moment";
import Constants from "../../constants";
import * as appActions from "../../actions";
export const getShuttleListing = (pageNo, locationId, navigator) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    if (pageNo == 1) {
      dispatch({ type: Types.ADMIN_SHUTTLE_LISTING_RESET });
    }
    dispatch({ type: Types.ADMIN_SHUTTLE_LISTING_REQUEST });
    RestClient.getCall(`admin/mobile/vehicles?locationId=${locationId}&pageNo=${pageNo}&limit=20`, accessToken)
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.ADMIN_SHUTTLE_META, payload: res.data.meta });
          dispatch({
            type: Types.ADMIN_SHUTTLE_LIST,
            payload: res.data.shuttles
          });
          dispatch({ type: Types.ADMIN_SHUTTLE_LISTING_SUCESS });
        } else {
          dispatch({ type: Types.ADMIN_SHUTTLE_LISTING_FAIL });
          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.ADMIN_SHUTTLE_LISTING_FAIL });
        serverError(navigator);
      });
  };
};

export const getDriverListing = (pageNo, locationId, navigator) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.ADMIN_DRIVER_LISTING_REQUEST });
    RestClient.getCall(`v1/admin/mobile/drivers?locationId=${locationId}&pageNo=${pageNo}&limit=20`, accessToken)
      .then(res => {
        if (res.success) {
           dispatch({ type: Types.ADMIN_DRIVER_META, payload: res.data.meta });
          dispatch({
            type: Types.ADMIN_DRIVER_LIST,
            payload: res.data.drivers
          });
          dispatch({ type: Types.ADMIN_DRIVER_LISTING_SUCESS });
        } else {
          dispatch({ type: Types.ADMIN_DRIVER_LISTING_FAIL });
          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.ADMIN_DRIVER_LISTING_FAIL });
        //serverError(navigator);
      });
  };
};

export const updateFilters = (filters, navigator) => {
  return dispatch => {
    dispatch({ type: Types.UPDATE_FILTERS, payload: filters });

    navigator.pop();
  };
};

export const getRiderListing = (pageNo, parms, navigator) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.ADMIN_RIDER_LISTING_REQUEST });
    RestClient.restCall("v1/admin/mobile/rides", parms, accessToken, "PUT")
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.ADMIN_RIDER_LIST, payload: res.data.trips });
          dispatch({ type: Types.ADMIN_RIDER_META, payload: res.data.meta });
          dispatch({ type: Types.ADMIN_RIDER_LISTING_SUCESS });
        } else {
          dispatch({ type: Types.ADMIN_RIDER_LISTING_FAIL });
          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.ADMIN_RIDER_LISTING_FAIL });
        serverError(navigator);
      });
  };
};
/**
 *
 * @param {*} pageNo page no for rides
 * @param {*} locationId if required any location based active shuttles
 * @param {*} navigator navigator for perform navigation action
 */
export const ActiveTrips = (pageNo, locationId, navigator) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.ADMIN_ACTIVE_TRIPS_REQUEST });
    RestClient.getCall(`v1/admin/mobile/activetrips?locationId=${locationId}&pageNo=${pageNo}&limit=20`, accessToken)
      .then(res => {
        if (res.success) {
          let reg = [];
          dispatch({ type: Types.ADMIN_ACTIVE_TRIPS, payload: res.data });
          dispatch({ type: Types.ADMIN_ACTIVE_TRIPS_SUCCESS });
          res.data.length > 0 &&
            res.data.map(item => {
              if (item.gpsLoc) {
                reg.push({
                  longitude: item.gpsLoc[0],
                  latitude: item.gpsLoc[1]
                });
              }
            });
          if (reg.length > 0) {
            MapApi.getCenterCordinates(reg).then(region => {
              dispatch({ type: Types.UPDATE_REGION, payload: region });
            });
          }
        } else {
          dispatch({ type: Types.ADMIN_ACTIVE_TRIPS_FAIL });
          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.ADMIN_ACTIVE_TRIPS_FAIL });
        serverError(navigator);
      });
  };
};
/**
 *
 * @param {*} tripId
 * @param {*} navigator
 */
export const updateCurrentTrip = (tripId, navigator) => {
  return dispatch => {
    setTimeout(() => {
      if (Platform.OS == "ios") {
        navigator.handleDeepLink({
          link: "TripMap",
          payload: {
            push: true
          }
        });
      } else {
        navigator.push({
          screen: "TripMap"
        });
      }
    }, 500);
    dispatch({ type: Types.ADMIN_UPDATE_CURRENT_TRIP, payload: tripId });
    navigator.dismissModal();
  };
};

/**
 *
 */

export const getTripRoute = (navigator, callback) => {
  return (dispatch, getState) => {
    let { user, listing } = getState();
    let { accessToken, userType } = user;
    let { currentTrip } = listing;
    dispatch({ type: Types.ADMIN_CURRENT_TRIP_ROUTE_REQUEST });
    RestClient.getCall(`/v1/admin/trip/details/route?tripID=${currentTrip}`, accessToken)
      .then(res => {
        if (res.success) {
          if (userType == Constants.AppConstants.UserTypes.Admin) {
            (async () => {
              let formattedRoute = [];
              if (res.data.driverRoute.length) {
                formattedRoute = await MapApi.getFormattedLatLong(res.data.driverRoute);
              }
              let rideObj = {
                driverRoute: res.data.driverRoute,
                waypoints: formattedRoute
              };
              dispatch({ type: Types.UPDATE_TRIP_DATA, payload: rideObj });
              if (callback) {
                callback();
              }
            })();
          }

          dispatch({
            type: Types.ADMIN_CURRENT_TRIP_ROUTE,
            payload: res.data.driverRoute
          });
          dispatch({ type: Types.ADMIN_ACTIVE_TRIPS_SUCCESS });
        } else {
          dispatch({ type: Types.ADMIN_CURRENT_TRIP_ROUTE_FAIL });
          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.ADMIN_CURRENT_TRIP_ROUTE_FAIL });
        serverError(navigator);
      });
  };
};
/**
 *
 */
export const deactivateShuttle = (postData, navigator, callback) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    appActions.showProgressBar(navigator);
    RestClient.restCall("v1/admin/drivers/onlineOffline", postData, accessToken, "PUT")
      .then(res => {
        appActions.dismissModalAnimated(navigator).then(() => {
          if (res.success) {
            if (callback) {
              callback();
            }
          }
        });
      })
      .catch(() => {
        appActions.dismissModalAnimated(navigator).then(() => {
          dispatch({ type: Types.ADMIN_CURRENT_TRIP_ROUTE_FAIL });
          serverError(navigator);
        });
      });
  };
};

export const getDriversAdminScheduling = (navigator, searchText) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.DRIVERS_LISTING_ADMIN_REQUEST });
    RestClient.getCall(`schedulerequests/admin/drivers?name=${searchText}`, accessToken)
      .then(res => {
        if (res.success) {
          dispatch({
            type: Types.DRIVERS_LISTING_ADMIN_SUCCESS,
            payload: res.data
          });
          // dispatch({ type: Types.SHUTTLE_LIST_SUCESS });
        } else {
          dispatch({ type: Types.DRIVERS_LISTING_ADMIN_FAIL });
        }
      })
      .catch(() => {
        dispatch({ type: Types.DRIVERS_LISTING_ADMIN_FAIL });
        serverError(navigator);
      });
  };
};

export const getScheduledTrips = navigator => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.GET_SCHEDULING_LIST_ADMIN_REQUEST });
    RestClient.getCall(
      `schedulerequests?fromDate=${getState().common.startDate == null ? "" : getState().common.startDate}&toDate=${
        getState().common.endDate == null ? "" : getState().common.endDate
      }&fromTime=${
        getState().common.startTime == null ? "" : moment(getState().common.startTime).format("HH:mm")
      }&toTime=${getState().common.endTime == null ? "" : moment(getState().common.endTime).format("HH:mm")}&status=${
        getState().common.status
      }&limit=50`,
      accessToken
    )
      .then(res => {
        if (res.success) {
          dispatch({
            type: Types.GET_SCHEDULING_LIST_ADMIN_SUCCESS,
            payload: res.data
          });
        } else {
          dispatch({ type: Types.GET_SCHEDULING_LIST_ADMIN_FAIL });
        }
      })
      .catch(() => {
        dispatch({ type: Types.GET_SCHEDULING_LIST_ADMIN_FAIL });
        serverError(navigator);
      });
  };
};

export const assignDriver = (parms, navigator, cb) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.ASSIGN_DRIVER_REQUEST });
    RestClient.restCall("schedulerequests/assigndriver", parms, accessToken, "PUT")
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.ASSIGN_DRIVER_SUCCESS, payload: res.data });
          dispatch(getScheduledTrips(navigator));
          if (cb) {
            navigator.pop();
          }
          // dispatch({ type: Types.ADMIN_RIDER_META, payload: res.data.meta });
          // dispatch({ type: Types.ADMIN_RIDER_LISTING_SUCESS });
        } else {
          dispatch({ type: Types.ASSIGN_DRIVER_FAIL });
          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.ASSIGN_DRIVER_FAIL });
        serverError(navigator);
      });
  };
};

export const cancelTrip = (parms, navigator) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.CANCEL_TRIP_REQUEST });
    RestClient.restCall("schedulerequests/cancel", parms, accessToken, "PUT")
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.CANCEL_TRIP_SUCCESS, payload: res.data });
          dispatch(getScheduledTrips(navigator));
        } else {
          dispatch({ type: Types.CANCEL_TRIP_FAIL });
          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({ type: Types.CANCEL_TRIP_FAIL });
        serverError(navigator);
      });
  };
};

export const scheduleRide = (postData, navigator) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({ type: Types.SCHEDULE_RIDE_REQUEST });
    RestClient.restCall("schedulerequests", postData, accessToken, "post")
      .then(res => {
        if (res.success) {
          dispatch({ type: Types.SCHEDULE_RIDE, payload: postData });
          dispatch(getScheduledTrips(navigator));
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
