/*
Name : 
File Name : Styles.js
Description : Contains Style for Auth button component.
Date : 12 Sept 2018
*/

import { StyleSheet } from "react-native";
import Constants from "../../../constants";
import { moderateScale } from "../../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  buttonContainer: {
    // alignSelf: "center"
    paddingRight: moderateScale(1)
  },
  gradientStyle: {
    // borderRadius: moderateScale(50),
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    height: moderateScale(60)
    // padding: moderateScale(15)
  },
  buttonText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: Constants.Colors.Yellow,
    textAlign: "center",
    // textAlignHorizonatal: "center",
    paddingHorizontal: moderateScale(5)
  }
});
