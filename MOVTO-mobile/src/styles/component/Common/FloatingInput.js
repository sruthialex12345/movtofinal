/*
Name : Gurtej Singh
File Name : Styles.js
Description : Contains Style for Floating Input component.
Date : 12 Sept 2018
*/

import { StyleSheet } from "react-native";
import Constants from "../../../constants";
import { moderateScale } from "../../../helpers/ResponsiveFonts";
export default StyleSheet.create({
  container: {
    paddingVertical: moderateScale(15)
  },
  inputStyle: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    height: moderateScale(50),
    fontSize: moderateScale(20),
    color: Constants.Colors.Black
    //backgroundColor:'red',
    // width:Constants.BaseStyle.DEVICE_WIDTH*0.5
  },
  inputWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: Constants.Colors.gray
    //backgroundColor: "#aabbcc"
  },
  cancelImg: {
    backgroundColor: "#A9AFAF",
    width: 30,
    height: 30,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center"
  },
  submitImg: {
    backgroundColor: "#F6CF65",
    width: 30,
    height: 30,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center"
  },
  pad5: { padding: 5 }
});
