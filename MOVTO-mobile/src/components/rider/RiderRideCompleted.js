/*
Name : Gurtej Singh
File Name : RiderRideCompleted.js
Description : Contains the Ride Complete view.
Date : 17 oct 2018
*/
import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { View, Image, Text, StyleSheet } from "react-native";
import _ from "lodash";

import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import AuthButton from "../common/AuthButton";
import * as appActions from "../../actions";

class RiderRideCompleted extends Component {
  constructor(props) {
    super(props);
  }
  static navigatorStyle = {
    navBarHidden: true,
    screenBackgroundColor: "transparent",
    modalPresentationStyle: "overFullScreen"
  };
  backToWaitScreen = () => {
    // this.props.navigator.dismissModal();
  };

  moveToRatingScreen = _.debounce(() => {
    this.props.appActions.riderRating(this.props.navigator);
  });

  cancleShuttleUpdate = () => {
    // this.props.appActions.cancleRide(this.props.navigator);
  };
  render() {
    return (
      <View style={Styles.container}>
        <View style={Styles.modalView}>
          <View
            style={{
              position: "absolute",
              backgroundColor: Constants.Colors.Yellow,
              height: moderateScale(40),
              width: moderateScale(40),
              justifyContent: "center",
              alignItems: "center",
              borderRadius: moderateScale(100),
              zIndex: 999,
              right: Constants.BaseStyle.DEVICE_WIDTH / 2.6,
              top: moderateScale(5)
            }}
          >
            <Image source={Constants.Images.Common.Accept} resizeMode={"contain"} />
          </View>
          <View
            style={{
              flex: 0.4,
              marginVertical: moderateScale(20),
              justifyContent: "center",
              alignItems: "center",
              borderRadius: moderateScale(100)
            }}
          >
            <Image source={Constants.Images.RideInfo.ActiveShuttle} resizeMode={"contain"} />
          </View>
          <View
            style={{
              flex: 0.6,
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Text style={Styles.text}>{Constants.Strings.RideRequest.RideCompleted1}</Text>
            <Text style={Styles.text}>{Constants.Strings.RideRequest.RideCompleted2}</Text>
          </View>
        </View>
        <View
          style={{
            backgroundColor: Constants.Colors.Primary,
            justifyContent: "space-between",
            flexDirection: "row",
            borderColor: Constants.Colors.placehoder,
            borderWidth: 0.4
          }}
        >
          <AuthButton
            buttonStyle={Styles.buttonStyle}
            gradientStyle={Styles.gradientStyle}
            //  gradientColors={["#fff", "#fff"]}
            gradientColors={[Constants.Colors.Yellow, Constants.Colors.Yellow]}
            buttonName={Constants.Strings.RideRequest.Ok}
            onPress={this.moveToRatingScreen}
            textStyle={{ color: Constants.Colors.Primary }}
            loading={false}
          />
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
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RiderRideCompleted);

const Styles = StyleSheet.create({
  container: {
    backgroundColor: Constants.Colors.transparent,
    justifyContent: "flex-end",
    position: "absolute",
    bottom: 0,
    zIndex: 9999
  },
  modalView: {
    backgroundColor: "#fff",
    flex: 0.2,
    width: Constants.BaseStyle.DEVICE_WIDTH,
    justifyContent: "space-between",
    //alignItems: "center",
    flexDirection: "column",
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(10)
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
    color: Constants.Colors.Primary,
    paddingHorizontal: moderateScale(30),
    justifyContent: "center"
  },
  buttonStyle: { flex: 1, borderWidth: 0.4, borderColor: Constants.Colors.placehoder },
  gradientStyle: { borderRadius: 0, padding: moderateScale(12) }
});
