/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains all App styles for login screen
Date : 12 Sept 2018
*/

import { StyleSheet, Dimensions } from "react-native";
var { height, width } = Dimensions.get("window");
import Constants from "../../../constants";
import { moderateScale } from "../../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.Colors.White
  },
  wrapperContainer: {
    flex: 1,
    // flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: moderateScale(30)
  },
  logoStyle: { marginTop: moderateScale(50) },
  scrollHeight: {
    height: moderateScale(340),
    flexDirection: "column",
    justifyContent: "flex-start"
  },
  wrapper: { flex: 0.8 },
  backgroundImage: {
    marginTop: moderateScale(100),
    justifyContent: "flex-end",
    alignItems: "center",
    flexDirection: "row",
    zIndex: 999
  },
  FloatingInputContainer: {
    // paddingVertical: moderateScale(40),
    justifyContent: "flex-start"
  },
  authPolicyContainer: {
    flex: 0.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  buttonStyle: { flex: 1 },
  signBtn: { flexDirection: "row", alignItems: "center" },
  signBtnStyle: {},
  signTxtStyle: {
    ...Constants.Fonts.TitilliumWebBold,
    fontSize: moderateScale(18),
    color: Constants.Colors.Primary,
    textDecorationLine: "underline"
  },
  policy: {
    justifyContent: "center"
  },
  policyText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(16),
    color: Constants.Colors.Primary,
    textAlign: "right",
    textAlignVertical: "center"
  },
  newUser: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(16),
    color: Constants.Colors.Primary,
    textAlign: "right",
    textAlignVertical: "center"
  }
});
