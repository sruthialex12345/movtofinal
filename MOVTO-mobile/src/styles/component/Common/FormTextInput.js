/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains Style for form text input component.
Date : 13 Sept 2018
*/

import { StyleSheet } from "react-native";
import Constants from "../../../constants";
import { moderateScale } from "../../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  viewStyle: {
    flexDirection: "row",
    borderColor: Constants.Colors.placehoder,
    marginTop: moderateScale(10),
    marginBottom: moderateScale(10),
    //alignSelf: "stretch",
    borderRadius: moderateScale(25),
    marginHorizontal: moderateScale(25),
    justifyContent: "center",
    alignItems: "center"
  },
  inputStyle: {
    //marginLeft: moderateScale(10),
    //width: Constants.BaseStyle.DEVICE_WIDTH,
    height: moderateScale(30),
    color: Constants.Colors.Primary,
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(16)
  }
});
