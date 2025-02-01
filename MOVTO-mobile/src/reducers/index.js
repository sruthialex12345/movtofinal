// import { storeObj } from "../store/setup";
// import Constants from "../constants";
// const { getState } = storeObj.store;
// const { userType } = getState().user;
//common reducers
import app from "./app";
import loader from "./loader";
import user from "./user";

//rider reducers
import riderLocation from "./rider/riderLocation";
import riderTrip from "./rider/riderTrip";

//driver reducers
import shuttle from "./driver/shuttle";
import terminalListing from "./driver/terminalterminalListing";
import trip from "./driver/trip";
// admin reducers
import listing from "./admin/listing";
import admin from "./admin/admin";

//common reducers
import common from "./common/index";

export {
  //common reducers
  app,
  user,
  loader,
  //rider reducers
  riderLocation,
  riderTrip,
  //driver reducers
  shuttle,
  trip,
  terminalListing,
  //admin reducers
  listing,
  common,
  admin
};
