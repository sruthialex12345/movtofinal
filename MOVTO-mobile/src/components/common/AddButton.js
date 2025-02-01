/*
Name : Gurtej Singh
File Name : AddButton.js
Description : Contains the add button.
Date : 19 Nov 2018
*/

import React from "react";
import { TouchableOpacity, Image } from "react-native";
// import LinearGradient from "react-native-linear-gradient";
import Constants from "../../constants";
// import Styles from "../../styles/component/Common/AuthButton";
import { moderateScale } from "../../helpers/ResponsiveFonts";
const AddButton = props => {
  let { buttonStyle, onPress, src } = props;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          position: "absolute",
          backgroundColor: "black",
          height: moderateScale(50),
          width: moderateScale(50),
          borderRadius: moderateScale(100),
          bottom: Constants.BaseStyle.DEVICE_WIDTH / 1.7,
          right: moderateScale(20),
          zIndex: 99,
          alignItems: "center",
          justifyContent: "center"
        },
        buttonStyle
      ]}
    >
      <Image
        source={src ? src : Constants.Images.Common.YellowAccept}
        style={{
          height: moderateScale(25),
          width: moderateScale(25)
        }}
      />
    </TouchableOpacity>
  );
};

export default AddButton;
