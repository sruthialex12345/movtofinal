/*
Name : Gurtej Singh
File Name : RiderRateToDriver.js
Description : Contains the RiderRateToDriver screen
Date : 17 Sept 2018
*/
import React, { Component } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";

import { StarRating } from "../../components/Rating";
import Constants from "../../constants";
import Header from "../../components/common/Header";
import * as appActions from "../../actions";
import AuthButton from "../../components/common/AuthButton";
import { moderateScale } from "../../helpers/ResponsiveFonts";
class RiderRateToDriver extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rateText: "",
      rate: 5
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };

  submitDriverRating = _.debounce(() => {
    let { rateText, rate } = this.state;
    let { user, appActions, navigator, riderTrip } = this.props;
    let { driverId, adminId } = riderTrip;
    let dataToPost = {
      reviewerId: user._id,
      reviewToId: driverId,
      reviewToType: Constants.AppConstants.UserTypes.Driver,
      message: rateText,
      rating: rate,
      adminId
    };
    // in case of super admin reviewToId will be null
    appActions.rateAndReview(dataToPost, navigator);
  });

  skipRating = _.debounce(() => {
    let { appActions, navigator } = this.props;
    appActions.thankyou(navigator);
  });

  onRighPress = () => {
    this.skipRating();
  };

  render() {
    let { rate } = this.state;
    let HeaderHeight = moderateScale(60) + Constants.BaseStyle.StatusBarHeight();
    return (
      <View style={Styles.mainView}>
        <Header
          hideBack
          hideDrawer
          // rightText={"Skip"}
          color={Constants.Colors.transparent}
          navigator={this.props.navigator}
          title={"Ride Completed"}
          headerText={{ color: Constants.Colors.Primary }}
          // onRighPress={() => this.onRighPress}
        />
        <KeyboardAwareScrollView style={Styles.container} scrollEnabled={false}>
          <View
            style={{
              height: Constants.BaseStyle.DEVICE_HEIGHT - HeaderHeight
            }}
          >
            <View
              style={{
                flex: 0.4,
                marginVertical: moderateScale(20),
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row"
              }}
            >
              <View
                style={{
                  backgroundColor: Constants.Colors.Yellow,
                  borderRadius: moderateScale(100),
                  justifyContent: "center",
                  alignItems: "center",
                  height: moderateScale(150),
                  width: moderateScale(150)
                }}
              >
                <Image
                  source={Constants.Images.Common.Driver}
                  resizeMode={"cover"}
                  style={{ height: "100%", width: "100%" }}
                />
              </View>
            </View>
            <View
              style={{
                flex: 0.2,
                marginVertical: moderateScale(20),
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <Text style={Styles.centerTextStyle}>Rate our driver</Text>
            </View>
            <View style={{ flex: 0.2, marginVertical: moderateScale(20) }}>
              <StarRating
                ratingColor={Constants.Colors.Yellow}
                count={5}
                reviews={["OK", "Good", "Very Good", "Wow", "Amazing"]}
                defaultRating={rate}
                size={40}
                onFinishRating={rate => this.setState({ rate })}
              />
            </View>
            <View style={{ flex: 0.2, marginVertical: moderateScale(20) }} />
          </View>
          <View
            style={{
              justifyContent: "space-between",
              flexDirection: "row",
              borderColor: Constants.Colors.placehoder,
              borderWidth: 0.4,
              position: "absolute",
              bottom: 0,
              zIndex: 99
            }}
          >
            <AuthButton
              buttonStyle={Styles.buttonStyle}
              gradientStyle={Styles.gradientStyle}
              buttonName={"No, Thanks"}
              textStyle={{ color: Constants.Colors.Primary }}
              onPress={() => this.skipRating()}
              loading={false}
              gradientColors={["#FFFFFF", "#FFFFFF"]}
            />
            <AuthButton
              buttonStyle={Styles.buttonStyle}
              gradientStyle={Styles.gradientStyle}
              gradientColors={["#F6CF65", "#F6CF65"]}
              buttonName={"Submit"}
              onPress={() => this.submitDriverRating()}
              textStyle={{ color: "#fff" }}
              loading={false}
              // disabled={waitTime.min <= 10 ? true : false}
            />
          </View>
        </KeyboardAwareScrollView>
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
    riderLocation: state.riderLocation,
    loader: state.loader,
    riderTrip: state.riderTrip
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RiderRateToDriver);

const Styles = StyleSheet.create({
  mainView: { flex: 1, backgroundColor: Constants.Colors.transparent },
  container: {
    backgroundColor: Constants.Colors.White,
    width: Constants.BaseStyle.DEVICE_WIDTH,
    height: Constants.BaseStyle.DEVICE_HEIGHT - moderateScale(100)
  },
  keyboardScroll: {
    // width: Constants.BaseStyle.DEVICE_WIDTH,
    height: Constants.BaseStyle.DEVICE_HEIGHT
  },
  buttonStyle: { flex: 0.5 },
  gradientStyle: { borderRadius: 0 },
  inputStyle: {
    ...Constants.Fonts.TitilliumWebRegular,
    height: moderateScale(50),
    fontSize: moderateScale(16),
    flex: 1
  },
  centerTextStyle: {
    ...Constants.Fonts.TitilliumWebBold,
    fontSize: moderateScale(24),
    textAlign: "center",
    color: Constants.Colors.Primary
  }
});
