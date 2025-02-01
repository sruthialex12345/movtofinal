/*
Name : Gurtej Singh
File Name : RightComponent.js
Description : Contains the DriverTripListing  screen
Date : 29 Nov 2018
*/
import React from "react";
import { View, Image } from "react-native";
import Constants from "../../constants";
import OnlineDot from "./OnlineDot";
import { moderateScale } from "../../helpers/ResponsiveFonts";

/**
 *
 * @param {source, icon} props used to pass default icon or if having source.
 */
const RightComponent = props => {
  let { source, icon } = props;
  return (
    <View
      style={{
        height: moderateScale(40),
        width: moderateScale(40),
        borderRadius: moderateScale(100),
        borderWidth: 0.4,
        overflow: "hidden",
        backgroundColor: Constants.Colors.White,
        borderColor: Constants.Colors.gray
      }}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={{
            height: moderateScale(40),
            width: moderateScale(40)
          }}
          resizeMode={"center"}
        />
      ) : (
        <Image source={icon} />
      )}
      <OnlineDot
        overlay
        dotStyle={{
          bottom: moderateScale(5),
          right: moderateScale(5)
        }}
      />
    </View>
  );
};

export default RightComponent;
