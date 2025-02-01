/*
Name : Gurtej Singh
File Name : cancelRide.js
Description : Contains the cancel Ride view.
Date : 21 oct 2018
*/
import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";

import * as appActions from "../../actions";
import Constants from "../../constants";
import CancelView from "../common/CancelView";

class CancelRide extends Component {
  constructor(props) {
    super(props);
  }
  static navigatorStyle = {
    navBarHidden: true,
    screenBackgroundColor: "transparent",
    modalPresentationStyle: "overFullScreen",
    drawBehind: true
  };
  backToWaitScreen = _.debounce(() => {
    this.props.navigator.dismissModal();
  }, 500);

  cancleRide = _.debounce(() => {
    this.props.appActions.cancleRide(this.props.navigator);
  }, 500);

  render() {
    return (
      <CancelView
        sureMessage={Constants.Strings.CancelRide.AreYouSureYouWantTo}
        cancelMessage={Constants.Strings.CancelRide.CancelTheRide}
        onCancelPress={this.backToWaitScreen}
        onConfirmPress={this.cancleRide}
      />
    );
  }
}
const mapDispatchToProps = dispatch => ({
  appActions: bindActionCreators(appActions, dispatch)
});
function mapStateToProps(state) {
  return {
    riderLocation: state.riderLocation
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CancelRide);
