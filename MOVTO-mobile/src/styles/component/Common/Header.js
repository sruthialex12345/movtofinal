/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains Style for Auth button component.
Date : 13 Sept 2018
*/

import { StyleSheet } from "react-native";
import Constants from "../../../constants";
import { moderateScale } from "../../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(15),
    flexDirection: "row",
    backgroundColor: Constants.Colors.transparent
  },
  iconBtn: {
    height: moderateScale(40),
    width: moderateScale(50),
    justifyContent: "center",
    alignItems: "center"
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    height: moderateScale(40),
    width: Constants.BaseStyle.DEVICE_WIDTH - moderateScale(110)
  },
  headerText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    color: Constants.Colors.White,
    fontSize: moderateScale(21),
    textAlign: "center",
    textAlignVertical: "center"
  },
  subHeaderText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    color: Constants.Colors.White,
    fontSize: moderateScale(16),
    textAlign: "center",
    textAlignVertical: "center"
  },
  searchBox: {
    borderColor: Constants.Colors.transparent,
    borderRadius: 0,
    marginTop: moderateScale(0),
    marginHorizontal: moderateScale(5),
    justifyContent: "flex-start",
    alignItems: "center",
    height: moderateScale(40),
    flexDirection: "row",
    width: Constants.BaseStyle.DEVICE_WIDTH / 1.4
  },
  inputStyle: {
    color: Constants.Colors.Primary,
    flex: 1,
    paddingHorizontal: moderateScale(5),
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    paddingVertical: moderateScale(5)
  },
  skip: {
    color: Constants.Colors.gray,
    paddingHorizontal: moderateScale(5),
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(16),
    textAlign: "right"
  }
});
