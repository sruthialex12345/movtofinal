/**
 * Name :Gurtej Singh
 * File Name : ToastNotification.js
 * Description : Contains the toast Notificaitons of the app
 * Date : 25 Sept 2018
 */
import React from "react";
import { Text, View, Image, StyleSheet } from "react-native";

import SafeView from "./SafeView";
import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";

const ToastNotification = props => {
  let { type, message } = props; // type 1 for error, 2=for Notification
  let primaryColor =
    type == Constants.AppConstants.Notificaitons.Error ? Constants.Colors.red : Constants.Colors.Yellow;
  let image =
    type == Constants.AppConstants.Notificaitons.Error ? Constants.Images.Common.Cross : Constants.Images.Common.Accept;
  //let textColor = type == 1 ? Constants.Colors.White : Constants.Colors.White;
  return (
    <View style={Styles.container}>
      <SafeView />
      <View style={{ alignItems: "center", justifyContent: "flex-start", flex: 1 }}>
        <View style={Styles.notificationView}>
          <View style={[Styles.imageView, { backgroundColor: primaryColor }]}>
            <Image source={image} resizeMode={"contain"} />
          </View>
          <Text style={Styles.message}>
            {message}
            {/* Request Accepted */}
          </Text>
        </View>
      </View>
    </View>
  );
};

const Styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Constants.Colors.transparent, justifyContent: "space-between" },
  notificationView: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Constants.Colors.White,
    top: moderateScale(20),
    padding: moderateScale(10),
    borderRadius: moderateScale(10)
  },
  imageView: {
    height: moderateScale(30),
    width: moderateScale(30),
    borderRadius: moderateScale(100),
    alignItems: "center",
    justifyContent: "center"
  },
  message: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(17),
    color: Constants.Colors.Primary,
    paddingHorizontal: moderateScale(10)
  }
});

export default ToastNotification;
