/*Socket common file */
/* eslint-disable */
"use strict";
import { Alert } from "react-native";
import { Navigator } from "react-native-navigation";
import _ from "lodash";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";

import { connect } from "react-redux";
import { bindActionCreators } from "redux";
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
import Event from "../../events";
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
        dispatch({
          type: Types.SET_SOCKET,
          payload: (this.socket && this.socket.id) || null
        });
      });

      this.socket.on("disconnect", res => {
        console.log("Socket disconnected", this.socket, res);
        this.isConnected = this.socket.connected;
        dispatch({
          type: Types.SET_SOCKET,
          payload: (this.socket && this.socket.id) || null
        });
      });

      // socket.on("reconnect", () => {
      //   isConnected=true;
      //   dispatch({ type: Types.SET_SOCKET, payload: (socket && socket.id) || null });
      //   console.log("Re-connected");
      // });

      this.socket.on("unauthorizedToken", () => {
        actions.hideProgressBar(this.navigator);
        dispatch({ type: Types.RIDE_REQUEST_FAIL });
        //  dispatch(logOutUser());
      });
      this.socket.on("socketError", e => {
        console.log("socket error,", e);
        dispatch({ type: Types.RIDE_REQUEST_FAIL });
        actions.dismissModalAnimated(this.navigator).then(() => {
          toastMessage(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: e.message
          });
          // if(e.code && e.code==504){
          //   console.log("code erroe");
          //   Event.emit("BackToDashboard");
          // }
        });
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
          MapApi.getRegionForCoordinates([region]).then(region => {
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
        dispatch({ type: Types.RIDE_REQUEST_FAIL });
        actions.dismissModalAnimated(this.navigator).then(() => {
          try {
            console.log("noDriverOnRequestRide", res);
            dispatch({ type: Types.REJECT_MESSAGE, payload: res.message });
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
            }, 700);
          } catch (e) {
            console.log("error in on");
          }
        });
      });

      /****************************************************Rider*********************************/

      // handling ride request sent successfully
      this.socket.on("rideRequestSentToDriver", res => {
        actions.dismissModalAnimated(this.navigator).then(() => {
          dispatch({ type: Types.RIDE_REQUEST_SUCESS });
          if (res.success) {
            dispatch({
              type: Types.UPDATE_TRIP,
              payload: res.data
            });
            Event.emit("BackToDashboard");
          } else {
            toastMessage(this.navigator, {
              type: Constants.AppConstants.Notificaitons.Error,
              message: res.message
            });
          }
          console.log("rideRequestSentToDriver", res);
        });
      });

      this.socket.on("requestCancelledRider", res => {
        console.log("requestCancelledRider", res);
        if (res.success) {
          actions.dismissModalAnimated(this.navigator).then(() => {
            dispatch({
              type: Types.RESET_RIDER_DATA
            });
            dispatch({
              type: Types.RESET_RIDER_TRIP
            });
            toastNotification(this.navigator, {
              type: Constants.AppConstants.Notificaitons.Error,
              message: res.message
            });
            Event.emit("cancelRide", { cancelRideFromRider: true });
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
            dispatch({ type: Types.UPDATE_TRIP, payload: userTripData });
            dispatch({
              type: Types.SAVE_RIDER_DRIVER,
              payload: res.data.driver
            });
            dispatch({
              type: Types.SAVE_RIDER_SHUTTLE,
              payload: res.data.shuttle
            });
            dispatch({ type: Types.UPDATE_ETA, payload: res.data.ETA });
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
          this.navigator.dismissModal();
          // toastNotification(this.navigator, {
          //   type: Constants.AppConstants.Notificaitons.Error,
          //   message: res.message
          // });
          dispatch({ type: Types.REJECT_MESSAGE, payload: res.message });
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
          }, 700);
        } else {
          toastMessage(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: res.message
          });
        }
      });

      /* event fired for rider when shuttle location updated to server */
      this.socket.on("tripLocationUpdatedRider", res => {
        try {
          console.log("tripLocationUpdatedRider", res);
          let { riderTrip } = getState();
          let { destLoc, srcLoc, isRecentAccepted, tripRequestStatus } = riderTrip;
          let source = {
            latitude: srcLoc.loc && srcLoc.loc[1],
            longitude: srcLoc.loc && srcLoc.loc[0]
          };
          let destination = {
            latitude: destLoc.loc && destLoc.loc[1],
            longitude: destLoc.loc && destLoc.loc[0]
          };
          if (res.success) {
            let { region } = res.data;
            dispatch({ type: Types.UPDATE_SHUTTLE_LOCATION, payload: region });
            if (tripRequestStatus === Constants.AppConstants.RideStatus.Accepted && !isRecentAccepted) {
              console.log("accepteed");
              MapApi.getRegionForCoordinates([region, source, destination]).then(reg => {
                dispatch({ type: Types.UPDATE_REGION, payload: reg });
                dispatch({ type: Types.UPDATE_RECENT_UPDATE, payload: true });
              });
            }
            if (tripRequestStatus === Constants.AppConstants.RideStatus.EnRoute && !isRecentAccepted) {
              console.log("enrouted");
              MapApi.getRegionForCoordinates([source, destination]).then(reg => {
                dispatch({ type: Types.UPDATE_REGION, payload: reg });
                dispatch({ type: Types.UPDATE_RECENT_UPDATE, payload: true });
              });
            }
          }
        } catch (e) {
          console.log("error in updating shuttle location :tripLocationUpdatedRider", e);
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
      //request transfer event
      this.socket.on("requestTransferredRider", res => {
        dispatch(
          actions.getRideData(this.navigator, () => {
            toastNotification(this.navigator, {
              type: Constants.AppConstants.Notificaitons.Success,
              message: res.message
            });
          })
        );
        console.log("requestTransferredRider", res);
      });
      this.socket.on("vehicleChangedRider", res => {
        dispatch(
          actions.getRideData(this.navigator, () => {
            toastNotification(this.navigator, {
              type: Constants.AppConstants.Notificaitons.Success,
              message: res.message
            });
          })
        );
        console.log("vehicleChangedRider", res);
      });
      this.socket.on("updatedETA", res => {
        console.log("updatedETA", res);
        if (res.success) {
          dispatch({ type: Types.UPDATE_ETA, payload: res.data.eta });
        }
      });

      /* Will be called when Driver will accept or reject the trip request*/

      this.socket.on("scheduleReqUpdatedRider", res => {
        console.log("scheduleReqUpdatedRider", res);
        if (res.success) {
          Dialog(res.message, [{ text: "Ok", style: "cancel" }]);
          dispatch(actions.getUpcomingRides(this.navigator));
        }
      });

      this.socket.on("scheduledTripNotification", res => {
        console.log("scheduledTripNotification", res);
        if (res.success) {
          Dialog(res.message, [{ text: "Ok", style: "cancel" }]);
        }
      });

      /* Will be called when Driver will be assigned to a riders trip*/

      this.socket.on("driverAssignedRequestRider", res => {
        console.log("driverAssignedRequestRider", res);
        if (res.success) {
          Dialog(res.message, [{ text: "Ok", style: "cancel" }]);
          dispatch(actions.getUpcomingRides(this.navigator));
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
  static disconnectSocket() {
    if (this.isConnected) {
      console.log("disconnecting socket");
      this.socket.disconnect();
      this.socket = null;
    }
  }

  static updateLocation(payload) {
    if (this.isConnected) {
      const { getState } = storeObj.store;
      let { user } = getState();
      let { _id, userType } = user;
      let gpsLoc = [payload.longitude, payload.latitude];
      let _payload = {
        userType,
        _id,
        gpsLoc
      };
      this.socket.emit("updateLocation", _payload);
    }
  }

  /****************************************************Rider*********************************/

  static async requestTrip(reservationCode) {
    let isInternetConnected = await RestClient.isInternetConnected();
    if (isInternetConnected) {
      if (this.isConnected) {
        const { getState, dispatch } = storeObj.store;
        let { user, riderLocation } = getState();
        let { source, destination, time, person, userProvider } = riderLocation;
        let { adminTripTypes } = userProvider;
        let adminId = userProvider._id;
        let tripType = (adminTripTypes.length && adminTripTypes[0]) || null;
        let { _id } = user;
        let request = {};
        //if dynamic then use following request format
        actions.showProgressBar(this.navigator);
        dispatch({ type: Types.RIDE_REQUEST });
        if (tripType == Constants.AppConstants.RouteType.Dynamic) {
          request = {
            adminId,
            sourceLoc: source,
            destLoc: destination,
            seats: person,
            tripType,
            reservationCode
            // time: time
          };
          console.log("request-------->", request);
        } else {
          request = {
            adminId,
            sourceLoc: source._id,
            destLoc: destination._id,
            seats: person,
            tripType,
            reservationCode
            // time: time
          };
        }

        let payload = {
          rider: {
            _id: _id
          },
          request
        };
        console.log("requestTrip_v2", JSON.stringify(payload));
        this.socket.emit("requestTrip_v2", payload);
      } else {
        this.socketConnectionError();
      }
    } else {
      this.internetError();
    }
  }

  static async riderCancelTripRequest() {
    let isInternetConnected = await RestClient.isInternetConnected();
    if (isInternetConnected) {
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
        this.socketConnectionError();
      }
    } else {
      this.internetError();
    }
  }
}

reactMixin(UserSocket.prototype, TimerMixin);

const mapDispatchToProps = dispatch => ({
  appActions: bindActionCreators(appActions, dispatch)
});
function mapStateToProps(state) {
  return {
    user: state.user
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserSocket);
