import { StyleSheet, Platform } from "react-native";
import * as defaultStyle from "../../style";
import { moderateScale } from "../../../../../helpers/ResponsiveFonts";

const STYLESHEET_ID = "stylesheet.calendar.header";

export default function(theme = {}) {
  const appStyle = { ...defaultStyle, ...theme };
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingLeft: moderateScale(10),
      paddingRight: moderateScale(10),
      alignItems: "center"
    },
    monthText: {
      fontSize: appStyle.textMonthFontSize,
      fontFamily: appStyle.textMonthFontFamily,
      fontWeight: appStyle.textMonthFontWeight,
      color: appStyle.monthTextColor,
      margin: moderateScale(10)
    },
    arrow: {
      padding: moderateScale(10)
    },
    arrowImage: {
      ...Platform.select({
        ios: {
          tintColor: appStyle.arrowColor
        },
        android: {
          tintColor: appStyle.arrowColor
        }
      })
    },
    week: {
      marginTop: moderateScale(7),
      flexDirection: "row",
      justifyContent: "space-around"
    },
    dayHeader: {
      marginTop: moderateScale(2),
      marginBottom: moderateScale(7),
      width: moderateScale(32),
      textAlign: "center",
      fontSize: appStyle.textDayHeaderFontSize,
      fontFamily: appStyle.textDayHeaderFontFamily,
      color: appStyle.textSectionTitleColor
    },
    ...(theme[STYLESHEET_ID] || {})
  });
}
