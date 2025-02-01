import React, { Component } from "react";
import { View, PanResponder, Image } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";

import * as appActions from "../../actions";
import Constants from "../../constants";
import RideStatus from "./RideStatus";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import DriverSocket from "../../helpers/socket/driver";

class RideStatusModal extends Component {
  constructor(props) {
    super(props);
  }
  static navigatorStyle = {
    navBarHidden: true,
    screenBackgroundColor: "transparent",
    modalPresentationStyle: "overFullScreen"
  };

  UNSAFE_componentWillMount() {
    this._panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (event, gestureState) => {
        if (gestureState.dx < 4 && (gestureState.dy < -10 && gestureState.dy < 0)) {
          // LayoutAnimation.easeInEaseOut();
          let { trip } = this.props;
          let { currentTerminal } = trip;
          let { isCompleteModal, isContinueModal } = currentTerminal;
          currentTerminal || isCompleteModal
            ? isContinueModal
              ? this.onContinueRide()
              : this.onCompleteRide()
            : this.replaceConsole();
        }
      }
    });
  }
  replaceConsole() {}

  onButtonPress = _.debounce(() => {
    let { trip } = this.props;
    let { currentTerminal } = trip;
    if (currentTerminal) {
      let { isCompleteModal, isContinueModal } = currentTerminal;
      if (isCompleteModal) {
        DriverSocket.completeRides();
        return;
      }
      if (isContinueModal) {
        DriverSocket.continueRides();
        return;
      }
    }
  });

  onCompleteRide = _.debounce(modalProps => {
    let { navigator } = this.props;
    navigator.showModal({
      screen: "CompleteRide",
      animationType: "slide-up",
      passProps: { modalProps },
      navigatorStyle: {
        statusBarColor: "transparent",
        navBarHidden: true,
        screenBackgroundColor: "rgba(0,0,0,0.4)",
        modalPresentationStyle: "overFullScreen"
      }
    });
  });

  onContinueRide = _.debounce(modalProps => {
    let { navigator } = this.props;
    navigator.showModal({
      screen: "ContinueRide",
      animationType: "slide-up",
      passProps: { modalProps },
      navigatorStyle: {
        statusBarColor: "transparent",
        navBarHidden: true,
        screenBackgroundColor: "transparent",
        modalPresentationStyle: "overFullScreen"
      }
    });
  });

  render() {
    let { trip } = this.props;
    let { rides, currentTerminal } = trip;
    let { isCompleteModal, isContinueModal } = currentTerminal;
    let terminal = {
      _id: terminal,
      name: ""
    };
    let buttonText = "";
    let passengers = 0;
    let message = "";
    if (currentTerminal) {
      if (isContinueModal) {
        buttonText = "Continue Ride";
        message = "new passangers";
        rides.map(item => {
          if (
            item.srcLoc &&
            item.srcLoc._id === currentTerminal._id &&
            item.tripRequestStatus === Constants.AppConstants.RideStatus.Accepted
          ) {
            passengers += item.seatBooked;
            terminal.name = item.srcLoc && item.srcLoc.name;
          }
        });
      }
      if (isCompleteModal) {
        buttonText = "Complete Ride";
        message = "passangers completing ride.";
        rides.map(item => {
          if (
            item.destLoc &&
            item.destLoc._id === currentTerminal._id &&
            item.tripRequestStatus === Constants.AppConstants.RideStatus.EnRoute
          ) {
            passengers += item.seatBooked;
            terminal.name = item.destLoc && item.destLoc.name;
          }
        });
      }
    }

    return (
      <View
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "column",
          paddingHorizontal: moderateScale(10),
          position: "absolute",
          zIndex: 999,
          backgroundColor: Constants.Colors.White,
          width: Constants.BaseStyle.DEVICE_WIDTH,
          bottom: 0,
          height: Constants.BaseStyle.DEVICE_HEIGHT * 0.22,

          borderTopLeftRadius: 15,
          borderTopRightRadius: 15,
          shadowColor: "black",
          shadowOffset: { width: 1, height: -0.1 },
          shadowOpacity: 1,
          shadowRadius: 2,
          elevation: 5
        }}
      >
        <View style={{ height: 30, justifyContent: "center" }} {...this._panResponder.panHandlers}>
          <Image source={Constants.Images.Common.sliderLine} />
        </View>
        <RideStatus
          terminal={terminal}
          passengers={passengers}
          message={message}
          onModalPress={
            currentTerminal && isCompleteModal
              ? () => this.onCompleteRide()
              : isContinueModal
                ? () => this.onContinueRide()
                : () => {}
          }
          onButtonPress={this.onButtonPress}
          buttonText={buttonText}
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
    trip: state.trip
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RideStatusModal);
