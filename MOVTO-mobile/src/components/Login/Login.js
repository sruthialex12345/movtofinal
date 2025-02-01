/*
Name : Gurtej Singh
File Name : Login.js
Description : Contains the login screen.
Date : 10 sept 2018
*/
import React, { Component } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { connect } from "react-redux";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import _ from "lodash";
import ArrowButton from "../../components/common/ArrowButton";
import Button from "../../components/common/Button";
import Welcome from "../../components/common/WelcomeLogo";
import FloatingInput from "../../components/common/FloatingInput";
import Styles from "../../styles/container/loginScreen";
import * as appActions from "../../actions";
import { toastMessage } from "../../config/navigators";
import Regex from "../../helpers/Regex";
import Constants from "../../constants";

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      userType: props.userType
    };
  }
  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.userType !== prevState.userType) {
      return {
        userType: nextProps.userType
      };
    } else return null;
  }

  focusNext(next) {
    this[next].focus();
  }
  onLoginPress = _.debounce(() => {
    let { navigator, dispatch, user } = this.props;
    let { deviceToken, deviceType } = user;
    let { userType, email, password } = this.state;
    if (_.isEmpty(email.trim())) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: Constants.Strings.Common.EmptyEmailMsg
      });
      return;
    }
    if (!Regex.validateEmail(email.trim())) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: Constants.Strings.Common.ValidEmailAddress
      });
      return;
    }
    if (_.isEmpty(password.trim())) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: Constants.Strings.Common.EnterPassword
      });
      return;
    }
    if (userType === Constants.AppConstants.UserTypes.Rider) {
      dispatch(
        appActions.signIn({ email, password, userType, device: { token: deviceToken, type: deviceType } }, navigator)
      );
    }
    if (userType === Constants.AppConstants.UserTypes.Driver) {
      dispatch(
        appActions.signInDriver(
          { email, password, userType, device: { token: deviceToken, type: deviceType } },
          navigator
        )
      );
    }
    if (userType === Constants.AppConstants.UserTypes.Admin) {
      dispatch(
        appActions.signInAdmin(
          { email, password, userType, device: { token: deviceToken, type: deviceType } },
          navigator
        )
      );
    }
  }, 500);

  render() {
    let { navigator, loader, userType } = this.props;
    return (
      <View style={{ flex: 1 }}>
        <KeyboardAwareScrollView showsVerticalScrollIndicator={false} scrollEnabled={true} extraScrollHeight={40}>
          <Welcome
            logoStyle={Styles.logoStyle}
            heading={Constants.Strings.Login.Heading}
            message={Constants.Strings.Login.LoginMsg}
          />
          <View style={[Styles.scrollHeight, {}]}>
            <View style={[Styles.wrapper, {}]}>
              <View style={Styles.FloatingInputContainer}>
                <FloatingInput
                  label={Constants.Strings.Login.UserName}
                  onChangeText={email => {
                    this.setState({ email });
                  }}
                  value={this.state.email}
                  keyboardType={"email-address"}
                  returnKeyType={"next"}
                  autoCapitalize={"none"}
                  ref={ref => (this.email = ref)}
                  onSubmitEditing={() => {
                    this.focusNext("password");
                  }}
                  isBlack={true}
                />
                <FloatingInput
                  label={Constants.Strings.Login.Password}
                  onChangeText={password => {
                    this.setState({ password });
                  }}
                  value={this.state.password}
                  returnKey="done"
                  onSubmitEditing={() => {
                    this.onLoginPress();
                  }}
                  autoCapitalize={"none"}
                  secureTextEntry
                  ref={ref => (this.password = ref)}
                  isBlack={true}
                />
              </View>
              {userType == Constants.AppConstants.UserTypes.Rider ? (
                <View style={[Styles.signBtn, {}]}>
                  <TouchableOpacity
                    style={Styles.policy}
                    onPress={() => {
                      navigator.push({
                        screen: "ForgotPassword",
                        passProps: { userType: this.state.userType }
                      });
                    }}
                  >
                    <Text style={Styles.policyText}>{Constants.Strings.Login.ForgotPassword}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              {userType == Constants.AppConstants.UserTypes.Driver ? (
                <View style={[Styles.signBtn, {}]}>
                  <TouchableOpacity
                    style={Styles.policy}
                    onPress={() => {
                      navigator.push({
                        screen: "ClearSession",
                        passProps: { userType: this.state.userType }
                      });
                    }}
                  >
                    <Text style={Styles.policyText}>{Constants.Strings.Login.ClearSession}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
            {/* <View style={{ flex: 0.5 }} /> */}
            <View style={[Styles.backgroundImage, {}]}>
              <ArrowButton
                gradientColors={[Constants.Colors.Yellow, Constants.Colors.Yellow]}
                onPress={() => this.onLoginPress()}
                loading={loader && loader.loginLoader}
                style={[Styles.buttonStyle]}
              />
              {userType == Constants.AppConstants.UserTypes.Rider ? (
                <View style={[Styles.signBtn]}>
                  <Text style={Styles.newUser}>{Constants.Strings.Login.NewUser}</Text>
                  <Button
                    buttonName={Constants.Strings.Login.Signup}
                    buttonStyle={Styles.signBtnStyle}
                    textStyle={Styles.signTxtStyle}
                    onPress={() => {
                      navigator.push({
                        screen: "SignupScreen",
                        passProps: { userType: this.state.userType },
                        animated: true,
                        animationType: "slide-horizontal"
                      });
                    }}
                  />
                </View>
              ) : null}
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    );
  }
}
function mapStateToProps(state) {
  return {
    loader: state.loader,
    user: state.user
  };
}

export default connect(mapStateToProps)(Login);
