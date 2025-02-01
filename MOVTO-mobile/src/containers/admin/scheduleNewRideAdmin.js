/*
Name : Gurtej Singh
File Name : RiderProviderListing.js
Description : Contains the Provider listing
Date : 11 Oct 2018
*/

import React, { Component } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import * as appActions from "../../actions";
import Constants from "../../constants";
import Header from "../../components/common/Header";
import Styles from "../../styles/container/RiderProviderListing";
import { handleDeepLink } from "../../config/navigators";
import LocationInput from "../../components/common/LocationInput";
import FloatingInput from "../../components/common/FloatingInput";
import AuthButton from "../../components/common/AuthButton";
import { toastMessage } from "../../config/navigators";
import Regex from "../../helpers/Regex";
import DatePicker from "react-native-datepicker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import CountryPickerModal from "../../components/common/CountryPicker";

import moment from "moment";
import Geocoder from "react-native-geocoding";
const GOOGLE_MAPS_APIKEY = Constants.DevKeys.map.APIKey;

class ScheduleRideAdmin extends Component {
  constructor(props) {
    super(props);
    props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
    this.state = {
      name: this.props.riderDetails ? this.props.riderDetails.name : "",
      phoneNo: this.props.riderDetails ? this.props.riderDetails.phoneNo : "",
      dateTime: this.props.scheduledTime ? this.props.scheduledTime : "",
      noOfPersons: this.props.seatBooked ? JSON.stringify(this.props.seatBooked) : "",
      countryCode: "IN",
      cca2: "IN",
      country: "India",
      isdCode: this.props.riderDetails ? this.props.riderDetails.isdCode : "91",
      source: this.props.srcLoc ? this.props.srcLoc : {},
      destination: this.props.destLoc ? this.props.destLoc : {},
      updateTrip: this.props.updateTrip ? this.props.updateTrip : false
    };
    Geocoder.init(GOOGLE_MAPS_APIKEY);
  }
  static navigatorStyle = {
    navBarHidden: true
  };

  componentDidMount() {
    let { navigator } = this.props;
    navigator.setDrawerEnabled({
      side: "left",
      enabled: true
    });
  }

  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 500);

  clearLocation = location => {
    if (location === Constants.AppConstants.UserLocation.Source) {
      this.setState({ source: {}, destination: {} });
    } else {
      this.setState({ destination: {} });
    }
  };

  onChangeSource = location => {
    let { user, navigator, appActions } = this.props;
    let { source } = this.state;
    if (location === Constants.AppConstants.UserLocation.Destination && !source._id) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: Constants.Strings.Error.SourceNotSelected
      });
      return;
    }
    this.setState({ locationType: location });
    appActions.setLocationType(location, navigator, true, user._id, this.state.source, this.onSelectTerminal);
  };

  onSelectTerminal = terminal => {
    let { locationType } = this.state;
    if (locationType === Constants.AppConstants.UserLocation.Source) {
      this.setState({ source: terminal });
    } else {
      this.setState({ destination: terminal });
    }
  };

  addCurrentLocation = region => {
    let { latitude, longitude } = region;
    if (latitude && longitude) {
      Geocoder.from(latitude, longitude)
        .then(json => {
          let terminal;
          if (json.results[0] && json.results[0].address_components) {
            let { geometry, formatted_address } = json.results[0];
            let { location } = geometry;
            terminal = {
              address: formatted_address || json.results[0].address_components[2].long_name || null,
              name: json.results[0].address_components[2].long_name || formatted_address || null,
              loc: [location.lng || 0, location.lat || 0],
              _id: json.results[0].place_id || 0
            };
            this.props.appActions.setRiderLocation(terminal);
          }
        })
        .catch(() => {
          //  console.log("eroroeroeoerwioerw", e);
        });
    }
  };
  focusNext(next) {
    this[next].focus();
  }
  moveToNextStep = _.debounce(() => {
    let { navigator, user, requestId, updateTrip } = this.props;
    let { name, phoneNo, dateTime, isdCode, noOfPersons, country, countryCode } = this.state;
    if (_.isEmpty(name.trim())) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter your name."
      });
      return;
    }
    if (_.isEmpty(phoneNo.trim())) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter a phoneNo number."
      });
      return;
    }
    if (_.isEmpty(dateTime.trim())) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter date and time."
      });
      return;
    }
    if (!Regex.validateMobile(phoneNo)) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter a valid mobile number."
      });
      return;
    }
    if (_.isEmpty(noOfPersons.trim())) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter the number of persons."
      });
      return;
    }
    let { destination, source } = this.state;
    if (destination && source && noOfPersons) {
      // { address:source.address,loc:[source.loc[0],source.loc[1]],name:source.name,_id:source._id}
      let dateToISO = moment(dateTime).toISOString();
      // let extraData={adminId: user._id};
      // {requestId:requestId}

      let postData = {
        sourceLoc: {
          address: source.address,
          loc: [source.loc[0], source.loc[1]],
          name: source.name
        },
        destLoc: {
          address: destination.address,
          loc: [destination.loc[0], destination.loc[1]],
          name: destination.name
        },
        scheduledTime: dateToISO,
        seatBooked: noOfPersons,
        phoneNo: phoneNo,
        isdCode,
        name,
        adminId: user._id,
        countryCode,
        country
      };
      if (updateTrip) postData.requestId = requestId;
      // else
      // postData.adminId= user._id;

      // console.log("Data sending to api create of update",postData);
      this.props.appActions.scheduleRide(postData, navigator);
    }
  }, 500);

  render() {
    let { source, destination } = this.state;
    let { navigator, listing } = this.props;
    let { dateTimeView, btnView, formView } = InlineStyle;
    let minDate = moment(new Date()).add(30, "minutes");
    let maxDate = moment(new Date()).add(7, "days");
    return (
      <View style={Styles.container}>
        <Header
          color={Constants.Colors.Yellow}
          navigator={navigator}
          title={"Schedule a ride"}
          onBackPress={this.onBackPress}
          hideDrawer
        />
        <KeyboardAwareScrollView
          scrollEnable={true}
          // innerRef={ref => {
          //   this.scroll = ref;
          // }}
          enableOnAndroid
          style={{ flex: 0.9 }}
        >
          <View style={{ marginTop: moderateScale(20) }}>
            <LocationInput
              shadowStyle={{ shadowColor: Constants.Colors.Transparent }}
              sourcePlaceholder={Constants.Strings.PlaceHolder.Pickup}
              destinationPlaceholder={Constants.Strings.PlaceHolder.Destination}
              disabledSource={false}
              disabledDestination={false}
              source={source && source.name}
              destination={destination && destination.name}
              onPressSource={() => this.onChangeSource(Constants.AppConstants.UserLocation.Source)}
              onPressDestination={() => this.onChangeSource(Constants.AppConstants.UserLocation.Destination)}
              loading={false}
              renderInputBox={false}
              clearBox={this.clearLocation}
            />
          </View>
          <View style={formView}>
            <View style={{ marginTop: moderateScale(20) }}>
              <FloatingInput
                label={"Name"}
                autoCapitalize={"words"}
                onChangeText={name => {
                  this.setState({ name });
                }}
                value={this.state.name}
                returnKeyType={"next"}
                ref={ref => (this.name = ref)}
                isBlack={true}
                onSubmitEditing={() => {
                  this.focusNext("phoneNo");
                }}
                blueOnSubmit={true}
              />
            </View>
            <View
              style={{
                flexDirection: "row"
                // alignItems: "flex-start",
              }}
            >
              <TouchableOpacity
                style={{ flex: 0.23 }}
                onPress={() => {
                  this.callingCode && this.callingCode.openModal();
                }}
              >
                <CountryPickerModal
                  innerref={ref => (this.callingCode = ref)}
                  disabled={false}
                  onChange={value => {
                    this.setState({
                      countryCode: value.cca2,
                      country: value.name,
                      isdCode: value.callingCode
                    });
                  }}
                  SubmitEditing={() => {
                    this.focusNext("phoneNo");
                  }}
                  filterable={true}
                  closeable={true}
                  isdCode={this.state.isdCode}
                  cca2={this.state.countryCode}
                  animationType={"fade"}
                  translation="eng"
                />
              </TouchableOpacity>
              <View style={{ flex: 0.05 }} />
              <View style={{ flex: 0.72 }}>
                <FloatingInput
                  label={"Mobile Number"}
                  onChangeText={phoneNo => {
                    this.setState({ phoneNo });
                  }}
                  autoCapitalize={"none"}
                  value={this.state.phoneNo}
                  returnKeyType={"next"}
                  keyboardType={"numeric"}
                  maxLength={10}
                  ref={ref => (this.phoneNo = ref)}
                  SubmitEditing={() => {
                    this.focusNext("dateTime");
                  }}
                  isBlack={true}
                />
              </View>
            </View>
            <View style={dateTimeView}>
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === "android") {
                    this.DatePicker.onPressDate("datetime");
                  } else {
                    this.DatePicker.setModalVisible(true);
                  }
                }}
                style={{ flex: 0.65, justifyContent: "center" }}
                ref={ref => (this.dateTime = ref)}
              >
                <Text
                  style={{
                    ...Constants.Fonts.TitilliumWebRegular,
                    fontSize: moderateScale(18),
                    color: Constants.Colors.gray
                  }}
                >
                  Date & Time
                </Text>
                {this.state.dateTime ? (
                  <Text
                    style={{
                      ...Constants.Fonts.TitilliumWebSemiBold,
                      fontSize: moderateScale(20),
                      color: Constants.Colors.Black
                    }}
                  >
                    {moment(this.state.dateTime).format("Do MMM, YYYY, LT")}
                  </Text>
                ) : null}
              </TouchableOpacity>
            </View>
            <View style={{ flex: 0.3, marginTop: moderateScale(10) }}>
              <FloatingInput
                label={"Number of persons"}
                // autoCapitalize={"words"}
                onChangeText={noOfPersons => {
                  this.setState({ noOfPersons });
                }}
                // onFocus={() => {
                //   this.scroll.props.scrollToPosition(0,150);
                // }}
                value={this.state.noOfPersons}
                returnKeyType={"next"}
                ref={ref => (this.noOfPersons = ref)}
                isBlack={true}
                onSubmitEditing={() => {
                  this.focusNext("phoneNo");
                }}
                blueOnSubmit={true}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
        <View style={btnView}>
          <AuthButton
            buttonStyle={Styles.buttonStyle}
            gradientStyle={Styles.gradientStyle}
            buttonName={"Cancel"}
            textStyle={{ color: Constants.Colors.Primary }}
            onPress={() => navigator.pop()}
            loading={false}
            gradientColors={["#FFFFFF", "#FFFFFF"]}
          />
          <AuthButton
            buttonStyle={Styles.buttonStyle}
            gradientStyle={Styles.gradientStyle}
            gradientColors={["#F6CF65", "#F6CF65"]}
            buttonName={this.state.updateTrip ? "Update" : "Submit"}
            onPress={() => this.moveToNextStep()}
            textStyle={{ color: "#fff" }}
            loading={listing.scheduleNewTripLoader}
          />
        </View>
        <DatePicker
          ref={ref => (this.DatePicker = ref || "DatePicker")}
          date={this.state.dateTime}
          style={{ height: 0 }}
          mode="datetime"
          minDate={minDate}
          maxDate={maxDate}
          confirmBtnText="Confirm"
          cancelBtnText="Cancel"
          onDateChange={date => {
            this.setState({
              dateTime: date
            });
          }}
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
    riderLocation: state.riderLocation,
    riderTrip: state.riderTrip,
    user: state.user,
    listing: state.listing
  };
}
const InlineStyle = StyleSheet.create({
  dateTimeView: {
    justifyContent: "flex-end",
    paddingVertical: moderateScale(13),
    marginVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: Constants.Colors.gray
  },
  btnView: {
    width: Constants.BaseStyle.DEVICE_WIDTH,
    flex: 0.1,
    justifyContent: "space-between",
    flexDirection: "row",
    position: "absolute",
    bottom: Platform.OS === "android" ? moderateScale(20) : 0,
    shadowOffset: { width: 3, height: 3 },
    shadowColor: "black",
    shadowOpacity: 0.3,
    elevation: 2
  },
  formView: {
    paddingHorizontal: moderateScale(30),
    marginTop: moderateScale(5)
  },
  locationInput: {
    shadowColor: "#A9AFAF",
    shadowOpacity: moderateScale(0),
    shadowRadius: moderateScale(0),
    elevation: moderateScale(0)
  }
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ScheduleRideAdmin);
