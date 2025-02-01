/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains all App styles for signup screen
Date : 12 Sept 2018
*/

import { StyleSheet } from "react-native";
import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.Colors.White
  },
  wrapperScroll: {
    paddingVertical: moderateScale(25),
    paddingHorizontal: moderateScale(30)
  },
  wrapperContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center"
  },
  logoStyle: { marginTop: moderateScale(0), paddingBottom: moderateScale(0) },
  scrollHeight: {
    height: Constants.BaseStyle.DEVICE_HEIGHT * 0.42,
    flexDirection: "column",
    justifyContent: "space-between"
  },
  wrapper: {
    zIndex: 999,
    flex: 0.9
  },
  backgroundImage: {
    flex: 0.2,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row"
  },
  FloatingInputContainer: {
    flex: 0.4,
    justifyContent: "center",
    alignItems: "flex-start",
    marginLeft: -30
    // backgroundColor:'red'
  },
  inputContainerStyles: {
    backgroundColor: Constants.Colors.White,
    borderRadius: 0,
    borderBottomWidth: 2,
    borderBottomColor: Constants.Colors.Primary,
    color: Constants.Colors.Primary
  },
  otpImage: {
    justifyContent: "flex-start",
    alignItems: "center",
    flex: 0.8
  },
  otpText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(20),
    color: Constants.Colors.Primary
  },
  authPolicyContainer: {
    flex: 0.1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(5)
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
