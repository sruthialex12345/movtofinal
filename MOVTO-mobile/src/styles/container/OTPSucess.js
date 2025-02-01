/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains all App styles for signup screen
Date : 12 Sept 2018
*/

import { StyleSheet } from "react-native";
import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.Colors.Yellow
  },
  wrapperScroll: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center"
  },
  containerStyle: {
    paddingVertical: moderateScale(80)
  },
  sucessStyle: {
    justifyContent: "center",
    alignItems: "center"
  }
});
