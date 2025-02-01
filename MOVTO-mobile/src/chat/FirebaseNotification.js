import React, {Component} from 'react';
import {StyleSheet, Text, View, Alert, AsyncStorage} from 'react-native';
import firebase from 'react-native-firebase';
import { Platform } from "react-native";
let notificationListener, notificationOpenedListener;

class FirebaseNotification {

  constructor() {
    if (Platform.OS === "android") {
       this.createChannel();
    }
    //@GR - commented - Not required since it is checked by the Login component.
    //this.checkPermission();
    this.createNotificationListeners();
  }


  //Check whether Push Notifications are enabled or not
  async checkPermission() {
    const enabled = await firebase.messaging().hasPermission();
    if (enabled) {
      this.getToken();
    } else {
      this.requestPermission();
    }
  }

  async createChannel() {
    //Setup Notification Channel for android
    const channel = new firebase.notifications.Android.Channel(
    'cidr-channel',
    'cidr notification Channel',
    firebase.notifications.Android.Importance.Max,
    ).setDescription('Circular drive notification channel');
    firebase.notifications().android.createChannel(channel);
    console.log('Channel Created');

  }

  //Get Device Registration Token
  //@GR - Noe: This is not the true device token used by the system, we have another token used
  //from the login screen that is sent to server.
  async getToken() {
    let fcmToken = await AsyncStorage.getItem('fcmToken');
    console.log("fcmToken: ", fcmToken);
    if (!fcmToken) {
      fcmToken = await firebase.messaging().getToken();
      if (fcmToken) {
        console.log('fcmToken:', fcmToken);
        await AsyncStorage.setItem('fcmToken', fcmToken);
      }
    }
  }

  //Request for Push Notification
  async requestPermission() {
    try {
      await firebase.messaging().requestPermission();
      // If user allow Push Notification
      this.getToken();
    } catch (error) {
      // If user do not allow Push Notification
      console.log('Rejected');
    }
  }

  async createNotificationListeners() {

    // If your app is in Foreground
    console.log("In createNotificationListeners ");
    this.notificationListener = firebase.notifications().onNotification((notification) => {
        console.log("Notification Received: ", notification);
    const localNotification = new firebase.notifications.Notification({
            show_in_foreground: true,
          })
          .setNotificationId(new Date().valueOf().toString())
          .setTitle(notification.title)
          .setBody(notification.body).
          setSound("bell.mp3");
          localNotification.android.setAutoCancel(true);
          localNotification.android.setColor("red");
          localNotification.android.setColorized(true);
          localNotification.android.setOngoing(true);
          localNotification.android.setPriority(firebase.notifications.Android.Priority.High);
          localNotification.android.setSmallIcon("ic_launcher");
          localNotification.android.setVibrate([300]);
          localNotification.android.setChannelId('cidr-channel');
          //await firebase.notifications().setBadge(1);
          firebase.notifications()
            .displayNotification(localNotification);
    });


    //If your app is in background
    this.notificationOpenedListener = firebase.notifications().onNotificationOpened((notificationOpen) => {
      const { title, body } = notificationOpen.notification;
      console.log('onNotificationOpened:');
      Alert.alert(title, body);
    });


    // If your app is closed
    const notificationOpen = await firebase.notifications().getInitialNotification();
    if (notificationOpen) {
      console.log('getInitialNotification:');
    }

    // For data only payload in foreground

    this.messageListener = firebase.messaging().onMessage
((message) => {
      //process data message
      console.log("Message", JSON.stringify(message));
      console.log("Notification title: ", message._data.title);
      console.log("Notification body: ", message._data.body);      
      const localNotification = new firebase.notifications.Notification({
        show_in_foreground: true,
      })
      .setNotificationId(new Date().valueOf().toString())
      .setTitle(message._data.title)
      .setBody(message._data.body).
      setSound("bell.mp3");
      firebase.notifications()
      .displayNotification(localNotification);       
    });
  }

}

export default FirebaseNotification;