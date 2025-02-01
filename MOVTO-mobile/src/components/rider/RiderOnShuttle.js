/*
Name : Gurtej Singh
File Name : RiderOnShuttle.js
Description : Contains the Ride view while onBoard.
Date : 16 oct 2018
*/
import React, { Component } from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import Constants from "../../constants";
import moment from "moment";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";

import AuthButton from "../common/AuthButton";
import * as appActions from "../../actions";
import { moderateScale } from "../../helpers/ResponsiveFonts";

class RiderOnShuttle extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isDateTimePickerVisible: false,
      waitTime: {
        min: 0,
        sec: 0
      }
    };
  }

  static navigatorStyle = {
    navBarHidden: true,
    screenBackgroundColor: "transparent",
    modalPresentationStyle: "overFullScreen"
  };

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

  render() {
    let { riderTrip } = this.props;
    let { requestTime, seatBooked, shuttle, driver } = riderTrip;
    let { name, profileUrl } = driver;
    let { imageUrl, vehicleNo, company } = shuttle;
    // let { waitTime } = this.state;
    return (
      <View style={Styles.container}>
        <View style={{ height: Constants.BaseStyle.DEVICE_WIDTH * 0.1 }} />
        <View style={Styles.modalView}>
          <View
            style={{
              backgroundColor: Constants.Colors.White,
              width: Constants.BaseStyle.DEVICE_WIDTH,
              justifyContent: "space-between",
              //alignItems: "center",
              flexDirection: "column",
              borderRadius: moderateScale(10)
            }}
          >
            <View style={{ flex: 0.5, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
              <View style={{ flex: 0.3 }} />
              <View
                style={[Styles.timePersonContainer, { flex: 0.4, justifyContent: "flex-start", alignItems: "center" }]}
              >
                <Text numberOfLines={1} style={Styles.userName}>
                  {name}
                </Text>
              </View>
              <View style={[Styles.timePersonContainer, { flex: 0.6 }]}>
                <View style={{ flex: 0.7, justifyContent: "center" }}>
                  <Text numberOfLines={1} style={[Styles.userName]}>
                    {shuttle.name}
                  </Text>
                  <Text numberOfLines={1} style={[Styles.userName]}>
                    {company + " " + vehicleNo}
                  </Text>
                </View>
                <View style={{ flex: 0.3, justifyContent: "center", alignItems: "center" }}>
                  <View
                    style={{
                      height: moderateScale(30),
                      width: moderateScale(30),
                      borderColor: Constants.Colors.gray,
                      borderWidth: 0.4,
                      borderRadius: moderateScale(500),
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: Constants.Colors.transparent
                    }}
                  >
                    <Image
                      source={imageUrl ? { uri: profileUrl } : Constants.Images.RideInfo.InActiveShuttle}
                      style={{
                        height: moderateScale(20),
                        width: moderateScale(20)
                      }}
                      resizeMode={"contain"}
                    />
                  </View>
                </View>
              </View>
            </View>
            <View style={{ flex: 0.5, flexDirection: "row", alignItems: "center" }}>
              <View style={Styles.timePersonContainer}>
                <View style={Styles.timeManContainer}>
                  <Image source={Constants.Images.RideInfo.Clock} resizeMode={"contain"} />
                </View>
                <Text style={Styles.buttonText}>
                  {moment(requestTime) == moment().unix()
                    ? Constants.Strings.RideWait.Now
                    : moment(requestTime)
                        .utc()
                        .format("hh:mm A")}
                </Text>
              </View>
              <View style={Styles.timePersonContainer} onPress={() => {}}>
                <View style={Styles.timeManContainer}>
                  <Image source={Constants.Images.RideInfo.Man} resizeMode={"contain"} />
                </View>
                <Text style={Styles.buttonText}>{seatBooked}</Text>
              </View>
            </View>
          </View>
        </View>
        <View
          style={{
            justifyContent: "space-between",
            flexDirection: "row",
            borderColor: Constants.Colors.placehoder,
            borderWidth: 0.4,
            elevation: 20
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
            icon={Constants.Images.Common.Chat}
            buttonStyle={Styles.buttonStyle}
            gradientStyle={Styles.gradientStyle}
            gradientColors={["#F6CF65", "#F6CF65"]}
            buttonName={Constants.Strings.RideWait.ChatWithAdmin}
            onPress={() => {
              alert("Feature coming soon...");
            }}
            textStyle={{ color: "#fff" }}
            loading={false}
            // disabled={waitTime.min <= 10 ? true : false}
          />
        </View>
        <View style={Styles.sideMenuImageContainer}>
          <View style={Styles.profileImg}>
            <Image source={{ uri: profileUrl }} style={Styles.imgAvatar} resizeMode={"center"} />
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
    riderLocation: state.riderLocation,
    riderTrip: state.riderTrip
  };
}

reactMixin(RiderOnShuttle.prototype, TimerMixin);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RiderOnShuttle);

const Styles = StyleSheet.create({
  container: {
    backgroundColor: Constants.Colors.transparent,
    position: "absolute",
    bottom: 0
  },
  modalView: {
    backgroundColor: Constants.Colors.transparent,
    flex: 0.4,
    width: Constants.BaseStyle.DEVICE_WIDTH,
    justifyContent: "space-between",
    //alignItems: "center",
    flexDirection: "column",
    borderRadius: moderateScale(10),
    zIndex: -100,
    shadowColor: "black",
    shadowOffset: { width: 2, height: -1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 20
  },
  timePersonContainer: {
    flex: 0.33,
    flexDirection: "row",
    justifyContent: "space-evenly",
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
  gradientStyle: { borderRadius: 0, padding: moderateScale(12) },
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
  },

  sideMenuImageContainer: {
    paddingHorizontal: moderateScale(10),
    position: "absolute",
    zIndex: 100,
    elevation: 20,
    backgroundColor: Constants.Colors.transparent
  },
  profileImg: {
    height: Constants.BaseStyle.DEVICE_WIDTH * 0.2,
    width: Constants.BaseStyle.DEVICE_WIDTH * 0.2,
    borderColor: Constants.Colors.Primary,
    borderWidth: 0.4,
    borderRadius: moderateScale(100),
    paddingHorizontal: moderateScale(15),
    backgroundColor: Constants.Colors.transparent,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  },
  imgAvatar: {
    height: Constants.BaseStyle.DEVICE_WIDTH * 0.18,
    width: Constants.BaseStyle.DEVICE_WIDTH * 0.18
  },
  userInfo: {
    padding: moderateScale(5)
  },
  userName: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(13),
    color: Constants.Colors.Primary
  }
});
