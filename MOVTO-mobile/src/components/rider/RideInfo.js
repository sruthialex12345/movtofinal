/*
Name : Gurtej Singh
File Name : rideInfo.js
Description : Contains the Ride info view.
Date : 12 oct 2018
*/
import React, { Component } from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet } from "react-native";
import DateTimePicker from "react-native-modal-datetime-picker";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";

import Constants from "../../constants";
import * as appActions from "../../actions";
import { moderateScale } from "../../helpers/ResponsiveFonts";

class RideInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isDateTimePickerVisible: false
    };
  }

  static navigatorStyle = {
    navBarHidden: true,
    screenBackgroundColor: "transparent",
    modalPresentationStyle: "overFullScreen"
  };
  _showDateTimePicker = _.debounce(() => this.setState({ isDateTimePickerVisible: true }));

  _hideDateTimePicker = _.debounce(() => this.setState({ isDateTimePickerVisible: false }));

  _handleDatePicked = _.debounce(date => {
    this.props.appActions.updateRideTime(date);
    this._hideDateTimePicker();
  });

  _renderConfrirmButton = () => {
    return (
      <TouchableOpacity style={Styles.PickerBtn}>
        <Image source={Constants.Images.Common.Accept} resizeMode={"contain"} />
      </TouchableOpacity>
    );
  };

  showPersonModal = _.debounce(() => {
    this.props.navigator.showModal({
      screen: "RideSelectPerson",
      animationType: "slide-up",
      navigatorStyle: {
        statusBarColor: "transparent",
        navBarHidden: true,
        screenBackgroundColor: "transparent",
        modalPresentationStyle: "overFullScreen"
      }
    });
  });

  bookRide = _.debounce(() => {
    let { navigator } = this.props;
    this.props.appActions.updateRideDetails(navigator);
  }, 500);

  componentDidMount() {
    this.props.appActions.updateRideTime(new Date());
  }

  gotoCodeScreen = _.debounce(() => {
    this.props.navigator.push({
      screen: "EnterCode"
    });
  }, 500);

  render() {
    let { person } = this.props.riderLocation;
    return (
      <View style={Styles.modalView}>
        <TouchableOpacity
          style={Styles.timePersonContainer}
          onPress={() => {
            //this._showDateTimePicker();
            //for allow date time picker need to call above funcation only
          }}
        >
          <View style={Styles.timeManContainer}>
            <Image source={Constants.Images.RideInfo.Clock} resizeMode={"contain"} />
          </View>
          <Text style={Styles.buttonText}>{Constants.Strings.RideInfo.Now}</Text>
          <Image
            source={Constants.Images.RideInfo.Dropdown}
            resizeMode={"contain"}
            style={{
              height: moderateScale(8),
              width: moderateScale(8)
            }}
          />
        </TouchableOpacity>
        <TouchableOpacity style={Styles.timePersonContainer} onPress={this.showPersonModal}>
          <View style={Styles.timeManContainer}>
            <Image source={Constants.Images.RideInfo.Man} resizeMode={"contain"} />
          </View>
          <Text style={Styles.buttonText}>{person}</Text>
          <Image
            source={Constants.Images.RideInfo.Dropdown}
            resizeMode={"contain"}
            style={{
              height: moderateScale(8),
              width: moderateScale(8)
            }}
          />
        </TouchableOpacity>
        <TouchableOpacity style={Styles.bookBtnContainer} onPress={() => this.gotoCodeScreen()}>
          <View style={Styles.bookBtn}>
            <Image
              source={Constants.Images.Common.Accept}
              resizeMode={"contain"}
              style={{
                height: moderateScale(15),
                width: moderateScale(15),
                marginRight: moderateScale(10)
              }}
            />
            <Text style={[Styles.bookText, { fontSize: moderateScale(14) }]}>
              {Constants.Strings.RideInfo.BookRide}
            </Text>
          </View>
        </TouchableOpacity>
        <DateTimePicker
          isVisible={this.state.isDateTimePickerVisible}
          onConfirm={this._handleDatePicked}
          onCancel={this._hideDateTimePicker}
          mode={"time"}
          datePickerModeAndroid={"spinner"}
          titleIOS={"Select Time"}
          titleStyle={Styles.pickerTitle}
          is24Hour={false}
          minuteInterval={15}
        />
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
)(RideInfo);

const Styles = StyleSheet.create({
  modalView: {
    // backgroundColor: "red",
    height: moderateScale(60),
    width: Constants.BaseStyle.DEVICE_WIDTH,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: moderateScale(10),
    borderTopLeftRadius: moderateScale(10),
    borderTopRightRadius: moderateScale(10)

    // bottom: 0,
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: moderateScale(2),
    backgroundColor: Constants.Colors.Yellow,
    borderRadius: moderateScale(5)
  },
  bookBtn: {
    flex: 0.9,
    borderRadius: moderateScale(5),
    height: moderateScale(40),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(5)
  },
  pickerTitle: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(19),
    color: Constants.Colors.Primary
  },
  PickerBtn: {
    height: moderateScale(40),
    width: moderateScale(40),
    borderRadius: moderateScale(100),
    backgroundColor: "red"
  },
  bookText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(18),
    color: Constants.Colors.White,
    textAlign: "center",
    flex: 1
  }
});
