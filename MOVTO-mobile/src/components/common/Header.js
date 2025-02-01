/*
Name : Gurtej Singh
File Name : AuthHeader.js
Description : Contains the header screens.
Date : 17 Sept 2018
*/

import React from "react";
import { TouchableOpacity, View, Image, Text } from "react-native";

import Constants from "../../constants";
import Styles from "../../styles/component/Common/Header";
import SafeView from "./SafeView";
import FormTextInput from "./FormTextInput";
import { moderateScale } from "../../helpers/ResponsiveFonts";

const Header = props => {
  let {
    hideBack,
    hideDrawer,
    color,
    subTitle,
    title,
    rightIcon,
    onRightPress,
    rightText,
    navigator,
    headerText,
    onBackPress,
    searchBox,
    onChangeSearchText,
    searchText,
    searchPlaceHolder,
    rightComponent
  } = props;
  return (
    <View style={{ backgroundColor: color || Constants.Colors.Yellow }}>
      <SafeView />
      <View style={[Styles.container, { backgroundColor: color, paddingVertical: !searchBox ? moderateScale(15) : 0 }]}>
        {!hideDrawer ? (
          <TouchableOpacity
            style={Styles.iconBtn}
            onPress={() => {
              navigator.toggleDrawer({
                side: "left"
              });
            }}
          >
            <Image
              source={Constants.Images.Drawer.Toggle}
              resizeMode={"contain"}
              style={{ height: moderateScale(35), width: moderateScale(35) }}
            />
          </TouchableOpacity>
        ) : !hideBack ? (
          <TouchableOpacity
            style={Styles.iconBtn}
            onPress={() => {
              onBackPress ? onBackPress() : navigator.pop();
            }}
          >
            <Image source={Constants.Images.Common.Back} resizeMode={"contain"} style={{ paddingRight: 100 }} />
          </TouchableOpacity>
        ) : (
          <View style={Styles.iconBtn} />
        )}
        <View
          style={[
            Styles.header,
            {
              justifyContent: searchBox ? "flex-start" : "center",
              alignItems: searchBox ? "flex-start" : "center"
            }
          ]}
        >
          {searchBox ? (
            <FormTextInput
              autoFocus={true}
              onChangeText={text => onChangeSearchText(text)}
              value={searchText}
              placeHolderText={searchPlaceHolder}
              style={Styles.searchBox}
              inputStyle={Styles.inputStyle}
              placeHolderColor={Constants.Colors.placehoder}
            />
          ) : null}
          {title ? (
            <Text numberOfLines={2} style={[Styles.headerText, headerText]}>
              {title}
            </Text>
          ) : null}
          {subTitle ? (
            <Text numberOfLines={1} style={Styles.subHeaderText}>
              {subTitle}
            </Text>
          ) : null}
        </View>
        {rightIcon ? (
          <TouchableOpacity style={Styles.iconBtn} onPress={() => onRightPress()}>
            <Image
              source={rightIcon}
              resizeMode={"contain"}
              style={{ height: moderateScale(22), width: moderateScale(22) }}
            />
          </TouchableOpacity>
        ) : rightText ? (
          <TouchableOpacity style={Styles.iconBtn} onPress={() => onRightPress()}>
            <Text style={Styles.skip}>{rightText}</Text>
          </TouchableOpacity>
        ) : rightComponent ? (
          <View style={[Styles.iconBtn, { paddingRight: moderateScale(30) }]}>{rightComponent}</View>
        ) : null}
      </View>
    </View>
  );
};

export default Header;
