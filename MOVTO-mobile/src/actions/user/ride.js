import { Platform } from "react-native";
import RestClient from "../../helpers/RestClient";
import { serverError } from "../app";
import * as Types from "../../actionTypes/index";
import { toastMessage } from "../../config/navigators";
import Constants from "../../constants";
// import { requestTrip, riderCancelTripRequest } from "../../helpers/socket";
import UserSocket from "../../helpers/socket/rider";
import MapApi from "../../helpers/Maps";
import * as appActions from "../../actions";
import Event from "../../helpers/events";
export const setLocationType = (location, navigator, push = true, admin = "", sourceAdmin = {}, onSelectTerminal) => {
  return (dispatch, getState) => {
    let { userType, tripType } = getState().user;
    let { userProvider } = getState().riderLocation;
    let tripTypeToRedirect = null;
    dispatch({
      type: Types.PICKUP_POINT_REQUEST
    });
    dispatch({
      type: Types.RIDER_LOCATION_TYPE,
      payload: location
    });
    if (push) {
      if (userType == Constants.AppConstants.UserTypes.Driver || userType == Constants.AppConstants.UserTypes.Admin) {
        tripTypeToRedirect = tripType;
      } else {
        let { adminTripTypes } = userProvider;
        tripTypeToRedirect = (adminTripTypes && adminTripTypes.length && adminTripTypes[0]) || null;
      }
      let screen =
        tripTypeToRedirect == Constants.AppConstants.RouteType.Dynamic ? "RiderTerminalDynamic" : "RiderTerminal";

      navigator.push({
        screen,
        passProps: { admin, onSelectTerminal, sourceAdmin },
        animated: true,
        animationType: "slide-horizontal"
      });
    }
  };
};
export const cancleRide = navigator => {
  return () => {
    appActions.dismissModalAnimated(navigator).then(() => {
      UserSocket.riderCancelTripRequest();
    });
  };
};
export const GotoShuttlePage = navigator => {
  return dispatch => {
    appActions.dismissModalAnimated(navigator).then(() => {
      dispatch({ type: Types.RESET_RIDER_DATA });
      dispatch({ type: Types.RESET_RIDER_TRIP });
      Event.emit("cancelRide", { cancelRideFromRider: true });
    });
  };
};
export const setRiderLocation = (location, navigator) => {
  return (dispatch, getState) => {
    let { locationType } = getState().riderLocation;
    if (locationType == Constants.AppConstants.UserLocation.Source) {
      dispatch({
        type: Types.RIDER_SOURCE,
        payload: location
      });
    } else {
      dispatch({
        type: Types.RIDER_DESTINATION,
        payload: location
      });
      //#####################Following code to get cordinates of ride booking location###############//
      let { source } = getState().riderLocation;
      let sourceCord = {
        latitude: source.loc && source.loc[1],
        longitude: source.loc && source.loc[0]
      };
      let destinationCord = {
        latitude: location.loc && location.loc[1],
        longitude: location.loc && location.loc[0]
      };
      if (source.loc && location.loc) {
        MapApi.getRegionForCoordinates([sourceCord, destinationCord]).then(region =>
          dispatch({
            type: Types.UPDATE_REGION,
            payload: region
          })
        );
      }
      //#################################end of the region updation##################################//
    }
    if (location && location.loc) {
      navigator.pop();
    }
  };
};

export const updateRiders = (riders, navigator) => {
  return dispatch => {
    navigator.dismissModal({
      animationType: "slide-down"
    });
    dispatch({
      type: Types.RIDER_COUNT,
      payload: riders
    });
  };
};

export const updateCode = (code, navigator) => {
  return dispatch => {
    navigator.dismissModal({
      animationType: "slide-down"
    });
    dispatch({
      type: Types.CODE_IS,
      payload: code
    });
  };
};

export const updateRideTime = time => {
  return dispatch => {
    dispatch({
      type: Types.UPDATE_RIDE_TIME,
      payload: time
    });
  };
};

export const updateRideDetails = (reservationCode, navigator) => {
  return () => {
    UserSocket.requestTrip(reservationCode, navigator);
  };
};
export const getServiceProviders = (qry = "", navigator, callback) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({
      type: Types.PROVIDER_REQUEST
    });
    RestClient.getCall(`v1/users/admins?name=${qry}`, accessToken)
      .then(res => {
        if (res.success) {
          dispatch({
            type: Types.PROVIDERS,
            payload: res.data
          });
          dispatch({
            type: Types.PROVIDER_SUCESS
          });
          if (callback) {
            callback(res.data);
          }
        } else {
          dispatch({
            type: Types.PROVIDER_REQUEST_FAILS
          });

          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({
          type: Types.PROVIDER_REQUEST_FAILS
        });
        serverError(navigator);
      });
  };
};

export const setProvider = (provider, navigator, isSearch = false) => {
  return dispatch => {
    if (isSearch) {
      if (Platform.OS === "ios") {
        setTimeout(() => {
          navigator.dismissModal();
        }, 600);
        navigator.handleDeepLink({
          link: "DashBoard",
          payload: {
            push: true
          }
        });
      } else {
        setTimeout(() => {
          navigator.push({
            screen: "DashBoard",
            animated: true,
            animationType: "slide-horizontal"
          });
        }, 600);
        navigator.dismissModal();
      }
    } else {
      navigator.handleDeepLink({
        link: "DashBoard",
        payload: {
          push: true
        }
      });
    }
    dispatch({
      type: Types.USER_PROVIDER,
      payload: provider
    });
  };
};
export const getRiderPickupPoints = (qry = "", navigator, admin) => {
  return (dispatch, getState) => {
    let { accessToken, userType } = getState().user;
    let { userProvider } = getState().riderLocation;
    let REUEST_URL = null;
    if (userType == Constants.AppConstants.UserTypes.Driver) {
      REUEST_URL = `v1/users/location/driverCurrentFromTerminals?name=${qry}`;
    } else {
      REUEST_URL = `v1/users/location/fromterminals?adminId=${admin || userProvider._id}&name=${qry}`;
    }
    dispatch({
      type: Types.PICKUP_POINT_REQUEST
    });
    RestClient.getCall(REUEST_URL, accessToken)
      .then(res => {
        if (res.success) {
          dispatch({
            type: Types.PICKUP_POINT,
            payload: res.data.locations
          });
          dispatch({
            type: Types.PICKUP_POINT_SUCESS
          });
        } else {
          dispatch({
            type: Types.PICKUP_POINT_REQUEST_FAILS
          });
          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({
          type: Types.PICKUP_POINT_REQUEST_FAILS
        });
        serverError(navigator);
      });
  };
};

export const getRiderDropupPoints = (qry = "", navigator, admin, sourceAdmin) => {
  return (dispatch, getState) => {
    let { accessToken, userType } = getState().user;
    let { userProvider, source } = getState().riderLocation;
    let REUEST_URL = null;
    if (userType == Constants.AppConstants.UserTypes.Driver) {
      REUEST_URL = `v1/users/location/driverCurrentToTerminals?source=${
        admin ? sourceAdmin._id : source._id
      }&name=${qry}&sequenceNo=${sourceAdmin.sequenceNo}`;
    } else {
      REUEST_URL = `v1/users/location/toterminals?source=[${admin ? sourceAdmin.loc[0] : source.loc[0]},${
        admin ? sourceAdmin.loc[1] : source.loc[1]
      }]&adminId=${admin || userProvider._id}&name=${qry}&sequenceNo=${source.sequenceNo}`;
    }
    dispatch({
      type: Types.PICKUP_POINT_REQUEST
    });
    RestClient.getCall(REUEST_URL, accessToken)
      .then(res => {
        if (res.success) {
          dispatch({
            type: Types.PICKUP_POINT,
            payload: res.data.locations
          });
          dispatch({
            type: Types.PICKUP_POINT_SUCESS
          });
        } else {
          dispatch({
            type: Types.PICKUP_POINT_REQUEST_FAILS
          });
          // toastMessage(navigator, { type: Constants.AppConstants.Notificaitons.Error, message: res.message });
        }
      })
      .catch(() => {
        dispatch({
          type: Types.PICKUP_POINT_REQUEST_FAILS
        });
        serverError(navigator);
      });
  };
};

//check if rider has any active ride or not if yes return ride data
export const getRideData = (navigator, callback) => {
  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({
      type: Types.PROVIDER_REQUEST
    });
    RestClient.getCall("v1/users/ridernotificationrequests", accessToken)
      .then(res => {
        if (res.success) {
          dispatch({
            type: Types.UPDATE_TRIP,
            payload: res.data
          });
        }
        if (callback) {
          callback(res.data);
        }
      })
      .catch(() => {
        if (callback) {
          callback();
        }
        serverError(navigator);
      });
  };
};
export const resetTerminals = () => {
  return dispatch => {
    dispatch({
      type: Types.RESET_TERMINAL_LIST
    });
  };
};

export const goToHome = navigator => {
  return dispatch => {
    appActions.dismissModalAnimated(navigator).then(() => {
      dispatch({ type: Types.RESET_RIDER_DATA });
      dispatch({ type: Types.RESET_RIDER_TRIP });
      setTimeout(() => {
        navigator.handleDeepLink({ link: "RiderProviderListing" });
      }, 1000);
    });
  };
};

export const updateRegion = region => {
  return dispatch => {
    dispatch({
      type: Types.UPDATE_REGION,
      payload: region
    });
  };
};

//@GR - 05/06/2020 - New action created to update the user with shuttle provider id.
export const updateRideProvider = providerRoute => {
  return dispatch => {
    dispatch({
      type: Types.UPDATE_USER_PROVIDERID,
      payload: providerRoute
    });
  };
};

export const rateAndReview = (postData, navigator) => {
  // let example={
  //   reviewerId: "5baa2a790753f76deeadde5a",
  //    reviewToId: "5baa1208938c135acbb0130b",
  //     reviewToType: "admin",
  //     message: "Testing By RJ admin",
  //     rating: "3"};

  // in case of super admin reviewToId will be null

  return (dispatch, getState) => {
    let { accessToken } = getState().user;
    dispatch({
      type: Types.RIDER_RATE_REVIEW_REQUEST
    });
    appActions.showProgressBar(navigator);
    RestClient.restCall("users/addReview", postData, accessToken, "post")
      .then(res => {
        if (res.success) {
          dispatch({
            type: Types.RIDER_RATE_REVIEW,
            payload: res
          });
          dispatch({
            type: Types.RIDER_RATE_REVIEW_SUCESS
          });
          appActions.hideProgressBar(navigator);
          toastMessage(navigator, {
            type: Constants.AppConstants.Notificaitons.Success,
            message: res.message
          });
          if (postData.reviewToType === Constants.AppConstants.UserTypes.SuperAdmin) {
            setTimeout(() => {
              navigator.handleDeepLink({ link: "RiderProviderListing" });
              // navigator.handleDeepLink({
              //   link: "DashBoard",
              //   payload: {
              //     push: true
              //   }
              // });
            }, 1000);
          } else if (postData.reviewToType === Constants.AppConstants.UserTypes.Admin) {
            dispatch({ type: Types.SET_RATE_SCREEN, payload: Constants.AppConstants.RideStatus.RatingDriver });
            setTimeout(() => {
              navigator.push({
                screen: "RiderRateToDriver",
                animated: true,
                animationType: "slide-horizontal"
              });
            }, 1000);
          } else {
            setTimeout(() => {
              navigator.resetTo({
                screen: "RiderProviderListing",
                animated: true,
                animationType: "slide-horizontal"
              });
            }, 2000);
            dispatch({ type: Types.RESET_RIDER_DATA });
            dispatch({ type: Types.RESET_RIDER_TRIP });
            navigator.push({
              screen: "Thankyou",
              animated: true,
              animationType: "fade",
              passProps: {}
            });
          }
        } else {
          appActions.hideProgressBar(navigator);
          toastMessage(navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: res.message
          });
          dispatch({
            type: Types.RIDER_RATE_REVIEW_FAIL
          });
        }
      })
      .catch(() => {
        appActions.hideProgressBar(navigator);
        dispatch({
          type: Types.RIDER_RATE_REVIEW_FAIL
        });
        serverError(navigator);
      });
  };
};

export const thankyou = navigator => {
  return dispatch => {
    setTimeout(() => {
      navigator.resetTo({
        screen: "RiderProviderListing"
      });
    }, 2000);
    dispatch({ type: Types.RESET_RIDER_DATA });
    dispatch({ type: Types.RESET_RIDER_TRIP });
    navigator.push({
      screen: "Thankyou",
      animated: true,
      animationType: "fade",
      passProps: {}
    });
  };
};

export const riderRating = navigator => {
  return dispatch => {
    dispatch({ type: Types.SET_RATE_SCREEN, payload: Constants.AppConstants.RideStatus.RatingRide });
    navigator.push({
      screen: "RiderRating"
    });
  };
};

export const riderDriverRating = navigator => {
  return dispatch => {
    dispatch({ type: Types.SET_RATE_SCREEN, payload: Constants.AppConstants.RideStatus.RatingDriver });
    navigator.push({
      screen: "RiderRateToDriver"
    });
  };
};
export const clearLocationData = () => {
  return dispatch => {
    dispatch({ type: Types.RESET_LOCATION_DATA });
  };
};
