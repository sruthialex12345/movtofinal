/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains Style for Country Picker component.
Date : 12 Sept 2018
*/
import { StyleSheet } from "react-native";
import Constants from "../../../constants";
import { moderateScale } from "../../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  picker: {
    paddingRight: moderateScale(10),
    paddingLeft: 0,
    marginTop: moderateScale(18),
    borderBottomColor: Constants.Colors.gray,
    borderBottomWidth: 1
  },
  flagStyle: {
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "row",
    paddingVertical: moderateScale(10)
  },
  modalContainer: {
    backgroundColor: Constants.Colors.Yellow
  },
  contentContainer: {
    backgroundColor: Constants.Colors.White
  },
  header: {
    backgroundColor: Constants.Colors.Yellow
  },
  itemCountryName: {
    borderBottomWidth: 0
  },
  countryName: {
    color: Constants.Colors.Primary,
    ...Constants.Fonts.TitilliumWebRegular,
    height: moderateScale(20)
  },
  letterText: {
    color: Constants.Colors.Primary,
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(13)
  },
  input: {
    ...Constants.Fonts.TitilliumWebRegular,
    color: Constants.Colors.Primary
  },

  TextStyle: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(18),
    color: Constants.Colors.Black,
    textAlign: "center",
    textAlignVertical: "bottom",
    paddingLeft: moderateScale(5)
  }
});
