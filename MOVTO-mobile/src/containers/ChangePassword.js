/*
Name : Gurtej Singh
File Name : DashBoard.js
Description : Contains the profile screen
Date : 17 Sept 2018
*/

import React, { Component } from "react";
import { View, Text } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import _ from "lodash";

import FloatingInput from "../components/common/FloatingInput";
import * as appActions from "../actions";
import Constants from "../constants";
import Styles from "../styles/container/changePassword";
import AuthButton from "../components/common/AuthButton";
import { toastMessage } from "../config/navigators";
import Regex from "../helpers/Regex";
import Header from "../components/common/Header";
import { moderateScale } from "../helpers/ResponsiveFonts";
class ChangePassword extends Component {
  constructor(props) {
    super(props);
    this.state = {
      oldPassword: "",
      newPassword: "",
      reNewPassword: ""
    };
  }
  static navigatorStyle = {
    navBarHidden: true,
    screenBackgroundColor: "transparent",
    modalPresentationStyle: "overFullScreen"
  };

  focusNext(next) {
    this[next].focus();
  }
  dismissModal = _.debounce(() => {
    // this.props.navigator.dismissModal({
    //   animationType: "slide-down"
    // });
  });

  changePassword = _.debounce(() => {
    let { oldPassword, newPassword, reNewPassword } = this.state;
    let { user, navigator } = this.props;
    let { email, userType } = user;
    if (_.isEmpty(oldPassword.trim())) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter old password."
      });
      return;
    }
    if (_.isEmpty(newPassword.trim())) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter new password."
      });
      return;
    }
    if (!Regex.validatePassword(newPassword)) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "The password must be minimum 8 characters long with at least one letter and one digit."
      });
      return;
    }
    if (_.isEmpty(reNewPassword.trim())) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please confirm new password."
      });
      return;
    }
    if (newPassword !== reNewPassword) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Your new password and confirmation password do not match."
      });
      return;
    }
    this.props.appActions.changePassword(
      {
        email,
        oldPassword,
        newPassword,
        userType
      },
      navigator
    );
    this.dismissModal();
  }, 500);

  render() {
    let HeaderHeight = moderateScale(60) + Constants.BaseStyle.StatusBarHeight();
    return (
      <View style={[Styles.container]}>
        <Header
          headerText={{ color: "#fff" }}
          hideDrawer
          navigator={this.props.navigator}
          color={Constants.Colors.Yellow}
          title={"Change Password"}
        />
        <KeyboardAwareScrollView
          style={Styles.scrollStyle}
          contentContainerStyle={Styles.scrollContainerStyle}
          scrollEnabled={true}
        >
          <View
            style={{
              height: Constants.BaseStyle.DEVICE_HEIGHT - HeaderHeight
            }}
          >
            <Text style={Styles.textStyle}>Please fill below details to reset password</Text>
            <View style={Styles.inputStyle}>
              <FloatingInput
                label={"Old Password"}
                autoCapitalize={"none"}
                value={this.state.oldPassword}
                onChangeText={oldPassword => {
                  this.setState({ oldPassword });
                }}
                returnKeyType="next"
                onSubmitEditing={() => {
                  this.focusNext("newPassword");
                }}
                secureTextEntry
                ref={ref => (this.oldPassword = ref)}
                isBlack={true}
              />
              <FloatingInput
                value={this.state.newPassword}
                autoCapitalize={"none"}
                label={"New Password"}
                onChangeText={newPassword => {
                  this.setState({ newPassword });
                }}
                returnKeyType="next"
                onSubmitEditing={() => {
                  this.focusNext("reNewPassword");
                }}
                secureTextEntry
                ref={ref => (this.newPassword = ref)}
                isBlack={true}
              />
              <FloatingInput
                value={this.state.reNewPassword}
                autoCapitalize={"none"}
                label={"Confirm Password"}
                onChangeText={reNewPassword => {
                  this.setState({ reNewPassword });
                }}
                returnKeyType="done"
                onSubmitEditing={() => {
                  this.changePassword();
                }}
                secureTextEntry
                ref={ref => (this.reNewPassword = ref)}
                isBlack={true}
              />
            </View>
            <View
              style={{
                flex: 0.2,
                justifyContent: "space-between",
                flexDirection: "row",
                borderColor: Constants.Colors.placehoder,
                borderWidth: 0.4,
                position: "absolute",
                bottom: moderateScale(-5),
                zIndex: 99
              }}
            >
              <AuthButton
                buttonStyle={Styles.buttonStyle}
                gradientStyle={Styles.gradientStyle}
                buttonName={"Cancel"}
                gradientColors={["#FFFFFF", "#FFFFFF"]}
                textStyle={{ color: Constants.Colors.Primary }}
                onPress={() => this.props.navigator.pop()}
                loading={this.props.loader && this.props.loader.changePasswordLoader}
              />
              <AuthButton
                buttonStyle={Styles.buttonStyle}
                gradientStyle={Styles.gradientStyle}
                gradientColors={["#F6CF65", "#F6CF65"]}
                buttonName={"Change"}
                onPress={() => this.changePassword()}
                textStyle={{ color: "#fff" }}
                loading={this.props.loader && this.props.loader.changePasswordLoader}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    );
  }
}
const mapDispatchToProps = dispatch => ({
  appActions: bindActionCreators(appActions, dispatch)
});
function mapStateToProps(state) {
  return {
    user: state.user,
    loader: state.loader
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChangePassword);
