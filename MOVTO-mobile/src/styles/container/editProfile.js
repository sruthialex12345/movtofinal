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
    backgroundColor: "rgba(0,0,0,0.7)",
    height: Constants.BaseStyle.DEVICE_HEIGHT,
    justifyContent: "center",
    alignItems: "center"
  },
  closeBtnContainer: { flex: 0.1 },
  closeBtn: {
    paddingVertical: moderateScale(5),
    borderColor: Constants.Colors.Primary,
    backgroundColor: Constants.Colors.Transparent,
    borderWidth: 2,
    borderRadius: moderateScale(100),
    width: moderateScale(30),
    marginTop: moderateScale(20),
    justifyContent: "center",
    alignItems: "center"
  },
  closeBtnText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(16),
    color: Constants.Colors.Primary,
    textAlignVertical: "center"
  },
  modelContainer: {
    flex: 0.5,
    backgroundColor: Constants.Colors.White,
    width: Constants.BaseStyle.DEVICE_WIDTH,
    zIndex: 99999
  },

  heading: {
    flex: 0.1,
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(10)
  },
  headingText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(16),
    color: Constants.Colors.placehoder,
    textAlignVertical: "center"
  },
  scrollStyle: {
    flex: 0.9,
    paddingHorizontal: moderateScale(25)
  },
  scrollContainerStyle: { justifyContent: "center" },
  inputStyle: { flex: 0.6 },
  buttonStyle: { flex: 0.2 }
});
