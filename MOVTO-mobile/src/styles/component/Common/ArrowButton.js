/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains Style for Auth button component.
Date : 12 Sept 2018
*/

import { StyleSheet } from "react-native";
import Constants from "../../../constants";
import { moderateScale } from "../../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  buttonContainer: {
    //paddingHorizontal: moderateScale(25)
  },
  gradientStyle: {
    borderRadius: moderateScale(50),
    justifyContent: "space-around",
    alignItems: "flex-end",
    flexDirection: "row",
    paddingVertical: moderateScale(15),
    backgroundColor: Constants.Colors.Primary,
    height: 60
    // borderRadius: 100,
    // justifyContent: "center",
    // alignItems: "center"
  }
});
