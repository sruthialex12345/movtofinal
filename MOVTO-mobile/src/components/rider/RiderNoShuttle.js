/*
Name : Gurtej Singh
File Name : RiderNoShuttle.js
Description : Contains the no Shuttle Available view.
Date : 14 oct 2018
*/
import React, { Component } from "react";
import { Platform } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as appActions from "../../actions";
import { View, Image, Text, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import _ from "lodash";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";

import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import AuthButton from "../common/AuthButton";
class RiderNoShuttle extends Component {
  constructor(props) {
    super(props);
  }
  static navigatorStyle = {
    navBarHidden: true,
    screenBackgroundColor: "transparent",
    modalPresentationStyle: "overFullScreen"
  };
  backToWaitScreen = _.debounce(() => {
    let { appActions, navigator } = this.props;
    appActions.GotoShuttlePage(navigator);
  }, 500);

  moveToChatWindow = _.debounce(() => {
    //alert("Featue coming soon");
    //@GR - 02/16/2020 - Added Chat feature
    console.log("User prop: ", this.props.user);
    this.props.navigator.push({
        screen: "ChatWindow",
        animated: false,
        passProps: {
            crtransportId : this.props.user.route.adminId,
            crselectId: this.props.user._id,
            crselectName: this.props.user.name,
            crprofileUrl: this.props.user.profileUrl,
            crselectType : 'Passenger'
        }

    });
    /*this.props.navigator.handleDeepLink({
      link: "ChatWindow",
      payload: {
        passProps: {
            crtransportId : '5d513f99d819772312af0c08',
            crselectId: this.props.user._id,
            crselectName: this.props.user.name,
            crselectType : 'Passenger'
        },
        push: true
      }
    });*/

  });

  cancleShuttleUpdate = () => {
    // this.props.appActions.cancleRide(this.props.navigator);
  };
  render() {
    let { riderTrip } = this.props;
    let { rejectMessage } = riderTrip;
    return (
      <KeyboardAwareScrollView>
        <View style={Styles.container}>
          <View style={Styles.modalView}>
            <View
              style={{
                flex: 0.4,
                marginVertical: moderateScale(20),
                justifyContent: "center",
                alignItems: "center",
                borderRadius: moderateScale(100)
              }}
            >
              <Image source={Constants.Images.RideInfo.InActiveShuttle} resizeMode={"contain"} />
            </View>
            <View style={{ flex: 0.6, flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <Text style={Styles.text}>{rejectMessage}</Text>
            </View>
          </View>
          <View
            style={{
              backgroundColor: Constants.Colors.Primary,
              justifyContent: "space-between",
              flexDirection: "row",
              borderColor: Constants.Colors.gray,
              borderWidth: 0.4
            }}
          >
            <AuthButton
              buttonStyle={Styles.buttonStyle}
              gradientStyle={Styles.gradientStyle}
              buttonName={Constants.Strings.RideWait.GoToHome}
              textStyle={{ color: Constants.Colors.Primary }}
              onPress={this.backToWaitScreen}
              loading={false}
              gradientColors={["#FFFFFF", "#FFFFFF"]}
            />
            <AuthButton
              buttonStyle={Styles.buttonStyle}
              gradientStyle={Styles.gradientStyle}
              gradientColors={["#F6CF65", "#F6CF65"]}
              buttonName={Constants.Strings.RideWait.ChatWithAdmin}
              onPress={this.moveToChatWindow}
              textStyle={{ color: "#fff" }}
              loading={false}
              // disabled={waitTime.min <= 10 ? true : false}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    );
  }
}
const mapDispatchToProps = dispatch => ({
  appActions: bindActionCreators(appActions, dispatch)
});
function mapStateToProps(state) {
  return {
    user: state.user,
    riderLocation: state.riderLocation,
    riderTrip: state.riderTrip
  };
}

reactMixin(RiderNoShuttle.prototype, TimerMixin);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RiderNoShuttle);

const Styles = StyleSheet.create({
  container: {
    height: Constants.BaseStyle.DEVICE_HEIGHT,
    backgroundColor: Constants.Colors.transparent,
    justifyContent: "flex-end",
    bottom: Platform.OS === "ios" ? moderateScale(0) : moderateScale(20)
  },
  modalView: {
    backgroundColor: Constants.Colors.White,
    flex: 0.3,
    width: Constants.BaseStyle.DEVICE_WIDTH,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "column",
    paddingHorizontal: moderateScale(10)
  },
  PickerBtn: {
    height: moderateScale(40),
    width: moderateScale(40),
    borderRadius: moderateScale(100),
    backgroundColor: Constants.Colors.Yellow,
    justifyContent: "center",
    alignItems: "center"
  },
  modalTitle: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(19),
    color: Constants.Colors.Primary,
    paddingHorizontal: moderateScale(20)
  },
  headingText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(19),
    color: Constants.Colors.Primary
  },
  okText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(18),
    color: Constants.Colors.placehoder
  },
  text: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(19),
    color: Constants.Colors.Primary
  },
  buttonStyle: { flex: 0.5, borderWidth: 0.4, borderColor: Constants.Colors.gray },
  gradientStyle: { borderRadius: 0 }
});
