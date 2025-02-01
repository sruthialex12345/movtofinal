/*
Name : Gurtej Singh
File Name : OTPScreen.js
Description : Contains OTPScreen.
Date : 12 Sept 2018
*/
import React, { Component } from "react";
//GR - 02/03/2019 - Added for RN61.5 Upgrade
import { View, DeviceEventEmitter } from "react-native";
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
import { bindActionCreators } from "redux";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";
import { toastMessage } from "../../config/navigators";
import Events from "../../helpers/events";
class OTPScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      reservationCode: null
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };
  backToDashboard = () => {
    this.props.navigator.handleDeepLink({ link: "DashBoard" });
  };
  componentDidMount() {
    DeviceEventEmitter.addListener("BackToDashboard", this.backToDashboard);
  }
  componentWillUnmount() {
    DeviceEventEmitter.removeListener("BackToDashboard", this.backToDashboard);
  }
  bookRide = _.debounce(() => {
    let { navigator } = this.props;
    let { reservationCode } = this.state;
    if (reservationCode && reservationCode.length == 4) {
      //appActions.deeplink(this.props.navigator, "DashBoard", { isCodeEntered: true }).then(() => {
      // setTimeout(() => {
      this.props.appActions.updateRideDetails(reservationCode, navigator);
      // }, 2000);
      // });
      //this.props.navigator.handleDeepLink({ link: "DashBoard" });
      // this.setTimeout(() => {
      //   this.props.appActions.updateRideDetails(reservationCode, navigator);
      // }, 500);
    } else {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter valid reservation code."
      });
    }
  }, 500);

  render() {
    let { otpLoader } = this.props.loader;
    return (
      <View style={Styles.container}>
        <KeyboardAwareScrollView scrollEnabled={false}>
          <Header navigator={this.props.navigator} />
          <View style={Styles.wrapperScroll}>
            <Welcome logoStyle={Styles.logoStyle} heading="Booking Code" message={"Please type booking code."} />
            <View style={Styles.scrollHeight}>
              <View style={Styles.wrapper}>
                <View style={Styles.FloatingInputContainer}>
                  <OtpInputs
                    handleChange={reservationCode => {
                      //  console.log(reservationCode);
                      this.setState({ reservationCode });
                    }}
                    numberOfInputs={4}
                    keyboardType={"email-address"}
                    autoCapitalize={false}
                    inputContainerStyles={Styles.inputContainerStyles}
                    underlineColorAndroid={Constants.Colors.placehoder}
                    inputTextErrorColor={Constants.Colors.placehoder}
                    focusedBorderColor={Constants.Colors.placehoder}
                    inputStyles={{ color: Constants.Colors.placehoder }}
                  />
                </View>
              </View>
              <View style={Styles.backgroundImage}>
                <View style={Styles.signBtn} />
                <ArrowButton
                  gradientColors={[Constants.Colors.Yellow, Constants.Colors.Yellow]}
                  onPress={() => {
                    this.bookRide();
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
const mapDispatchToProps = dispatch => ({
  appActions: bindActionCreators(appActions, dispatch)
});
reactMixin(OTPScreen.prototype, TimerMixin);
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(OTPScreen);
