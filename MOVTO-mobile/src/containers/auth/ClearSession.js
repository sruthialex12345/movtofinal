/*
Name : Gurtej Singh
File Name : ForgotPassword.js
Description : Contains ForgotPassword.
Date : 12 Sept 2018
*/
import React, { Component } from "react";
import { View } from "react-native";
import { connect } from "react-redux";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import _ from "lodash";

import ArrowButton from "../../components/common/ArrowButton";
import Constants from "../../constants";
import Header from "../../components/common/AuthHeader";
import Welcome from "../../components/common/WelcomeLogo";
import Styles from "../../styles/container/forgotPassword";
import * as appActions from "../../actions";
import Regex from "../../helpers/Regex";
import { toastMessage } from "../../config/navigators";
import FloatingInput from "../../components/common/FloatingInput";

// this is a traditional React component connected to the redux store
class ClearSession extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      accessCode: ""
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };
  focusNext(next) {
    this[next].focus();
  }
  moveToNextStep = _.debounce(() => {
    let { email, password, accessCode } = this.state;
    let { userType, user } = this.props;
    let { deviceToken, deviceType } = user;
    let { navigator } = this.props;
    if (_.isEmpty(email.trim())) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter an email address."
      });
      return;
    }
    if (!Regex.validateEmail(email.trim())) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter a valid email address."
      });
      return;
    }
    if (_.isEmpty(password.trim())) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter your password."
      });
      return;
    }
    if (_.isEmpty(accessCode.trim())) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter your access code."
      });
      return;
    }
    this.props.dispatch(
      appActions.clearSession(
        { email, password, accessCode, userType, device: { token: deviceToken, type: deviceType } },
        navigator
      )
    );
  });

  render() {
    return (
      <View style={Styles.container}>
        <Header navigator={this.props.navigator} />
        <KeyboardAwareScrollView scrollEnabled={true}>
          <View style={Styles.wrapperContainer}>
            <Welcome
              heading={"Want to clear session?"}
              message={"Enter below details to clear your previous session."}
            />
            <View style={[Styles.scrollHeight, {}]}>
              <View style={Styles.wrapper}>
                <View style={Styles.FloatingInputContainer}>
                  <FloatingInput
                    label={"Email"}
                    onChangeText={email => {
                      this.setState({ email });
                    }}
                    value={this.state.email}
                    returnKeyType={"next"}
                    keyboardType={"email-address"}
                    autoCapitalize={"none"}
                    ref={ref => (this.email = ref)}
                    isBlack={true}
                    onSubmitEditing={() => {
                      this.focusNext("password");
                    }}
                  />
                  <FloatingInput
                    label={"Password"}
                    onChangeText={password => {
                      this.setState({ password });
                    }}
                    value={this.state.password}
                    secureTextEntry
                    returnKeyType={"next"}
                    autoCapitalize={"none"}
                    ref={ref => (this.password = ref)}
                    isBlack={true}
                    onSubmitEditing={() => {
                      this.focusNext("accessCode");
                    }}
                  />
                  <FloatingInput
                    label={"Access code"}
                    onChangeText={accessCode => {
                      this.setState({ accessCode });
                    }}
                    value={this.state.accessCode}
                    returnKeyType={"done"}
                    secureTextEntry
                    autoCapitalize={"none"}
                    ref={ref => (this.accessCode = ref)}
                    onSubmitEditing={() => {
                      this.moveToNextStep();
                    }}
                    isBlack={true}
                  />
                </View>
                <View style={Styles.signBtn} />
              </View>
              <View style={[Styles.backgroundImage]}>
                <ArrowButton
                  gradientColors={[Constants.Colors.Yellow, Constants.Colors.Yellow]}
                  onPress={() => this.moveToNextStep()}
                  loading={this.props.loader && this.props.loader.clearSessionLoader}
                />
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    );
  }
}

// which props do we want to inject, given the global state?
function mapStateToProps(state) {
  return {
    loader: state.loader,
    user: state.user
  };
}

export default connect(mapStateToProps)(ClearSession);
