/*
Name : Parshant Nagpal
File Name : Maps.js
Description : Contains the Maps Tab
Date : 6 Sept 2018
*/

import React, { Component } from "react";
import { View, StyleSheet, Platform, Text } from "react-native";
import MapView, { AnimatedRegion, Polyline, Marker } from "react-native-maps";
import haversine from "haversine";
//Guru - 12/29/2019 - Fix for RN0.61.5 Upgrade
import Geolocation from "@react-native-community/geolocation";

import Constants from "../constants";
import Header from "../components/common/Header";
// import Styles from "../styles";
const LATITUDE = 29.95539;
const LONGITUDE = 78.07513;
const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = LATITUDE_DELTA * Constants.BaseStyle.aspectRatio;

class UserRoute extends Component {
  constructor(props) {
    super(props);
    this.state = {
      region: {},
      routeCoordinates: [],
      distanceTravelled: 0,
      prevLatLng: {},
      coordinate: new AnimatedRegion({
        latitude: LATITUDE,
        longitude: LONGITUDE
      })
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };

  UNSAFE_componentWillMount() {
    //Guru - 12/29/2019 - Fix for RN0.61.5 Upgrade
    Geolocation.getCurrentPosition(
      position => {
        let { longitude, latitude } = position.coords;
        let region = {
          longitude,
          latitude,
          longitudeDelta: LONGITUDE_DELTA,
          latitudeDelta: LATITUDE_DELTA
        };
        this.setState({
          region
        });
      },
      error => alert(error.message),
      {
        enableHighAccuracy: false
      }
    );
  }

  componentDidMount() {
    //const { coordinate } = this.state;
    //Guru - 12/29/2019 - Fix for RN0.61.5 Upgrade
    this.watchID = Geolocation.watchPosition(
      position => {
        const { coordinate, routeCoordinates, distanceTravelled } = this.state;
        const { latitude, longitude } = position.coords;

        const region = {
          latitude,
          longitude,
          longitudeDelta: LONGITUDE,
          latitudeDelta: LATITUDE_DELTA
        };
        if (Platform.OS === "android") {
          if (this.marker) {
            this.marker._component.animateMarkerToCoordinate(region, 500);
          }
        } else {
          coordinate.timing(region).start();
        }

        this.setState({
          region,
          routeCoordinates: routeCoordinates.concat([region]),
          distanceTravelled: distanceTravelled + this.calcDistance(region),
          prevLatLng: region
        });
      },
      error => console.log(error), //eslint-disable-line
      { enableHighAccuracy: false }
    );
  }
  componentWillUnmount() {
    //Guru - 12/29/2019 - Fix for RN0.61.5 Upgrade
    Geolocation.clearWatch(this.watchID);
  }
  calcDistance = newLatLng => {
    const { prevLatLng } = this.state;
    return haversine(prevLatLng, newLatLng) || 0;
  };

  onRegionChange = region => {
    this.setState({ region });
  };

  render() {
    let riders = [
      { name: "abc", coordinate: { latitude: 30.70907, longitude: 76.704556 } },
      { name: "abc1", coordinate: { latitude: 30.709441, longitude: 76.703794 } },
      { name: "abc2", coordinate: { latitude: 30.709275, longitude: 76.704116 } },
      { name: "abc3", coordinate: { latitude: 30.708868, longitude: 76.707056 } }
    ];
    return (
      <View style={styles.container}>
        <View
          style={{
            position: "absolute",
            zIndex: 999,
            backgroundColor: Constants.Colors.transparent,
            width: Constants.BaseStyle.DEVICE_WIDTH
          }}
        >
          <Header navigator={this.props.navigator} hideDrawer color={Constants.Colors.transparent} />
          <Text>sada</Text>
        </View>
        <MapView
          zoomEnabled={true}
          minZoomLevel={5}
          rotateEnabled={true}
          scrollEnabled={true}
          initialRegion={this.state.region}
          onRegionChange={this.onRegionChange}
          onRegionChangeComplete={this.onRegionChange}
          showUserLocation={true}
          followUserLocation={true}
          loadingEnabled={true}
          style={{
            height: Constants.BaseStyle.DEVICE_HEIGHT,
            width: Constants.BaseStyle.DEVICE_WIDTH
          }}
        >
          <Polyline coordinates={this.state.routeCoordinates} strokeWidth={5} />

          {riders.map((item, index) => {
            return (
              <Marker.Animated
                coordinate={item.coordinate}
                title={item.riderName}
                image={Constants.Images.Common.User}
                key={index}
              />
            );
          })}
        </MapView>
      </View>
    );
  }
}

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

export default UserRoute;
