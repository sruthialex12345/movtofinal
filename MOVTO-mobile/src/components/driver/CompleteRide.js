/*
Name : Gurtej Singh
File Name : CompleteRide.js
Description : Contains the passengers on terminal.
Date : 08 oct 2018
*/
import React, { Component } from "react";
import { View, StyleSheet, PanResponder } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";

import Constants from "../../constants";
import * as appActions from "../../actions";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import TerminalListing from "./TerminalListing";
import AuthButton from "../common/AuthButton";
import DriverSocket from "../../helpers/socket/driver";

class CompleteRide extends Component {
  constructor(props) {
    super(props);
    this.state = {
      terminal: []
    };
  }

  static navigatorStyle = {
    navBarHidden: true,
    screenBackgroundColor: "transparent",
    modalPresentationStyle: "overFullScreen"
  };

  UNSAFE_componentWillMount() {
    this._panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (event, gestureState) => {
        if (gestureState.dy > 0) {
          setTimeout(() => {
            this.dismissModal();
          }, 300);
        }
      }
    });
  }

  dismissModal = _.debounce(() => {
    this.props.navigator.dismissModal({
      animationType: "slide-down"
    });
  });

  render() {
    let { trip, user } = this.props;
    let { rides, currentTerminal } = trip;
    let terminalRide = [];
    let meta = { totalSeats: 0 };
    rides.map(item => {
      if (
        item.destLoc &&
        item.destLoc._id === currentTerminal._id &&
        item.tripRequestStatus === Constants.AppConstants.RideStatus.EnRoute
      ) {
        meta.totalSeats += item.seatBooked;
        terminalRide.push(item);
      }
    });
    return (
      <View style={Styles.container}>
        <View style={Styles.modalView}>
          {/* <TouchableOpacity
            onPress={this.dismissModal}
            style={{
              flex: 0.1,
              // width: Constants.BaseStyle.DEVICE_WIDTH,
              justifyContent: "center",
              alignItems: "flex-start",
              paddingHorizontal: moderateScale(20)
            }}
          >
            <Image
              source={Constants.Images.RideInfo.Dropdown}
              style={{ height: moderateScale(20), width: moderateScale(20) }}
            />
          </TouchableOpacity> */}
          <View style={{ flex: 0.05 }} />
          <View
            style={{
              backgroundColor: Constants.Colors.White,
              flex: 1,
              width: Constants.BaseStyle.DEVICE_WIDTH,
              borderTopLeftRadius: moderateScale(10),
              borderTopRightRadius: moderateScale(10)
            }}
          >
            <TerminalListing
              panResponder={this._panResponder}
              onSwipeOut={() => {}}
              meta={meta}
              rides={terminalRide}
              message={"Passengers Ride Completed"}
              userType={user.userType}
            />
          </View>
          <View
            style={{
              justifyContent: "space-between",
              flexDirection: "row",
              borderColor: Constants.Colors.placehoder,
              borderWidth: 0.4
            }}
          >
            {/* <AuthButton
            buttonStyle={Styles.buttonStyle}
            gradientStyle={Styles.gradientStyle}
            buttonName={Constants.Strings.RideWait.CancelRide}
            textStyle={{ color: Constants.Colors.Primary }}
            onPress={this.cancelRide}
            loading={false}
            gradientColors={["#FFFFFF", "#FFFFFF"]}
          /> */}
            <AuthButton
              buttonStyle={Styles.buttonStyle}
              gradientStyle={Styles.gradientStyle}
              gradientColors={["#F6CF65", "#F6CF65"]}
              buttonName={"Complete Ride"}
              onPress={() => DriverSocket.completeRides()}
              textStyle={{ color: "#fff" }}
              loading={false}
              // disabled={waitTime.min <= 10 ? true : false}
            />
          </View>
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
    trip: state.trip,
    user: state.user
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CompleteRide);

const Styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Constants.Colors.transparent, justifyContent: "flex-end" },
  modalView: {
    backgroundColor: Constants.Colors.Transparent,
    flex: 0.9,
    justifyContent: "center",
    alignItems: "flex-start",
    flexDirection: "column"
  },
  timePersonContainer: {
    flex: 0.33,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginHorizontal: moderateScale(2),
    height: moderateScale(40)
  },
  timeManContainer: {
    backgroundColor: "#A9AFAF",
    borderRadius: moderateScale(100),
    height: moderateScale(20),
    width: moderateScale(20),
    justifyContent: "center",
    alignItems: "center"
  },
  buttonText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.Primary
  },
  bookBtnContainer: {
    flex: 0.34,
    flexDirection: "column",
    justifyContent: "flex-start",
    marginHorizontal: moderateScale(2)
  },
  bookBtn: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center"
  },
  buttonStyle: { flex: 1 },
  gradientStyle: { borderRadius: 0 },
  WaitText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.placehoder,
    textAlign: "left"
  },
  bookText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(18),
    color: Constants.Colors.Black,
    textAlign: "right"
  },
  waitTime: {
    justifyContent: "flex-end",
    alignItems: "flex-end"
  }
});
