/*
Name : Gurtej Singh
File Name : Filters.js
Description : Contains the Filters
Date : 23 Nov 2018
*/
import React, { Component } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, TextInput } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Constants from "../../constants";
import Header from "../../components/common/Header";
import * as appActions from "../../actions";
import moment from "moment";
import AuthButton from "../../components/common/AuthButton";

import { moderateScale } from "../../helpers/ResponsiveFonts";

class AssignDriver extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedDriverIndex: null
    };
  }

  static navigatorStyle = {
    navBarHidden: true
  };

  componentDidMount() {
    let { appActions, navigator } = this.props;
    appActions.getDriverListing(1, "", navigator);
    this.props.navigator.setDrawerEnabled({
      side: "left",
      enabled: false
    });
    appActions.getDriversAdminScheduling(navigator, "");
  }

  search = text => {
    let { appActions, navigator } = this.props;
    appActions.getDriversAdminScheduling(navigator, text);
  };

  selectDriver = index => {
    // let data=[...this.state.driverList];
    let selectedDriverIndex = index;
    this.setState({ selectedDriverIndex });
  };

  unSelectDrivers = () => {
    this.setState({ selectedDriverIndex: null });
  };

  assignDriverToTrip = () => {
    let driverId = this.props.listing.schedulingDrivers[this.state.selectedDriverIndex]._id;
    let data = {
      driverId: driverId,
      requestId: this.props.tripId,
      isAssign: true
    };
    this.props.appActions.assignDriver(data, this.props.navigator, true);
  };

  searchBar = () => {
    return (
      <View
        style={{
          height: moderateScale(58),
          borderBottomWidth: 1,
          flexDirection: "row",
          borderColor: "#D8D8D8"
        }}
      >
        <View
          style={{
            flex: 0.13,
            justifyContent: "center",
            alignItems: "flex-end"
          }}
        >
          <Image
            source={Constants.Images.Common.Search}
            resizeMode="contain"
            style={{
              height: moderateScale(25),
              width: moderateScale(25)
            }}
          />
        </View>
        <View style={{ flex: 0.87, justifyContent: "center" }}>
          <TextInput
            style={[Styles.srcText, { paddingHorizontal: moderateScale(10) }]}
            placeholder="Search by name..."
            onChangeText={text => this.search(text)}
          />
        </View>
      </View>
    );
  };

  renderItem = ({ item, index }) => {
    return (
      <TouchableOpacity
        onPress={() => this.selectDriver(index)}
        style={{
          height: moderateScale(70),
          borderBottomWidth: 1,
          borderColor: "#D8D8D8",
          flexDirection: "row",
          marginHorizontal: moderateScale(5)
        }}
      >
        <View style={{ flex: 0.22, justifyContent: "center", alignItems: "center" }}>
          <View
            style={{
              height: moderateScale(46),
              width: moderateScale(46),
              borderRadius: 100,
              backgroundColor: "lightgray",
              overflow: "hidden"
            }}
          >
            <Image
              // source={Constants.Images.Common.Driver}
              source={{ uri: item && item.profileUrl }}
              style={{
                height: moderateScale(46),
                width: moderateScale(46)
              }}
            />
          </View>
        </View>
        <View style={{ flex: 0.65, justifyContent: "center" }}>
          <Text numberOfLines={1} style={Styles.driverName}>
            {item.name}
          </Text>
        </View>
        {/* {myShuttle._id == item._id ? ( */}
        <View
          style={{
            flex: 0.13,
            justifyContent: "center",
            alignItems: "flex-start"
          }}
        >
          {this.state.selectedDriverIndex == index ? (
            <View
              style={{
                height: moderateScale(30),
                width: moderateScale(30),
                borderRadius: 100,
                backgroundColor: Constants.Colors.Yellow,
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <Image
                source={Constants.Images.Common.Accept}
                resizeMode={"contain"}
                style={{
                  height: moderateScale(15),
                  width: moderateScale(15)
                }}
              />
            </View>
          ) : null}
        </View>
        {/* ) : null} */}
      </TouchableOpacity>
    );
  };

  tripDetailCard = () => {
    let { item } = this.props;
    return (
      <View
        style={{
          height: moderateScale(120),
          borderBottomLeftRadius: 15,
          borderBottomRightRadius: 15,
          shadowOffset: { width: 2, height: 2 },
          shadowColor: "black",
          shadowOpacity: 0.3,
          paddingHorizontal: moderateScale(28),
          backgroundColor: "#FFFFFF",
          elevation: 2
        }}
      >
        <View style={{ flex: 0.35, justifyContent: "flex-end" }}>
          <Text numberOfLines={1} style={Styles.driverName}>
            {item && item.riderDetails.name}
          </Text>
        </View>
        <View style={{ flex: 0.3, flexDirection: "row" }}>
          <View style={Styles.srcView}>
            <Image
              source={Constants.Images.Common.Source}
              resizeMode="contain"
              style={{
                height: moderateScale(15),
                width: moderateScale(15)
              }}
            />
            <Text numberOfLines={1} style={[Styles.srcText, { paddingHorizontal: moderateScale(10) }]}>
              {item && item.srcLoc.name}
            </Text>
          </View>
          <View style={Styles.srcView}>
            <Image
              source={Constants.Images.Common.Destination}
              resizeMode="contain"
              style={{
                height: moderateScale(15),
                width: moderateScale(15)
              }}
            />
            <Text numberOfLines={1} style={[Styles.srcText, { paddingLeft: moderateScale(5) }]}>
              {item && item.destLoc.name}
            </Text>
          </View>
        </View>

        <View style={{ flex: 0.35, flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={Constants.Images.Common.Calendar}
              resizeMode="contain"
              style={{
                height: moderateScale(15),
                width: moderateScale(15)
              }}
            />
            <Text numberOfLines={1} style={Styles.destText}>
              {moment(item.scheduledTime).format("D MMM YYYY")}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginLeft: moderateScale(7)
            }}
          >
            <Image
              source={Constants.Images.RideInfo.ClockGray}
              resizeMode="contain"
              style={{
                height: moderateScale(15),
                width: moderateScale(15)
              }}
            />
            <Text numberOfLines={1} style={Styles.destText}>
              {moment(item.scheduledTime).format("hh:mm A")}
            </Text>
          </View>
          <View style={[Styles.infoView, { flex: 0.15, paddingLeft: moderateScale(10) }]}>
            <Image
              source={require("../../assets/images/manGray.png")}
              style={{
                height: moderateScale(15),
                width: moderateScale(15)
              }}
              resizeMode={"contain"}
            />
            <Text numberOfLines={1} style={Styles.destText}>
              {item.seatBooked}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  componentWillUnmount = () => {
    this.props.navigator.setDrawerEnabled({
      side: "left",
      enabled: true
    });
  };

  render() {
    // let { filter } = this.state;
    let { navigator, listing, appActions } = this.props;
    return (
      <View style={Styles.container}>
        <Header hideDrawer navigator={navigator} title={"Assign Driver"} color={Constants.Colors.Yellow} />
        <KeyboardAwareScrollView scrollEnable={false} Opacity style={[Styles.filterContainer, {}]}>
          {this.tripDetailCard()}
          {this.searchBar()}

          <FlatList
            style={{ marginTop: listing.driverFetchAdminLoader ? moderateScale(25) : 0 }}
            numColumns={1}
            keyExtractor={item => item._id}
            data={listing.schedulingDrivers}
            onRefresh={() => appActions.getDriversAdminScheduling(navigator)}
            refreshing={listing.driverFetchAdminLoader}
            //   onEndReached={this.onEndReached}
            //   onEndReachedThreshold={0}
            renderItem={this.renderItem}
            showsVerticalScrollIndicator={false}
          />
        </KeyboardAwareScrollView>
        {this.state.selectedDriverIndex != null ? (
          <View style={Styles.wraper}>
            <AuthButton
              buttonStyle={Styles.buttonStyle}
              gradientStyle={Styles.gradientStyle}
              buttonName={"Cancel"}
              gradientColors={["#FFFFFF", "#FFFFFF"]}
              textStyle={{ color: Constants.Colors.Primary }}
              onPress={() => this.unSelectDrivers()}
            />
            <AuthButton
              buttonStyle={Styles.buttonStyle}
              gradientStyle={Styles.gradientStyle}
              gradientColors={["#F6CF65", "#F6CF65"]}
              buttonName={"Assign"}
              textStyle={{ color: "#fff" }}
              icon={Constants.Images.Common.Accept}
              onPress={() => this.assignDriverToTrip()}
            />
          </View>
        ) : null}
      </View>
    );
  }
}

const Styles = StyleSheet.create({
  container: {
    backgroundColor: Constants.Colors.White,
    flex: 1
  },
  filterContainer: {
    flex: 1,
    backgroundColor: Constants.Colors.White
  },
  srcView: {
    flex: 0.5,
    flexDirection: "row",
    alignItems: "center"
  },
  buttonStyle: {
    flex: 0.5
  },
  gradientStyle: {
    borderRadius: 0
  },
  srcText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.Primary,
    paddingVertical: moderateScale(3)
  },
  driverName: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(19),
    color: Constants.Colors.Primary
  },
  destText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.gray,
    paddingVertical: moderateScale(3),
    paddingHorizontal: moderateScale(8)
  },
  wraper: {
    flex: 0.1,
    justifyContent: "space-between",
    flexDirection: "row",
    position: "absolute",
    bottom: 0,
    zIndex: 999,
    // borderWidth: 0.4,
    borderColor: Constants.Colors.placehoder
  },
  infoView: {
    flex: 0.45,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center"
  }
});

const mapDispatchToProps = dispatch => ({
  appActions: bindActionCreators(appActions, dispatch)
});

function mapStateToProps(state) {
  return {
    user: state.user,
    listing: state.listing,
    loader: state.loader
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AssignDriver);
