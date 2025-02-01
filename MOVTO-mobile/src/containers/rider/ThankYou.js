/*
Name : Gurtej Singh
File Name : ThankYou.js
Description : Contains Thank You Screen.
Date : 19 Nov 2018
*/
import React, { Component } from "react";
import { View, KeyboardAvoidingView, StyleSheet } from "react-native";
import { connect } from "react-redux";
import Constants from "../../constants";
import Welcome from "../../components/common/WelcomeLogo";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import SafeView from "../../components/common/SafeView";

class Thankyou extends Component {
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
    // let { user } = this.props;
    return (
      <KeyboardAvoidingView behavior="padding" style={Styles.container}>
        <SafeView />
        <View style={Styles.wrapperScroll}>
          <Welcome containerStyle={Styles.containerStyle} />
          <Welcome
            containerStyle={Styles.sucessStyle}
            logo={Constants.Images.Common.Thankyou}
            heading={"Thank you"}
            message={"We Really appreciate your help"}
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

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.Colors.Yellow
  },
  wrapperScroll: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center"
  },
  containerStyle: {
    paddingVertical: moderateScale(80)
  },
  sucessStyle: {
    justifyContent: "center",
    alignItems: "center"
  }
});

export default connect(mapStateToProps)(Thankyou);
