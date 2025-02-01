/*
 * @file: RestClient.js
 * @description: Rest Client
 * @date: 14.12.2017
 * @author: Gurtej Singh
 * */
/* eslint-disable */

"use strict";

import Connection from "../config/Connection";
import { Alert, Platform } from "react-native";
//Guru - 12/25/2019 - Fix for RN 0.61.5 Upgrade
import NetInfo from "@react-native-community/netinfo";
import { storeObj } from "../store/setup";
import * as appActions from "../actions";
import { Navigator } from "react-native-navigation";
import Constants from "../constants";
//import RNFetchBlob from "react-native-fetch-blob";
//import axios from "axios";


class RestClient {
  navigator = null;
  static isConnected() {
    let context = this;
    //Guru - 12/25/2019 - Fix for RN 0.61.5 Upgrade
    return new Promise(function(fulfill, reject) {
      NetInfo.fetch().then(state => {
        if (state.isConnected) {
          console.log("Is connected?", state.isConnected);
          fulfill(state.isConnected);
        }
        else {
          reject(state.isConnected);
        }
      });
    });
  }

  static isInternetConnected() {
    //Guru - 12/25/2019 - Fix for RN 0.61.5 Upgrade
    return new Promise(function(fulfill) {
      NetInfo.fetch().then(state => {
        fulfill(state.isConnected);
      });
    });
  }
  static restCall(url, params, token = null, type = "POST", transToken = null) {
    let navigator = new Navigator();
    let context = this;
    console.log(type, " call", Connection.getResturl() + url, params, token);
    return new Promise(function(fulfill, reject) {
      context
        .isInternetConnected()
        .then(() => {
         /*axios.post(Connection.getResturl() + url, JSON.stringify(params),{
            "headers": {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              "Authorization": token,
              "transToken": transToken
            }
          })*/
           /*RNFetchBlob.fetch( 'POST',
            Connection.getResturl() + url,{
                Accept: "application/json",
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                Authorization: token,
                transToken: transToken
                },
                JSON.stringify(params)
            )*/
          fetch(Connection.getResturl() + url, {
            method: type,
            timeout: 1000 * 1 * 60,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              Authorization: token,
              transToken: transToken
            },
            body: JSON.stringify(params)
          })
            .then(response => {
              console.log('Response: ', response);
              return response.text();
            })
            .then(responseText => {
              console.log("POST responseText*****", responseText);
              let response = JSON.parse(responseText);
              if (response.code && response.code == 401) {
                console.log("unauthorized..............");
                const { dispatch } = storeObj.store;
                dispatch(appActions.ClearSession(navigator, response.message));
              } else {
                fulfill(response);
              }
            })
            .catch(error => {
              fulfill({
                message: "The server is not reachable right now, sorry for inconvenience."
              });
              console.warn("eroro", error);
            });
        })
        .catch(error => {
          console.log("eroro ********* ", error);
          fulfill({
            message: "Please check your internet connection."
          });
        });
    });
  }
  static getCall(url, token = null) {
    let navigator = new Navigator();
    let context = this;
    console.log("get call", Connection.getResturl() + url, token);
    return new Promise(function(fulfill, reject) {
      context
        .isInternetConnected()
        .then(() => {
          fetch(Connection.getResturl() + url, {
            method: "GET",
            timeout: 1000 * 1 * 60,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              Authorization: token
            }
          })
            .then(response => {
              return response.text();
            })
            .then(responseText => {
              console.log(" get call responseText*****", responseText);
              let response = JSON.parse(responseText);
              if (response.code && response.code == 401) {
                const { dispatch } = storeObj.store;
                dispatch(appActions.ClearSession(navigator, response.message));
              } else {
                fulfill(response);
              }
            })
            .catch(error => {
              fulfill({
                message: "The server is not reachable right now, sorry for inconvenience."
              });
              console.warn("eroro", error);
            });
        })
        .catch(error => {
          console.log("eroro ********* ", error);
          fulfill({
            message: "Please check your internet connection."
          });
        });
    });
  }
  static delCall(url, token = null) {
    this.navigator = new Navigator();
    // dispatch({ type: Types.SET_NAVIGATOR, payload: navigator });

    let context = this;
    console.log("delete call", url, token);
    return new Promise(function(fulfill, reject) {
      context
        .isInternetConnected()
        .then(() => {
          fetch(Connection.getResturl() + url, {
            method: "Delete",
            timeout: 1000 * 1 * 60,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              Authorization: token
            }
          })
            .then(response => {
              return response.text();
            })
            .then(responseText => {
              console.log("Del responseText*****", responseText);
              let response = JSON.parse(responseText);
              if (response.code && response.code == 401) {
                const { dispatch } = storeObj.store;
                dispatch(appActions.ClearSession(navigator, response.message));
              } else {
                fulfill(response);
              }
            })
            .catch(error => {
              fulfill({
                message: "The server is not reachable right now, sorry for inconvenience."
              });
              console.warn("eroro", error);
            });
        })
        .catch(error => {
          console.log("eroro ********* ", error);
          fulfill({
            message: "Please check your internet connection."
          });
        });
    });
  }
  static post(url, params, deviceToken = null, deviceType = null) {
    if (!this.navigator) {
      this.navigator = new Navigator();
      // dispatch({ type: Types.SET_NAVIGATOR, payload: navigator });
    }
    let context = this;
    console.log("login details->", url, params, deviceToken, deviceType);
    return new Promise(function(fulfill, reject) {
      context
        .isInternetConnected()
        .then(() => {
          console.log("url=> ", Connection.getResturl() + url, " requestObject=> ", params);
          fetch(Connection.getResturl() + url, {
            method: "POST",
            timeout: 1000 * 1 * 60,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              "device-type": deviceType,
              "device-token": deviceToken
            },
            body: JSON.stringify(params)
          })
            .then(response => {
              return response.text();
            })
            .then(responseText => {
              console.log("POST responseText*****", responseText);
              let response = JSON.parse(responseText);
              if (response.code && response.code == 401) {
                const { dispatch } = storeObj.store;
                dispatch(appActions.ClearSession(navigator, response.message));
              } else {
                fulfill(response);
              }
            })
            .catch(error => {
              //   debugger;
              fulfill({
                message: "The server is not reachable right now, sorry for inconvenience."
              });
              console.warn("eroro", error);
            });
        })
        .catch(error => {
          console.log("eroro ********* ", error);
          fulfill({
            message: "Please check your internet connection."
          });
        });
    });
  }
}

export default RestClient;
