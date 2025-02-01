/*
Name : Gurtej Singh
File Name : RiderRideAccepted.js
Description : Contains the Ride Accepted view.
Date : 17 oct 2018
*/
import React, { Component } from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import moment from "moment";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";

import Constants from "../../constants";
import AuthButton from "../common/AuthButton";
import * as appActions from "../../actions";
import { moderateScale } from "../../helpers/ResponsiveFonts";
class RiderRideAccepted extends Component {
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

  componentDidMount() {}

  cancelRide = _.debounce(() => {
    this.setTimeout(() => {
      this.props.navigator.showModal({
        screen: "CancelRide",
        animationType: "slide-up",
        navigatorStyle: {
          statusBarColor: "transparent",
          navBarHidden: true,
          screenBackgroundColor: "rgba(0,0,0,0.4)",
          modalPresentationStyle: "overFullScreen"
        }
      });
    }, 500);
    this.props.navigator.dismissModal();
  });

  moveToChatWindow = _.debounce(() => {
    this.setTimeout(() => {
      //alert("Feature coming soon...");
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
    let { requestTime, seatBooked, driver, shuttle, ETA } = riderTrip;
    let { name, profileUrl } = driver;
    let { imageUrl, vehicleNo, company } = shuttle;
    let ETAinMinutes =
      ETA == 0
        ? 0
        : ETA !== null
          ? moment()
              .add(ETA, "seconds")
              .format("hh:mm A")
          : null;
    // let { waitTime } = this.state;
    return (
      <View style={Styles.container}>
        <View style={Styles.modalView}>
          <View style={[Styles.sideMenuImageContainer, {}]} />
          <View
            style={{
              height: moderateScale(170),
              backgroundColor: Constants.Colors.transparent,
              justifyContent: "space-between",
              //alignItems: "center",
              flexDirection: "column",
              shadowColor: "black",
              shadowOffset: { width: 2, height: -1 },
              shadowOpacity: 0.4,
              shadowRadius: 2,
              elevation: 20,
              zIndex: -100
            }}
          >
            <View
              style={{
                height: Constants.BaseStyle.DEVICE_WIDTH * 0.1
              }}
            />
            <View
              style={[
                {
                  position: "absolute",
                  marginLeft: moderateScale(25),
                  height: moderateScale(80),
                  width: moderateScale(80),
                  borderColor: Constants.Colors.Primary,
                  borderWidth: 0.4,
                  borderRadius: moderateScale(100),
                  // paddingHorizontal: moderateScale(15),
                  backgroundColor: Constants.Colors.White,
                  // justifyContent: "center",
                  // alignItems: "center",
                  overflow: "hidden",
                  zIndex: 100
                }
              ]}
            >
              {typeof profileUrl === "string" ? (
                <Image resizeMode={"cover"} style={[Styles.shuttleImg, { flex: 1 }]} source={{ uri: profileUrl }} />
              ) : (
                <Image source={Constants.Images.Common.Provider} resizeMode={"contain"} style={Styles.shuttleImg} />
              )}
            </View>
            <View
              style={{
                flex: 0.5,
                flexDirection: "row",
                alignItems: "flex-end",
                justifyContent: "space-between",
                backgroundColor: Constants.Colors.White,
                borderTopLeftRadius: moderateScale(10),
                borderTopRightRadius: moderateScale(10),
                zIndex: -100
              }}
            >
              <View
                style={[
                  {
                    backgroundColor: Constants.Colors.White,
                    flex: 0.33,
                    flexDirection: "row",
                    justifyContent: "space-evenly",
                    alignItems: "flex-end",
                    height: moderateScale(40),
                    paddingLeft: moderateScale(10)
                  }
                ]}
              >
                <Text style={Styles.userName} numberOfLines={1}>
                  {name}
                </Text>
              </View>
              <View
                style={[
                  {
                    flex: 1,
                    justifyContent: "flex-end",
                    backgroundColor: Constants.Colors.White,
                    flexDirection: "row",
                    alignItems: "center",
                    height: moderateScale(40)
                  }
                ]}
              >
                <View style={{ flex: 0.8 }}>
                  {/* <Text numberOfLines={1} style={[Styles.userName, { textAlign: "right" }]}>
                    {shuttle.name}
                  </Text> */}
                  <Text numberOfLines={1} style={[Styles.userName, { textAlign: "right" }]}>
                    {company + " " + vehicleNo}
                  </Text>
                </View>

                <View
                  style={[
                    {
                      flex: 0.2,
                      overflow: "hidden",
                      alignItems: "flex-end",
                      paddingRight: moderateScale(10)
                    }
                  ]}
                >
                  <View
                    style={{
                      height: moderateScale(40),
                      width: moderateScale(40),
                      borderColor: Constants.Colors.gray,
                      borderWidth: 0.4,
                      borderRadius: moderateScale(500),
                      overflow: "hidden"
                    }}
                  >
                    <Image
                      source={
                        typeof imageUrl === "string"
                          ? { uri: shuttle.imageUrl }
                          : Constants.Images.RideInfo.InActiveShuttle
                      }
                      style={{
                        flex: 1,
                        borderColor: Constants.Colors.gray
                      }}
                      resizeMode={"cover"}
                    />
                  </View>
                </View>
              </View>
            </View>
            <View
              style={{
                flex: 0.5,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "white"
              }}
            >
              <View style={[Styles.timePersonContainer, {}]}>
                <View style={Styles.timeManContainer}>
                  <Image source={Constants.Images.RideInfo.Clock} resizeMode={"contain"} />
                </View>
                <Text style={Styles.buttonText}>
                  {moment(requestTime) == moment().unix()
                    ? Constants.Strings.RideWait.Now
                    : moment(requestTime).format("hh:mm A")}
                </Text>
              </View>
              <View
                style={{
                  flex: 0.33,
                  flexDirection: "row",
                  alignItems: "center",
                  marginHorizontal: moderateScale(2),
                  height: moderateScale(40)
                }}
                onPress={() => {}}
              >
                <View style={[Styles.timeManContainer, { flexDirection: "row" }]}>
                  <Image source={Constants.Images.RideInfo.Man} resizeMode={"contain"} />
                </View>
                <View style={{ flex: 0.3, justifyContent: "center" }}>
                  <Text style={[Styles.buttonText, { textAlign: "center" }]}>{seatBooked}</Text>
                </View>
              </View>
              <View
                style={[Styles.bookBtnContainer, { alignItems: "flex-end", paddingRight: moderateScale(10) }]}
                onPress={() => {}}
              >
                <Text style={[Styles.WaitText, { textAlign: "center" }]}>
                  {Constants.Strings.RideAccepted.ArivalTime}
                </Text>
                <View>
                  <Text numberOfLines={1} style={[Styles.bookText, { textAlign: "center" }]}>
                    {ETAinMinutes == null ? "Calculating..." : ETAinMinutes == 0 ? "Arrived" : ETAinMinutes}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        <View
          style={{
            justifyContent: "space-between",
            flexDirection: "row",
            borderColor: Constants.Colors.placehoder,
            borderWidth: 0.4
          }}
        >
          <AuthButton
            buttonStyle={Styles.buttonStyle}
            gradientStyle={Styles.gradientStyle}
            buttonName={Constants.Strings.RideWait.CancelRide}
            textStyle={{ color: Constants.Colors.Primary }}
            onPress={this.cancelRide}
            loading={false}
            gradientColors={["#FFFFFF", "#FFFFFF"]}
          />
          <AuthButton
            icon={Constants.Images.Common.Chat}
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

reactMixin(RiderRideAccepted.prototype, TimerMixin);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RiderRideAccepted);

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.Colors.transparent,
    justifyContent: "flex-end",
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
    borderRadius: moderateScale(10)
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
    zIndex: 99
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
    fontSize: moderateScale(15),
    color: Constants.Colors.Primary
  }
});
