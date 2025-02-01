/*
Name : Gurtej Singh
File Name : PassengerModal.js
Description : Contains the passengers on terminal.
Date : 08 oct 2018
*/
import React, { Component } from "react";
import { View, StyleSheet, PanResponder } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";
import Constants from "../../constants";
import * as appActions from "../../actions";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import TerminalListing from "./TerminalListing";
class PassengerModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      terminal: [],
      rowIndex: ""
    };
  }
  static navigatorStyle = {
    navBarHidden: true,
    screenBackgroundColor: "transparent",
    modalPresentationStyle: "overFullScreen"
  };
  cancelRide = _.debounce(() => {
    this.setTimeout(() => {
      this.props.navigator.showModal({
        screen: "CancelRide",
        animationType: "slide-up",
        navigatorStyle: {
          statusBarColor: "transparent",
          navBarHidden: true,
          screenBackgroundColor: "transparent",
          modalPresentationStyle: "overFullScreen"
        }
      });
    }, 500);
    this.props.navigator.dismissModal();
  });
  moveToChatWindow = _.debounce(() => {
    this.setTimeout(() => {
      //@GR - 05/06/2020 - Added Chat functionality
        this.props.navigator.push({
            screen: "ChatWindow",
            animated: true,
            passProps: {
                crtransportId : this.props.user.route.adminId,
                crselectId: this.props.user._id,
                crselectName: this.props.user.name,
                crprofileUrl: this.props.user.profileUrl,
                crselectType : 'Passenger'
            }
        });
    }, 500);
    this.props.navigator.dismissModal();
  });

  componentdidMount() {
    this.props.appActions.updateRideTime(new Date());
  }
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
    let { trip, user, appActions } = this.props;
    let { rides, meta } = trip;
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
          {/* <View style={{flex:0.02, justifyContent:'center', alignItems:'center',borderTopLeftRadius: moderateScale(10),
              borderTopRightRadius: moderateScale(10), 
              backgroundColor: Constants.Colors.White, width: Constants.BaseStyle.DEVICE_WIDTH,}} {...this._panResponder.panHandlers} >
            <Image source={Constants.Images.Common.sliderLine} />
          </View> */}
          <View style={{ flex: 0.05 }} />
          <View
            style={{
              backgroundColor: Constants.Colors.White,
              flex: 0.95,
              width: Constants.BaseStyle.DEVICE_WIDTH,
              borderTopLeftRadius: moderateScale(10),
              borderTopRightRadius: moderateScale(10)
            }}
          >
            <TerminalListing
              panResponder={this._panResponder}
              meta={meta}
              rides={rides}
              userType={user.userType}
              appActions={appActions}
              onSwipeOut={rowIndex => {
                this.setState({
                  rowIndex: rowIndex
                });
              }}
              rowIndex={this.state.rowIndex}
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
    user: state.user,
    loader: state.loader
  };
}

reactMixin(PassengerModal.prototype, TimerMixin);
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PassengerModal);

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
  buttonStyle: { flex: 0.5 },
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
