/*
 * @file: registerevets.js
 * @description: this file will be used to regiseter all events required in the app
 * @author:Gurtej Singh
 * */
/* eslint-disable */
//Guru - 12/25/2019 - Fix for RN 0.61.5 Upgrade
import NetInfo from "@react-native-community/netinfo";

let Events = {
  RegisterNetEvents: () => {
    let handleFirstConnectivityChange = () => {
      // NetInfo.isConnected.removeEventListener("connectionChange", handleFirstConnectivityChange);
    };
   //  NetInfo.isConnected.addEventListener("connectionChange", handleFirstConnectivityChange);
    NetInfo.fetch().then(() => {});
  }
};
module.exports = Events;
