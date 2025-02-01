/*Socket common file */
/* eslint-disable */
"use strict";
import { Alert } from "react-native";
import { Navigator } from "react-native-navigation";
import _ from "lodash";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";

import { storeObj } from "../../../store/setup";
import Connection from "../../../config/Connection";
import * as Types from "../../../actionTypes";
import * as actions from "../../../actions";
import { toastMessage, toastNotification } from "../../../config/navigators";
import Constants from "../../../constants";
import MapApi from "../../Maps";
import { Dialog } from "../../common";
import RestClient from "../../RestClient";
const io = require("socket.io-client");

// import { logOutUser } from "../actions/common/signin";
// import { setCurrentMap } from "../components/rider/rootMapView";
// import { socketDisconnected, syncDataAsync, nearByDriversList } from "../actions/rider/home";
// import { tripRequestUpdated, tripUpdated, driverLocationUpdated } from "../actions/rider/rideBooked";
// import "../UserAgent";

//store.dispatch(updateCart(response));

class DriverSocket {
  socket = null;
  navigator = null;
  isConnected = false;
  socketError = "Client/Server connection lost ";

  static socketInit() {
    const { dispatch, getState } = storeObj.store;
    if (!this.socket) {
      console.log("Intializing socket");
      this.socket = io(Connection.getSocketUrl(), {
        jsonp: false,
        transports: ["websocket"],
        query: `token=${getState().user.accessToken}`
      });
      // this.navigator = new Navigator();

      /****************************************************Soket Listining Events*********************************/

      /****************************************************Common*********************************/

      this.socket.on("connect", res => {
        console.log("Socket connected", this.socket, res);
        this.isConnected = this.socket.connected;
        dispatch({ type: Types.SET_SOCKET, payload: (this.socket && this.socket.id) || null });
      });

      this.socket.on("disconnect", res => {
        console.log("Socket disconnected", this.socket, res);
        this.isConnected = this.socket.connected;
        dispatch({ type: Types.SET_SOCKET, payload: (this.socket && this.socket.id) || null });
      });

      // socket.on("reconnect", () => {
      //   isConnected=true;
      //   dispatch({ type: Types.SET_SOCKET, payload: (socket && socket.id) || null });
      //   console.log("Re-connected");
      // });

      this.socket.on("unauthorizedToken", () => {
        //  dispatch(logOutUser());
      });
      this.socket.on("socketError", e => {
        console.log("socket error,", e);
        toastMessage(this.navigator, {
          type: Constants.AppConstants.Notificaitons.Error,
          message: e.message
        });
        // Alert.alert(e);
      });

      this.socket.on("locationUpdated", res => {
        console.log("locationUpdated", res);
        if (res.success) {
          dispatch({
            type: Types.UPDATE_GPS_LOCATION,
            payload: res.data.gpsLoc
          });
          let region = {
            latitude: res.data && res.data.gpsLoc && res.data.gpsLoc[1],
            longitude: res.data && res.data.gpsLoc && res.data.gpsLoc[0]
          };
          MapApi.getCenterCordinates([region]).then(region => {
            dispatch({
              type: Types.UPDATE_REGION,
              payload: region
            });
          });
          // toastNotification(this.navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
        } else {
          toastMessage(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: res.message
          });
        }
      });

      /****************************************************driver*********************************/

      this.socket.on("requestDriver", res => {
        let meta = { ...getState().trip.meta };
        console.log("requestDriver", res);
        if (res.success) {
          meta.newRequestsCount++;
          toastNotification(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Success,
            message: res.message
          });
          dispatch({
            type: Types.UPDATE_RIDES_META,
            payload: meta.newRequestsCount
          });
          dispatch({
            type: Types.UPDATE_RIDES,
            payload: res.data
          });
        } else {
          toastMessage(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: res.message
          });
        }
      });

      this.socket.on("requestCancelledDriver", res => {
        console.log("requestCancelledDriver", res);
        let { trip, user } = getState();
        let meta = { ...trip.meta };
        let rides = [...trip.rides];
        let { userType, tripType } = user;
        let { currentTerminal } = trip;
        if (res.success) {
          if (
            userType == Constants.AppConstants.UserTypes.Driver &&
            tripType == Constants.AppConstants.RouteType.Dynamic
          ) {
            (async () => {
              let formattedRoute = [];
              if (res.data.driverRoute.length) {
                formattedRoute = await MapApi.getFormattedLatLong(res.data.driverRoute);
              }
              let rideObj = { driverRoute: res.data.driverRoute, waypoints: formattedRoute };
              dispatch({ type: Types.UPDATE_TRIP_DATA, payload: rideObj });
            })();
          }
          toastMessage(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: res.message
          });
          let index = _.findIndex(rides, {
            _id: res.data.ride._id
          });
          if (index != -1) {
            if (rides[index].tripRequestStatus === Constants.AppConstants.RideStatus.Request) {
              meta.newRequestsCount--;
            }
            rides[index] = res.data.ride;
            dispatch({
              type: Types.UPDATE_RIDES_META,
              payload: meta.newRequestsCount
            });
            dispatch({
              type: Types.REMOVE_RIDES,
              payload: rides
            });
          }
          //following code to hide continue button if there is only one request and rider cancle
          //it after continue button get displayed

          if (currentTerminal && currentTerminal._id) {
            if (currentTerminal.isContinueModal) {
              //check if contiue button is enabled
              let terminalRide = [];
              rides.map(item => {
                if (
                  item.srcLoc &&
                  item.srcLoc._id === currentTerminal._id &&
                  item.tripRequestStatus === Constants.AppConstants.RideStatus.Accepted
                ) {
                  terminalRide.push(item);
                }
              });
              if (terminalRide.length == 0) {
                //if there is only one ride and rider reject it hide continue button
                let currentTerminalPayload = {
                  _id: res.data.terminal,
                  isContinueModal: false,
                  isCompleteModal: false
                };
                dispatch({ type: Types.UPDATE_CURRENT_TERMINAL, payload: currentTerminalPayload });
                this.navigator.dismissAllModals();
              }
            }
          }
        } else {
          toastMessage(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: res.message
          });
        }
      });

      this.socket.on("requestAcceptedDriver", res => {
        console.log("requestAcceptedDriver,", res);
        let { trip, user } = getState();
        let meta = { ...trip.meta };
        let rides = [...trip.rides];
        let { userType, tripType } = user;
        try {
          if (res.success) {
            let index = _.findIndex(rides, {
              _id: res.data.ride._id
            });

            if (index != -1) {
              if (rides[index].tripRequestStatus === Constants.AppConstants.RideStatus.Request) {
                meta.newRequestsCount--;
              }
              rides[index] = res.data.ride;
              dispatch({
                type: Types.UPDATE_RIDES_META,
                payload: meta.newRequestsCount
              });
              dispatch({
                type: Types.REMOVE_RIDES,
                payload: rides
              });
              if (
                userType == Constants.AppConstants.UserTypes.Driver &&
                tripType == Constants.AppConstants.RouteType.Dynamic
              ) {
                (async () => {
                  let formattedRoute = await MapApi.getFormattedLatLong(res.data.driverRoute);
                  let rideObj = { driverRoute: res.data.driverRoute, waypoints: formattedRoute };
                  dispatch({ type: Types.UPDATE_TRIP_DATA, payload: rideObj });
                })();
              }
            }
          } else {
            toastMessage(this.navigator, {
              type: Constants.AppConstants.Notificaitons.Error,
              message: res.message
            });
          }
        } catch (e) {
          console.log(e);
        }
      });

      /*Event fired to driver when driver rejects any request*/

      this.socket.on("requestRejectedDriver", res => {
        console.log("requestRejectedDriver,", res);
        let { trip, user } = getState();
        let meta = { ...trip.meta };
        let rides = [...trip.rides];
        let { userType, tripType } = user;
        let { currentTerminal } = trip;

        if (res.success) {
          if (
            userType == Constants.AppConstants.UserTypes.Driver &&
            tripType == Constants.AppConstants.RouteType.Dynamic
          ) {
            (async () => {
              let formattedRoute = [];
              if (res.data.driverRoute.length) {
                formattedRoute = await MapApi.getFormattedLatLong(res.data.driverRoute);
              }
              let rideObj = { driverRoute: res.data.driverRoute, waypoints: formattedRoute };
              dispatch({ type: Types.UPDATE_TRIP_DATA, payload: rideObj });
            })();
          }

          let index = _.findIndex(rides, {
            _id: res.data.ride._id
          });
          if (index !== -1) {
            if (rides[index].tripRequestStatus === Constants.AppConstants.RideStatus.Request) {
              meta.newRequestsCount--;
            }
            rides[index] = res.data.ride;
            dispatch({
              type: Types.UPDATE_RIDES_META,
              payload: meta.newRequestsCount
            });
            dispatch({
              type: Types.REMOVE_RIDES,
              payload: rides
            });
          }

          //following code to hide continue button if there is only one request and driver reject
          //it after continue button get displayed

          if (currentTerminal && currentTerminal._id) {
            if (currentTerminal.isContinueModal) {
              //check if contiue button is enabled
              let terminalRide = [];
              rides.map(item => {
                if (
                  item.srcLoc &&
                  item.srcLoc._id === currentTerminal._id &&
                  item.tripRequestStatus === Constants.AppConstants.RideStatus.Accepted
                ) {
                  terminalRide.push(item);
                }
              });
              if (terminalRide.length == 0) {
                //if there is only one ride and rider reject it hide continue button
                let currentTerminalPayload = {
                  _id: res.data.terminal,
                  isContinueModal: false,
                  isCompleteModal: false
                };
                dispatch({ type: Types.UPDATE_CURRENT_TERMINAL, payload: currentTerminalPayload });
                this.navigator.dismissAllModals();
              }
            }
          }
        } else {
          toastMessage(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: res.message
          });
        }
      });

      /*Event fired when driver accept all/terminal all request*/
      /*Fired to the driver */
      this.socket.on("acceptedAllTripRequests", res => {
        console.log("acceptedAllTripRequests", res);
        let { user } = getState();
        let { userType, tripType } = user;
        if (
          userType == Constants.AppConstants.UserTypes.Driver &&
          tripType == Constants.AppConstants.RouteType.Dynamic
        ) {
          (async () => {
            let formattedRoute = await MapApi.getFormattedLatLong(res.data.driverRoute);
            let rideObj = { driverRoute: res.data.driverRoute, waypoints: formattedRoute };
            dispatch({ type: Types.UPDATE_TRIP_DATA, payload: rideObj });
          })();
        }

        if (res.success) {
          setTimeout(() => {
            dispatch(actions.getRideRequests(this.navigator));
          }, 500);
          this.navigator.dismissModal();
        } else {
          toastMessage(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: res.message
          });
        }
      });

      /* event fired when shuttle location updated to server */
      this.socket.on("tripLocationUpdatedDriver", res => {
        console.log("tripLocationUpdatedDriver", res);
      });

      /* event fired event fired if terminal has requests as source */
      this.socket.on("completedTerminalRequests", res => {
        console.log("completedTerminalRequests", res);

        if (res.success) {
          let { user } = getState();
          let { userType, tripType } = user;
          let currentTerminal = {
            _id: res.data.terminal,
            isContinueModal: false,
            isCompleteModal: false
          };
          if (
            userType == Constants.AppConstants.UserTypes.Driver &&
            tripType == Constants.AppConstants.RouteType.Dynamic
          ) {
            (async () => {
              let formattedRoute = [];
              if (res.data.driverRoute.length) {
                formattedRoute = await MapApi.getFormattedLatLong(res.data.driverRoute);
              }
              let rideObj = { driverRoute: res.data.driverRoute, waypoints: formattedRoute };
              dispatch({ type: Types.UPDATE_TRIP_DATA, payload: rideObj });
            })();
          }
          setTimeout(() => {
            if (res.data.newRequestsToEnroute) {
              currentTerminal = {
                _id: res.data.terminal,
                isContinueModal: true,
                isCompleteModal: false
              };
            }
            dispatch({ type: Types.UPDATE_CURRENT_TERMINAL, payload: currentTerminal });
          }, 500);
          this.navigator.dismissAllModals();
        }
      });

      /* event fired when all riders picked from the terminal */
      this.socket.on("enroutedTerminalRequests", res => {
        let { trip } = getState();
        let currentTerminal = { ...trip.currentTerminal };
        console.log("enroutedTerminalRequests", res);
        if (res.success) {
          setTimeout(() => {
            dispatch(actions.getRideRequests(this.navigator));
          }, 500);
          currentTerminal.isContinueModal = false;
          dispatch({ type: Types.UPDATE_CURRENT_TERMINAL, payload: currentTerminal });
          this.navigator.dismissModal();
          toastNotification(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Success,
            message: res.message
          });
        } else {
          toastNotification(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: res.message
          });
        }
      });

      /* event fired if terminal has requests as destination*/
      this.socket.on("completeTripOnTerminal", res => {
        console.log("completeTripOnTerminal", res);
        if (res.success) {
          this.navigator.dismissAllModals();
          let currentTerminal = {
            _id: res.data._id,
            isContinueModal: false,
            isCompleteModal: true
          };
          dispatch({ type: Types.UPDATE_CURRENT_TERMINAL, payload: currentTerminal });
          toastNotification(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Success,
            message: res.message
          });
        } else {
          toastNotification(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: res.message
          });
        }
      });
      //request transfer event
      this.socket.on("requestTransferredDriver", res => {
        if (res.success) {
          let { user } = getState();
          let { userType, tripType } = user;
          if (
            userType == Constants.AppConstants.UserTypes.Driver &&
            tripType == Constants.AppConstants.RouteType.Dynamic
          ) {
            (async () => {
              let formattedRoute = [];
              if (res.data.driverRoute.length) {
                formattedRoute = await MapApi.getFormattedLatLong(res.data.driverRoute);
              }
              let rideObj = { driverRoute: res.data.driverRoute, waypoints: formattedRoute };
              dispatch({ type: Types.UPDATE_TRIP_DATA, payload: rideObj });
            })();
          }
          dispatch(actions.getRideRequests(this.navigator));
          toastNotification(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Success,
            message: res.message
          });
          console.log("requestTransferredDriver", res);
        }
      });
      //driver deactivated by admin
      this.socket.on("driverDeactivate", res => {
        if (res.success) {
          console.log("driverDeactivate", res);
          dispatch(actions.ClearSession(this.navigator, res.message));
        }
      });

      /* event fired when Driver is assigned to a particular trip */
      this.socket.on("requestAssignedDriver", res => {
        console.log("requestAssignedDriver", res);
        if (res.success) {
          Dialog(res.message, [{ text: "Ok", style: "cancel" }]);
          dispatch(actions.getScheduleListingDriver(this.navigator));
        }
      });

      /* event fired before an hour of schedule time */

      this.socket.on("scheduledTripNotification", res => {
        console.log("scheduledTripNotification", res);
        if (res.success) {
          Dialog(res.message, [{ text: "Ok", style: "cancel" }]);
        }
      });

      /* Event will be triggered just assure that trip is active*/

      this.socket.on("noActiveTrip", res => {
        console.log("noActiveTrip", res);
        if (res.success) {
          Dialog(res.message, [{ text: "Ok", style: "cancel" }]);
        }
      });

      /* Event will be triggered to update the schedule list at driver end*/

      this.socket.on("scheduleReqUpdatedDriver", res => {
        console.log("scheduleReqUpdatedDriver", res);
        if (res.success) {
          Dialog(res.message, [{ text: "Ok", style: "cancel" }]);
          dispatch(actions.getScheduleListingDriver(this.navigator));
        }
      });
    }
    if (!this.navigator) {
      this.navigator = new Navigator();
      // dispatch({ type: Types.SET_NAVIGATOR, payload: this.navigator });
    }
  }

  /****************************************************Emit Events*********************************/

  /****************************************************Common*********************************/
  static disconnectSocket() {
    if (this.isConnected) {
      console.log("disconnecting socket");
      this.socket.disconnect();
      this.socket = null;
    }
  }
  static internetError() {
    toastMessage(this.navigator, {
      type: Constants.AppConstants.Notificaitons.Error,
      message: Constants.Strings.Common.noInternet
    });
  }
  static socketConnectionError() {
    toastMessage(this.navigator, {
      type: Constants.AppConstants.Notificaitons.Error,
      message: Constants.Strings.Common.socketDisconnected
    });
  }

  static updateLocation(region) {
    if (this.isConnected) {
      const { getState } = storeObj.store;
      let { user } = getState();
      let { _id, userType } = user;
      let gpsLoc = [region.longitude, region.latitude];
      let payload = {
        userType,
        _id,
        gpsLoc
      };
      this.socket.emit("updateLocation", payload);
    }
  }

  /****************************************************driver*********************************/
  /**
   * @param tripRequestID is ride id going to accept
   */
  static async driverAcceptTripRequest(tripRequestID) {
    let isInternetConnected = await RestClient.isInternetConnected();
    if (isInternetConnected) {
      if (this.isConnected) {
        const { getState } = storeObj.store;
        const { response } = getState().trip;
        let payload = {
          tripRequestID,
          tripID: response && response._id,
          driverID: response && response.driver && response.driver._id
        };
        console.log("driverAcceptTripRequest", JSON.stringify(payload));
        this.socket.emit("driverAcceptTripRequest", payload);
      } else {
        this.socketConnectionError();
      }
    } else {
      this.internetError();
    }
  }

  /**
   * @param tripRequestID is ride id going to reject
   */
  static async driverRejectTripRequest(tripRequestID) {
    let isInternetConnected = await RestClient.isInternetConnected();
    if (isInternetConnected) {
      if (this.isConnected) {
        const { getState } = storeObj.store;
        const { response } = getState().trip;
        let payload = {
          tripRequestID,
          tripID: response && response._id,
          driverID: response && response.driver && response.driver._id
        };
        console.log("driverRejectTripRequest_v1", JSON.stringify(payload));
        this.socket.emit("driverRejectTripRequest_v1", payload);
      } else {
        this.socketConnectionError();
      }
    } else {
      this.internetError();
    }
  }

  //*All Requests accepted by the driver  *//
  /**
   *
   * @param {*} terminalID is ride id going to acceptOnTerminal
   */
  static async acceptAllTripRequests(terminalID) {
    let isInternetConnected = await RestClient.isInternetConnected();
    if (isInternetConnected) {
      if (this.isConnected) {
        const { getState } = storeObj.store;
        const { response } = getState().trip;
        let payload = {
          terminalID,
          tripID: response && response._id,
          driverID: response && response.driver && response.driver._id
        };
        console.log("acceptAllTripRequests", JSON.stringify(payload));
        this.socket.emit("acceptAllTripRequests", payload);
      } else {
        this.socketConnectionError();
      }
    } else {
      this.internetError();
    }
  }

  //Driver will fire current location of the shuttle to the server
  static updateTripLocation(location) {
    const { dispatch, getState } = storeObj.store;
    dispatch({ type: Types.UPDATE_REGION, payload: location });
    if (this.isConnected) {
      const { user, trip } = getState();
      const { response } = trip;
      console.log("updating location");
      if (response && response._id) {
        let { latitude, longitude } = location;
        //updating shuttle location in the reducer in the driver trip
        let payload = {
          driverId: user._id,
          gpsLoc: [longitude, latitude],
          region: location
        };
        console.log("updateTripLocation_v1", JSON.stringify(payload));
        this.socket.emit("updateTripLocation_v1", payload);
      }
    }
  }

  /* event emit when driver press complete trip request event */
  static async completeRides() {
    let isInternetConnected = await RestClient.isInternetConnected();
    if (isInternetConnected) {
      if (this.isConnected) {
        const { getState } = storeObj.store;
        const { user, trip } = getState();
        const { response, currentTerminal } = trip;
        let payload = {
          driverID: user._id,
          tripID: response._id,
          terminalID: currentTerminal._id
        };
        console.log("completeTripRequestsTerminal", JSON.stringify(payload));
        this.socket.emit("completeTripRequestsTerm", payload);
      } else {
        this.socketConnectionError();
      }
    } else {
      this.internetError();
    }
  }

  /* event emit when driver press continue ride trip request event */
  static async continueRides() {
    let isInternetConnected = await RestClient.isInternetConnected();
    if (isInternetConnected) {
      if (this.isConnected) {
        const { getState } = storeObj.store;
        const { user, trip } = getState();
        const { response, currentTerminal } = trip;
        let payload = {
          driverID: user._id,
          tripID: response._id,
          terminalID: currentTerminal._id
        };
        console.log("enrouteTripRequestsTerminal", JSON.stringify(payload));
        this.socket.emit("enrouteTripRequestsTerm", payload);
      } else {
        this.socketConnectionError();
      }
    } else {
      this.internetError();
    }
  }
  /****************************************************Admin*********************************/
}

reactMixin(DriverSocket.prototype, TimerMixin);

export default DriverSocket;
