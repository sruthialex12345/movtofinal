/*
Name : Parshant Nagpal
Description : 'Contains the main app class for loading the particiular screen on root reducer change in app '
Date : 7 Sept 2018
*/

import setup from "./store/setup";
import { StatusBar } from "react-native";
//import NetInfo from "@react-native-community/netinfo";
import { registerScreens, registerScreenVisibilityListener } from "./config/routes";
import { Provider } from "react-redux";
import startApp from "./config/navigators";
import { RegisterNetEvents } from "./helpers/registerevents";
import SplashScreen from "react-native-splash-screen";
import FirebaseNotification from "./chat/FirebaseNotification";
global.isDebuggingInChrome = __DEV__ && !!window.navigator.userAgent; // eslint-disable-line
console.disableYellowBox = true; // eslint-disable-line

// Registering the main screen

const store = setup();
registerScreens(store, Provider);
registerScreenVisibilityListener();


// notice that this is just a simple class, it's not a React component
export default class App {
  constructor() {
    console.log("Starting");
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor("transparent");
    // since react-redux only works on components, we need to subscribe this class manually
    store.subscribe(this.onStoreUpdate.bind(this));
    //event to enable internet checking
    RegisterNetEvents();
    SplashScreen.hide();
    //@GR - 05/30/2020 - Init Push Notification
    var pushNotif = new FirebaseNotification();
  }

  onStoreUpdate() {
    const { root } = store.getState().app;
    // console.log("root", root);
    // handle a root change
    // if your app doesn't change roots in runtime, you can remove onStoreUpdate() altogether
    if (this.currentRoot != root) {
      this.currentRoot = root;
      console.log("working....................");
      startApp(root);
    }
  }
}
// eslint-disable-line
