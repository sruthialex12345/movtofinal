/*
Name : Gurtej Singh
File Name : Maps.js
Description : Contains the Maps View
Date : 12 OCT 2018
*/

import React, { Component } from "react";
import {
  View,
  StyleSheet,
  Image,
  Platform,
  Animated,
  Text,
  TouchableOpacity,
  PanResponder,
  LayoutAnimation
} from "react-native";
import MapView, { PROVIDER_GOOGLE, Callout, Marker } from "react-native-maps";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import Permissions from "react-native-permissions";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";

import MapApi from "../../helpers/Maps";
import * as appActions from "../../actions";
import Constants from "../../constants";
import Header from "../../components/common/Header";
import CustomCallOut from "../../components/admin/CustomCallOut";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import AdminSocket from "../../helpers/socket/admin";
import { handleDeepLink, toastMessage } from "../../config/navigators";
import KeepAwake from "react-native-keep-awake";
class AdminDashBoard extends Component {
  constructor(props) {
    super(props);
    this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
    this.state = {
      shuttleRoutes: [],
      routeCoordinates: [],
      distanceTravelled: 0
    };
    this._panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (event, gestureState) => {
        if (gestureState.dx < 4 && (gestureState.dy < -10 && gestureState.dy < 0)) {
          LayoutAnimation.easeInEaseOut();
          this.loadActiveTripModal();
        }
      }
    });
  }
  static navigatorStyle = {
    navBarHidden: true
  };

  componentDidMount() {
    let { appActions } = this.props;
    this.setTimeout(() => {
      AdminSocket.socketInit();
      this.checkLocationPermission();
      appActions.ActiveTrips(1, "", this.props.navigator);
    }, 500);
  }
  async componentDidUpdate(prevProps) {
    let { listing } = this.props;
    let { activeTrips } = listing;
    if (prevProps.listing.activeTrips !== activeTrips.length) {
      try {
        let formattedRoute = await MapApi.getFormattedLatLongAdmin(activeTrips);
        this.fitMaptoCordinations(formattedRoute);
      } catch (e) {
        //console.log("Error: ActiveTrips", e);
      }
    }
  }
  setCurrentPossiotion = () => {
    MapApi.getCurrentPosition(navigator).then(
      region => {
        this.onRegionChange(region);
        let { trip } = this.props;
        let { waypoints } = trip;
        // DriverSocket.updateLocation(region);
        this.fitMaptoCordinations(waypoints);
      },
      () => {
        toastMessage(this.props.navigator, {
          type: Constants.AppConstants.Notificaitons.Error,
          message: "Please check your location services"
        });
      }
    );
  };
  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.listing !== prevState.listing) {
      this.adminMap && this.adminMap.animateToRegion(nextProps.listing.region, 500);
      return null;
    } else return null;
  }

  //check permission for the locations
  checkLocationPermission = async () => {
    let { navigator } = this.props;
    const requestPermission = await Permissions.request("location");
    if (requestPermission == "authorized") {
      this.getAndSetPossitionData();
    } else {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: Constants.Strings.Permissions.Locations
      });
    }
  };

  //get location data and set states
  getAndSetPossitionData = () => {
    MapApi.getCurrentPosition(navigator).then(
      region => {
        this.onRegionChange(region);
        // updateLocation(region);
      },
      () => {
        toastMessage(this.props.navigator, {
          type: Constants.AppConstants.Notificaitons.Error,
          message: "Please check your location services"
        });
      }
    );
  };

  onRegionChange = region => {
    this.props.appActions.updateRegion(region);
  };

  loadActiveTripModal = _.debounce(() => {
    this.props.navigator.showModal({
      screen: "ActiveTripModal",
      animationType: "slide-up",
      navigatorStyle: {
        statusBarColor: "transparent",
        navBarHidden: true,
        screenBackgroundColor: "transparent",
        modalPresentationStyle: "overFullScreen"
      }
    });
  });

  onTerminalPress = _.debounce(terminal => {
    this.props.navigator.push({
      screen: "TerminalDetails",
      passProps: { terminal },
      animated: true,
      animationType: "slide-horizontal"
    });
  });

  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 500);

  updateCurrentTrip = _.debounce(tripId => {
    this.props.appActions.updateCurrentTrip(tripId, this.props.navigator);
  });

  renderShuttles = () => {
    /* function will display shuttle */
    let { listing } = this.props;
    let { activeTrips } = listing;

    return activeTrips.map(trip => {
      let coordinate = trip.region ? trip.region : { latitude: trip.gpsLoc[1], longitude: trip.gpsLoc[0] };

      if (Platform.OS === "android") {
        return (
          <Marker.Animated
            key={trip._id}
            coordinate={coordinate}
            image={Constants.Images.Common.Bus}
            rotation={(trip.region && trip.region.angle) || 0}
          >
            <Callout onPress={() => this.updateCurrentTrip(trip._id)} tooltip={false} style={{ alignItems: "center" }}>
              <CustomCallOut
                name={trip.shuttleId && trip.shuttleId.name && trip.shuttleId.name.trim()}
                tripId={trip._id}
              />
            </Callout>
          </Marker.Animated>
        );
      } else {
        return (
          <Marker.Animated coordinate={coordinate} key={trip._id}>
            <Image
              style={{
                width: moderateScale(25),
                height: moderateScale(25),
                transform: [{ rotate: `${(trip.region && trip.region.angle) || 0}deg` }]
              }}
              source={Constants.Images.Common.Bus}
              resizeMode={"contain"}
            />
            <Callout
              onPress={() => this.updateCurrentTrip(trip._id)}
              tooltip={false}
              style={{ alignItems: "center", padding: moderateScale(10) }}
            >
              <CustomCallOut name={trip.shuttleId && trip.shuttleId.name && trip.shuttleId.name.trim()} />
            </Callout>
          </Marker.Animated>
        );
      }
    });
  };

  renderRequestModal = () => {
    let { listing } = this.props;
    let { activeTrips } = listing;
    if (activeTrips && activeTrips.length > 0) {
      return (
        <Animated.View
          {...this._panResponder.panHandlers}
          style={{
            position: "absolute",
            zIndex: 999,
            backgroundColor: Constants.Colors.White,
            width: Constants.BaseStyle.DEVICE_WIDTH,
            bottom: 0,
            height: Constants.BaseStyle.DEVICE_HEIGHT * 0.1,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            shadowColor: "black",
            shadowOffset: { width: 2, height: -1 },
            shadowOpacity: 0.4,
            shadowRadius: 2,
            elevation: 25,
            alignItems: "center"
          }}
        >
          <View style={{ height: 10 }} />
          <Image source={Constants.Images.Common.sliderLine} />
          <TouchableOpacity
            onPress={this.loadActiveTripModal}
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center"
            }}
          >
            <View
              style={{
                height: moderateScale(50),
                width: moderateScale(50),
                justifyContent: "center",
                alignItems: "center",
                padding: moderateScale(20)
              }}
            >
              <Image
                source={Constants.Images.Common.UpArrow}
                style={{
                  height: moderateScale(20),
                  width: moderateScale(20)
                }}
              />
            </View>
            <View style={{ flex: 0.85 }}>
              <Text
                numberOfLines={1}
                style={{
                  ...Constants.Fonts.TitilliumWebSemiBold,
                  fontSize: moderateScale(19),
                  color: Constants.Colors.Black
                }}
              >
                {activeTrips.length}
                {activeTrips.length > 1 ? " Active Shuttles" : " Active Shuttle"}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    }
  };
  fitMaptoCordinations = coordinates => {
    if (coordinates && this.adminMap) {
      this.adminMap.fitToCoordinates(coordinates, {
        edgePadding: {
          right: 40,
          bottom: 100,
          left: 40,
          top: 40
        }
      });
    }
  };
  render() {
    let { listing } = this.props;
    let region = {
      latitude: 30.704090393529093,
      latitudeDelta: 0.005,
      longitude: 76.7036553598852,
      longitudeDelta: 0.003010033444816054
    };
    if (listing.region) {
      region = { ...listing.region };
    }

    return (
      <View style={styles.container}>
        <KeepAwake />
        <View
          style={{
            position: "absolute",
            zIndex: 999,
            backgroundColor: Constants.Colors.transparent,
            width: Constants.BaseStyle.DEVICE_WIDTH
          }}
        >
          <Header color={Constants.Colors.transparent} navigator={this.props.navigator} />
        </View>

        {this.renderRequestModal()}
        <MapView
          ref={refs => (this.adminMap = refs)}
          // mapPadding={{
          //   top: moderateScale(20),
          //   right: moderateScale(20),
          //   bottom: moderateScale(20),
          //   left: moderateScale(20)
          // }}
          provider={PROVIDER_GOOGLE}
          followsUserLocation={true}
          showsUserLocation={false}
          // zoomEnabled={true}
          rotateEnabled={false}
          scrollEnabled={true}
          region={region && region.latitude ? region : null}
          loadingEnabled={true}
          style={{
            height:
              listing.activeTrips.length > 0
                ? Constants.BaseStyle.DEVICE_HEIGHT - Constants.BaseStyle.DEVICE_HEIGHT * 0.1
                : Constants.BaseStyle.DEVICE_HEIGHT,
            width: Constants.BaseStyle.DEVICE_WIDTH
          }}
        >
          {/* <Polyline coordinates={shuttleRoutes} strokeWidth={4} strokeColor={"#333"} /> */}
          {this.renderShuttles()}
        </MapView>
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
    listing: state.listing,
    loader: state.loader,
    app: state.app
  };
}

reactMixin(AdminDashBoard.prototype, TimerMixin);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AdminDashBoard);
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.Colors.transparent
  },
  map: {
    height: Constants.BaseStyle.DEVICE_HEIGHT
  },
  bubble: {
    flex: 1,
    backgroundColor: Constants.Colors.transparent
  }
});
