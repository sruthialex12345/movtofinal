/*
Name : Gurtej Singh
File Name : RideWaitTime.js
Description : Contains the waiting time view.
Date : 13 oct 2018
*/
import React, { Component } from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import moment from "moment";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";

import AuthButton from "../common/AuthButton";
import Constants from "../../constants";
import * as appActions from "../../actions";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import { toastMessage } from "../../config/navigators";

class RideWaitTime extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timer: { watch: "00:00 min", min: 0, sec: 0 },
      isDateTimePickerVisible: false,
      waitTime: {
        min: 0,
        sec: 0
      }
    };
    this.interval = null;
  }

  static navigatorStyle = {
    navBarHidden: true,
    screenBackgroundColor: "transparent",
    modalPresentationStyle: "overFullScreen"
  };

  cancelRide = _.debounce(() => {
    if (this.interval) {
      clearInterval(this.interval);
    }
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
    if (this.interval) {
      clearInterval(this.interval);
    }
    let { timer } = this.state;
    if (timer.min < 10) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: `Chat will be unlocked in ${9 - timer.min < 10 ? "0" : ""}${9 - timer.min}:${
          59 - timer.sec < 9 ? "0" : ""
        }${59 - timer.sec} ${9 - timer.min < 1 ? "min" : "mins"}`
      });
    } else {
      this.interval = this.setTimeout(() => {
        //alert("Feature coming soon...");
        //@GR - 02/16/2020 - Added Chat feature
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
    }
  });

  componentDidMount() {
    this.startTimer();
  }

  componentWillUnmount() {
    this.stopTimer();
  }

  startTimer() {
    let startTimestamp = moment().startOf("day");
    this.interval = setInterval(() => {
      startTimestamp.add(1, "second");
      const timer = this.formatTimer(startTimestamp.format("mm:ss"));
      this.setState({ timer });
    }, 1000);
  }
  stopTimer() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  formatTimer(time = "00:00") {
    let splt = time.split(":");
    if (splt[0] == "10" || splt[0] == 10) {
      this.stopTimer();
      return {
        watch:
          splt[0] === "01" || splt[0] === "1" || splt[0] === "00" || splt[0] === "0" ? `${time} min` : `${time} mins`,
        min: +splt[0],
        sec: +splt[1]
      };
    }
    return {
      watch:
        splt[0] === "01" || splt[0] === "1" || splt[0] === "00" || splt[0] === "0" ? `${time} min` : `${time} mins`,
      min: +splt[0],
      sec: +splt[1]
    };
  }

  // calcuateWaitTime = () => {
  //   let { requestTime } = this.props.riderTrip;
  //   let requestAt = moment(requestTime);
  //   //let requestAt = moment(requestTime).utc();
  //   setInterval(() => {
  //     let now = moment();
  //     var duration = moment.duration(now.diff(requestAt));
  //     this.setState({
  //       waitTime: { min: duration._data.minutes, sec: duration._data.seconds }
  //     });
  //   }, 1000);

  // }

  render() {
    let { requestTime, seatBooked } = this.props.riderTrip;
    let { timer } = this.state;
    return (
      <View
        style={[
          Styles.container,
          {
            elevation: 20,
            backgroundColor: "white",
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            shadowColor: "black",
            shadowOffset: { width: 1, height: -0.1 },
            shadowOpacity: 1,
            shadowRadius: 2
          }
        ]}
      >
        <View style={Styles.modalView}>
          <View style={Styles.timePersonContainer}>
            <View style={[Styles.timeManContainer, {}]}>
              <Image source={Constants.Images.RideInfo.Clock} resizeMode={"contain"} />
            </View>
            <Text style={Styles.buttonText}>
              {moment(requestTime) == moment() ? Constants.Strings.RideWait.Now : moment(requestTime).format("hh:mm A")}
            </Text>
          </View>
          <View style={Styles.timePersonContainer} onPress={() => {}}>
            <View style={Styles.timeManContainer}>
              <Image source={Constants.Images.RideInfo.Man} resizeMode={"contain"} />
            </View>
            <Text style={Styles.buttonText}>{seatBooked}</Text>
          </View>
          <View style={Styles.bookBtnContainer} onPress={() => {}}>
            <View>
              <Text style={Styles.WaitText}>{Constants.Strings.RideWait.WaitingTime}</Text>
            </View>
            <View style={Styles.waitTime}>
              <Text numberOfLines={1} style={Styles.bookText}>
                {timer.watch}
              </Text>
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
            gradientColors={timer.min <= 10 ? [Constants.Colors.gray, Constants.Colors.gray] : ["#F6CF65", "#F6CF65"]}
            buttonName={Constants.Strings.RideWait.ChatWithAdmin}
            onPress={this.moveToChatWindow}
            textStyle={{ color: "#fff" }}
            loading={false}
            // disabled={timer.min <= 10 ? true : false}
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

reactMixin(RideWaitTime.prototype, TimerMixin);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RideWaitTime);

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.Colors.transparent,
    justifyContent: "flex-end",
    position: "absolute",
    bottom: 0
  },
  modalView: {
    backgroundColor: "#fff",
    flex: 0.1,
    width: Constants.BaseStyle.DEVICE_WIDTH,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: moderateScale(10),
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
  }
});
