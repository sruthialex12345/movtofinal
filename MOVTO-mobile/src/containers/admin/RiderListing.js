/*
Name : Gurtej Singh
File Name : RiderListing.js
Description : Contains the Shuttle Listing
Date : 21 Nov 2018
*/
import React, { Component } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";

import Constants from "../../constants";
import NoRecord from "../../components/common/NoRecord";
import Header from "../../components/common/Header";
import * as appActions from "../../actions";
import { handleDeepLink } from "../../config/navigators";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import TerminalListing from "../../components/driver/TerminalListing";
import Online from "../../components/common/OnlineDot";
class RiderListing extends Component {
  constructor(props) {
    super(props);
    this.state = {
      page: 1,
      timeSort: false
    };
    this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
  }

  static navigatorStyle = {
    navBarHidden: true
  };
  componentDidMount() {
    let pageNo = 1;
    this.setTimeout(() => {
      this.getRiderListing(pageNo);
    }, 500);
  }

  /* API call to get data from server for rider  listing*/

  getRiderListing = page => {
    let { navigator, listing } = this.props;
    let { filters } = listing;
    let { destination, drivers, source, status, timeSort } = filters;
    let data = {
      driverIds: drivers,
      status,
      startTerminalID: source && source._id ? source._id : "",
      toTerminalID: destination && destination._id ? destination._id : "",
      timeSort: timeSort || false
    };
    this.props.appActions.getRiderListing(page, data, navigator);
  };
  ChangeTimeFilters = () => {
    let { listing } = this.props;
    let { filters } = listing;
    let { destination, drivers, source, status, timeSort } = filters;
    //filter reducer data
    let filter = {
      destination: destination || {},
      drivers: drivers || [],
      source: source || {},
      status: status || [],
      timeSort: timeSort ? !timeSort : true
    };
    //filter call data
    let data = {
      driverIds: drivers || [],
      status: status || [],
      startTerminalID: source && source._id ? source._id : "",
      toTerminalID: destination && destination._id ? destination._id : "",
      timeSort: timeSort ? !timeSort : true
    };
    //to update reducer data
    this.props.appActions.updateFilters(filter, this.props.navigator);
    //to call api filter
    this.props.appActions.getRiderListing(1, data, navigator);
  };
  onEndReached = () => {
    let { page } = this.state;
    let { listing } = this.props;
    let { ridersMeta } = listing;
    let { totalNoOfPages } = ridersMeta;
    if (page < totalNoOfPages) {
      page++;
      this.setState({ page: page }, () => {
        this.getRiderListing(this.state.page);
      });
    }
  };

  onRefresh = () => {
    this.setState({ page: 1 }, () => {
      this.getRiderListing(this.state.page);
    });
  };

  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 500);

  updateShuttleStatus() {
    alert("under development");
  }

  renderTrip = ({ item, index }) => {
    let { user } = this.props;
    if (item.rides.length > 0) {
      return (
        <View key={index} style={{ flex: 1 }}>
          <View
            style={{
              paddingVertical: moderateScale(10),
              paddingHorizontal: moderateScale(25),
              justifyContent: "space-between",
              flexDirection: "row"
            }}
          >
            <Text
              style={{
                ...Constants.Fonts.TitilliumWebSemiBold,
                fontSize: moderateScale(17),
                color: Constants.Colors.Primary
              }}
            >
              {item.driver.name}
            </Text>
            <Text
              style={{
                ...Constants.Fonts.TitilliumWebRegular,
                fontSize: moderateScale(17),
                color: Constants.Colors.gray
              }}
            >{`${item.shuttle && item.shuttle.name} ${(item.shuttle && item.shuttle.vechileNo) || "---"}`}</Text>
          </View>
          <TerminalListing hideMeta rides={item.rides} chat={true} userType={user.userType} />
        </View>
      );
    }
  };
  render() {
    let { listing, loader } = this.props;
    let { filters, riders, ridersMeta } = listing;
    return (
      <View style={Styles.mainView}>
        <Header
          navigator={this.props.navigator}
          title={"Passengers"}
          rightIcon={Constants.Images.Common.Chat}
          onRightPress={() => alert("underDevelopment")}
        />
        <View style={{ height: moderateScale(50), flexDirection: "row" }}>
          <View style={Styles.noOfRidesView}>
            <Text style={Styles.noOfRidesTxt}>{ridersMeta.currNoOfRecord} Passengers</Text>
          </View>
          <View style={{ flex: 0.8 }} />
          <View
            style={{
              flexDirection: "row",
              width: moderateScale(160),
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <TouchableOpacity onPress={this.ChangeTimeFilters}>
              {filters.timeSort ? <Online color={Constants.Colors.red} size={6} /> : null}
              <Image
                source={Constants.Images.Common.Sort}
                resizeMode={"contain"}
                style={{ height: moderateScale(35), width: moderateScale(35) }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => this.props.navigator.push({ screen: "Filters" })}
              style={{
                flex: 0.52,
                justifyContent: "space-between",
                flexDirection: "row",
                alignItems: "center"
              }}
            >
              {(filters.destination && !_.isEmpty(filters.destination)) ||
              (filters.source && !_.isEmpty(filters.source)) ||
              (filters.drivers && filters.drivers.length) ||
              (filters.status && filters.status.length) ? (
                <Online color={Constants.Colors.red} size={6} />
              ) : null}
              <View
                style={
                  {
                    // paddingTop: moderateScale(10),
                    // paddingLeft: moderateScale(0)
                  }
                }
              >
                <Image
                  source={Constants.Images.Common.Filter}
                  resizeMode={"contain"}
                  style={{ height: moderateScale(12), width: moderateScale(12) }}
                />
              </View>
              <Text style={Styles.dateTxt}>Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
        <FlatList
          data={riders}
          keyExtractor={(item, index) => item._id + index}
          numColumns={1}
          renderItem={this.renderTrip}
          onRefresh={this.onRefresh}
          refreshing={loader.riderListing}
          onEndReached={this.onEndReached}
          onEndReachedThreshold={0}
          style={{ flex: 0.9 }}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => {
            return <NoRecord />;
          }}
        />
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
    loader: state.loader
  };
}

reactMixin(RiderListing.prototype, TimerMixin);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RiderListing);

const Styles = StyleSheet.create({
  mainView: { flex: 1, backgroundColor: Constants.Colors.transparent },
  noOfRidesView: {
    //flex: 0.05,
    justifyContent: "space-between",
    flexDirection: "row",
    marginHorizontal: moderateScale(25),
    marginVertical: moderateScale(10),
    alignItems: "center"
  },
  rideDateView: {
    flex: 0.2,
    justifyContent: "center",
    marginLeft: Constants.BaseStyle.DEVICE_WIDTH * 0.05
  },
  noOfRidesTxt: {
    color: "#A9AFAF",
    fontSize: moderateScale(17),
    ...Constants.Fonts.TitilliumWebRegular
  },
  dateTxt: {
    color: "#707070",
    fontSize: moderateScale(17),
    ...Constants.Fonts.TitilliumWebSemiBold
  },

  activeBtn: {
    width: moderateScale(100),
    backgroundColor: Constants.Colors.Yellow,
    height: moderateScale(36),
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    borderRadius: moderateScale(3)
  },
  checkBtn: {
    backgroundColor: Constants.Colors.White,
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(6),
    margin: moderateScale(3),
    borderRadius: moderateScale(3)
  },
  activeText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(18),
    color: Constants.Colors.White,
    marginHorizontal: moderateScale(5)
  }
});
