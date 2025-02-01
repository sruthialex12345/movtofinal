/*
Name : Gurtej Singh
File Name : RideRequestConfirmation.js
Description : Contains the Ride Request Confirmation view.
Date : 14 oct 2018
*/
import React, { Component } from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";

import * as appActions from "../../actions";
import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";

class RideRequestConfirmation extends Component {
  constructor(props) {
    super(props);
  }
  static navigatorStyle = {
    navBarHidden: true,
    screenBackgroundColor: "transparent",
    modalPresentationStyle: "overFullScreen"
  };
  moveToWaitScreen = _.debounce(() => {
    this.props.navigator.dismissModal();
  });

  render() {
    return (
      <KeyboardAwareScrollView>
        <View style={Styles.container}>
          <View style={Styles.modalView}>
            <View style={Styles.checkImg}>
              <Image source={Constants.Images.Common.Accept} resizeMode={"contain"} />
            </View>
            <View style={{ flex: 0.3, flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <Text style={Styles.headingText}>{Constants.Strings.RideRequest.RequestSubmitted}</Text>
              <Text style={Styles.text}>{Constants.Strings.RideRequest.Accept}</Text>
              <Text style={Styles.text}>{Constants.Strings.RideRequest.Notificaion}</Text>
            </View>
            <TouchableOpacity onPress={this.moveToWaitScreen} style={Styles.btnStyle}>
              <Text style={Styles.okText}>{Constants.Strings.RideRequest.Ok}</Text>
            </TouchableOpacity>
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
    riderLocation: state.riderLocation
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RideRequestConfirmation);

const Styles = StyleSheet.create({
  container: {
    height: Constants.BaseStyle.DEVICE_HEIGHT,
    backgroundColor: Constants.Colors.transparent,
    justifyContent: "flex-end"
  },
  modalView: {
    backgroundColor: Constants.Colors.White,
    flex: 0.35,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "column",
    paddingHorizontal: moderateScale(10)
  },
  checkImg: {
    marginVertical: moderateScale(20),
    backgroundColor: Constants.Colors.Yellow,
    height: moderateScale(40),
    width: moderateScale(40),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: moderateScale(100)
  },
  btnStyle: {
    flex: 0.3,
    borderWidth: 0.3,
    borderColor: Constants.Colors.placehoder,
    width: Constants.BaseStyle.DEVICE_WIDTH,
    justifyContent: "center",
    alignItems: "center"
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
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.placehoder
  }
});
