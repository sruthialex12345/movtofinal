/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains Style for gradientImage component.
Date : 12 Sept 2018
*/
import { StyleSheet } from "react-native";
import Constants from "../../../constants";
import { moderateScale } from "../../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  mainAuthContainer: {
    flexDirection: "row",
    backgroundColor: Constants.Colors.Transparent,
    padding: moderateScale(20),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(15)
  },
  backButtonContainer: {
    flex: 0.1,
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(10)
  },
  headingContainer: {
    flex: 0.8,
    justifyContent: "center",
    alignItems: "center"
  },
  rightButton: {
    flex: 0.1
  },
  menuStyle: { alignSelf: "flex-end", paddingHorizontal: moderateScale(20) },
  triggerStyle: { flexDirection: "row", alignItems: "center" },
  images: { height: moderateScale(40), width: moderateScale(40) },
  optionsContainerStyle: { marginTop: 12, zIndex: 9999 },
  loginText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(16)
  },
  menuText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(20)
  },
  selectedMenu: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(20),
    paddingHorizontal: moderateScale(5),
    color: Constants.Colors.Newblack
  }
});
