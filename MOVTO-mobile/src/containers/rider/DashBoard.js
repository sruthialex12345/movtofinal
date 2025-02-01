/*
Name : Gurtej Singh
File Name : DashBoard.js
Description : Contains the Dashboard screen
Date : 17 Sept 2018
*/
import React, { Component } from "react";
//Guru - 12/29/2019 - Fix for RN 0.65.1 Upgrade
import { View, Platform, Image, AppState, TouchableOpacity, DeviceEventEmitter } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import Permissions from "react-native-permissions";
import _ from "lodash";
import MapView, { Marker } from "react-native-maps";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";

import Constants from "../../constants";
import Styles from "../../styles/container/Dashboard";
import Header from "../../components/common/Header";
import * as appActions from "../../actions";
import LocationInput from "../../components/common/LocationInput";
import MapApi from "../../helpers/Maps";
// import { updateLocation, socketInit } from "../../helpers/socket";
import UserSocket from "../../helpers/socket/rider";
import { handleDeepLink, toastMessage } from "../../config/navigators";
import RideInfo from "../../components/rider/RideInfo";
// import ReservationCode from "../../components/rider/ReservationCode";

import Events from "../../helpers/events";
import RideWaitTime from "../../components/rider/RideWaitTime";
import RiderRideAccepted from "../../components/rider/RiderRideAccepted";
import RiderOnShuttle from "../../components/rider/RiderOnShuttle";
import RiderRideCompleted from "../../components/rider/RiderRideCompleted";
import { moderateScale, RF } from "../../helpers/ResponsiveFonts";
import MapViewDirections from "react-native-maps-directions";
import KeepAwake from "react-native-keep-awake";
import Geocoder from "react-native-geocoding";
//Guru - 12/29/2019 - Fix for RN0.61.5 Upgrade
import Geolocation from "@react-native-community/geolocation";

const GOOGLE_MAPS_APIKEY = Constants.DevKeys.map.APIKey;
class DashBoard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lastLat: null,
      lastLong: null,
      codeCheckIs: false,
      appState: AppState.currentState,
      wayPointsMap: []
    };
    this.setMapView = false;
    Geocoder.init(GOOGLE_MAPS_APIKEY);
  }
  static navigatorStyle = {
    navBarHidden: true
  };

  cancelRide = () => {
    // console.log("NAvigation Props=>>>", this.props.navigator);
    this.props.navigator.push({
      screen: "RiderProviderListing",
      animated: true,
      animationType: "slide-horizontal"
    });
  };
  goToHome = () => {
    appActions.goToHome(this.props.navigator);
  };
  componentDidMount() {
    UserSocket.socketInit();
    // socketInit();
    this.checkLocationPermission();
    this.setRouteUpdateInterval();
    AppState.addEventListener("change", this._handleAppStateChange);
    //Guru - 12/29/2019 - Fix for RN 0.61.5 upgrade
    DeviceEventEmitter.addListener("cancelRide", this.cancelRide);
    DeviceEventEmitter.addListener("Dashboard", this.goToHome);
    // this.rateScreenManagement();
  }
  //update route interval
  // setRouteUpdateInterval() {
  //   this._interval = this.setInterval(() => {
  //     // Your code
  //     let { riderTrip } = this.props;
  //     let { shuttleLocation } = riderTrip;
  //     let { routeShuttleLocation } = this.state;
  //     if (
  //       routeShuttleLocation &&
  //       !_.isEmpty(routeShuttleLocation) &&
  //       !_.isEmpty(shuttleLocation) &&
  //       routeShuttleLocation.latitude != shuttleLocation.latitude
  //     ) {
  //       this.setState({ routeShuttleLocation: shuttleLocation });
  //     }
  //   }, Constants.DevKeys.map.Timer);
  // }
  setRouteUpdateInterval() {
    this._interval = this.setInterval(() => {
      // Your code
      let { riderTrip } = this.props;
      let { shuttleLocation, destLoc, srcLoc } = riderTrip;
      if (!_.isEmpty(shuttleLocation) && destLoc && destLoc.loc && srcLoc && srcLoc.loc) {
        let waypoints = [
          {
            latitude: srcLoc.loc && srcLoc.loc[1],
            longitude: srcLoc.loc && srcLoc.loc[0]
          },
          {
            latitude: destLoc.loc && destLoc.loc[1],
            longitude: destLoc.loc && destLoc.loc[0]
          },
          shuttleLocation
        ];
        let wayPointsMap = MapApi.getDriversWayPoints(waypoints, shuttleLocation);
        this.setState({ wayPointsMap });
      }
    }, Constants.DevKeys.map.Timer);
  }

  _handleAppStateChange = nextAppState => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === "active") {
      let { appActions } = this.props;
      appActions.getRideData(this.props.navigator);
    }
    this.setState({ appState: nextAppState });
  };
  componentDidUpdate(prevProps) {
    let { riderLocation, riderTrip } = this.props;
    let { destination } = riderLocation;
    let { shuttleLocation } = riderTrip;

    let preRiderTrip = prevProps.riderTrip;
    if (
      (prevProps.riderLocation.destination && prevProps.riderLocation.destination._id) !==
      (destination && destination._id)
    ) {
      //when rider select source and destination recenter
      this.fitMaptoCordinations();
    }
    if (
      preRiderTrip.shuttleLocation &&
      _.isEmpty(preRiderTrip.shuttleLocation) &&
      (shuttleLocation && !_.isEmpty(shuttleLocation.latitude))
    ) {
      //if previoiusly on shuttle location is available but now shuttle location is availble change map region only once
      this.fitMaptoCordinations();
    }
  }

  rateScreenManagement = () => {
    let { navigator, riderTrip } = this.props;
    if (riderTrip.rateScreen === Constants.AppConstants.RideStatus.RatingRide) {
      navigator.push({
        screen: "RiderRating",
        animated: true,
        animationType: "slide-horizontal"
      });
    } else if (riderTrip.rateScreen === Constants.AppConstants.RideStatus.RatingDriver) {
      navigator.push({
        screen: "RiderRateToDriver",
        animated: true,
        animationType: "slide-horizontal"
      });
    } else {
      return false;
    }
  };
  //conditional popup rendering  accoriding to the ride status
  conditionalViewManagement = () => {
    let { navigator, riderTrip } = this.props;
    if (riderTrip._id) {
      if (riderTrip.tripRequestStatus === Constants.AppConstants.RideStatus.Request) {
        return <RideWaitTime navigator={navigator} />;
      }
      if (riderTrip.tripRequestStatus === Constants.AppConstants.RideStatus.Accepted) {
        return <RiderRideAccepted navigator={navigator} />;
      }
      if (riderTrip.tripRequestStatus === Constants.AppConstants.RideStatus.EnRoute) {
        return <RiderOnShuttle navigator={navigator} />;
      }
      if (riderTrip.tripRequestStatus === Constants.AppConstants.RideStatus.Completed) {
        return <RiderRideCompleted navigator={navigator} />;
      }
    }
  };
  //check permission for the locations
  checkLocationPermission = async () => {
    let { navigator } = this.props;
    const checkPermission = await Permissions.check("location");
    if (checkPermission == "authorized") {
      this.getAndSetPossitionData();
    } else {
      const requestPermission = await Permissions.request("location");
      if (requestPermission == "authorized") {
        this.getAndSetPossitionData();
      } else {
        toastMessage(navigator, {
          type: Constants.AppConstants.Notificaitons.Error,
          message: Constants.Strings.Permissions.Locations
        });
      }
    }
  };

  //get location data and set states
  getAndSetPossitionData = () => {
    MapApi.getCurrentPosition(navigator).then(
      region => {
        let { riderLocation } = this.props;
        let { userProvider, source } = riderLocation;
        //only for dynamic case
        if (
          userProvider.adminTripTypes &&
          userProvider.adminTripTypes.length > 0 &&
          userProvider.adminTripTypes[0] == Constants.AppConstants.RouteType.Dynamic &&
          !source._id
        ) {
          this.addCurrentLocation(region);
        }

        // updateLocation(region);
        UserSocket.updateLocation(region);
        this.fitMaptoCordinations();
        this.onRegionChange(region);
      },
      () => {
        toastMessage(this.props.navigator, {
          type: Constants.AppConstants.Notificaitons.Error,
          message: "Please check your location services"
        });
      }
    );
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
  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.riderTrip !== prevState.riderTrip) {
      this.riderMap && this.riderMap.animateToRegion(nextProps.riderTrip.shuttleLocation, 500);
      return null;
    } else return null;
  }

  componentWillUnmount() {
    //Guru - 12/29/2019 - Fix for RN-0.61.5 Upgrade
    Geolocation.clearWatch(this.watchID);
    AppState.removeEventListener("change", this._handleAppStateChange);
    clearInterval(this._interval);
    //Guru - 12/29/2019 - Fix for RN 0.61.5 upgrade
    DeviceEventEmitter.removeListener("cancelRide", this.cancelRide);
    DeviceEventEmitter.removeListener("Dashboard", this.goToHome);

    //  Events.remove();
  }

  onRegionChange = region => {
    this.props.appActions.updateRegion(region);
  };

  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 500);

  clearLocation = _.debounce(location => {
    let { riderTrip, navigator, appActions } = this.props;
    if (riderTrip && riderTrip._id) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: "Can't change source and destination during active ride!"
      });
      return;
    }
    if (location === Constants.AppConstants.UserLocation.Source) {
      appActions.setLocationType(Constants.AppConstants.UserLocation.Destination, navigator, false);
      appActions.setRiderLocation({}, navigator);
    }
    appActions.setLocationType(location, navigator, false);
    appActions.setRiderLocation({}, navigator);
  });

  onChangeSource = _.debounce(location => {
    let { navigator, riderLocation } = this.props;
    let { source } = riderLocation;
    if (location === Constants.AppConstants.UserLocation.Destination && !source._id) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: Constants.Strings.Error.SourceNotSelected
      });
      return;
    }
    this.props.appActions.setLocationType(location, this.props.navigator);
  });

  rightBtnPress = _.debounce(() => {
    this.setTimeout(() => {
      this.props.navigator.pop();
    }, 500);
    this.props.appActions.setLocationType(Constants.AppConstants.UserLocation.Destination, this.props.navigator, false);
    this.props.appActions.setRiderLocation({}, this.props.navigator);
    this.props.appActions.setLocationType(Constants.AppConstants.UserLocation.Source, this.props.navigator, false);
    this.props.appActions.setRiderLocation({}, this.props.navigator);

    // this.props.navigator.showModal({
    //   screen: "RideWaitTime",
    // navigatorStyle: {
    //   statusBarColor: "transparent",
    //   navBarHidden: true,
    //   screenBackgroundColor: "transparent",
    //   modalPresentationStyle: "overFullScreen"
    // }
    // });
  });

  renderShuttle = () => {
    let { riderTrip } = this.props;
    let { shuttleLocation, tripRequestStatus } = riderTrip;
    if (shuttleLocation && shuttleLocation.latitude && tripRequestStatus != Constants.AppConstants.RideStatus.Request) {
      if (Platform.OS === "android") {
        return (
          <MapView.Marker
            coordinate={shuttleLocation}
            image={Constants.Images.Common.Bus}
            rotation={(shuttleLocation && shuttleLocation.angle) || 0}
          />
        );
      } else {
        return (
          <MapView.Marker coordinate={shuttleLocation}>
            <Image
              style={{
                transform: [{ rotate: `${(shuttleLocation && shuttleLocation.angle) || 0}deg` }]
              }}
              source={Constants.Images.Common.Bus}
            />
          </MapView.Marker>
        );
      }
    } else {
      return null;
    }
  };
  fitMaptoCordinations = () => {
    let { riderTrip, riderLocation } = this.props;
    let { source, destination } = riderLocation;
    let { shuttleLocation, region } = riderTrip;
    let sourceCord = {
      latitude: source.loc && source.loc[1],
      longitude: source.loc && source.loc[0]
    };
    let cordinatnes = [];
    let destinationCord = {
      latitude: destination.loc && destination.loc[1],
      longitude: destination.loc && destination.loc[0]
    };

    if (destinationCord.latitude) {
      cordinatnes.push(destinationCord);
    }
    if (shuttleLocation.latitude) {
      cordinatnes.push(shuttleLocation);
    }
    if (sourceCord.latitude) {
      cordinatnes.push(sourceCord);
    }
    if (region && region.latitude) {
      cordinatnes.push(region);
    }

    if (region && region.latitude && this.riderMap) {
      this.riderMap.fitToCoordinates(cordinatnes, {
        edgePadding: {
          right: 40,
          bottom: 100,
          left: 40,
          top: 100
        }
      });
    }
  };

  proceed = value => {
    this.setState({ codeCheckIs: value });
  };

  rightHeaderComponant(image = "") {
    return (
      <TouchableOpacity style={{}} onPress={() => this.rightBtnPress()}>
        <View
          style={{
            borderRadius: 30,
            justifyContent: "center",
            height: RF(5.5),
            width: RF(5.5),
            backgroundColor: "#FFF",
            alignItems: "flex-end"
          }}
        >
          <Image source={{ uri: image }} resizeMode="contain" style={{ height: RF(4.5), width: RF(4.5) }} />
        </View>

        <View
          style={{
            height: RF(3),
            width: RF(3),
            backgroundColor: "#393B3B",
            justifyContent: "center",
            alignItems: "center",
            position: "absolute",
            borderRadius: 30,
            bottom: 0,
            left: 0
          }}
        >
          <Image style={{ height: RF(1.8), width: RF(1.8) }} source={Constants.Images.Common.EditWhite} />
        </View>
      </TouchableOpacity>
    );
  }

  render() {
    let { riderLocation, navigator, riderTrip, user } = this.props;
    let { userProvider } = riderLocation;
    let { wayPointsMap } = this.state;
    // let { tripRequestStatus } = riderTrip;
    // let { routeShuttleLocation } = this.state;
    let source = {},
      destination = {};
    if (riderTrip && riderTrip._id) {
      source = riderTrip.srcLoc;
      destination = riderTrip.destLoc;
    } else {
      source = riderLocation.source;
      destination = riderLocation.destination;
    }
    let { region } = riderTrip;
    return (
      <View style={Styles.mainView}>
        <KeepAwake />
        <KeyboardAwareScrollView style={Styles.container} scrollEnabled={false}>
          <Header
            headerText={{ color: Constants.Colors.Primary }}
            navigator={navigator}
            color={Constants.Colors.transparent}
            title={userProvider && userProvider.name}
            rightComponent={this.rightHeaderComponant(userProvider && userProvider.profileUrl)}
          />
          <View style={Styles.keyboardScroll}>
            <View style={Styles.wrapper}>
              <LocationInput
                sourcePlaceholder={Constants.Strings.PlaceHolder.Pickup}
                destinationPlaceholder={Constants.Strings.PlaceHolder.Destination}
                disabledSource={riderTrip && riderTrip._id}
                disabledDestination={riderTrip && riderTrip._id}
                source={source && source.name}
                destination={destination && destination.name}
                onPressSource={this.onChangeSource}
                onPressDestination={this.onChangeSource}
                loading={false}
                renderInputBox={false}
                clearBox={this.clearLocation}
                navigator={navigator}
                scheduleTrip={
                  user.userType === "rider" &&
                  userProvider &&
                  userProvider.adminTripTypes &&
                  userProvider.adminTripTypes[0] === "dynamicRoute" &&
                  userProvider.settings &&
                  userProvider.settings.allowScheduleTrips
                }
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
        {!(riderTrip, riderTrip._id) && (source && source._id) && (destination && destination._id) ? (
          <View
            style={{
              position: "absolute",
              zIndex: 99,
              bottom: 0,
              backgroundColor: Constants.Colors.White,
              borderTopLeftRadius: moderateScale(10),
              borderTopRightRadius: moderateScale(10),
              marginTop: 10
            }}
          >
            <RideInfo navigator={navigator} onProceed={this.proceed} />
          </View>
        ) : null}
        <MapView
          ref={refs => (this.riderMap = refs)}
          followsUserLocation={true}
          zoomEnabled={true}
          rotateEnabled={false}
          scrollEnabled={true}
          loadingEnabled={true}
          initialRegion={region}
          style={{
            height: Constants.BaseStyle.DEVICE_HEIGHT,
            width: Constants.BaseStyle.DEVICE_WIDTH
          }}
        >
          {/* {source && source.loc && destination && destination.loc ? (
            <Polyline
              coordinates={[
                { longitude: source.loc[0], latitude: source.loc[1] },
                { longitude: destination.loc[0], latitude: destination.loc[1] }
              ]}
              strokeWidth={2}
              strokeColor={Constants.Colors.Primary}
            />
          ) : null} */}
          {source &&
            source.loc &&
            destination &&
            destination.loc && (
              <MapViewDirections
                origin={{ longitude: source.loc[0], latitude: source.loc[1] }}
                waypoints={wayPointsMap && wayPointsMap.length > 2 ? wayPointsMap.slice(1, -1) : null}
                destination={{ longitude: destination.loc[0], latitude: destination.loc[1] }}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={4}
                strokeColor={Constants.Colors.PolyLineGrey}
                onStart={() => {
                  //   console.log(`Started routing between "${params.origin}" and "${params.destination}"`);
                }}
                onReady={result => {
                  // debugger;
                  this.coordinates = result.coordinates;
                  if (!this.setMapView) {
                    this.setMapView = true; //this flag will only allow to reset map view only first time
                    this.fitMaptoCordinations(this.coordinates);
                  }
                }}
                // onError={(errorMessage) => {
                //    console.log('GOT AN ERROR');
                // }}
              />
            )}
          {this.renderShuttle()}
          {source && source.loc ? (
            <Marker.Animated
              coordinate={{ longitude: source.loc[0], latitude: source.loc[1] }}
              image={Constants.Images.Common.Source}
            />
          ) : null}
          {destination && destination.loc ? (
            <Marker.Animated
              coordinate={{ longitude: destination.loc[0], latitude: destination.loc[1] }}
              image={Constants.Images.Common.Destination}
            />
          ) : null}
        </MapView>

        {this.conditionalViewManagement()}
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
    riderTrip: state.riderTrip,
    loader: state.loader,
    app: state.app
  };
}

reactMixin(DashBoard.prototype, TimerMixin);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DashBoard);

{
  /* */
}
