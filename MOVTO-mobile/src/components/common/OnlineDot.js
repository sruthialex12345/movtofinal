import React from "react";
import { View } from "react-native";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import Constants from "../../constants";

const OnlineDot = props => {
  /**
   * componant is used for show dot.
   * @param dotStyle is an object of style use for change dot style
   * @param color is used for change color of dot
   * @param size is used for change size of dot
   */

  let { dotStyle, color, size, overlay } = props;
  if (overlay) {
    return (
      <View
        style={[
          {
            position: "absolute",
            height: moderateScale(size) || moderateScale(10),
            width: moderateScale(size) || moderateScale(10),
            borderRadius: moderateScale(100),
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99,
            backgroundColor: Constants.Colors.White
          },
          dotStyle
        ]}
      >
        <View
          style={[
            {
              position: "absolute",
              height: moderateScale(size - size / 3) || moderateScale(7),
              width: moderateScale(size - size / 3) || moderateScale(7),
              borderRadius: moderateScale(100),
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99
            },
            {
              backgroundColor: color || Constants.Colors.Yellow
            }
          ]}
        />
      </View>
    );
  } else {
    return (
      <View
        style={[
          {
            position: "absolute",
            height: moderateScale(size) || moderateScale(10),
            width: moderateScale(size) || moderateScale(10),
            borderRadius: moderateScale(100),
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99
          },
          dotStyle,
          {
            backgroundColor: color || Constants.Colors.Yellow
          }
        ]}
      />
    );
  }
};

export default OnlineDot;
