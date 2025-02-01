/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains all App styles for main screen
Date : 11 Sept 2018
*/

import { StyleSheet, Dimensions } from "react-native";
var { height, width } = Dimensions.get("window");
import Constants from "../../../constants";
import { moderateScale } from "../../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  mainScreenContainer: {
    flex: 1,
    backgroundColor: Constants.Colors.Yellow
  },
  header: { flex: 0.1 },
  logoSectionContainer: {
    flex: 0.15,
    justifyContent: "center",
    alignItems: "center"
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center"
  },
  logo: {},
  logoText: {
    ...Constants.Fonts.TitilliumWebBold,
    color: Constants.Colors.Primary,
    fontSize: moderateScale(30)
  },
  gradientSectionContainer: {
    flex: 0.5,
    justifyContent: "space-around",
    marginTop: moderateScale(51)
  },
  lowerSection: {
    flex: 0.25,
    justifyContent: "flex-end",
    alignItems: "center"
  }
});
