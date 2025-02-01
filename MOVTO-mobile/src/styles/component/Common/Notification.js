/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains Style for Auth button component.
Date : 13 Sept 2018
*/

import { StyleSheet, Dimensions } from "react-native";
const { width } = Dimensions.get("window");
import Constants from "../../../constants";
import { moderateScale } from "../../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  notificationStyle: {
    width: width,
    alignItems: "center",
    padding: moderateScale(10),
    zIndex: 9999
  },
  textStyle: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    color: Constants.Colors.White,
    fontSize: moderateScale(16)
  }
});
