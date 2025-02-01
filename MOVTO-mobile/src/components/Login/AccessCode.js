/*
Name : Gurtej Singh
File Name : AccessCode.js
Description : Contains theAccess code view for auth.
Date : 10 oct 2018
*/
import React, { Component } from "react";
import { View, Dimensions } from "react-native";
import { connect } from "react-redux";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import _ from "lodash";
import { bindActionCreators } from "redux";
import * as appActions from "../../actions";
import ArrowButton from "../common/ArrowButton";
import Welcome from "../common/WelcomeLogo";
import FloatingInput from "../common/FloatingInput";
import Styles from "../../styles/container/loginScreen";
import { toastMessage } from "../../config/navigators";
import Constants from "../../constants";
const { height } = Dimensions.get("window");
class AccessCode extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accessCode: ""
      // accessCode: "1234abcd" //JYiUdmO_7 LivSimTSe,lSKwfJ9oX
      // userType: props.userType
    };
  }
  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.userType !== prevState.userType) {
      return {
        userType: nextProps.userType
      };
    } else return null;
  }
  static navigatorStyle = {
    navBarHidden: true
  };

  onLoginPress = _.debounce(() => {
    let { navigator, appActions } = this.props;
    let { accessCode, userType } = this.state;

    if (_.isEmpty(accessCode.trim())) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: Constants.Strings.Common.EnterAccessCode
      });
      return;
    }
    if (userType == Constants.AppConstants.UserTypes.Driver) {
      appActions.verifyDriverAccessCode({ accessCode, userType }, navigator);
    }
    if (userType == Constants.AppConstants.UserTypes.Admin) {
      appActions.verifyAdminAccessCode({ accessCode, userType }, navigator);
    }
  }, 500);

  render() {
    let { loader } = this.props;
    return (
      <KeyboardAwareScrollView
        contentContainerStyle={{ backgroundColor: "white", height: height }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        <Welcome
          logoStyle={Styles.logoStyle}
          heading={Constants.Strings.Login.Heading}
          message={Constants.Strings.Login.LoginMsg}
        />
        <View style={Styles.scrollHeight}>
          <View style={Styles.wrapper}>
            <View style={Styles.FloatingInputContainer}>
              <FloatingInput
                label={Constants.Strings.Login.EnterAccessCode}
                onChangeText={accessCode => {
                  this.setState({ accessCode });
                }}
                value={this.state.accessCode}
                returnKey="done"
                onSubmitEditing={() => {
                  this.onLoginPress();
                }}
                autoCapitalize={"none"}
                secureTextEntry
                isBlack={true}
              />
            </View>
          </View>
          <View style={Styles.backgroundImage}>
            <ArrowButton
              gradientColors={[Constants.Colors.Yellow, Constants.Colors.Yellow]}
              onPress={() => this.onLoginPress()}
              loading={loader && loader.accessCode}
            />
            <View style={Styles.signBtn} />
          </View>
        </View>
      </KeyboardAwareScrollView>
    );
  }
}
const mapDispatchToProps = dispatch => ({
  appActions: bindActionCreators(appActions, dispatch)
});
function mapStateToProps(state) {
  return {
    loader: state.loader
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AccessCode);
