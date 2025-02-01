/*
Name : Gurtej Singh
File Name : RiderRating.js
Description : Contains the RiderRating screen
Date : 17 Sept 2018
*/
import React, { Component } from "react";
import { View, Text, Image, TextInput, StyleSheet, findNodeHandle } from "react-native";
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
class RiderRating extends Component {
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

  skipRating = _.debounce(() => {
    let { appActions, navigator } = this.props;
    appActions.riderDriverRating(navigator);
  });

  submitRideRating = _.debounce(() => {
    let { rateText, rate } = this.state;
    let { user, appActions, navigator, riderTrip } = this.props;
    let { adminId } = riderTrip;
    let dataToPost = {
      reviewerId: user._id,
      reviewToId: adminId,
      reviewToType: Constants.AppConstants.UserTypes.Admin,
      message: rateText,
      rating: rate,
      adminId
    };
    // in case of super admin reviewToId will be null
    appActions.rateAndReview(dataToPost, navigator);
  });

  onRightPress = _.debounce(() => {
    let { appActions, navigator } = this.props;
    appActions.thankyou(navigator);
    // alert("underDevelopment");
  });

  render() {
    // console.log("rating here");
    let HeaderHeight = moderateScale(60) + Constants.BaseStyle.StatusBarHeight();
    let { rateText, rate } = this.state;
    return (
      <View style={Styles.mainView}>
        <Header
          hideBack
          hideDrawer
          rightText={"Skip"}
          color={Constants.Colors.transparent}
          navigator={this.props.navigator}
          title={"Ride Completed"}
          headerText={{ color: Constants.Colors.Primary }}
          onRightPress={this.onRightPress}
        />
        <KeyboardAwareScrollView
          innerRef={ref => {
            this.scroll = ref;
          }}
        >
          <View
            style={{
              height: Constants.BaseStyle.DEVICE_HEIGHT - HeaderHeight
            }}
          >
            <View
              style={{
                flex: 0.25,
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
                  height: moderateScale(120),
                  width: moderateScale(120)
                }}
              >
                <Image
                  source={Constants.Images.RideInfo.ActiveShuttle}
                  resizeMode={"cover"}
                  style={{ height: "60%", width: "60%" }}
                />
              </View>
            </View>
            <View
              style={{
                flex: 0.2,
                // marginVertical: moderateScale(20),
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <Text style={Styles.centerTextStyle}>Thanks for choosing us</Text>
              <Text style={Styles.centerTextStyle}>Rate our service</Text>
            </View>
            <View style={{ flex: 0.2 }}>
              <StarRating
                ratingColor={Constants.Colors.Yellow}
                count={5}
                reviews={["OK", "Good", "Very Good", "Wow", "Amazing"]}
                defaultRating={rate}
                size={40}
                onFinishRating={rate => this.setState({ rate })}
              />
            </View>
            <View style={{ flex: 0.4 }}>
              <Text
                style={{
                  flex: 0.15,
                  fontSize: moderateScale(15),
                  color: Constants.Colors.placehoder,
                  ...Constants.Fonts.TitilliumWebRegular,
                  marginBottom: moderateScale(5),
                  marginHorizontal: moderateScale(20)
                }}
              >
                {200 - rateText.length} characters left!
              </Text>
              <TextInput
                onFocus={(event: any) => {
                  this.scroll.props.scrollToFocusedInput(findNodeHandle(event.target));
                }}
                value={rateText}
                onChangeText={rateText => {
                  this.setState({ rateText });
                }}
                autoCorrect
                maxLength={200}
                multiline={true}
                numberOfLines={5}
                placeholder={"Enter a message..."}
                placeholderTextColor={"#A9AFAF"}
                style={{
                  backgroundColor: "#E2DEDE",
                  flex: 0.45,
                  borderRadius: moderateScale(10),
                  fontSize: moderateScale(17),
                  color: Constants.Colors.Primary,
                  ...Constants.Fonts.TitilliumWebRegular,
                  padding: moderateScale(15),
                  textAlignVertical: "top",
                  marginHorizontal: moderateScale(20),
                  marginBottom: moderateScale(10)
                }}
              />
              <View
                style={{
                  flex: 0.3,
                  width: Constants.BaseStyle.DEVICE_WIDTH,
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
                  onPress={() => this.submitRideRating()}
                  textStyle={{ color: "#fff" }}
                  loading={false}
                  // disabled={waitTime.min <= 10 ? true : false}
                />
              </View>
            </View>
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
    riderTrip: state.riderTrip,
    riderLocation: state.riderLocation,
    loader: state.loader
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RiderRating);

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
