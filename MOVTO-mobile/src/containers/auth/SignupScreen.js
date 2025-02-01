/*
Name : Gurtej Singh
File Name : SignupScreen.js
Description : Contains SignupScreen.
Date : 12 Sept 2018
*/
import React, { Component } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { connect } from "react-redux";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import _ from "lodash";
import CountryPickerModal from "../../components/common/CountryPicker";
import ArrowButton from "../../components/common/ArrowButton";
import Constants from "../../constants";
import Header from "../../components/common/AuthHeader";
import Welcome from "../../components/common/WelcomeLogo";
import Styles from "../../styles/container/signupScreen";
import * as appActions from "../../actions";
import { toastMessage } from "../../config/navigators";
import Regex from "../../helpers/Regex";
import FloatingInput from "../../components/common/FloatingInput";

class SignupScreenStep1 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      email: "",
      phoneNo: "",
      password: "",
      confirmPassword: "",
      isdCode: "1",
      countryCode: "US",
      country: "United States",
      userType: "rider"
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };

  focusNext(next) {
    this[next].focus();
  }

  onUserChange = _.debounce(user => {
    this.setState({ userType: user });
  });

  moveToNextStep = _.debounce(() => {
    let { navigator } = this.props;
    let { name, email, phoneNo, password, confirmPassword, countryCode, country, isdCode, userType } = this.state;
    if (_.isEmpty(name.trim())) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter your name."
      });
      return;
    }
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
    if (_.isEmpty(phoneNo.trim())) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter a mobile number."
      });
      return;
    }
    if (!Regex.validateMobile(phoneNo)) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter a valid mobile number."
      });
      return;
    }
    if (_.isEmpty(password.trim())) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter a password."
      });
      return;
    }
    if (!Regex.validatePassword(password)) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "The password must be minimum 8 characters long with at least one letter and one digit."
      });
      return;
    }
    if (_.isEmpty(confirmPassword.trim())) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please confirm your password."
      });
      return;
    }
    if (password !== confirmPassword) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Your password and confirmation password do not match."
      });
      return;
    }
    this.props.dispatch(
      appActions.registeration({ name, email, phoneNo, password, country, countryCode, isdCode, userType }, navigator)
    );
  }, 500);

  render() {
    return (
      <View style={Styles.container}>
        <View style={Styles.scroll}>
          <Header navigator={this.props.navigator} />
          <KeyboardAwareScrollView style={Styles.scrollHeight} scrollEnabled={true}>
            <Welcome heading={"Sign Up Now"} />
            <View style={Styles.wrapperContainer}>
              <View style={Styles.wrapper}>
                <View style={Styles.FloatingInputContainer}>
                  <FloatingInput
                    label={"Name"}
                    autoCapitalize={"words"}
                    onChangeText={name => {
                      this.setState({ name });
                    }}
                    value={this.state.name}
                    returnKeyType={"next"}
                    ref={ref => (this.firstName = ref)}
                    onSubmitEditing={() => {
                      this.focusNext("email");
                    }}
                    isBlack={true}
                  />
                  <FloatingInput
                    label={"Email"}
                    autoCapitalize={"none"}
                    onChangeText={email => {
                      this.setState({ email });
                    }}
                    value={this.state.email}
                    returnKeyType={"next"}
                    keyboardType={"email-address"}
                    ref={ref => (this.email = ref)}
                    onSubmitEditing={() => {
                      this.focusNext("phoneNo");
                    }}
                    isBlack={true}
                  />
                  <View style={Styles.mobileNumber}>
                    <TouchableOpacity
                      onPress={() => {
                        this.callingCode && this.callingCode.openModal();
                      }}
                    >
                      <CountryPickerModal
                        innerref={ref => (this.callingCode = ref)}
                        disabled={false}
                        onChange={value => {
                          this.setState({
                            countryCode: value.cca2,
                            country: value.name,
                            isdCode: value.callingCode
                          });
                        }}
                        SubmitEditing={() => {
                          this.focusNext("phoneNo");
                        }}
                        filterable={true}
                        closeable={true}
                        isdCode={this.state.isdCode}
                        cca2={this.state.countryCode}
                        animationType={"fade"}
                        translation="eng"
                      />
                    </TouchableOpacity>
                    <View style={{ flex: 0.95 }}>
                      <FloatingInput
                        label={"Mobile Number"}
                        onChangeText={phoneNo => {
                          this.setState({ phoneNo });
                        }}
                        autoCapitalize={"none"}
                        value={this.state.phoneNo}
                        returnKeyType={"next"}
                        keyboardType={"numeric"}
                        maxLength={10}
                        ref={ref => (this.phoneNo = ref)}
                        onSubmitEditing={() => {
                          this.focusNext("password");
                        }}
                        isBlack={true}
                      />
                    </View>
                  </View>
                  <FloatingInput
                    label={"Password"}
                    onChangeText={password => {
                      this.setState({ password });
                    }}
                    autoCapitalize={"none"}
                    returnKeyType={"next"}
                    secureTextEntry
                    value={this.state.password}
                    ref={ref => (this.password = ref)}
                    onSubmitEditing={() => {
                      this.focusNext("confirmPassword");
                    }}
                    isBlack={true}
                  />
                  <FloatingInput
                    label={"Confrim Password"}
                    onChangeText={confirmPassword => {
                      this.setState({ confirmPassword });
                    }}
                    autoCapitalize={"none"}
                    returnKeyType={"done"}
                    secureTextEntry
                    value={this.state.confirmPassword}
                    ref={ref => (this.confirmPassword = ref)}
                    onSubmitEditing={() => {
                      this.moveToNextStep();
                    }}
                    isBlack={true}
                  />
                </View>
              </View>
            </View>
          </KeyboardAwareScrollView>
          <View style={Styles.backgroundImage}>
            {/* <TouchableOpacity style={Styles.policy} /> */}
            <Text
              onPress={() => {
                this.props.navigator.push({
                  screen: "CMSPage",
                  passProps: {
                    hideDrawer: true,
                    uri: "terms-conditions",
                    type: "terms",
                    PageName: "Terms and Conditions"
                  }
                });
              }}
              style={Styles.signTxtStyle}
            >
              Terms & Conditions
            </Text>
            <ArrowButton
              gradientColors={[Constants.Colors.Yellow, Constants.Colors.Yellow]}
              onPress={() => this.moveToNextStep()}
              loading={this.props.loader && this.props.loader.signupLoader}
            />
          </View>
        </View>
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

export default connect(mapStateToProps)(SignupScreenStep1);
