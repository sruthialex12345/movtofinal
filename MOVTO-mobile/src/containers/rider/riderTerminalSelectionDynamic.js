/*
Name : Gurtej singh
File Name : RiderTerminal.js
Description : Contains the RiderTerminal screen
Date : 3 Feb 2019
*/
/* eslint-disable */
import React, { Component } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";

import Constants from "../../constants";
import Styles from "../../styles/container/riderTerminal";
import Header from "../../components/common/Header";
import * as appActions from "../../actions";
import LocationInput from "../../components/common/LocationInput";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { moderateScale } from "../../helpers/ResponsiveFonts";
const homePlace = { description: "Home", geometry: { location: { lat: 48.8152937, lng: 2.4597668 } } };
const workPlace = { description: "Work", geometry: { location: { lat: 48.8496818, lng: 2.2940881 } } };

class RiderTerminal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      region: null,
      lastLat: null,
      lastLong: null,
      source: "",
      destination: ""
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };

  componentDidMount() {
    let { navigator, admin, sourceAdmin } = this.props;
    let { locationType } = this.props.riderLocation;
    if (locationType == Constants.AppConstants.UserLocation.Source) {
      this.props.appActions.getRiderPickupPoints("", navigator, admin);
    } else {
      this.props.appActions.getRiderDropupPoints("", navigator, admin, sourceAdmin);
    }
  }
  componentWillUnmount() {
    this.props.appActions.resetTerminals();
  }
  onSelectTerminal = _.debounce((data, details = null) => {
    let { admin, appActions, navigator, onSelectTerminal } = this.props;
    let terminal;
    if (details) {
      let { geometry } = details;
      let { location } = geometry;
      terminal = {
        address: details.formatted_address || details.name || null,
        name: details.name || details.formatted_address || null,
        loc: [location.lng || 0, location.lat || 0],
        _id: details.place_id || 0
      };
    }
    if (admin) {
      onSelectTerminal(terminal);
      navigator.pop();
    } else {
      appActions.setRiderLocation(terminal, navigator);
    }
  });

  render() {
    return (
      <View style={Styles.mainView}>
        <Header hideDrawer color={Constants.Colors.transparent} navigator={this.props.navigator} />
        <View style={{ marginHorizontal: 10, flex: 1 }}>
          <GooglePlacesAutocomplete
            placeholder="Search"
            minLength={2} // minimum length of text to search
            autoFocus={false}
            returnKeyType={"search"} // Can be left out for default return key https://facebook.github.io/react-native/docs/textinput.html#returnkeytype
            listViewDisplayed="auto" // true/false/undefined
            fetchDetails={true}
            renderDescription={row => row.description} // custom description render
            onPress={this.onSelectTerminal}
            getDefaultValue={() => ""}
            query={{
              key: Constants.DevKeys.map.APIKey,
              language: "en" // language of the results
              // types: "(cities)" // default: 'geocode'
            }}
            styles={{
              textInputContainer: {
                width: "100%",
                backgroundColor: "#fff",
                borderRadius: moderateScale(10),
                borderWidth: 0.5,
                flexDirection: "row",
                borderColor: "#A9AFAF",
                overflow: "hidden"
              }
            }}
            //   currentLocation={true} // Will add a 'Current location' button at the top of the predefined places list
            // currentLocationLabel="Current location"
            nearbyPlacesAPI="GooglePlacesSearch" // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
            GoogleReverseGeocodingQuery={
              {
                // available options for GoogleReverseGeocoding API : https://developers.google.com/maps/documentation/geocoding/intro
              }
            }
            GooglePlacesSearchQuery={{
              // available options for GooglePlacesSearch API : https://developers.google.com/places/web-service/search
              rankby: "distance",
              types: "food"
            }}
            filterReverseGeocodingByTypes={["locality", "administrative_area_level_3"]} // filter the reverse geocoding results by types - ['locality', 'administrative_area_level_3'] if you want to display only cities
            //  predefinedPlaces={[homePlace, workPlace]}
            debounce={200} // debounce the requests in ms. Set to 0 to remove debounce. By default 0ms.
            // renderLeftButton={()  => <Image source={Constants.Images.Common.Back} />}
            // renderRightButton={() => <Text>Custom text after the input</Text>}
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
    user: state.user,
    riderLocation: state.riderLocation,
    loader: state.loader
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RiderTerminal);

{
  /* */
}
