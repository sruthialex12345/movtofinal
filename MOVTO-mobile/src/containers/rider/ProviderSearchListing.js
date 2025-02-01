/*
Name : Gurtej Singh
File Name : ProviderSearchListing.js
Description : Contains the Provider listing
Date : 11 Oct 2018
*/

import React, { Component } from "react";
import { View, Text, Image, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";

import * as appActions from "../../actions";
import Constants from "../../constants";
import Header from "../../components/common/Header";
import Styles from "../../styles/container/RiderProviderListing";
import { handleDeepLink } from "../../config/navigators";

class ProviderSearchListing extends Component {
  constructor(props) {
    super(props);
    this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
    this.state = {
      Provider: {},
      searchText: "",
      typingTimer: 500
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };

  mixins = [TimerMixin];

  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 500);
  onProviderPress = provider => {
    if (!provider.shuttelStatus) {
      alert("Currently service is not available please contact shuttle provider.");
    } else {
      this.props.appActions.clearLocationData();
      this.props.appActions.setProvider(provider, this.props.navigator);
    }
  };

  onChangeSearchText = value => {
    this.setState({ searchText: value });
    clearTimeout(this.state.typingTimer); // this will cancel the previous timer
    this.setState({
      typingTimer: this.setTimeout(() => {
        this.props.appActions.getServiceProviders(this.state.searchText, this.props.navigator);
      }, 500)
    });
  };

  componentWillUnmount() {
    this.onRightPress();
  }
  onRightPress = _.debounce(() => {
    this.setState({ searchText: "" }, () =>
      this.props.appActions.getServiceProviders(this.state.searchText, this.props.navigator)
    );
  });
  renderItem = ({ item }) => {
    let { Provider } = this.state;
    return (
      <TouchableOpacity onPress={() => this.onProviderPress(item)} key={item._id} style={Styles.itemContaier}>
        <View style={[Styles.imageContainer, { justifyContent: "center" }]}>
          {typeof item.profileUrl === "string" ? (
            <Image resizeMode={"contain"} style={Styles.shuttleImg} source={{ uri: item.profileUrl }} />
          ) : (
            <Image source={Constants.Images.Common.Provider} resizeMode={"contain"} style={Styles.shuttleImg} />
          )}
        </View>
        <View style={Styles.textContainer}>
          <Text style={Styles.titleText}>{item.name}</Text>
        </View>
        {Provider._id == item._id ? (
          <View style={Styles.yellowBtn}>
            <Image source={Constants.Images.Common.Accept} resizeMode={"contain"} />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  handleBackPress = () => {
    this.setTimeout(() => {
      this.props.navigator.dismissModal();
    }, 500);
  };
  render() {
    let { loader, navigator, riderLocation } = this.props;
    let { providers } = riderLocation;
    return (
      <View style={Styles.container}>
        <Header
          onBackPress={this.handleBackPress}
          color={Constants.Colors.White}
          hideDrawer
          navigator={navigator}
          searchBox={true}
          rightIcon={Constants.Images.Common.Cross}
          onChangeSearchText={this.onChangeSearchText}
          searchText={this.state.searchText}
          searchPlaceHolder={"Search Shuttle Provider"}
          onRightPress={this.onRightPress}
        />
        {loader.providerList ? (
          <ActivityIndicator size="large" color={Constants.Colors.White} />
        ) : providers.length > 0 ? (
          <View style={Styles.shuttleContainer}>
            <Text style={Styles.textStyle}>{providers.length} Found</Text>
            <FlatList
              data={providers}
              renderItem={this.renderItem}
              numColumns={1}
              keyExtractor={item => item._id}
              style={Styles.listStyle}
              extraData={this.state.myShuttle}
            />
          </View>
        ) : (
          <View style={Styles.notFound}>
            <Text style={Styles.titleText}>No Shuttle Provider Found</Text>
          </View>
        )
        /*(
         
        )} */
        }
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
    loader: state.loader,
    riderLocation: state.riderLocation
  };
}

reactMixin(ProviderSearchListing.prototype, TimerMixin);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProviderSearchListing);
