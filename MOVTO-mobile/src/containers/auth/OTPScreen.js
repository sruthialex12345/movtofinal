/*
Name : Gurtej Singh
File Name : OTPScreen.js
Description : Contains OTPScreen.
Date : 12 Sept 2018
*/
import React, { Component } from "react";
import { View, Text } from "react-native";
import { connect } from "react-redux";
import OtpInputs from "react-native-otp-inputs";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import _ from "lodash";

import ArrowButton from "../../components/common/ArrowButton";
import Constants from "../../constants";
import Header from "../../components/common/AuthHeader";
import Welcome from "../../components/common/WelcomeLogo";
import Styles from "../../styles/container/OTPScreen";
import * as appActions from "../../actions";
import { toastMessage } from "../../config/navigators";
import Button from "../../components/common/Button";

class OTPScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      otp: null
    };
  }

  static navigatorStyle = {
    navBarHidden: true
  };

  resendOTP = _.debounce(() => {
    let { _id } = this.props.user;
    let { navigator } = this.props;
    this.props.dispatch(appActions.resendOTP({ userId: _id }, navigator));
  });

  verifyOTP = _.debounce(() => {
    let { otp } = this.state;
    let { _id } = this.props.user;
    if (_.isEmpty(otp)) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter OTP, Sent on your number."
      });
      return;
    }
    this.props.dispatch(appActions.verifyOTP({ otpValue: parseInt(otp), userId: _id }, this.props.navigator));
  });

  render() {
    let { phoneNo, isdCode } = this.props.user;
    let { otpLoader } = this.props.loader;
    return (
      <View style={Styles.container}>
        <KeyboardAwareScrollView scrollEnabled={false}>
          <Header navigator={this.props.navigator} />
          <View style={Styles.wrapperScroll}>
            <Welcome
              logoStyle={Styles.logoStyle}
              heading="Verification"
              message={"Please type verification code sent to +" + isdCode + "-" + phoneNo}
            />
            <View style={Styles.scrollHeight}>
              <View style={Styles.wrapper}>
                <View style={Styles.FloatingInputContainer}>
                  <OtpInputs
                    handleChange={otp => {
                      this.setState({ otp });
                    }}
                    numberOfInputs={4}
                    keyboardType={"numeric"}
                    inputContainerStyles={Styles.inputContainerStyles}
                    underlineColorAndroid={Constants.Colors.Primary}
                    inputTextErrorColor={Constants.Colors.Primary}
                    focusedBorderColor={Constants.Colors.Primary}
                    inputStyles={{ color: Constants.Colors.Primary }}
                  />
                </View>
              </View>
              <View style={Styles.backgroundImage}>
                <View style={Styles.signBtn}>
                  <Text style={Styles.newUser}>{"Don't receive OTP?"}</Text>
                  <Button
                    buttonName=" Resend"
                    buttonStyle={Styles.signBtnStyle}
                    textStyle={Styles.signTxtStyle}
                    onPress={() => this.resendOTP()}
                  />
                </View>
                <ArrowButton
                  gradientColors={[Constants.Colors.Yellow, Constants.Colors.Yellow]}
                  onPress={() => {
                    this.verifyOTP();
                  }}
                  loading={otpLoader}
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
    user: state.user,
    loader: state.loader
  };
}

export default connect(mapStateToProps)(OTPScreen);
