/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains all App styles
Date : 11 Sept 2018
*/

import { StyleSheet, Platform } from "react-native";
import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";
export default StyleSheet.create({
  // Side menu Component
  sideMenuContainer: {
    // flex: 1,
    height: Constants.BaseStyle.DEVICE_HEIGHT,
    flexDirection: "column",
    backgroundColor: Constants.Colors.White
  },
  sideMenuImageContainer: {
    marginTop: Platform.OS == "ios" ? moderateScale(20) : 0,
    paddingHorizontal: moderateScale(30),
    paddingVertical: moderateScale(10),
    justifyContent: "flex-end",
    alignItems: "flex-start"
  },
  profileImg: {
    height: Constants.BaseStyle.DEVICE_WIDTH * 0.27,
    width: Constants.BaseStyle.DEVICE_WIDTH * 0.27,
    borderColor: Constants.Colors.Primary,
    //borderWidth: 1,
    borderRadius: moderateScale(100),
    backgroundColor: Constants.Colors.White,
    // justifyContent: "center",
    // alignItems: "center",
    overflow: "hidden"
  },
  imgAvatar: {
    flex: 1
    // height: Constants.BaseStyle.DEVICE_WIDTH * 0.27,
    //  width: Constants.BaseStyle.DEVICE_WIDTH * 0.27
  },
  userInfo: {
    paddingTop: moderateScale(12)
  },
  userName: {
    ...Constants.Fonts.TitilliumWebBold,
    fontSize: moderateScale(22),
    color: Constants.Colors.Primary
  },
  userEmail: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.gray
  },
  sideMenuSubContainer: {
    paddingHorizontal: moderateScale(30),
    // paddingVertical: moderateScale(10),
    backgroundColor: Constants.Colors.White
  },
  menuBtn: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center"
  },
  menuText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(18),
    color: Constants.Colors.menuItemTxt,
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(8)
  },
  buttonStyle: {},
  gradientStyle: { borderRadius: 0 },
  activeStatus: {
    borderColor: Constants.Colors.placehoder,
    borderWidth: 0.4,
    paddingHorizontal: moderateScale(30)
  },
  shuttleName: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(21),
    color: Constants.Colors.Primary
  },
  shuttleProvider: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.placehoder
  },
  suttleStatusBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(15)
  },
  activeBtn: {
    width: moderateScale(100),
    backgroundColor: Constants.Colors.Yellow,
    height: moderateScale(36),
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    borderRadius: moderateScale(3)
  },
  checkBtn: {
    backgroundColor: Constants.Colors.White,
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(6),
    margin: moderateScale(3),
    borderRadius: moderateScale(3)
  },
  activeText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(18),
    color: Constants.Colors.White,
    marginHorizontal: moderateScale(5)
  }
});
