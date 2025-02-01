/* eslint-disable */
import React, { Component } from "react";
import { Image, StyleSheet, Dimensions, View, Text, Animated, Easing, PanResponder, Platform } from "react-native";

import MapView, { Marker, Callout, AnimatedRegion } from "react-native-maps";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.006339428281933124;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

console.disableYellowBox = true;

const iconSize = Math.round(height / 10);

const initCoordinates = {
  latitude: 24.133765,
  longitude: 90.198258,
  latitudeDelta: 5,
  longitudeDelta: 5
};

export default class SmoothAnimation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      routeData: {},
      bearing: 0,
      speed: 0,
      time: "N/A",
      coordinate: new MapView.AnimatedRegion({
        latitude: 23,
        longitude: 90
      })
    };
    this.indx = 0;
  }

  handleAnimation = () => {
    const data = this.data[this.indx];
    const coord = data.loc.coordinates;
    const markerCoord = {
      latitude: coord[1],
      longitude: coord[0]
    };
    console.log("data ==>", data);
    this.indx = this.indx + 1;
    const duration = 100;
    const region = {
      ...markerCoord,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA
    };

    // this.map.animateToRegion(region,1000*9)

    if (Platform.OS === "android") {
      if (this.marker) {
        this.state.coordinate.timing(markerCoord, 500 * 2).start();
        console.log("===>", this.marker._component);
        this.marker._component.animateMarkerToCoordinate(markerCoord, duration);
      }
    } else {
      console.log("markerCoord", markerCoord);
      this.state.coordinate.timing(markerCoord, 0).start();
    }

    this.setState({ time: data.time, bearing: data.bearing });
  };
  countDonw = () => {
    console.log("countDonw function");
  };
  componentDidMount = async () => {
    const result = await (await fetch("https://routedata-api-moxccjjiez.now.sh/")).json();
    this.data = result.data;
    this.handleAnimation();
    setInterval(this.handleAnimation, 10000);
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <MapView
          style={styles.container}
          initialRegion={initCoordinates}
          ref={ref => {
            this.map = ref;
          }}
        >
          <MapView.Marker.Animated
            coordinate={this.state.coordinate}
            ref={marker => {
              this.marker = marker;
            }}
          >
            <Image
              style={{
                width: 40,
                height: 40,
                resizeMode: "contain",
                transform: [{ rotate: `${this.state.bearing}deg` }],
                zIndex: 3
              }}
              source={require("../../assets/images/bus.png")}
            />
          </MapView.Marker.Animated>
        </MapView>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  container: {
    // flex: 1,
    flex: 8,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
    //justifyContent: 'flex-end'
  },
  panview: {
    position: "absolute"
  },
  box: {
    backgroundColor: "rgba(0,0,0,0.7)",
    height: height, // let's make panview height is equal to screen height
    width: width,
    borderRadius: 10
    //position: 'absolute'
  }
});
