/*
Name : Gurtej Singh
File Name : WelcomeLogo.js
Description : Contains the WelcomeLogo for auth screens.
Date : 12 Sept 2018
*/

import React from "react";
import { View, Image, Text } from "react-native";

import Constants from "../../constants";
import Styles from "../../styles/component/Common/WelcomeLogo";
import { moderateScale } from "../../helpers/ResponsiveFonts";

const WelcomeLogo = props => {
  let { heading, message, headingStyle, messageStyle, containerStyle, logo, logoStyle } = props;
  return (
    <View style={[Styles.welcomeLogoContainer, containerStyle, { paddingTop: moderateScale(10) }]}>
      <View style={[Styles.logoStyle, logoStyle]}>
        <Image
          source={logo || Constants.Images.Common.Logo}
          resizeMode={"contain"}
          style={{ height: moderateScale(80), width: moderateScale(60) }}
        />
      </View>
      {heading ? <Text style={[Styles.welcomeText, headingStyle]}>{heading}</Text> : null}
      {message ? <Text style={[Styles.screenText, messageStyle]}>{message} </Text> : null}
    </View>
  );
};

export default WelcomeLogo;
