/*
Name : Gurtej Singh
File Name : AuthButton.js
Description : Contains the header for auth screens.
Date : 12 Sept 2018
*/

import React from "react";
import { TouchableOpacity, View, Image, Text, ActivityIndicator } from "react-native";
import LinearGradient from "react-native-linear-gradient";

import Constants from "../../constants";
import Styles from "../../styles/component/Common/AuthButton";
import { moderateScale } from "../../helpers/ResponsiveFonts";
const Button = props => {
  let {
    buttonName,
    buttonStyle,
    gradientStyle,
    textStyle,
    onPress,
    arrow,
    gradientColors,
    loading,
    icon,
    disabled
  } = props;

  return (
    <TouchableOpacity
      style={[Styles.buttonContainer, buttonStyle, { backgroundColor: "white" }]}
      onPress={onPress}
      disabled={disabled}
    >
      <LinearGradient
        colors={gradientColors || [Constants.Colors.Primary, Constants.Colors.Secondary]}
        style={[Styles.gradientStyle, gradientStyle]}
      >
        {loading ? (
          <ActivityIndicator size="large" color={Constants.Colors.White} />
        ) : (
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <View style={{ flexDirection: "row" }}>
              {icon ? (
                <Image
                  source={icon}
                  style={{ alignSelf: "center", height: moderateScale(16), width: moderateScale(18) }}
                  resizeMode={"contain"}
                />
              ) : null}
              <Text style={[Styles.buttonText, textStyle]}>{buttonName}</Text>
            </View>
            {arrow ? <Image source={Constants.Images.Common.Next} /> : null}
          </View>
        )}
      </LinearGradient>
      {/* <View style={{ flex: 0.7 }} /> */}
    </TouchableOpacity>
  );
};

export default Button;
