import React, { Component } from "react";
import { View, Platform } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";

import Styles from "../../styles/container/loginScreen";
import SafeView from "../../components/common/SafeView";
import PopOver from "../../components/common/loginPopover";
import Constants from "../../constants";
import * as appActions from "../../actions";
//importing login screen components
import Login from "../../components/Login/Login";
import AccessCode from "../../components/Login/AccessCode";
import firebase from "react-native-firebase";
import { moderateScale } from "../../helpers/ResponsiveFonts";

// this is a traditional React component connected to the redux store
class LoginScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userType: (this.props.user && this.props.user.userType) || (Constants.AppConstants.UserTypes.Rider)
    };
  }
  //default Rider
  static navigatorStyle = {
    navBarHidden: true
  };
  async componentDidMount() {
    let { deviceToken, deviceType } = this.props.user;
    console.log("deviceToken: ", deviceToken);
    console.log("deviceType: ", deviceType);
    if (!deviceToken && !deviceType) {
      this.checkPermission();
    }
    this.props.navigator.setDrawerEnabled({
      side: "left",
      enabled: false
    });
  }

  //1
  async checkPermission() {
    const enabled = await firebase.messaging().hasPermission();
    if (enabled) {
      this.getToken();
    } else {
      this.requestPermission();
    }
  }

  //3
  async getToken() {
    let fcmToken = await firebase.messaging().getToken();
    console.log("fcmToken : ", fcmToken);
    if (fcmToken) {
      // user has a device token
      this.props.appActions.updateNotificationsInfo({
        deviceToken: fcmToken,
        deviceType: Platform.OS
      });
    }
  }
  //2
  async requestPermission() {
    try {
      await firebase.messaging().requestPermission();
      // User has authorised
      this.getToken();
    } catch (e) {
      //alert(e);
      // User has rejected permissions
      //  console.log("permission rejected");
    }
  }
  /* eslint-disable-next-line */
  onUserChange = _.debounce(user => {
    this.setState({ userType: user });
  });

  //default User
  render() {
    // console.log("navigator=>>", this.props.navigator);
    let { navigator, user } = this.props;
    let { userType } = this.state;
    return (
      <View style={Styles.container}>
        <SafeView />
        <View style={Styles.wrapperContainer}>
          {userType == Constants.AppConstants.UserTypes.Rider || user.userType != userType ? (
            <PopOver userType={this.state.userType} onUserChange={this.onUserChange} navigator={navigator} />
          ) : (
            <View style={{ height: moderateScale(50) }} />
          )}
          {userType == Constants.AppConstants.UserTypes.Rider ? (
            <Login navigator={navigator} userType={userType} />
          ) : user.userType != userType ? (
            <Login navigator={navigator} userType={userType} />
          ) : (
            <AccessCode navigator={navigator} userType={userType} />
          )}
        </View>
      </View>
    );
  }
}
const mapDispatchToProps = dispatch => ({
  appActions: bindActionCreators(appActions, dispatch)
});
function mapStateToProps(state) {
  return {
    user: state.user
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LoginScreen);
