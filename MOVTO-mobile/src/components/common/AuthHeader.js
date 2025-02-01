/*
Name : Gurtej Singh
File Name : AuthHeader.js
Description : Contains the header for auth screens.
Date : 12 Sept 2018
*/

import React from "react";
import { TouchableOpacity, View, Image, Text } from "react-native";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import Constants from "../../constants";
import Styles from "../../styles/component/Common/AuthHeader";
import SafeView from "./SafeView";

const Header = props => {
  let { heading, disableBack, navigator } = props;

  return (
    <View>
      <SafeView />
      <View style={[Styles.mainAuthContainer]}>
        {!disableBack ? (
          <View>
            <TouchableOpacity
              style={Styles.backButtonContainer}
              onPress={() => {
                navigator.pop();
              }}
            >
              <Image resizeMode="contain" style={{ width: moderateScale(30) }} source={Constants.Images.Common.Back} />
            </TouchableOpacity>
            <View style={Styles.headingContainer}>{heading ? <Text>{heading}</Text> : null}</View>
            <View style={Styles.rightButton} />
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default Header;
