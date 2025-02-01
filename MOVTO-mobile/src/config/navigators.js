/*
Name : Parshant Nagpal
File Name : navigators.js
Description : function loads initial screen and for reseting the another screens 
Date : 6 Sept 2018
*/

import { Navigation } from "react-native-navigation";
import Constants from "../constants";
export default root => {
  switch (root) {
    case "login":
      Navigation.startSingleScreenApp({
        screen: {
          screen: "LoginScreen",
          title: "Login",
          navigatorStyle: {}
        },
        appStyle: {
          statusBarColor: Constants.Colors.Yellow,
          orientation: "portrait"
        },
        animated: true,
        animationType: "none",
        portraitOnlyMode: true
      });

      return;

      case "chat":
      Navigation.startSingleScreenApp({
        screen: {
          screen: "Chat",
          title: "Chat with Admin",
          navigatorStyle: {}
        },
        appStyle: {
          statusBarColor: Constants.Colors.Yellow,
          orientation: "portrait"
        },
        animated: true,
        animationType: "none",
        portraitOnlyMode: true
      });

      return;
      case "AdminScreen":
        Navigation.startSingleScreenApp({
          screen: {
            screen: "AdminScreen",
            title: "Admin Chat List",
            navigatorStyle: {}
          },
          appStyle: {
            statusBarColor: Constants.Colors.Yellow,
            orientation: "portrait"
          },
          animated: true,
          animationType: "none",
          portraitOnlyMode: true
        });
  
        return;
      
    case "after-login":
      Navigation.startSingleScreenApp({
        screen: {
          screen: "RiderProviderListing",
          title: "Home",
          navigatorStyle: {}
        },
        appStyle: {
          statusBarColor: Constants.Colors.Yellow,
          orientation: "portrait"
        },
        drawer: {
          left: {
            screen: "SideMenu"
          },
          style: {
            // ( iOS only )
            drawerShadow: false, // optional, add this if you want a side menu drawer shadow
            contentOverlayColor: "rgba(0,0,0,0.25)", // optional, add this if you want a overlay color when drawer is open
            leftDrawerWidth: 80, // optional, add this if you want a define right drawer width (50=percent)
            shouldStretchDrawer: false // optional, iOS only with 'MMDrawer' type, whether or not the panning gesture will “hard-stop” at the maximum width for a given drawer side, default : true
          },
          type: "MMDrawer",
          animated: true,
          animationType: "none",
          portraitOnlyMode: true
        }
      });
      return;
    case "after-login-driver-admin":
      Navigation.startSingleScreenApp({
        screen: {
          screen: "LoginScreen",
          title: "Home",
          navigatorStyle: {}
        },
        appStyle: {
          statusBarColor: Constants.Colors.Yellow,
          orientation: "portrait"
        },
        drawer: {
          left: {
            screen: "SideMenu"
          },
          style: {
            // ( iOS only )
            drawerShadow: false, // optional, add this if you want a side menu drawer shadow
            contentOverlayColor: "rgba(0,0,0,0.25)", // optional, add this if you want a overlay color when drawer is open
            leftDrawerWidth: 80, // optional, add this if you want a define right drawer width (50=percent)
            shouldStretchDrawer: false // optional, iOS only with 'MMDrawer' type, whether or not the panning gesture will “hard-stop” at the maximum width for a given drawer side, default : true
          },
          type: "MMDrawer",
          animated: true,
          animationType: "none",
          portraitOnlyMode: true
        }
      });
      return;
    default:
      console.error("Unknown app root"); // eslint-disable-line
  }
};

export const toastMessage = (navigator, props) => {
  // notifcationStyle and textStyle additional props can be passed to change style of Notification component.
  // status bar color according to the notification

  navigator.showInAppNotification({
    screen: "Notification",
    passProps: props,
    autoDismissTimerSec: 1,
    navigatorStyle: {
      statusBarColor: "transparent",
      screenBackgroundColor: "transparent"
    }
  });
};

export const toastNotification = (navigator, props) => {
  // notifcationStyle and textStyle additional props can be passed to change style of Notification component.
  // status bar color according to the notification

  navigator.showInAppNotification({
    screen: "ToastNotification",
    passProps: props,
    autoDismissTimerSec: 2,
    navigatorStyle: {
      statusBarColor: "transparent",
      screenBackgroundColor: "transparent"
    }
  });
};

export const handleDeepLink = (event, navigator) => {
  if (event.type == "DeepLink") {
    if (event.payload && event.payload.push) {
      navigator.push({
        screen: event.link,
        animated: true,
        animationType: "none",
        passProps: event.payload && event.payload.passProps
      });
    } else {
      navigator.resetTo({
        screen: event.link,
        animated: true,
        animationType: "none",
        passProps: event.payload && event.payload.passProps
      });
    }
  }
};
