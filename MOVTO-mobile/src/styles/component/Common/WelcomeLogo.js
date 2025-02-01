/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains Style for WelcomeLogo component.
Date : 12 Sept 2018
*/

import { StyleSheet } from "react-native";
import Constants from "../../../constants";
import { moderateScale } from "../../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  welcomeLogoContainer: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start"
  },
  logoStyle: { paddingBottom: 0 },
  welcomeText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(28),
    color: Constants.Colors.Primary
  },
  screenText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(18),
    color: Constants.Colors.gray
  }
});
