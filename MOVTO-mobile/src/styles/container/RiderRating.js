/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains all App styles for rider rating screen
Date : 17 Sept 2018
*/

import { StyleSheet } from "react-native";
import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  mainView: { flex: 1, backgroundColor: Constants.Colors.transparent },
  container: {
    backgroundColor: Constants.Colors.White,
    width: Constants.BaseStyle.DEVICE_WIDTH,
    flex: 1
  },
  keyboardScroll: {
    width: Constants.BaseStyle.DEVICE_WIDTH,
    height: Constants.BaseStyle.DEVICE_HEIGHT - moderateScale(100)
  },
  buttonStyle: { flex: 0.5 },
  gradientStyle: { borderRadius: 0 },
  // centerTextStyle: {
  //   ...Constants.Fonts.TitilliumWebSemiBold,
  //   fontSize: moderateScale(19),
  //   textAlign: "center",
  //   color: Constants.Colors.Primary
  // },
  searchWrapper: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(15),
    borderWidth: 1,
    flexDirection: "row",
    borderColor: "#A9AFAF"
  },
  searchIcon: {
    flex: 0.1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(10)
  },
  inputContainer: {
    flex: 1
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center"
  },
  inputBox: {
    flex: 0.9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  inputStyle: {
    ...Constants.Fonts.TitilliumWebRegular,
    height: moderateScale(50),
    fontSize: moderateScale(16),
    flex: 1
  },
  inputStyleBorder: {
    borderBottomColor: "#A9AFAF",
    borderBottomWidth: 1
  },
  centerTextStyle: {
    ...Constants.Fonts.TitilliumWebBold,
    fontSize: moderateScale(24),
    textAlign: "center",
    color: Constants.Colors.Primary
  },
  WebViewStyle: {
    flex: 1
  },
  ActivityIndicatorStyle: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center"
  }
});
