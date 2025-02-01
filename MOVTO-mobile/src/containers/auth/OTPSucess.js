/*
Name : Gurtej Singh
File Name : OTPSucess.js
Description : Contains OTP SUcess Screen.
Date : 12 Sept 2018
*/
import React, { Component } from "react";
import { View, KeyboardAvoidingView } from "react-native";
import { connect } from "react-redux";
import Constants from "../../constants";
import Welcome from "../../components/common/WelcomeLogo";
import Styles from "../../styles/container/OTPSucess";
import SafeView from "../../components/common/SafeView";

class OTPSucess extends Component {
  constructor(props) {
    super(props);
    this.state = {
      otp: ""
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };
  render() {
    let { user } = this.props;
    return (
      <KeyboardAvoidingView behavior="padding" style={Styles.container}>
        <SafeView />
        <View style={Styles.wrapperScroll}>
          <Welcome containerStyle={Styles.containerStyle} />
          <Welcome
            containerStyle={Styles.sucessStyle}
            logo={Constants.Images.Common.Successful_signed}
            heading={"Welcome " + user.name}
            message={"You have successfully signed up"}
            logoStyle={{ paddingBottom: 40 }}
          />
        </View>
      </KeyboardAvoidingView>
    );
  }
}

// which props do we want to inject, given the global state?
function mapStateToProps(state) {
  return {
    user: state.user
  };
}

export default connect(mapStateToProps)(OTPSucess);
