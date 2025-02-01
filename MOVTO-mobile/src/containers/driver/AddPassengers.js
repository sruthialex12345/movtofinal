/*
Name : Amit Singh
File Name : AddPassengers.js
Description : Contains the Add Passengers screen
Date : 17 Sept 2018
*/
import React, { Component } from "react";
import { View, StyleSheet, Text } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Constants from "../../constants";
import Header from "../../components/common/Header";
import * as appActions from "../../actions";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import FloatingInput from "../../components/common/FloatingInput";
import AuthButton from "../../components/common/AuthButton";
import LocationInput from "../../components/common/LocationInput";
import { toastMessage } from "../../config/navigators";
class AddPassengers extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      noOfPassengers: "",
      source: {},
      destination: {}
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };
  componentDidMount() {
    this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
    this.props.navigator.setStyle({
      statusBarColor: Constants.Colors.Yellow
    });
  }
  focusNext(next) {
    this[next].focus();
  }
  onNavigationEvent = _.debounce(event => {
    if (event.type == "DeepLink") {
      this.props.navigator.resetTo({
        screen: event.link,
        animated: true,
        animationType: "slide-horizontal"
      });
    }
  }, 100);

  drawerPress() {
    this.props.navigator.toggleDrawer({
      side: "left"
    });
  }
  onPressAddPassangers = _.debounce(tripType => {
    let { navigator, user } = this.props;
    let { source, destination, name, noOfPassengers } = this.state;
    let postData = {
      sourceLoc: source && source._id,
      destLoc: destination && destination._id,
      name,
      noOfseats: noOfPassengers
    };

    let postDataDynamic = {
      seats: noOfPassengers && JSON.parse(noOfPassengers),
      name,
      sourceLoc: source ? { address: source.address, name: source.name, loc: source.loc } : {},
      adminId: user.adminId,
      tripType,
      destLoc: destination ? { address: destination.address, name: destination.name, loc: destination.loc } : {}
    };

    if (_.isEmpty(source)) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please select from terminal"
      });
      return;
    }
    if (_.isEmpty(destination)) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please select to terminal"
      });
      return;
    }
    if (_.isEmpty(name.trim())) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter the name."
      });
      return;
    }
    if (_.isEmpty(noOfPassengers.trim())) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Please enter number of passangers"
      });
      return;
    }
    if (tripType == Constants.AppConstants.RouteType.Dynamic) {
      // console.log("Inside dynamic add passenger", postDataDynamic);
      this.props.appActions.addPassangersDynamic(postDataDynamic, navigator);
    } else {
      // console.log("Inside Static add passenger");
      this.props.appActions.addPassangers(postData, navigator);
    }
  });

  renderLocation = () => {
    let { source, destination } = this.state;
    return (
      <View>
        <LocationInput
          inputStyleBorder={{
            borderBottomColor: Constants.Colors.Primary,
            borderBottomWidth: 1,
            height: moderateScale(70)
          }}
          shadowStyle={{ shadowColor: Constants.Colors.Transparent }}
          iconsWrapperStyle={{ paddingHorizontal: 5 }}
          style={{
            marginHorizontal: 0,
            backgroundColor: Constants.Colors.backgroundColor,
            alignItems: "center",
            justifyContent: "center"
          }}
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
          showLastBorder={true}
        />
      </View>
    );
  };
  onSelectTerminal = terminal => {
    let { locationType } = this.state;
    if (locationType === Constants.AppConstants.UserLocation.Source) {
      this.setState({ source: terminal });
    } else {
      this.setState({ destination: terminal });
      this.focusNext("name");
    }
  };
  onChangeSource = location => {
    let { user, navigator, appActions } = this.props;
    let { source } = this.state;
    if (location === Constants.AppConstants.UserLocation.Destination && !(source && source._id)) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: Constants.Strings.Error.SourceNotSelected
      });
      return;
    }
    this.setState({ locationType: location });
    appActions.setLocationType(location, navigator, true, user._id, this.state.source, this.onSelectTerminal);
  };
  clearLocation = location => {
    if (location === Constants.AppConstants.UserLocation.Source) {
      this.setState({ source: {}, destination: {} });
    } else {
      this.setState({ destination: {} });
    }
  };
  render() {
    let { user } = this.props;
    // let { waypoints } = trip;
    let { tripType } = user;
    const { bottomBtnView, headerTxt } = Styles;
    return (
      <View style={{ flex: 1 }}>
        <Header hideDrawer navigator={this.props.navigator} title={"Add Passengers"} />
        <View
          style={{
            flex: 1,
            flexDirection: "column",
            marginHorizontal: Constants.BaseStyle.DEVICE_WIDTH * 0.08
          }}
        >
          <KeyboardAwareScrollView enableOnAndroid={true} extraScrollHeight={100}>
            <View
              style={{
                justifyContent: "center",
                marginBottom: moderateScale(10),
                marginTop: moderateScale(10)
              }}
            >
              <Text style={headerTxt}>Please add passengers detail below</Text>
            </View>
            <View style={{ marginRight: moderateScale(15) }}>{this.renderLocation()}</View>
            <View style={{ marginHorizontal: moderateScale(20) }}>
              <FloatingInput
                label={"Name"}
                onChangeText={name => {
                  this.setState({ name });
                }}
                value={this.state.name}
                returnKeyType={"next"}
                autoCapitalize={"none"}
                ref={ref => (this.name = ref)}
                onSubmitEditing={() => {
                  this.focusNext("noOfPassengers");
                }}
                isBlack={true}
              />
            </View>

            <View style={{ marginHorizontal: moderateScale(20) }}>
              <FloatingInput
                label={"Number of Passengers"}
                onChangeText={noOfPassengers => {
                  this.setState({ noOfPassengers });
                }}
                keyboardType={"numeric"}
                value={this.state.noOfPassengers}
                returnKeyType={"done"}
                autoCapitalize={"none"}
                ref={ref => (this.noOfPassengers = ref)}
                onSubmitEditing={() => {
                  this.onPressAddPassangers(tripType);
                }}
                isBlack={true}
              />
            </View>
          </KeyboardAwareScrollView>
        </View>
        <View style={bottomBtnView}>
          <View style={{ flex: 0.5 }}>
            <AuthButton
              buttonStyle={Styles.buttonStyle}
              gradientStyle={Styles.gradientStyle}
              gradientColors={[Constants.Colors.White, Constants.Colors.White]}
              buttonName={"Cancel"}
              onPress={() => {
                this.props.navigator.resetTo({
                  screen: "Maps"
                });
              }}
              textStyle={{
                color: Constants.Colors.placehoder,
                fontSize: moderateScale(18)
              }}
              loading={this.props.loader}
            />
          </View>
          <View style={{ flex: 0.5 }}>
            <AuthButton
              buttonStyle={Styles.buttonStyle}
              gradientStyle={Styles.gradientStyle}
              gradientColors={[Constants.Colors.Yellow, Constants.Colors.Yellow]}
              buttonName={"Add"}
              onPress={() => this.onPressAddPassangers(tripType)}
              textStyle={{
                color: Constants.Colors.White,
                fontSize: moderateScale(18)
              }}
              loading={this.props.loader}
            />
          </View>
        </View>
      </View>
    );
  }
}
const mapdestinationToProps = destination => ({
  appActions: bindActionCreators(appActions, destination)
});
function mapStateToProps(state) {
  return {
    user: state.user,
    riderLocation: state.riderLocation,
    trip: state.trip
  };
}
export default connect(
  mapStateToProps,
  mapdestinationToProps
)(AddPassengers);

const Styles = StyleSheet.create({
  gradientStyle: {
    borderRadius: moderateScale(0)
  },
  bottomBtnView: {
    flex: 0.2,
    flexDirection: "row",
    position: "absolute",
    left: 0,
    bottom: 0,
    justifyContent: "space-between",
    borderColor: Constants.Colors.placehoder,
    borderWidth: 0.4
  },
  headerTxt: {
    color: Constants.Colors.gray,
    fontSize: moderateScale(17),
    ...Constants.Fonts.TitilliumWebRegular
  }
});
