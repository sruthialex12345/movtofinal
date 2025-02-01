/*
Name : Gurtej Singh
File Name : Maps.js
Description : Contains the Maps View
Date : 12 OCT 2018
*/

import React, { Component } from "react";
import { View, StyleSheet, Image, Text, TouchableOpacity, Platform, AppState } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import Permissions from "react-native-permissions";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";
import AddButton from "../../components/common/AddButton";
import MapApi from "../../helpers/Maps";
import * as appActions from "../../actions";
import Constants from "../../constants";
import Header from "../../components/common/Header";
import CustomCallOut from "../../components/driver/CustomCallOut";
import RideStatusModal from "../../components/driver/RideStatusModal";
import { moderateScale } from "../../helpers/ResponsiveFonts";
// import { socketInit } from "../../helpers/socket";
import DriverSocket from "../../helpers/socket/driver";
import { handleDeepLink, toastMessage } from "../../config/navigators";
import MapViewDirections from "react-native-maps-directions";
import KeepAwake from "react-native-keep-awake";
const GOOGLE_MAPS_APIKEY = Constants.DevKeys.map.APIKey;

class Maps extends Component {
  constructor(props) {
    super(props);
    this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
    let { trip } = props;
    let { region } = trip;
    this.state = {
      shuttleRoutes: [],
      distanceTravelled: 0,
      coordinates: [],
      appState: AppState.currentState,
      wayPointsMap: null,
      coordinate: region.latitude ? region : null
    };
    this.coordinates = null;
    this.setMapView = false;
    this._interval = null;
  }
  static navigatorStyle = {
    navBarHidden: true
  };

  componentDidMount() {
    let { appActions } = this.props;
    this.setRouteUpdateInterval();

    DriverSocket.socketInit();
    this.checkLocationPermission();
    this.getDriverRoute();
    AppState.addEventListener("change", this._handleAppStateChange);
    appActions.getRideRequests(this.props.navigator, () => {
      let { trip } = this.props;
      let { waypoints, region } = trip;
      let wayPointsMap = MapApi.getDriversWayPoints(waypoints, region);
      this.setState({ wayPointsMap });
    });
    // setTimeout(this.animateRegion, 3000);
  }

  //update route interval
  setRouteUpdateInterval() {
    this._interval = this.setInterval(() => {
      // Your code
      let { trip } = this.props;
      let { waypoints, region } = trip;
      let wayPointsMap = MapApi.getDriversWayPoints(waypoints, region);
      this.setState({
        wayPointsMap
      });
    }, Constants.DevKeys.map.Timer);
  }
  _handleAppStateChange = nextAppState => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === "active") {
      let { appActions } = this.props;
      appActions.getRideRequests(this.props.navigator);
    }
    this.setState({ appState: nextAppState });
  };

  componentDidUpdate(prevProps) {
    let { trip } = this.props;
    let { waypoints, region } = trip;
    // let preRegion = prevProps.trip.region;
    if (prevProps.trip.waypoints.length && !waypoints.length && this.map) {
      this.fitMaptoCordinations([], region);
    }
    // if (JSON.stringify(preRegion) !== JSON.stringify(region)) {
    //   console.log("Animating.........",region);
    //   console.log("shuttleMarkershuttleMarkershuttleMarkershuttleMarker",this.shuttleMarker);
    //    // this.shuttleMarker && this.shuttleMarker.animateMarkerToCoordinate(region, 5000);
    //     if(this.shuttleMarker){
    //       this.shuttleMarker.animateMarkerToCoordinate(
    //         region,
    //         10000
    //       );
    //     }

    // }
  }

  animateRegion = () => {
    let { trip } = this.props;
    let { region } = trip;
    let angle = (region && region.angle) || 0;
    if (this.map) {
      this.map.animateToBearing(angle, 500);
      // setTimeout(() => {
      //   this.map.animateToViewingAngle(90, 100);
      // }, 200);
    }
  };

  //check permission for the locations
  checkLocationPermission = async () => {
    let { navigator } = this.props;
    const requestPermission = await Permissions.request("location");
    if (requestPermission == "authorized") {
      this.getAndSetPossitionData();
      this.setTimeout(() => {
        this.setCurrentPossiotion();
      }, 1000);
    } else {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: Constants.Strings.Permissions.Locations
      });
    }
    // }
  };
  setCurrentPossiotion = () => {
    MapApi.getCurrentPosition(navigator).then(
      region => {
        this.onRegionChange(region);
        let { trip } = this.props;
        let { waypoints } = trip;
        DriverSocket.updateLocation(region);
        this.fitMaptoCordinations(waypoints, region);
      },
      () => {
        toastMessage(this.props.navigator, {
          type: Constants.AppConstants.Notificaitons.Error,
          message: "Please check your location services"
        });
      }
    );
  };

  //get location data and set states
  getAndSetPossitionData = () => {
    MapApi.watcher().then(
      region => {
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

  getDriverRoute = async () => {
    let { trip } = this.props;
    let { driverRoute } = trip;
    let formattedRoute = await MapApi.getFormattedLatLong(driverRoute);
    let waypointsArry = { waypoints: formattedRoute };
    this.props.appActions.updateTripData(waypointsArry);
  };

  componentWillUnmount() {
    AppState.removeEventListener("change", this._handleAppStateChange);
    clearInterval(this._interval);
  }

  onRegionChange = region => {
    this.props.appActions.updateRegion(region);
  };

  loadPassengerModal = _.debounce(() => {
    this.props.navigator.showModal({
      screen: "PassengerModal",
      animationType: "slide-up",
      navigatorStyle: {
        statusBarColor: "transparent",
        navBarHidden: true,
        screenBackgroundColor: "transparent",
        modalPresentationStyle: "overFullScreen"
      }
    });
  }, 300);

  onTerminalPress = _.debounce(terminal => {
    this.props.navigator.push({
      screen: "TerminalDetails",
      passProps: { terminal },
      animated: true,
      animationType: "slide-horizontal"
    });
  }, 300);
  onAddPassangersPress = _.debounce(() => {
    this.props.navigator.push({
      screen: "AddPassengers",
      animated: true,
      animationType: "slide-horizontal"
    });
  }, 300);

  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 10);

  renderShuttle = () => {
    /* function will display shuttle */
    let { trip } = this.props;
    let { region } = trip;
    if (region && region.latitude) {
      if (Platform.OS === "android") {
        return (
          <MapView.Marker
            ref={marker => {
              this.shuttleMarker = marker;
            }}
            //coordinate={region}
            coordinate={this.state.coordinate}
            image={Constants.Images.Common.Bus}
            rotation={(region && region.angle) || 0}
          />
        );
      } else {
        return (
          <MapView.Marker
            ref={marker => {
              this.shuttleMarker = marker;
            }}
            coordinate={region}
          >
            <Image
              style={{
                transform: [{ rotate: `${(region && region.angle) || 0}deg` }]
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

  currentTerminalModal = () => {
    let { trip } = this.props;
    let { currentTerminal } = trip;
    /* method renderd whenever driver has riders on terminal to complete ride as well for continue ride*/
    if ((currentTerminal && currentTerminal.isContinueModal) || (currentTerminal && currentTerminal.isCompleteModal)) {
      return <RideStatusModal navigator={this.props.navigator} />;
    }
  };

  renderRequestModal = () => {
    let { trip } = this.props;
    let { rides, meta } = trip;
    if (rides && rides.length) {
      return (
        <TouchableOpacity
          onPress={this.loadPassengerModal}
          style={{
            position: "absolute",
            zIndex: 999,
            backgroundColor: Constants.Colors.White,
            width: Constants.BaseStyle.DEVICE_WIDTH,
            bottom: 0,
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
            height: Constants.BaseStyle.DEVICE_HEIGHT * 0.1,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            shadowColor: "black",
            shadowOffset: { width: 2, height: -1 },
            shadowOpacity: 0.4,
            shadowRadius: 2,
            elevation: 25
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
              {meta && meta.newRequestsCount} New Request
            </Text>
            <Text
              numberOfLines={1}
              style={{
                ...Constants.Fonts.TitilliumWebRegular,
                fontSize: moderateScale(17),
                color: Constants.Colors.placehoder
              }}
            >
              {/* Lax Terminal 1, Lax Terminal 1 */}
            </Text>
          </View>
          <View style={{ padding: moderateScale(20) }}>
            <Text
              numberOfLines={1}
              style={{
                ...Constants.Fonts.TitilliumWebSemiBold,
                fontSize: moderateScale(16),
                color: Constants.Colors.placehoder
              }}
            >
              View All
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
  };

  renderTerminalsCallouts = () => {
    let { trip } = this.props;
    let { driverRoute, rides } = trip;
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
          <Callout
            onPress={() => this.onTerminalPress(terminal)}
            tooltip={true}
            style={{ alignItems: "center", padding: moderateScale(10) }}
          >
            <CustomCallOut terminal={terminal} onTerminalPress={this.onTerminalPress} />
          </Callout>
        </Marker.Animated>
      );
    });
  };
  fitMaptoCordinations = (coordinates, region) => {
    if (coordinates && this.map) {
      if (region.latitude || coordinates.length) {
        this.map.fitToCoordinates(region && region.latitude ? [...coordinates, region] : coordinates, {
          // edgePadding: {
          //   right: (width / 10),
          //   bottom: (height / 10),
          //   left: (width / 10),
          //   top: (height /10),
          // }
          edgePadding: {
            right: 100,
            bottom: 40,
            left: 100,
            top: 40
          }
        });
      }
    }
  };

  render() {
    let { trip } = this.props;
    let { waypoints } = trip;
    let { wayPointsMap } = this.state;
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
        {this.currentTerminalModal()}

        {/* {tripType != Constants.AppConstants.RouteType.Dynamic && ( */}
        <AddButton
          src={Constants.Images.Common.Add}
          buttonStyle={{ bottom: moderateScale(80) }}
          onPress={this.onAddPassangersPress}
        />
        {/* )} */}
        {this.renderRequestModal()}
        <MapView
          ref={ref => {
            this.map = ref;
          }}
          followsUserLocation={true}
          showsUserLocation={false}
          zoomEnabled={true}
          rotateEnabled={false}
          scrollEnabled={true}
          // region={region && region.latitude ? region : null}
          loadingEnabled={true}
          style={{
            height: Constants.BaseStyle.DEVICE_HEIGHT,
            width: Constants.BaseStyle.DEVICE_WIDTH
          }}
        >
          {waypoints.length >= 2 && (
            <MapViewDirections
              origin={wayPointsMap ? wayPointsMap[0] : waypoints[0]}
              //  waypoints={waypoints.length > 2 ? region&& region.latitude?[waypoints.slice(1, -1),...region]:[waypoints.slice(1, -1)] :region&& region.latitude?[...region]: null}
              //waypoints={waypoints.length > 2 ? waypoints.slice(1, -1) : null}
              waypoints={wayPointsMap && wayPointsMap.length > 2 ? wayPointsMap.slice(1, -1) : null}
              destination={wayPointsMap ? wayPointsMap[wayPointsMap.length - 1] : waypoints[waypoints.length - 1]}
              apikey={GOOGLE_MAPS_APIKEY}
              strokeWidth={4}
              strokeColor={Constants.Colors.PolyLineGrey}
              optimizeWaypoints={true}
              onStart={() => {
                //   console.log(`Started routing between "${params.origin}" and "${params.destination}"`);
              }}
              onReady={result => {
                this.coordinates = result.coordinates;
                if (!this.setMapView) {
                  let { trip } = this.props;
                  let { region } = trip;
                  this.setMapView = true;
                  this.fitMaptoCordinations(this.coordinates, region);
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
    trip: state.trip,
    loader: state.loader,
    app: state.app
  };
}

reactMixin(Maps.prototype, TimerMixin);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Maps);
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
