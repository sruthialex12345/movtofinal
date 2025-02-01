/**
 * Name :Gurtej Singh
 * File Name : Notificaitons.js
 * Description : Contains the side notificationStyle of the app
 * Date : 9 Sept 2018
 */
import React from "react";
import { Text } from "react-native";
import LinearGradient from "react-native-linear-gradient";

import SafeView from "./SafeView";
import Styles from "../../styles/component/Common/Notification";
import Constants from "../../constants";

const Notification = props => {
  let { type, message, notificationStyle, textStyle } = props; // type 1 for error, 2=for Notification
  let primaryColor = type == Constants.AppConstants.Notificaitons.Error ? Constants.Colors.red : Constants.Colors.green;
  let gradientColors = [primaryColor, primaryColor];
  //let textColor = type == 1 ? Constants.Colors.White : Constants.Colors.White;
  return (
    <LinearGradient colors={gradientColors} style={[Styles.notificationStyle, notificationStyle]}>
      <SafeView backgroundColor={primaryColor} />
      <Text style={[Styles.textStyle, textStyle]}>{message}</Text>
    </LinearGradient>
  );
};

export default Notification;
