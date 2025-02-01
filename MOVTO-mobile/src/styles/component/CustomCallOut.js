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
  container: {
    backgroundColor: Constants.Colors.White,
    width: moderateScale(100),
    padding: moderateScale(8),
    justifyContent: "center",
    alignItems: "center"
  },
  terminalView: { paddingVertical: moderateScale(5) },
  terminalText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(13),
    color: Constants.Colors.placehoder
  },
  infoView: {
    flexDirection: "row",
    justifyContent: "space-between",
    //backgroundColor: "red",
    width: moderateScale(100),
    paddingHorizontal: moderateScale(5)
  },
  userImgWrapper: {
    flexDirection: "row",
    flex: 0.5,
    //backgroundColor: "green",
    alignItems: "center",
    justifyContent: "space-around"
  },
  userimg: {
    height: moderateScale(25),
    width: moderateScale(25),
    borderRadius: moderateScale(100),
    backgroundColor: Constants.Colors.gray,
    justifyContent: "center",
    alignItems: "center"
  },
  passangersCount: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(16)
  },
  timeWrapper: {
    flexDirection: "row",
    flex: 0.5,
    alignItems: "center",
    justifyContent: "space-around"
  },
  reachTime: {
    height: moderateScale(25),
    width: moderateScale(25),
    borderRadius: moderateScale(100),
    backgroundColor: Constants.Colors.Yellow,
    justifyContent: "center",
    alignItems: "center"
  },
  timeText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(16)
  }
});
