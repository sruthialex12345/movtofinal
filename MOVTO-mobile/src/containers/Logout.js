/*
Name : Gurtej Singh
File Name : cancelRide.js
Description : Contains the Logout view.
Date : 2 Nov 2018
*/

import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import { View } from "react-native";
import * as appActions from "../actions";
import Constants from "../constants";
import CancelView from "../components/common/CancelView";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";
class Logout extends Component {
  constructor(props) {
    super(props);
  }

  // static navigatorStyle = {
  //   statusBarColor: "transparent",
  //   navBarHidden: true,
  //   screenBackgroundColor: "transparent",
  //   modalPresentationStyle: "overFullScreen"
  // };
  back = _.debounce(() => {
    this.props.navigator.dismissModal();
  }, 300);

  logout = _.debounce(() => {
    let context = this;
    appActions.dismissModalAnimated(this.props.navigator).then(() => {
      context.props.appActions.logout(context.props.navigator);
    });
  }, 300);
  render() {
    return (
      <View>
        <CancelView
          sureMessage={Constants.Strings.CancelRide.AreYouSureYouWantTo}
          cancelMessage={Constants.Strings.CancelRide.Logout}
          onCancelPress={this.back}
          onConfirmPress={this.logout}
        />
      </View>
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
reactMixin(Logout.prototype, TimerMixin);
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Logout);
