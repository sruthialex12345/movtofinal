/**
 * Name :Gurtej Singh
 * File Name : PopOver.js
 * Description : Contains the login PopOver
 * Date : 7 Sept 2018
 */
import React from "react";

import { View, Text, Image, TouchableOpacity } from "react-native";

import Menu, { MenuItem, MenuDivider } from "../../lib/react-native-material-menu";
import Constants from "../../constants";
import SafeView from "./SafeView";
import Styles from "../../styles/component/Common/AuthHeader";
import { moderateScale } from "../../helpers/ResponsiveFonts";

class PopOver extends React.Component {
  _menu = null;
  constructor(props) {
    super(props);
  }

  setMenuRef = ref => {
    this._menu = ref;
  };

  hideMenu = () => {
    this._menu.hide();
  };

  showMenu = () => {
    this._menu.show();
  };
  onChange = id => {
    let { onUserChange } = this.props;
    this.hideMenu();
    // if (id != Constants.AppConstants.UserTypes.Rider) {
    //   setTimeout(() => {
    //     alert("Under Development");
    //   }, 300);
    // } else {
    onUserChange(id);
    // }
  };
  render() {
    let { userType } = this.props;
    let userTypes = [
      { id: Constants.AppConstants.UserTypes.Rider, value: "User" },
      { id: Constants.AppConstants.UserTypes.Driver, value: "Driver" },
      { id: Constants.AppConstants.UserTypes.Admin, value: "Admin" }
    ];
    return (
      <TouchableOpacity style={{ alignItems: "flex-end" }} onPress={this.showMenu}>
        <SafeView />
        <Menu
          userIs={userType}
          ref={this.setMenuRef}
          button={
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Text style={Styles.selectedMenu}>
                Sign in as{" "}
                {userType === Constants.AppConstants.UserTypes.Rider
                  ? "User"
                  : userType === Constants.AppConstants.UserTypes.Admin
                    ? "Admin"
                    : "Driver"}
              </Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#A9AFAF",
                  borderRadius: moderateScale(200),
                  height: moderateScale(50),
                  width: moderateScale(50),
                  overflow: "hidden",
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                <Image
                  source={
                    userType === Constants.AppConstants.UserTypes.Rider
                      ? Constants.Images.Common.Rider
                      : userType === Constants.AppConstants.UserTypes.Admin
                        ? Constants.Images.Common.Admin
                        : Constants.Images.Common.Driver
                  }
                  resizeMode={"contain"}
                  style={{
                    // marginLeft: 5,
                    height: moderateScale(50),
                    width: moderateScale(50)
                  }}
                />
              </View>
            </View>
          }
          // style={{
          //   top: Platform.OS == "ios" ? moderateScale(85) : moderateScale(30),
          //   right: moderateScale(30)
          // }}
        >
          {userTypes.map(item => {
            if (item.id != userType) {
              return (
                <View key={item.id} style={{ height: moderateScale(50) }}>
                  <MenuItem
                    key={item.id}
                    onPress={() => {
                      this.onChange(item.id);
                    }}
                    textStyle={{
                      ...Constants.Fonts.TitilliumWebRegular,
                      fontSize: moderateScale(20),
                      color: Constants.Colors.gray,
                      textAlign: "right"
                    }}
                    style={{ width: moderateScale(135) }}
                  >
                    {item.value}
                  </MenuItem>
                  <MenuDivider color={Constants.Colors.placehoder} />
                </View>
              );
            } else {
              return null;
            }
          })}
        </Menu>
      </TouchableOpacity>
    );
  }
}

export default PopOver;
