/*
Name : Gurtej Singh
File Name : cancelRide.js
Description : Contains the cancel Ride view.
Date : 21 oct 2018
*/
import React, { Component } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as appActions from "../../actions";
import Constants from "../../constants";

class Loader extends Component {
  constructor(props) {
    super(props);
  }
  static navigatorStyle = {
    navBarHidden: true,
    screenBackgroundColor: "transparent",
    modalPresentationStyle: "overFullScreen",
    drawBehind: false
  };

  render() {
    return (
      <View style={styles.modalBackground}>
        <View style={styles.activityIndicatorWrapper}>
          <ActivityIndicator animating={true} />
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
    riderLocation: state.riderLocation
  };
}
const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    alignItems: "center",
    //  flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    position: "absolute",
    zIndex: 9999,
    //backgroundColor:'red',
    width: Constants.BaseStyle.DEVICE_WIDTH,
    height: Constants.BaseStyle.DEVICE_HEIGHT
  },
  activityIndicatorWrapper: {
    backgroundColor: "#FFFFFF",
    height: 100,
    width: 100,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around"
  }
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Loader);
