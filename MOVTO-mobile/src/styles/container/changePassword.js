/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains all App styles for profile screen
Date : 17 Sept 2018
*/

import { StyleSheet } from "react-native";
import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  container: {
    backgroundColor: Constants.Colors.White,
    flex: 1
  },
  modelContainer: {
    backgroundColor: Constants.Colors.White,
    justifyContent: "center"
  },
  scrollStyle: {
    flex: 0.9
    //  paddingHorizontal: moderateScale(25)
  },
  textStyle: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    paddingHorizontal: moderateScale(30),
    paddingVertical: moderateScale(30),
    color: Constants.Colors.placehoder
  },
  scrollContainerStyle: { justifyContent: "center" },
  inputStyle: {
    flex: 0.8,
    paddingHorizontal: moderateScale(30),
    paddingBottom: moderateScale(20)
  },
  buttonStyle: { flex: 0.5 },
  gradientStyle: { borderRadius: 0 }
});
