/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains Style for gradientImage component.
Date : 11 Sept 2018
*/

import { StyleSheet, Platform } from "react-native";
import Constants from "../../../constants";
import { moderateScale } from "../../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  gradientContainer: {
    backgroundColor: Constants.Colors.Yellow,
    flex: 0.25,
    flexDirection: "row"
  },
  gradient: {
    flex: 0.8,
    paddingLeft: moderateScale(5),
    paddingRight: moderateScale(10),
    borderRadius: moderateScale(50),
    justifyContent: "center"
  },
  flex1Sec: { flex: 0.1 },
  gradientDataContainer: {
    justifyContent: "space-between",
    flexDirection: "row"
  },
  gradientImageContainer: { flex: 0.25 },
  gradientImage: {
    height: Platform.OS == "ios" ? moderateScale(70) : moderateScale(60),
    width: Platform.OS == "ios" ? moderateScale(70) : moderateScale(60)
  },
  gradientTextContainer: {
    flex: 0.75,
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: moderateScale(15),
    flexDirection: "row"
  },
  gradientText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    color: Constants.Colors.White,
    fontSize: moderateScale(16),
    fontWeight: "400"
  },
  arrow: { marginRight: moderateScale(25.8) }
});
