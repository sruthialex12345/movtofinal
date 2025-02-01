/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains all App styles for signup screen
Date : 12 Sept 2018
*/

import { StyleSheet, Platform } from "react-native";
import Constants from "../../../constants";
import { moderateScale } from "../../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.Colors.whit
  },
  scroll: { flex: 1 },
  wrapperContainer: {
    justifyContent: "center"
  },
  scrollHeight: {
    flex: 1,
    height: Constants.BaseStyle.DEVICE_HEIGHT,
    paddingHorizontal: moderateScale(30)
  },
  wrapper: { flex: 1 },
  backgroundImage: {
    paddingHorizontal: moderateScale(30),
    width: Constants.BaseStyle.DEVICE_WIDTH,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    //position: "absolute",
    bottom: moderateScale(5),
    marginBottom: moderateScale(30)
  },
  FloatingInputContainer: {
    justifyContent: "center",
    overflow: "hidden"
  },
  mobileNumber: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between"
  },
  authPolicyContainer: {
    flex: 0.12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  signBtn: { flexDirection: "row", alignItems: "center" },

  buttonStyle: { flex: 1 },
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
