/*
Name : Gurtej Singh
File Name : TerminalDetails.js
Description : Contains the Terminal Details screen
Date : 17 Sept 2018
*/
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import Header from "../../components/common/Header";
import * as appActions from "../../actions";
import TerminalListing from "../../components/driver/TerminalListing";
import Constants from "../../constants";

class TerminalDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  static navigatorStyle = {
    navBarHidden: true
  };

  componentDidMount() {
    // let { terminal, navigator, appActions } = this.props;
    // appActions.getTerminalListing(terminal._id, navigator);
  }

  render() {
    let { terminal, trip, user, listing } = this.props;
    let { tripData } = listing;
    let rides;
    if (user.userType === Constants.AppConstants.UserTypes.Driver) {
      rides = [...trip.rides];
    } else {
      rides = [...tripData.rides];
    }
    let terminalRide = [],
      terminalMeta = {
        newRequestsCount: 0,
        onBoardCount: 0
      };
    rides.map(item => {
      if (item.srcLoc && item.srcLoc._id === terminal._id) {
        terminalRide.push(item);
        if (item.tripRequestStatus === Constants.AppConstants.RideStatus.Request) {
          terminalMeta.newRequestsCount += 1;
        }
        if (item.tripRequestStatus === Constants.AppConstants.RideStatus.Accepted) {
          terminalMeta.onBoardCount += 1;
        }
      }
    });
    return (
      <View style={[Styles.mainView, { flex: 1 }]}>
        <Header hideDrawer navigator={this.props.navigator} title={terminal.name} />
        <TerminalListing terminal={terminal} meta={terminalMeta} rides={terminalRide} userType={user.userType} loader />
      </View>
    );
  }
}
const mapDispatchToProps = dispatch => ({
  appActions: bindActionCreators(appActions, dispatch)
});
function mapStateToProps(state) {
  return {
    user: state.user,
    terminalListing: state.terminalListing,
    trip: state.trip,
    listing: state.listing,
    loader: state.loader
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TerminalDetails);

const Styles = StyleSheet.create({});
