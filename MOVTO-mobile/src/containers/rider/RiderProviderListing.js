/*
Name : Gurtej Singh
File Name : RiderProviderListing.js
Description : Contains the Provider listing
Date : 11 Oct 2018
*/

import React, { Component } from "react";
import { View, Text, Image, TouchableOpacity, FlatList } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";

import * as appActions from "../../actions";
import Constants from "../../constants";
import Header from "../../components/common/Header";
import Styles from "../../styles/container/RiderProviderListing";
import { handleDeepLink, toastMessage } from "../../config/navigators";
import NoRecord from "../../components/common/NoRecord";
import MapApi from "../../helpers/Maps";
import UserSocket from "../../helpers/socket/rider";
import Permissions from "react-native-permissions";
import * as Types from "../../actionTypes";

class RiderProviderListing extends Component {
  constructor(props) {
    super(props);
    this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
    this.state = {
      Provider: {}
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };

  componentDidMount() {
    let { navigator } = this.props;
    UserSocket.socketInit();
    setTimeout(() => {
      this.checkLocationPermission();
    }, 700);

    navigator.setDrawerEnabled({
      side: "left",
      enabled: true
    });
  }

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
    let { navigator, appActions } = this.props;
    MapApi.getCurrentPosition(navigator).then(
      region => {
        UserSocket.updateLocation(region);
        this.onRegionChange(region);
        appActions.getRideData(navigator, data => {
          appActions.getServiceProviders("", navigator, providers => {
            /*following code to set service provider when we are getting data from server 
              for the active ride*/
            if (data.tripId) {
              let { adminId } = data;
              let index = _.findIndex(providers, ["_id", adminId]);
              if (index > -1) {
                let activeAdmin = providers[index];
                this.onProviderPress(activeAdmin);
              }
            }
          });
          this.conditionalBaseRendering();
        });
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
  conditionalBaseRendering = () => {
    let { riderTrip, navigator } = this.props;
    if (riderTrip._id) {
      if (riderTrip.rateScreen === Constants.AppConstants.RideStatus.RatingRide) {
        navigator.push({
          screen: "RiderRating"
        });
      } else if (riderTrip.rateScreen === Constants.AppConstants.RideStatus.RatingDriver) {
        navigator.push({
          screen: "RiderRateToDriver"
        });
      } else {
        navigator.resetTo({
          screen: "DashBoard"
        });
      }
    }
  };
  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 500);
  onProviderPress = _.debounce(provider => {
    if (!provider.shuttelStatus) {
      alert("Currently service is not available please contact shuttle provider.");
    } else {
      //@GR - 05/06/2020 - Set provider id as adminId for the Passenger
      if(this.props.user.userType == Constants.AppConstants.UserTypes.Rider){
        //Update adminId to user route and dispatch to reducer to update the user properties
        //this.props.user.route.adminId = provider._id;
        console.log("Provider id: ", provider._id);
         this.props.appActions.updateRideProvider({...this.props.user.route, adminId : provider._id});
      }
      this.props.appActions.clearLocationData();
      this.props.appActions.setProvider(provider, this.props.navigator);
    }
  });

  onCanclePress = _.debounce(() => {
    this.setState({ Provider: {} });
  });

  onRightPress = _.debounce(() => {
    this.props.navigator.showModal({
      screen: "ProviderSearchListing",
      animationType: "slide-up",
      passProps: {
        onProviderPress: this.onProviderPress
      }
      // navigatorStyle: {
      //   statusBarColor: "transparent",
      //   navBarHidden: false,
      //   screenBackgroundColor: "transparent",
      //   modalPresentationStyle: "overFullScreen"
      // }
    });
  });
  renderItem = ({ item }) => {
    return (
      <TouchableOpacity onPress={() => this.onProviderPress(item)} key={item._id} style={Styles.itemContaier}>
        <View style={[Styles.imageContainer, { justifyContent: "center" }]}>
          {typeof item.profileUrl === "string" ? (
            <Image resizeMode={"cover"} style={Styles.shuttleImg} source={{ uri: item.profileUrl }} />
          ) : (
            <Image source={Constants.Images.Common.Provider} resizeMode={"cover"} style={Styles.shuttleImg} />
          )}
        </View>
        <View style={Styles.textContainer}>
          <Text style={Styles.titleText}>{item.name}</Text>
        </View>
        {/* {Provider._id == item._id ? (
          <View style={Styles.yellowBtn}>
            <Image source={Constants.Images.Common.Accept} resizeMode={"contain"} />
          </View>
        ) : null} */}
      </TouchableOpacity>
    );
  };
  onRefresh = () => {
    this.props.appActions.getServiceProviders("", navigator);
  };
  render() {
    let { loader, navigator, riderLocation } = this.props;
    let { providers } = riderLocation;
    return (
      <View style={Styles.container}>
        <Header
          color={Constants.Colors.Yellow}
          navigator={navigator}
          title={"Select Provider"}
          rightIcon={Constants.Images.Common.Search}
          onRightPress={this.onRightPress}
        />

        <View style={Styles.shuttleContainer}>
          {providers.length ? (
            <Text style={Styles.textStyle}>
              {providers.length} {providers.length == 1 ? "Shuttle Provider" : "Shuttle Providers"}
            </Text>
          ) : null}
          <FlatList
            data={providers}
            renderItem={this.renderItem}
            numColumns={1}
            keyExtractor={item => item._id}
            style={Styles.listStyle}
            extraData={this.state.myShuttle}
            onRefresh={this.onRefresh}
            refreshing={loader}
            ListEmptyComponent={() => {
              return loader ? null : <NoRecord msg="No shuttle provider found" />;
            }}
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
    loader: state.loader.providerList,
    riderLocation: state.riderLocation,
    riderTrip: state.riderTrip
    // userLogo: state.riderLocation.riderLocation.providers
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RiderProviderListing);
