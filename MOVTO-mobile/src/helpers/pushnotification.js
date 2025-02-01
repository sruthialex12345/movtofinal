/*
 * @file: PushNotification.js
 * @description: Initiliazing push notification , Redirection on push notifications
 * @author: Ankush Rishi
 * */
/* eslint-disable */
"use strict";
import React, { Component } from "react";
import { Platform } from "react-native";
import FCM, {
  FCMEvent,
  RemoteNotificationResult,
  WillPresentNotificationResult,
  NotificationType
} from "react-native-fcm";
import {
  HIDE_NOTIFICATIONBAR,
  SHOW_NOTIFICATIONBAR,
  UPDATE_MESSAGE,
  UPDATE_TITLE,
  UPDATE_FCM_TOKEN
} from "../actions/types";
let notificationListener, refreshTokenListener;
let notificationToken = "dummytoken";

/**
 * Initiliazing push notification
 */

export function pushNotificationInit(callback) {
  if (Platform.OS === "ios") {
    //for ios
    FCM.requestPermissions({ badge: false, sound: true, alert: true })
      .then(() => {})
      .catch(() => {});
  } else {
    FCM.requestPermissions(); // for android
  }
  // FCM token on intial app load.
  FCM.getFCMToken().then(token => {
    callback(token);
  });
}
export function registerFCMEvents(store) {
  // // Receive Notification in kill state, inactive state or bankground state.
  FCM.getInitialNotification().then(res => {});
  console.log("Push notification from bakend", res);
  // Receive Notification in forground
  notificationListener = FCM.on(FCMEvent.Notification, async res => {
    console.log("Push notification from ======>>", res);
    let { body, title } = res;
    store.dispatch({ type: UPDATE_TITLE, payload: title });
    store.dispatch({ type: UPDATE_MESSAGE, payload: body });
    store.dispatch({ type: SHOW_NOTIFICATIONBAR });
    setTimeout(() => {
      store.dispatch({ type: HIDE_NOTIFICATIONBAR });
    }, 3000);
    console.log("Receive Notification in forground", res);
  });
  // Fcm token may not be available on first load, catch it here
  refreshTokenListener = FCM.on(FCMEvent.RefreshToken, token => {
    if (token) {
      store.dispatch({ type: UPDATE_FCM_TOKEN, payload: token });
    }
  });
}
/**
 *  Removes all future local notifications.
 */
export function cancelAllLocalNotifications() {
  FCM.cancelAllLocalNotifications();
}

export function pushNotificationRemove(store) {
  notificationListener.remove();
  refreshTokenListener.remove();
}
