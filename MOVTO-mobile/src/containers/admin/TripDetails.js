/*
Name : Gurtej Singh
File Name : TripDetails.js
Description : Contains the Shuttle Listing
Date : 21 Nov 2018
*/
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
// import _ from "lodash";
// import moment from "moment";

import Constants from "../../constants";
import Header from "../../components/common/Header";
import * as appActions from "../../actions";
// import { handleDeepLink } from "../../config/navigators";
// import { moderateScale } from "../../helpers/ResponsiveFonts";

class TripDetails extends Component {
  constructor(props) {
    super(props);
  }
  static navigatorStyle = {
    navBarHidden: true
  };
  componentDidMount() {}

  componentWillUnmount = () => {
    //alert("unmounting");
  };

  render() {
    return (
      <View style={Styles.mainView}>
        <Header
          hideDrawer
          color={Constants.Colors.transparent}
          navigator={this.props.navigator}
          title={"Ride Details"}
          headerText={{ color: Constants.Colors.Primary }}
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
    user: state.user,
    listing: state.listing,
    loader: state.loader
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TripDetails);

const Styles = StyleSheet.create({});
