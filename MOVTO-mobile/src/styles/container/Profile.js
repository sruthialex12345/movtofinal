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
  wraper: { height: Constants.BaseStyle.DEVICE_HEIGHT * 0.87 },
  camera: {
    position: "absolute",
    height: moderateScale(40),
    width: moderateScale(40),
    backgroundColor: Constants.Colors.Yellow,
    zIndex: 999,
    right: moderateScale(10),
    bottom: moderateScale(25),
    borderRadius: moderateScale(100),
    justifyContent: "center",
    alignItems: "center"
  },
  useInfo: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(10),
    backgroundColor: Constants.Colors.White,
    flex: 0.35
  },
  appInfo: {
    flex: 0.6,
    paddingHorizontal: moderateScale(30),
    paddingBottom: moderateScale(20),
    justifyContent: "center"
  },
  buttonStyle: {
    //paddingHorizontal: moderateScale(30),
    flex: 1
  },
  gradientStyle: { borderRadius: 0 },
  textStyle: {
    color: "#707070",
    fontSize: moderateScale(18)
  },
  picContainer: {
    width: moderateScale(170),
    height: moderateScale(170),
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: moderateScale(25),
    marginTop: moderateScale(25)
  },
  userName: {
    flex: 0.6,
    justifyContent: "center",
    paddingLeft: moderateScale(20)
  },
  userNameText: {
    ...Constants.Fonts.TitilliumWebBold,
    fontSize: moderateScale(20),
    color: Constants.Colors.Primary
  },
  tapText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(16),
    color: Constants.Colors.placehoder
  },

  pic: {
    //borderWidth: 1,
    borderRadius: 700,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  },
  userImg: {
    height: moderateScale(150),
    width: moderateScale(135)
    // marginTop: Constants.BaseStyle.DEVICE_WIDTH * 0.05
  },
  menuList: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: moderateScale(10),
    alignItems: "center",
    borderBottomColor: Constants.Colors.placehoder,
    borderBottomWidth: 1
  },
  placehoder: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(16),
    color: Constants.Colors.placehoder
  },
  value: {
    ...Constants.Fonts.TitilliumWebBold,
    fontSize: moderateScale(20),
    color: Constants.Colors.Primary
  },
  service: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(20),
    color: Constants.Colors.Primary
  },
  actionWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: Constants.BaseStyle.DEVICE_WIDTH
  },
  actionText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    textAlign: "center",
    fontSize: moderateScale(18)
  }
});
