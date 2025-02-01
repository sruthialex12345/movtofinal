/* eslint-disable */
"use strict";
//import Toast from "react-native-root-toast";
import { Alert } from "react-native";
import Constants from "../constants";
import KeepAwake from "react-native-keep-awake";
var Common = {
  // ShowToast: val => {
  //   setTimeout(() => {
  //     //console.log("++++++++:",val);
  //     Toast.show(val);
  //   }, 50);
  // },
  // isNumberPositive: val => {
  //   if (val >= 0) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // },
  Dialog: (msg, buttons) => {
    Alert.alert("Circular Drive", msg, buttons, { cancelable: true });
  },
  dateFilter: (startDate, endDate, collection) => {
    let filteredData = collection.filter(function(obj) {
      let date = new Date(obj.date);
      return date >= startDate && date <= endDate;
    });
    let dates = filteredData.map(a => a.date);
    let price = filteredData.map(a => parseInt(a.price));
    return { dates, price };
  },
  formatedAddress: collection => {
    let street_number = "";
    let sublocality_level_1 = "";
    let sublocality_level_2 = "";
    let sublocality_level_3 = "";
    let city = "";
    let country = "";
    let postal_code = "";
    collection.forEach(address_component => {
      if (address_component.types[0] == "sublocality_level_3") {
        sublocality_level_3 = address_component.long_name;
      }
      if (address_component.types[0] == "sublocality_level_2") {
        sublocality_level_2 = address_component.long_name;
      }
      if (address_component.types[0] == "sublocality_level_1") {
        sublocality_level_1 = address_component.long_name;
      }

      if (address_component.types[0] == "locality") {
        city = address_component.long_name;
      }

      if (address_component.types[0] == "country") {
        country = address_component.long_name;
      }

      if (address_component.types[0] == "postal_code") {
        postal_code = address_component.long_name;
      }

      if (address_component.types[0] == "street_number") {
        street_number = address_component.long_name;
      }
    });
    return {
      street_number,
      sublocality_level_1,
      sublocality_level_2,
      sublocality_level_3,
      city,
      country,
      postal_code
    };
  },
  checkEmptyAddress: val => {
    if (val != "") {
      return val + ",";
    } else {
      return "";
    }
  },
  roundOffValue: num => {
    if (num) {
      return parseFloat(num).toFixed(2);
    } else {
      return 0;
    }
  },
  AwakeScreen: shouldBeAwake => {
    if (shouldBeAwake) {
      KeepAwake.activate();
    } else {
      KeepAwake.deactivate();
    }
  }
};

module.exports = Common;
