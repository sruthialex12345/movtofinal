/*
Name : Gurtej Singh
File Name : GradientImage.js
Description : Contains the gradient for mainscreen.
Date : 11 Sept 2018
*/

import React from "react";
import { TouchableOpacity, View, Text, Image } from "react-native";

import Constants from "../../constants";
import LinearGradient from "react-native-linear-gradient";
import Styles from "../../styles/component/Common/GradientImage";

const GradientImage = props => {
  let { onPress, image, text } = props;

  return (
    <TouchableOpacity style={Styles.gradientContainer} onPress={onPress}>
      <View style={Styles.flex1Sec} />
      <LinearGradient colors={[Constants.Colors.Primary, Constants.Colors.Secondary]} style={Styles.gradient}>
        <View style={Styles.gradientDataContainer}>
          <View style={Styles.gradientImageContainer}>
            {image ? <Image source={image} style={Styles.gradientImage} resizeMode="contain" /> : null}
          </View>

          <View style={Styles.gradientTextContainer}>
            {text ? <Text style={Styles.gradientText}>{text}</Text> : null}
            <Image source={Constants.Images.Common.Arrow} style={Styles.arrow} />
          </View>
        </View>
      </LinearGradient>
      <View style={Styles.flex1Sec} />
    </TouchableOpacity>
  );
};

export default GradientImage;
