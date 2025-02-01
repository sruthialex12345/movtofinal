/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains all App styles for shuttle book screen
Date : 17 Sept 2018
*/

import { StyleSheet } from "react-native";
import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  container: {
    backgroundColor: Constants.Colors.White,
    height: Constants.BaseStyle.DEVICE_HEIGHT
  },
  wraper: {
    flex: 0.1,
    justifyContent: "space-between",
    flexDirection: "row",
    position: "absolute",
    bottom: 0,
    zIndex: 999,
    borderWidth: 0.4,
    borderColor: Constants.Colors.placehoder
  },
  shuttleContainer: {
    flex: 1,
    backgroundColor: Constants.Colors.White
    // paddingHorizontal: moderateScale(27)
  },
  textStyle: {
    paddingHorizontal: moderateScale(27),
    paddingVertical: moderateScale(10),
    fontSize: moderateScale(17),
    ...Constants.Fonts.TitilliumWebRegular,
    color: Constants.Colors.placehoder
  },

  buttonStyle: { flex: 0.5 },
  gradientStyle: { borderRadius: 0 },
  listStyle: {
    //  marginBottom: moderateScale(65)
  },
  itemContaier: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingVertical: moderateScale(15),
    borderBottomColor: Constants.Colors.gray,
    borderBottomWidth: 0.3
  },
  imageContainer: { paddingLeft: moderateScale(27) },
  shuttleImg: { height: moderateScale(30), width: moderateScale(30) },
  textContainer: {
    paddingHorizontal: moderateScale(10),
    alignItems: "flex-start",
    justifyContent: "center"
  },
  notFound: { justifyContent: "center", alignItems: "center" },
  titleText: {
    paddingLeft: moderateScale(20),
    fontSize: moderateScale(19),
    ...Constants.Fonts.TitilliumWebSemiBold,
    color: Constants.Colors.Primary
  },
  subText: {
    fontSize: moderateScale(17),
    ...Constants.Fonts.TitilliumWebRegular,
    color: Constants.Colors.placehoder
  },
  yellowBtn: {
    backgroundColor: Constants.Colors.Yellow,
    borderRadius: 100,
    padding: moderateScale(10),
    height: moderateScale(40),
    width: moderateScale(40),
    alignSelf: "center",
    position: "absolute",
    right: 0
  }
});
