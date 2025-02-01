import * as types from "../../actionTypes";
import { toastMessage } from "../../config/navigators";
import { Navigator } from "react-native-navigation";
import Constants from "../../constants";
import { Platform } from "react-native";
import * as appActions from "../../actions";
let navigator = new Navigator();
let { push, pop, resetTo } = navigator;

export function appInitialized() {
  //return async function(dispatch, getState) {
  return async function(dispatch) {
    // since all business logic should be inside redux actions
    // this is a good place to put your app initialization code
    dispatch(changeAppRoot("LoginScreen"));
  };
}
export function serverError(navigator) {
  toastMessage(navigator, {
    type: Constants.AppConstants.Notificaitons.Error,
    message: Constants.AppConstants.Error.serverError
  });
}
export function changeAppRoot(root) {
  return { type: types.ROOT_CHANGED, root: root };
}

export function login() {
  return async function(dispatch) {
    // login logic would go here, and when it's done, we switch app roots
    dispatch(changeAppRoot("login"));
  };
}

export function movedashBoardTab() {
  return async function(dispatch) {
    // login logic would go here, and when it's done, we switch app roots
    dispatch(changeAppRoot("after-login"));
  };
}

/*
Move to specified screen
*/
export const moveToScreen = root => ({
  type: types.ROOT_CHANGED,
  root
});

/*
Setting the navigator
*/
export const setNavigator = navigator => ({
  type: types.SET_NAVIGATOR,
  payload: navigator
});

export const pushToScreen = (screen, passProps = {}) => async (dispatch, getState) => {
  await push({
    screen: screen,
    passProps: { ...passProps, ...navigator }
  });
};

export const resetToScreen = (screen, passProps = {}) => async (dispatch, getState) => {
  await resetTo({
    screen: screen,
    passProps: { ...passProps, ...navigator }
  });
};
//show progress bar
export const showProgressBar = navigator => {
  navigator.showModal({
    screen: "Loader",
    animationType: "slide-up",
    navigatorStyle: {
      statusBarColor: "transparent",
      navBarHidden: true,
      screenBackgroundColor: "rgba(0,0,0,0.4)",
      modalPresentationStyle: "overFullScreen"
    }
  });
};

//show progress bar
export const hideProgressBar = navigator => {
  navigator.dismissModal();
};

export const dismissModalAnimated = navigator => {
  if (Platform.OS === "ios") {
    return navigator.dismissModal({ animationType: "slide-down" });
  } else {
    navigator.dismissModal({ animationType: "slide-down" });
    return new Promise(resolve => resolve());
  }
};
export const deeplink = async (navigator, scren, props) => {
  await navigator.handleDeepLink({ link: scren, payload: props });
  return new Promise(resolve => resolve());
};
