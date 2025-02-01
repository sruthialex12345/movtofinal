/*
Name : Gurtej Singh
File Name : ActiveInactiveShuttle.js
Description : Contains the ActiveInactiveShuttle view.
Date : 22 Sept 2018
*/
import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";

import * as appActions from "../../actions";
import Constants from "../../constants";
import CancelView from "../common/CancelView";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";
class ActiveInactiveShuttle extends Component {
  constructor(props) {
    super(props);
  }
  static navigatorStyle = {
    navBarHidden: true,
    screenBackgroundColor: "transparent",
    modalPresentationStyle: "overFullScreen"
  };
  cancleShuttleUpdate = () => {
    this.props.navigator.dismissModal();
  };

  updateTripStatus = _.debounce(() => {
    let { user, trip, navigator, appActions } = this.props;
    let { response } = trip;
    let data = {
      shuttle: trip.myShuttle,
      tripId: response._id,
      status: false,
      driverId: user._id
    };
    this.props.navigator.dismissModal();

    setTimeout(() => {
      appActions.updateTripStatus(data, navigator);
    }, 500);
  }, 300);

  render() {
    return (
      <CancelView
        sureMessage={Constants.Strings.CancelRide.AreYouSureYouWantTo}
        cancelMessage={"Inactive Shuttle ?"}
        onCancelPress={this.cancleShuttleUpdate}
        onConfirmPress={this.updateTripStatus}
      />
    );
  }
}

const mapDispatchToProps = dispatch => ({
  appActions: bindActionCreators(appActions, dispatch)
});
function mapStateToProps(state) {
  return {
    riderLocation: state.riderLocation,
    trip: state.trip,
    loader: state.loader,
    shuttle: state.shuttle,
    user: state.user
  };
}
reactMixin(ActiveInactiveShuttle.prototype, TimerMixin);
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ActiveInactiveShuttle);
