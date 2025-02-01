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
  shadow: {
    shadowColor: "#A9AFAF",
    shadowOffset: { width: moderateScale(1), height: moderateScale(1) },
    shadowOpacity: moderateScale(0.8),
    shadowRadius: moderateScale(2),
    elevation: moderateScale(1)
  },
  searchWrapper: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(15),
    borderWidth: 0,
    flexDirection: "row",
    borderColor: "#A9AFAF",
    marginHorizontal: moderateScale(25),
    overflow: "hidden"
  },
  searchIcon: {
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
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: moderateScale(50)
    //borderWidth:2,
    // backgroundColor: "red"
  },
  inputStyleBorder: {
    borderBottomColor: "#A9AFAF",
    borderBottomWidth: 0.4
  },
  inputStyle: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(17),
    flex: 1,
    color: Constants.Colors.Black,
    //overflow: "hidden",
    alignItems: "flex-end",
    textAlignVertical: "center"
  },

  centerTextStyle: {
    ...Constants.Fonts.TitilliumWebBold,
    fontSize: moderateScale(24),
    textAlign: "center",
    color: Constants.Colors.Primary
  },
  crossImg: {
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(10)
  },
  terminalListing: {
    flexDirection: "column",
    marginTop: moderateScale(5),
    borderRadius: 0,
    borderWidth: 0,
    marginHorizontal: moderateScale(0),
    //backgroundColor: "green",
    height: Constants.BaseStyle.DEVICE_HEIGHT * 0.8,
    paddingBottom: moderateScale(20)
  },
  indicatorStyle: {
    //height: Constants.BaseStyle.DEVICE_HEIGHT-moderateScale(200),
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: moderateScale(10)
  },
  terminalView: {
    // flex: 1,
    paddingVertical: moderateScale(10),
    borderBottomWidth: 0.4,
    borderBottomColor: Constants.Colors.placehoder,
    flexDirection: "row",
    paddingHorizontal: moderateScale(15)
  },
  terminalName: { flex: 0.9 },
  terminalNameText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(19),
    color: Constants.Colors.Primary
  },
  terminalNameSubText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.placehoder
  },
  notFound: { justifyContent: "center", alignItems: "center" },
  titleText: {
    paddingLeft: moderateScale(20),
    fontSize: moderateScale(19),
    ...Constants.Fonts.TitilliumWebSemiBold,
    color: Constants.Colors.Primary
  }
});
