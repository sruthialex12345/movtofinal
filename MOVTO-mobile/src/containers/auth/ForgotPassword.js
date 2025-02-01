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
class ForgotPassword extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: ""
    };
  }

  static navigatorStyle = {
    navBarHidden: true
  };
  // componentDidMount() {
  //   this.props.navigator.setStyle({
  //     statusBarColor: Constants.Colors.Yellow
  //   });
  // }

  moveToNextStep = _.debounce(() => {
    let { email } = this.state;
    let { navigator, userType } = this.props;
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
    this.props.dispatch(appActions.forgotPassword({ email, userType }, navigator));
  });

  render() {
    return (
      <View style={Styles.container}>
        <Header navigator={this.props.navigator} />
        <KeyboardAwareScrollView scrollEnabled={false}>
          <View style={Styles.wrapperContainer}>
            <Welcome
              heading={"Forgot Password?"}
              message={"Enter your email below to reset"}
              logoStyle={Styles.logoStyle}
              logo={Constants.Images.Common.Forgot_password}
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
                    returnKeyType={"done"}
                    keyboardType={"email-address"}
                    autoCapitalize={"none"}
                    ref={ref => (this.email = ref)}
                    onSubmitEditing={() => {
                      this.moveToNextStep();
                    }}
                    isBlack={true}
                  />
                </View>
                <View style={Styles.signBtn} />
              </View>
              <View style={[Styles.backgroundImage, {}]}>
                <ArrowButton
                  gradientColors={[Constants.Colors.Yellow, Constants.Colors.Yellow]}
                  onPress={() => this.moveToNextStep()}
                  loading={this.props.loader && this.props.loader.forgotLoader}
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
    loader: state.loader
  };
}

export default connect(mapStateToProps)(ForgotPassword);
