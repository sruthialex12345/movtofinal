/*
Name : Gurtej Singh
File Name : RiderRating.js
Description : Contains the rate us screen
Date : 18 Sept 2018
*/
import React, { Component } from "react";
import { View, Text, Image, TextInput, StyleSheet, findNodeHandle } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import { StarRating } from "../components/Rating";
import Constants from "../constants";
import Header from "../components/common/Header";
import * as appActions from "../actions";
import AuthButton from "../components/common/AuthButton";
import { moderateScale } from "../helpers/ResponsiveFonts";
import { handleDeepLink } from "../config/navigators";
class RateUs extends Component {
  constructor(props) {
    super(props);
    this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
    this.state = {
      rateText: "",
      rate: 3
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };
  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 500);

  submitAppRating = _.debounce(() => {
    let { rateText, rate } = this.state;
    let { user, appActions, navigator } = this.props;
    let example = {
      reviewerId: user._id,
      reviewToId: null,
      reviewToType: Constants.AppConstants.UserTypes.SuperAdmin,
      message: rateText,
      rating: rate
    };
    // in case of super admin reviewToId will be null
    appActions.rateAndReview(example, navigator);
  });

  cancelRate = _.debounce(() => {
    this.props.navigator.handleDeepLink({ link: "RiderProviderListing" });
  });

  render() {
    let { rateText, rate } = this.state;
    let HeaderHeight = moderateScale(60) + Constants.BaseStyle.StatusBarHeight();
    return (
      <View style={Styles.mainView}>
        <Header navigator={this.props.navigator} title={"Rate Us"} />
        <KeyboardAwareScrollView
          innerRef={ref => {
            this.scroll = ref;
          }}
          //style={Styles.container}
          scrollEnabled={true}
        >
          <View
            style={{
              height: Constants.BaseStyle.DEVICE_HEIGHT - HeaderHeight
            }}
          >
            <View
              style={{
                flex: 0.3,
                paddingVertical: moderateScale(0),
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row"
              }}
            >
              <View
                style={{
                  backgroundColor: Constants.Colors.transparent,
                  borderRadius: moderateScale(100),
                  justifyContent: "center",
                  alignItems: "center",
                  height: moderateScale(150),
                  width: moderateScale(150)
                }}
              >
                <Image
                  source={Constants.Images.Rating.RateOurApp}
                  resizeMode={"cover"}
                  style={{ height: "50%", width: "50%" }}
                />
              </View>
            </View>
            <View
              style={{
                flex: 0.1,
                justifyContent: "flex-end",
                alignItems: "center"
              }}
            >
              <Text style={Styles.centerTextStyle}>Rate our App</Text>
            </View>
            <View
              style={{
                flex: 0.3,
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <StarRating
                ratingColor={Constants.Colors.Yellow}
                count={5}
                reviews={["OK", "Good", "Very Good", "Wow", "Amazing"]}
                defaultRating={rate}
                size={40}
                onFinishRating={rate => this.setState({ rate })}
              />
            </View>
            <View
              style={{
                flex: 0.6,
                padding: moderateScale(20)
              }}
            >
              <Text
                style={{
                  fontSize: moderateScale(15),
                  color: Constants.Colors.placehoder,
                  ...Constants.Fonts.TitilliumWebRegular,
                  marginBottom: moderateScale(5)
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
                  borderRadius: moderateScale(10),
                  fontSize: moderateScale(17),
                  color: Constants.Colors.Primary,
                  ...Constants.Fonts.TitilliumWebRegular,
                  padding: moderateScale(15),
                  flex: 0.7,
                  textAlignVertical: "top"
                }}
              />
              <View
                style={{
                  width: Constants.BaseStyle.DEVICE_WIDTH,
                  flex: 0.3,
                  justifyContent: "space-between",
                  flexDirection: "row",
                  borderColor: Constants.Colors.placehoder,
                  borderWidth: 0.4,
                  position: "absolute",
                  bottom: moderateScale(-10)
                  // zIndex: 99
                }}
              >
                <AuthButton
                  buttonStyle={Styles.buttonStyle}
                  gradientStyle={Styles.gradientStyle}
                  buttonName={"Cancel"}
                  textStyle={{ color: Constants.Colors.Primary }}
                  onPress={this.cancelRate}
                  loading={false}
                  gradientColors={["#FFFFFF", "#FFFFFF"]}
                />
                <AuthButton
                  buttonStyle={Styles.buttonStyle}
                  gradientStyle={Styles.gradientStyle}
                  gradientColors={["#F6CF65", "#F6CF65"]}
                  buttonName={"Submit"}
                  onPress={() => this.submitAppRating()}
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
    loader: state.loader
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RateUs);

const Styles = StyleSheet.create({
  mainView: { flex: 1, backgroundColor: "transparent" },
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
