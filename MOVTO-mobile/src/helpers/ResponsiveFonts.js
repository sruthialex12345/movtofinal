"use strict";

import { Dimensions, Platform, StatusBar } from "react-native";
const { width, height } = Dimensions.get("window");
import { isIphoneX } from "react-native-iphone-x-helper";

//Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 350;
const guidelineBaseHeight = 680;

const scale = size => (width / guidelineBaseWidth) * size;
const verticalScale = size => (height / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;
const RF = percent => {
  const deviceHeight = isIphoneX()
    ? height - 78 // iPhone X style SafeAreaView size in portrait
    : Platform.OS === "android"
      ? height - StatusBar.currentHeight
      : height;

  const heightPercent = (percent * deviceHeight) / 100;
  return Math.round(heightPercent);
};

export { scale, verticalScale, moderateScale, width, height, RF };
