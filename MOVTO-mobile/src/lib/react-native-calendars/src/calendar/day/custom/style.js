import { StyleSheet, Platform } from "react-native";
import * as defaultStyle from "../../../style";
import { moderateScale } from "../../../../../../helpers/ResponsiveFonts";

const STYLESHEET_ID = "stylesheet.day.single";

export default function styleConstructor(theme = {}) {
  const appStyle = { ...defaultStyle, ...theme };
  return StyleSheet.create({
    base: {
      width: moderateScale(32),
      height: moderateScale(32),
      alignItems: "center"
    },
    text: {
      marginTop: Platform.OS === "android" ? 4 : 6,
      fontSize: appStyle.textDayFontSize,
      fontFamily: appStyle.textDayFontFamily,
      fontWeight: "300",
      color: appStyle.dayTextColor,
      backgroundColor: "rgba(255, 255, 255, 0)"
    },
    alignedText: {
      marginTop: Platform.OS === "android" ? 4 : 6
    },
    selected: {
      backgroundColor: appStyle.selectedDayBackgroundColor,
      borderRadius: moderateScale(20)
    },
    today: {
      backgroundColor: appStyle.todayBackgroundColor
    },
    todayText: {
      color: appStyle.todayTextColor
    },
    selectedText: {
      color: appStyle.selectedDayTextColor
    },
    disabledText: {
      color: appStyle.textDisabledColor
    },
    ...(theme[STYLESHEET_ID] || {})
  });
}
