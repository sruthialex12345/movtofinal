/*
Name : Gurtej Singh
File Name : DriverTripListing.js
Description : Contains the DriverTripListing  screen
Date : 29 Nov 2018
*/
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import Header from "../../components/common/Header";
import * as appActions from "../../actions";
import TerminalListing from "../../components/driver/TerminalListing";
import Constants from "../../constants";
import RightComponent from "../../components/common/RightComponent";

class DriverTripListing extends Component {
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
    let { driver, listing, user, shuttle } = this.props;
    let { tripData } = listing;
    let rides = [...tripData.rides];

    let terminalRide = [],
      terminalMeta = {
        newRequestsCount: 0,
        onBoardCount: 0
      };
    rides.map(item => {
      if (item.driverId === driver._id) {
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
        <Header
          hideDrawer
          navigator={this.props.navigator}
          title={driver.name}
          subTitle={shuttle.name}
          rightComponent={<RightComponent source={driver.profileUrl} icon={Constants.Images.Common.Driver} />}
        />
        <TerminalListing meta={terminalMeta} rides={terminalRide} userType={user.userType} />
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
    listing: state.listing
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DriverTripListing);

const Styles = StyleSheet.create({});
