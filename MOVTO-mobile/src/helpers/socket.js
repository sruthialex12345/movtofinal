/*Socket common file */
/* eslint-disable */
"use strict";
import { Alert } from "react-native";
import { Navigator } from "react-native-navigation";
import _ from "lodash";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";

import { storeObj } from "../store/setup";
import Connection from "../config/Connection";
import * as Types from "../actionTypes";
import * as actions from "../actions";
import { toastMessage, toastNotification } from "../config/navigators";
import Constants from "../constants";
import { getRegionForCoordinates } from "./Maps";
const io = require("socket.io-client");
// import { logOutUser } from "../actions/common/signin";
// import { setCurrentMap } from "../components/rider/rootMapView";
// import { socketDisconnected, syncDataAsync, nearByDriversList } from "../actions/rider/home";
// import { tripRequestUpdated, tripUpdated, driverLocationUpdated } from "../actions/rider/rideBooked";
// import "../UserAgent";

//store.dispatch(updateCart(response));

class UserSocket {
  socket = null;
  navigator = null;
  isConnected = false;
  socketError = "Client/Server connection lost ";

  static socketInit() {
    const { dispatch, getState } = storeObj.store;
    if (!this.socket) {
      console.log("Intializing socket");
      this.socket = io(Connection.getBaseUrl(), {
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
          getRegionForCoordinates([region]).then(region => {
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

      /****************************************************Rider*********************************/

      //handling no driver found on request ride
      this.socket.on("noDriverOnRequestRide", res => {
        try {
          console.log("noDriverOnRequestRide", res);
          setTimeout(() => {
            this.navigator.showModal({
              animationType: "slide-up",
              screen: "RiderNoShuttle",
              navigatorStyle: {
                statusBarColor: "transparent",
                navBarHidden: true,
                screenBackgroundColor: "transparent",
                modalPresentationStyle: "overFullScreen"
              }
            });
          }, 500);
          this.navigator.dismissModal();
          toastNotification(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: res.message
          });
        } catch (e) {
          console.log("error in on");
        }
      });

      /****************************************************Rider*********************************/

      // handling ride request sent successfully
      this.socket.on("rideRequestSentToDriver", res => {
        if (res.success) {
          dispatch({
            type: Types.UPDATE_TRIP,
            payload: res.data
          });
          // this.navigator.showModal({
          //   screen: "RideRequestConfrim",
          // navigatorStyle: {
          //   statusBarColor: "transparent",
          //   navBarHidden: true,
          //   screenBackgroundColor: "transparent",
          //   modalPresentationStyle: "overFullScreen"
          // }
          // });
        } else {
          toastMessage(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: res.message
          });
        }
        console.log("rideRequestSentToDriver", res);
      });

      this.socket.on("requestCancelledRider", res => {
        console.log("requestCancelledRider", res);
        if (res.success) {
          setTimeout(() => {
            dispatch({
              type: Types.RESET_RIDER_DATA
            });
            dispatch({
              type: Types.RESET_RIDER_TRIP
            });
            this.navigator.handleDeepLink({
              link: "RiderProviderListing",
              payload: {
                resetTo: true
              }
            });
          }, 500);
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

      /*Event fired when driver accept request/all for terminal/ all for trip request*/
      this.socket.on("requestAcceptedRider", res => {
        console.log("requestAcceptedRider", res);

        if (res.success) {
          let { riderTrip } = getState();
          let userTripData = { ...riderTrip };
          if (userTripData) {
            userTripData.tripRequestStatus = Constants.AppConstants.RideStatus.Accepted;
            // console.log("USER trip data--------->", userTripData);
            dispatch({ type: Types.UPDATE_TRIP, payload: userTripData });
            dispatch({ type: Types.SAVE_RIDER_DRIVER, payload: res.data.driver });
            dispatch({ type: Types.SAVE_RIDER_SHUTTLE, payload: res.data.shuttle });
          }
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

      this.socket.on("requestRejectedRider", res => {
        console.log("requestRejectedRider", res);
        let { meta } = getState().trip;
        if (res.success) {
          setTimeout(() => {
            this.navigator.showModal({
              animationType: "slide-up",
              screen: "RiderNoShuttle",
              navigatorStyle: {
                statusBarColor: "transparent",
                navBarHidden: true,
                screenBackgroundColor: "transparent",
                modalPresentationStyle: "overFullScreen"
              }
            });
          }, 500);
          this.navigator.dismissModal();
          toastNotification(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: res.message
          });
        } else {
          toastMessage(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: res.message
          });
        }
      });

      /* event fired for rider when shuttle location updated to server */
      this.socket.on("tripLocationUpdatedRider_v1", res => {
        try {
          console.log("tripLocationUpdatedRider_v1", res);
          let { riderTrip } = getState();
          let { destLoc, srcLoc, isRecentAccepted, tripRequestStatus } = riderTrip;
          let source = { latitude: srcLoc.loc && srcLoc.loc[1], longitude: srcLoc.loc && srcLoc.loc[0] };
          let destination = { latitude: destLoc.loc && destLoc.loc[1], longitude: destLoc.loc && destLoc.loc[0] };
          if (res.success) {
            let { region } = res.data;
            dispatch({ type: Types.UPDATE_SHUTTLE_LOCATION, payload: region });
            if (tripRequestStatus === Constants.AppConstants.RideStatus.Accepted && !isRecentAccepted) {
              console.log("accepteed");
              getRegionForCoordinates([region, source, destination]).then(reg => {
                dispatch({ type: Types.UPDATE_REGION, payload: reg });
                dispatch({ type: Types.UPDATE_RECENT_UPDATE, payload: true });
              });
            }
            if (tripRequestStatus === Constants.AppConstants.RideStatus.EnRoute && !isRecentAccepted) {
              console.log("enrouted");
              getRegionForCoordinates([source, destination]).then(reg => {
                dispatch({ type: Types.UPDATE_REGION, payload: reg });
                dispatch({ type: Types.UPDATE_RECENT_UPDATE, payload: true });
              });
            }
          }
        } catch (e) {
          console.log("error in updating shuttle location :tripLocationUpdatedRider_v1", e);
        }
      });

      /* event fired when ride is completed for a rider */
      this.socket.on("requestCompletedRider", res => {
        console.log("requestCompletedRider", res);
        if (res.success) {
          let { riderTrip } = getState();
          let userTripData = { ...riderTrip };
          if (userTripData) {
            userTripData.tripRequestStatus = Constants.AppConstants.RideStatus.Completed;
            // console.log("USER trip data--------->", userTripData);
            dispatch({ type: Types.UPDATE_TRIP, payload: userTripData });
          }

          toastNotification(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Success,
            message: res.message
          });

          this.navigator.dismissModal();
        } else {
          toastNotification(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: res.message
          });
        }
      });

      /* event fired when all rider inside shuttle after pressing continue ride button*/
      this.socket.on("requestEnrouted", res => {
        console.log("requestEnrouted", res);
        if (res.success) {
          let { riderTrip } = getState();
          let userTripData = { ...riderTrip };
          if (userTripData) {
            userTripData.tripRequestStatus = Constants.AppConstants.RideStatus.EnRoute;
            // console.log("USER trip data--------->", userTripData);
            dispatch({ type: Types.UPDATE_TRIP, payload: userTripData });
            dispatch({ type: Types.UPDATE_RECENT_UPDATE, payload: false });
          }
          toastNotification(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Success,
            message: res.message
          });
          this.navigator.dismissModal();
        } else {
          toastNotification(this.navigator, {
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
          console.log(meta, "meta here===", typeof meta.newRequestsCount);
          meta.newRequestsCount++;
          console.log(meta, "meta here===");
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
        let { trip } = getState();
        let meta = { ...trip.meta };
        let rides = [...trip.rides];
        if (res.success) {
          let index = _.findIndex(rides, {
            _id: res.data._id
          });
          if (index != -1) {
            if (rides[index].tripRequestStatus === Constants.AppConstants.RideStatus.Request) {
              meta.newRequestsCount--;
            }
            rides[index] = res.data;
            dispatch({
              type: Types.UPDATE_RIDES_META,
              payload: meta.newRequestsCount
            });
            dispatch({
              type: Types.REMOVE_RIDES,
              payload: rides
            });
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
        let { trip } = getState();
        let meta = { ...trip.meta };
        let rides = [...trip.rides];
        if (res.success) {
          let index = _.findIndex(rides, {
            _id: res.data._id
          });
          if (index != -1) {
            if (rides[index].tripRequestStatus === Constants.AppConstants.RideStatus.Request) {
              meta.newRequestsCount--;
            }
            rides[index] = res.data;
            dispatch({
              type: Types.UPDATE_RIDES_META,
              payload: meta.newRequestsCount
            });
            dispatch({
              type: Types.REMOVE_RIDES,
              payload: rides
            });
          }
        } else {
          toastMessage(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: res.message
          });
        }
      });

      /*Event fired to driver when driver rejects any request*/

      this.socket.on("requestRejectedDriver", res => {
        console.log("requestRejectedDriver,", res);
        let { trip } = getState();
        let meta = { ...trip.meta };
        let rides = [...trip.rides];
        if (res.success) {
          let index = _.findIndex(rides, {
            _id: res.data._id
          });
          if (index !== -1) {
            if (rides[index].tripRequestStatus === Constants.AppConstants.RideStatus.Request) {
              meta.newRequestsCount--;
            }
            rides[index] = res.data;
            dispatch({
              type: Types.UPDATE_RIDES_META,
              payload: meta.newRequestsCount
            });
            dispatch({
              type: Types.REMOVE_RIDES,
              payload: rides
            });
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
      this.socket.on("tripLocationUpdatedDriver_v1", res => {
        console.log("tripLocationUpdatedDriver_v1", res);
      });

      /* event fired event fired if terminal has requests as source */
      this.socket.on("completedTerminalRequests_v1", res => {
        console.log("completedTerminalRequests_v1", res);
        let currentTerminal = {
          _id: res.data.terminal,
          isContinueModal: false,
          isCompleteModal: false
        };
        if (res.success) {
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
      this.socket.on("completeTripOnTerminal_v1", res => {
        console.log("completeTripOnTerminal_v1", res);
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

  static updateLocation(payload) {
    if (isConnected) {
      const { getState } = storeObj.store;
      let { user } = getState();
      let { _id, userType } = user;
      let gpsLoc = [payload.longitude, payload.latitude];
      let payload = {
        userType,
        _id,
        gpsLoc
      };
      this.socket.emit("updateLocation", payload);
    }
  }

  /****************************************************Rider*********************************/

  static requestTrip() {
    if (this.isConnected) {
      const { getState } = storeObj.store;
      let { user, riderLocation } = getState();
      let { source, destination, time, person } = riderLocation;
      let { _id } = user;

      let payload = {
        rider: {
          _id: _id
        },
        request: {
          sourceLoc: source._id,
          destLoc: destination._id,
          seats: person
          // time: time
        }
      };
      console.log("requestTrip", JSON.stringify(payload));
      this.socket.emit("requestTrip", payload);
    } else {
      alert(this.socketError);
    }
  }

  static riderCancelTripRequest() {
    if (this.isConnected) {
      const { getState } = storeObj.store;
      let { riderTrip } = getState();
      let { driverId, riderId, _id } = riderTrip;
      let payload = {
        tripRequestID: _id,
        riderID: riderId
      };
      console.log("riderCancelTripRequest", JSON.stringify(payload));
      this.socket.emit("riderCancelTripRequest", payload);
    } else {
      alert(this.socketError);
    }
  }

  /****************************************************driver*********************************/
  /**
   * @param tripRequestID is ride id going to accept
   */
  static driverAcceptTripRequest(tripRequestID) {
    if (this.isConnected) {
      const { getState } = storeObj.store;
      const { response } = getState().trip;
      let payload = {
        tripRequestID,
        tripID: response && response._id,
        driverID: response && response.driverId
      };
      console.log("driverAcceptTripRequest", JSON.stringify(payload));
      this.socket.emit("driverAcceptTripRequest", payload);
    } else {
      alert(this.socketError);
    }
  }

  /**
   * @param tripRequestID is ride id going to reject
   */
  static driverRejectTripRequest(tripRequestID) {
    if (this.isConnected) {
      const { getState } = storeObj.store;
      const { response } = getState().trip;
      let payload = {
        tripRequestID,
        tripID: response && response._id,
        driverID: response && response.driverId
      };
      console.log("driverRejectTripRequest", JSON.stringify(payload));
      this.socket.emit("driverRejectTripRequest", payload);
    } else {
      alert(this.socketError);
    }
  }

  //*All Requests accepted by the driver  *//
  /**
   *
   * @param {*} terminalID is ride id going to acceptOnTerminal
   */
  static acceptAllTripRequests(terminalID) {
    if (this.isConnected) {
      const { getState } = storeObj.store;
      const { response } = getState().trip;
      let payload = {
        terminalID,
        tripID: response && response._id,
        driverID: response && response.driverId
      };
      console.log("acceptAllTripRequests", JSON.stringify(payload));
      this.socket.emit("acceptAllTripRequests", payload);
    } else {
      alert(this.socketError);
    }
  }

  //Driver will fire current location of the shuttle to the server
  static updateTripLocation = location => {
    if (this.isConnected) {
      const { dispatch, getState } = storeObj.store;
      const { user, trip } = getState();
      const { response } = trip;
      console.log("updating location");
      if (response && response._id) {
        let { latitude, longitude } = location;
        //updating shuttle location in the reducer in the driver trip
        dispatch({ type: Types.UPDATE_REGION, payload: location });
        let payload = {
          driverId: user._id,
          gpsLoc: [longitude, latitude],
          region: location
        };
        console.log("updateTripLocation_v1", JSON.stringify(payload));
        this.socket.emit("updateTripLocation_v1", payload);
      }
    }
  };

  /* event emit when driver press complete trip request event */
  static completeRides() {
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
      alert(this.socketError);
    }
  }

  /* event emit when driver press continue ride trip request event */
  static continueRides() {
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
      alert(this.socketError);
    }
  }
  /****************************************************Admin*********************************/
}

reactMixin(UserSocket.prototype, TimerMixin);

export default UserSocket;
