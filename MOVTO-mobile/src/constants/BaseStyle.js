/*
 * @file: BaseStyle.js
 * @description: Base Style for the application

 * */

"use-strict";
//Guru - 12/18/2019 -  Fixed Dimensions for RN 0.61.5
import { Platform, Dimensions } from "react-native";
import { moderateScale } from "../helpers/ResponsiveFonts";
// Precalculate Device Dimensions for better performance
const x = Dimensions.get("window").width;
const y = Dimensions.get("window").height;

// Calculating ratio from Phone breakpoints
const ratioX = x < 375 ? (x < 320 ? 0.75 : 0.875) : 1;
const ratioY = y < 568 ? (y < 480 ? 0.75 : 0.875) : 1;

// We set our base font size value
const base_unit = 16;

// We're simulating EM by changing font size according to Ratio
const unit = base_unit * ratioX;

// We add an em() shortcut function
function em(value) {
  return unit * value;
}
const isIphoneX = () => {
  const d = Dimensions.get("window");
  const isX = Platform.OS === "ios" && !Platform.isPad && (d.height > 800 || d.width > 800) ? true : false;
  return isX;
};
const StatusBarHeight = () => {
  let height =
    Platform.OS === "ios"
      ? BaseStyle.isIphoneX()
        ? moderateScale(50)
        : moderateScale(30)
      : moderateScale(40);
  return height;
};
const aspectRatio = x / y;
// Then we set our styles with the help of the em() function
const BaseStyle = {
  // GENERAL
  DEVICE_WIDTH: x,
  DEVICE_HEIGHT: y,
  RATIO_X: ratioX,
  RATIO_Y: ratioY,
  UNIT: em(1),
  PADDING: em(1.25),
  MARGIN: em(1.5),
  MARGINHORIZONTAL: em(0.5),

  // DRAWER
  DRAWER_WIDTH: x * 0.53,
  DRAWER_HEIGHT: y,
  DRAWER_OFFSET: 0.3,

  // CARD
  CARD_WIDTH: x - em(1.25) * 2,
  CARD_HEIGHT: (x - em(1.25) * 2) * (3 / 5),
  CARD_PADDING_X: em(1.875),
  CARD_PADDING_Y: em(1.25),

  // FONT
  LITTLE_BOLD: "200",
  BOLD: "400",
  BOLDER: "800",
  FONT_SIZE: em(1),
  FONT_SIZE_SMALLER: em(0.75),
  FONT_SIZE_SMALL: em(0.875),
  FONT_SIZE_TITLE: em(1.25),

  //header

  HEADER_HEIGHT: (x / 100) * 15,

  HIT_SLOP: { top: 10, left: 10, right: 10, bottom: 10 },

  HALF_HIT_SLOP: { top: 5, left: 5, right: 5, bottom: 5 },
  isIphoneX,
  aspectRatio,
  StatusBarHeight
};

module.exports = BaseStyle;
