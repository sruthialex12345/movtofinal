/*
Name : Gurtej Singh
File Name : ArrowButton.js
Description : Contains the arrow button.
Date : 20 Sept 2018
*/

import React from "react";
import { TouchableOpacity, Image, ActivityIndicator } from "react-native";
import LinearGradient from "react-native-linear-gradient";

import Constants from "../../constants";
import Styles from "../../styles/component/Common/AuthButton";
import { moderateScale } from "../../helpers/ResponsiveFonts";

const Button = props => {
  let { buttonStyle, onPress, gradientColors, loading, opacity, disabled } = props;
  return (
    <TouchableOpacity
      style={[Styles.buttonContainer, buttonStyle]}
      onPress={onPress}
      activeOpacity={opacity}
      disabled={disabled}
    >
      <LinearGradient
        colors={gradientColors || [Constants.Colors.Primary, Constants.Colors.Secondary]}
        style={[
          Styles.gradientStyle,
          {
            borderRadius: moderateScale(200),
            height: moderateScale(48),
            width: moderateScale(48)
          }
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={Constants.Colors.White}
            style={{ height: moderateScale(20), width: moderateScale(20) }}
          />
        ) : (
          <Image
            source={Constants.Images.Common.Proceed}
            resizeMode={"contain"}
            style={{
              height: moderateScale(48),
              width: moderateScale(48)
            }}
          />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default Button;
