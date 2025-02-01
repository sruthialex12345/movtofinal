/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains all App styles for dashboard screen
Date : 17 Sept 2018
*/

import { StyleSheet } from "react-native";
import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  mainView: { flex: 1, backgroundColor: Constants.Colors.transparent },
  container: {
    position: "absolute",
    zIndex: 999,
    backgroundColor: Constants.Colors.transparent,
    width: Constants.BaseStyle.DEVICE_WIDTH,
    minHeight: Constants.BaseStyle.DEVICE_HEIGHT * 0.35
  },
  keyboardScroll: { width: Constants.BaseStyle.DEVICE_WIDTH },
  wrapper: {
    //  / paddingHorizontal: moderateScale(25)
  },
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
  timeView: {
    flexDirection: "row",
    paddingVertical: Constants.BaseStyle.DEVICE_WIDTH * 0.03,
    marginLeft: moderateScale(15)
  },
  statusTxt: {
    flexDirection: "row",
    justifyContent: "center",
    ...Constants.Fonts.TitilliumWebRegular,
    color: Constants.Colors.gray,
    fontSize: moderateScale(17)
  },
  timeTxt: { color: "#393B3B", fontSize: moderateScale(17), ...Constants.Fonts.TitilliumWebSemiBold },
  carNameTxt: {
    color: "#3B3B39",
    fontSize: moderateScale(19),
    ...Constants.Fonts.TitilliumWebSemiBold,
    paddingHorizontal: moderateScale(10)
  },
  carNumTxt: {
    color: "#707070",
    fontSize: moderateScale(17),
    ...Constants.Fonts.TitilliumWebRegular,
    paddingHorizontal: moderateScale(10)
  },
  acceptImgView: {
    backgroundColor: Constants.Colors.green,
    borderRadius: Constants.BaseStyle.DEVICE_WIDTH * 1,
    height: Constants.BaseStyle.DEVICE_WIDTH * 0.1,
    width: Constants.BaseStyle.DEVICE_WIDTH * 0.1,
    justifyContent: "center",
    alignItems: "center"
  },
  rejectImgView: {
    backgroundColor: Constants.Colors.red,
    borderRadius: Constants.BaseStyle.DEVICE_WIDTH * 1,
    height: Constants.BaseStyle.DEVICE_WIDTH * 0.1,
    width: Constants.BaseStyle.DEVICE_WIDTH * 0.1,
    justifyContent: "center",
    alignItems: "center"
  },
  noOfRidesView: {
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    marginLeft: Constants.BaseStyle.DEVICE_WIDTH * 0.05,
    margin: 10
  },
  rideDateView: {
    flex: 0.2,
    justifyContent: "center",
    marginLeft: moderateScale(15)
  },
  noOfRidesTxt: {
    color: "#A9AFAF",
    fontSize: moderateScale(17)
  },
  dateTxt: {
    color: "#707070",
    fontSize: moderateScale(17)
  },
  //ride history row designs
  riderHistoryRowContainer: {
    marginHorizontal: moderateScale(10)
  },
  riderHistoryIcon: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(4)
  }
});
