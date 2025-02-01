/*
Name : Gurtej Singh
File Name : Maps.js
Description : Contains the Maps View
Date : 26 Nov 2018
*/

import React, { Component } from "react";
import { View, StyleSheet, Image, Platform } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";

import MapApi from "../../helpers/Maps";
import * as appActions from "../../actions";
import Constants from "../../constants";
import Header from "../../components/common/Header";
import CustomCallOut from "../../components/driver/CustomCallOut";
import RideStatus from "../../components/driver/RideStatus";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import AdminTripSocket from "../../helpers/socket/admin/TripSocket";
import { handleDeepLink } from "../../config/navigators";
import ActiveTripDriverModal from "../../components/admin/ActiveTripDriverModal";
import MapViewDirections from "react-native-maps-directions";
import KeepAwake from "react-native-keep-awake";
const GOOGLE_MAPS_APIKEY = Constants.DevKeys.map.APIKey;
class TripMap extends Component {
  constructor(props) {
    super(props);
    this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
    let { trip } = props;
    let { waypoints } = trip;
    this.state = {
      shuttleRoutes: [],
      routeCoordinates: [],
      distanceTravelled: 0,
      wayPointsMap: waypoints
    };
    this._interval = null;
    this.setMapView = false;
  }
  static navigatorStyle = {
    navBarHidden: true
  };

  componentDidMount() {
    let { appActions, navigator } = this.props;
    this.setTimeout(() => {
      AdminTripSocket.socketInit();
      // this.checkLocationPermission();
      appActions.getTripRoute(navigator);
      appActions.getRideRequests(navigator);
      this.getDriverRoute();
      this.setRouteUpdateInterval();
    }, 500);
  }
  //update route interval
  setRouteUpdateInterval() {
    this._interval = this.setInterval(() => {
      // Your code
      let { trip, listing } = this.props;
      let { waypoints } = trip;
      let { activeTrips, currentTrip } = listing;
      activeTrips.map(trip => {
        if (currentTrip === trip._id) {
          let coordinate = trip.region ? trip.region : { latitude: trip.gpsLoc[1], longitude: trip.gpsLoc[0] };
          let wayPointsMap = MapApi.getDriversWayPoints(waypoints, coordinate);
          this.setState({
            wayPointsMap
          });
          return;
        }
      });
    }, Constants.DevKeys.map.Timer);
  }
  componentWillUnmount = () => {
    AdminTripSocket.disconnectSocket();
    clearInterval(this._interval);
  };
  componentDidUpdate(prevProps) {
    let { trip } = this.props;
    let { waypoints } = trip;
    if (prevProps.trip.waypoints.length && !waypoints.length) {
      this.fitMaptoCordinations([]);
    }
  }
  getDriverRoute = async () => {
    let { trip } = this.props;
    let { driverRoute } = trip;
    let waypointsArry = [];
    if (driverRoute.length) {
      let formattedRoute = await MapApi.getFormattedLatLong(driverRoute);
      waypointsArry = { waypoints: formattedRoute };
    }
    this.props.appActions.updateTripData(waypointsArry);
    if (!waypointsArry.length) {
      this.fitMaptoCordinations([]);
    }
  };
  // getDriverRoute = () => {
  //   let { listing } = this.props;
  //   let { tripRoute } = listing;
  //   let shuttleRoute = [];
  //   debugger;
  //   tripRoute &&
  //     tripRoute.length &&
  //     tripRoute.map(item => {
  //       shuttleRoute.push({
  //         longitude: item.loc[0],
  //         latitude: item.loc[1]
  //       });
  //     });

  //   this.setTimeout(() => {
  //     if (shuttleRoute.length > 1) {
  //       MapApi.getRoutePoints(shuttleRoute).then(shuttleRoutes => {
  //         this.setState({ shuttleRoutes });
  //         MapApi.getRegionForCoordinates(shuttleRoutes).then(region => {
  //           let regiondata = { ...region, angle: 0 };
  //           this.onRegionChange(regiondata);
  //         });
  //       });
  //     }
  //   }, 1000);
  // };

  onRegionChange = region => {
    this.props.appActions.updateRegion(region);
  };

  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 500);

  driverTripListing = () => {
    let { navigator, listing } = this.props;
    let { currentTrip, activeTrips } = listing;
    let driver = {};
    let shuttle = {};
    activeTrips.map(trip => {
      if (currentTrip === trip._id) {
        driver = trip.driver;
        shuttle = trip.shuttleId;
      }
    });
    navigator.push({
      screen: "DriverTripListing",
      passProps: { driver, shuttle }
    });
  };

  renderShuttle = () => {
    /* function will display shuttle */
    let { listing } = this.props;
    let { activeTrips, currentTrip } = listing;
    return activeTrips.map(trip => {
      if (currentTrip === trip._id) {
        let coordinate = trip.region ? trip.region : { latitude: trip.gpsLoc[1], longitude: trip.gpsLoc[0] };
        if (Platform.OS === "android") {
          return (
            <MapView.Marker
              key={trip._id}
              coordinate={coordinate}
              image={Constants.Images.Common.Bus}
              rotation={(trip.region && trip.region.angle) || 0}
            />
          );
        } else {
          return (
            <MapView.Marker coordinate={coordinate} key={trip._id}>
              <Image
                style={{
                  transform: [{ rotate: `${(trip.region && trip.region.angle) || 0}deg` }]
                }}
                source={Constants.Images.Common.Bus}
              />
            </MapView.Marker>
          );
        }
      }
    });
  };

  currentTerminalModal = () => {
    let { listing } = this.props;
    let { activeTrips } = listing;
    /* method renderd whenever driver has riders on terminal to complete ride as well for continue ride*/
    if (activeTrips && activeTrips.length > 0) {
      return <RideStatus navigator={this.props.navigator} />;
    }
  };

  renderTripDetailModal = () => {
    let { listing, navigator, loader } = this.props;
    let { tripData, activeTrips, currentTrip } = listing;
    let { meta } = tripData;
    let driver = {},
      shuttle = {};
    activeTrips.map(trip => {
      if (trip._id === currentTrip) {
        driver = trip.driver;
        shuttle = trip.shuttleId;
      }
    });
    if (!loader.rideRequests) {
      return (
        <ActiveTripDriverModal
          driverTripListing={this.driverTripListing}
          navigator={navigator}
          driver={driver}
          shuttle={shuttle}
          meta={meta}
          disabled={loader.rideRequests}
        />
      );
    }
  };

  onTerminalPress = _.debounce(terminal => {
    this.props.navigator.push({
      screen: "TerminalDetails",
      passProps: { terminal }
    });
  });

  renderTerminalsCallouts = () => {
    let { listing, trip } = this.props;
    let { driverRoute } = trip;
    let { tripData } = listing;
    let { rides } = tripData;

    let terminals = [];
    if (driverRoute && driverRoute.length > 0) {
      driverRoute.map(item => {
        let terminalInfo = { ...item };
        terminalInfo.newRequestsCount = 0;
        terminalInfo.onBoardCount = 0;
        terminalInfo.image =
          item.type === "startTerminal"
            ? Constants.Images.Common.Source
            : item.type === "endTerminal"
              ? Constants.Images.Common.Destination
              : Constants.Images.Common.Source;

        rides &&
          rides.length > 0 &&
          rides.map(ride => {
            if (ride.srcLoc && ride.srcLoc._id === item._id) {
              if (ride.tripRequestStatus === Constants.AppConstants.RideStatus.Request) {
                terminalInfo.newRequestsCount += 1;
              }
              if (ride.tripRequestStatus === Constants.AppConstants.RideStatus.EnRoute) {
                terminalInfo.onBoardCount += 1;
              }
            }
          });
        terminals.push(terminalInfo);
      });
    }
    return terminals.map((terminal, index) => {
      return (
        <Marker.Animated
          coordinate={{
            longitude: terminal.loc[0],
            latitude: terminal.loc[1]
          }}
          title={terminal.name && terminal.name.trim()}
          image={terminal.image}
          key={index}
        >
          <Callout tooltip={true} style={{ alignItems: "center", padding: moderateScale(10) }}>
            <CustomCallOut terminal={terminal} onTerminalPress={() => this.onTerminalPress(terminal)} />
          </Callout>
        </Marker.Animated>
      );
    });
  };
  fitMaptoCordinations = coordinates => {
    let { trip } = this.props;
    let { region } = trip;
    if (coordinates && this.adminTripMap) {
      this.adminTripMap.fitToCoordinates(region && region.latitude ? [...coordinates, region] : coordinates, {
        // edgePadding: {
        //   right: (width / 10),
        //   bottom: (height / 10),
        //   left: (width / 10),
        //   top: (height /10),
        // }
        // edgePadding: {
        //   right: 100,
        //   bottom: 40,
        //   left: 100,
        //   top: 40
        // }
        edgePadding: {
          right: 40,
          bottom: 40,
          left: 40,
          top: 40
        }
      });
    }
  };
  render() {
    let { trip } = this.props;
    let { waypoints } = trip;
    let { wayPointsMap } = this.state;
    // let { waypoints } = trip;
    // let region = {
    //   latitude: 30.704090393529093,
    //   latitudeDelta: 0.005,
    //   longitude: 76.7036553598852,
    //   longitudeDelta: 0.003010033444816054
    // };
    // activeTrips.map(trip => {
    //   if (trip._id === currentTrip) {
    //     region = trip.region;
    //   }
    // });
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
          <Header hideDrawer color={Constants.Colors.transparent} navigator={this.props.navigator} />
        </View>

        <MapView
          ref={refs => (this.adminTripMap = refs)}
          followsUserLocation={true}
          showsUserLocation={false}
          zoomEnabled={true}
          rotateEnabled={false}
          scrollEnabled={true}
          //  region={region}
          loadingEnabled={true}
          style={{
            height: Constants.BaseStyle.DEVICE_HEIGHT,
            width: Constants.BaseStyle.DEVICE_WIDTH
          }}
        >
          {waypoints.length >= 2 && (
            <MapViewDirections
              origin={wayPointsMap ? wayPointsMap[0] : waypoints[0]}
              //  waypoints={waypoints.length > 2 ? waypoints.slice(1, -1) : null}
              waypoints={wayPointsMap && wayPointsMap.length > 2 ? wayPointsMap.slice(1, -1) : null}
              destination={wayPointsMap ? wayPointsMap[wayPointsMap.length - 1] : waypoints[waypoints.length - 1]}
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
                  this.setMapView = true;
                  this.fitMaptoCordinations(this.coordinates);
                }
              }}
              // onError={(errorMessage) => {
              //    console.log('GOT AN ERROR');
              // }}
            />
          )}
          {/* <Polyline coordinates={shuttleRoutes} strokeWidth={4} strokeColor={"#333"} /> */}
          {this.renderShuttle()}
          {this.renderTerminalsCallouts()}
        </MapView>
        {this.renderTripDetailModal()}
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
    listing: state.listing,
    loader: state.loader,
    app: state.app,
    trip: state.trip
  };
}

reactMixin(TripMap.prototype, TimerMixin);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TripMap);
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
