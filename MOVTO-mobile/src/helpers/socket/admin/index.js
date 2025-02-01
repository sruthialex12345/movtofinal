/*Socket common file */
/* eslint-disable */
import { Alert } from "react-native";
import { Navigator } from "react-native-navigation";
import _ from "lodash";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";

import { storeObj } from "../../../store/setup";
import Connection from "../../../config/Connection";
import * as Types from "../../../actionTypes";
import * as actions from "../../../actions";
import { Dialog } from "../../common";
import { toastMessage, toastNotification } from "../../../config/navigators";
import Constants from "../../../constants";
import MapApi from "../../Maps";

const io = require("socket.io-client");

class AdminSocket {
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

      this.socket.on("unauthorizedToken", () => {
        //  dispatch(logOutUser());
      });
      this.socket.on("socketError", e => {
        console.log("socket error,", e);
        toastMessage(this.navigator, {
          type: Constants.AppConstants.Notificaitons.Error,
          message: e.message
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
          // toastNotification(navigator, { type: Constants.AppConstants.Notificaitons.Success, message: res.message });
        } else {
          toastMessage(this.navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: res.message
          });
        }
      });

      /*********************************Admin************************************************************/
      /**
     
      /**
       * event triggred when driver recived request
       */
      this.socket.on("tripLocationUpdatedAdmin", res => {
        console.log("tripLocationUpdatedAdmin", res);
        let { listing } = getState();
        let activeTrips = [...listing.activeTrips];
        reg = [];
        if (res.success) {
          let index = _.findIndex(activeTrips, {
            _id: res.data._id
          });
          if (index > -1) {
            activeTrips[index] = res.data;
            activeTrips.map(trip => {
              if (trip.gpsLoc) reg.push({ longitude: trip.gpsLoc[0], latitude: trip.gpsLoc[1] });
            });
          }
          MapApi.getCenterCordinates(reg).then(region => {
            dispatch({ type: Types.ADMIN_ACTIVE_TRIPS, payload: activeTrips });
            dispatch({ type: Types.UPDATE_REGION, payload: region });
          });
        }
      });

      this.socket.on("tripCreated", res => {
        console.log("tripCreated", res);
        let { listing } = getState();
        let activeTrips = [...listing.activeTrips];
        if (res.success) {
          let index = _.findIndex(activeTrips, {
            _id: res.data._id
          });
          if (index === -1) {
            activeTrips.push(res.data);
          }
          dispatch({ type: Types.ADMIN_ACTIVE_TRIPS, payload: activeTrips });
        }
      });
      this.socket.on("VehicleChangedAdmin", res => {
        dispatch(actions.ActiveTrips(1, "", this.navigator));
        console.log("VehicleChangedAdmin", res);
      });
      this.socket.on("tripDeactivated", res => {
        console.log("tripDeactivated", res);
        let { listing } = getState();
        let { currentTrip } = listing;
        let activeTrips = [...listing.activeTrips];
        if (res.success) {
          if (currentTrip === res.data._id) {
            this.navigator.handleDeepLink({
              link: "AdminDashBoard"
            });
            toastMessage(this.navigator, {
              type: Constants.AppConstants.Notificaitons.Error,
              message: res.message
            });
          }
          _.remove(activeTrips, {
            _id: res.data._id
          });
          dispatch({ type: Types.ADMIN_UPDATE_CURRENT_TRIP, payload: "" });
          dispatch({ type: Types.ADMIN_ACTIVE_TRIPS, payload: activeTrips });
        }
      });

      /**
       * event triggred when driver Accepts or rejects the schedule trip request
       */
      this.socket.on("scheduleReqUpdatedAdmin", res => {
        if (res.success) {
          Dialog(res.message, [{ text: "Ok", style: "cancel" }]);
          console.log("socket Acceptance,Rejection", res.message);
          dispatch(actions.getScheduledTrips(this.navigator));
        }
      });

      /* Event will be triggered just assure that trip is active*/

      this.socket.on("noActiveTrip", res => {
        console.log("noActiveTrip", res);
        if (res.success) {
          Dialog(res.message, [{ text: "Ok", style: "cancel" }]);
        }
      });

      /* Event will be triggered when new request will be added from rider*/

      this.socket.on("newScheduleRequestAdmin", res => {
        console.log("newScheduleRequestAdmin", res);
        if (res.success) {
          Dialog(res.message, [{ text: "Ok", style: "cancel" }]);
          dispatch(actions.getScheduledTrips(this.navigator));
        }
      });
    }
    if (!this.navigator) {
      this.navigator = new Navigator();
      // dispatch({ type: Types.SET_NAVIGATOR, payload: navigator });
    }
  }

  static disconnectSocketAdmin() {
    if (this.isConnected) {
      console.log("disconnecting socket");
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
reactMixin(AdminSocket.prototype, TimerMixin);

export default AdminSocket;

/****************************************************Emit Events*********************************/
