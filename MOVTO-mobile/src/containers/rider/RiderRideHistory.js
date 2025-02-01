/*
Name : Gurtej Singh
File Name : RiderRideHistory.js
Description : Contains the Rider history screen
Date : 22 Oct 2018
*/
import React, { Component } from "react";
import { View, Text, Image, StyleSheet, FlatList, Dimensions, TouchableOpacity, Alert } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import moment from "moment";
import Constants from "../../constants";
import Header from "../../components/common/Header";
import * as appActions from "../../actions";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import { handleDeepLink } from "../../config/navigators";
// import constants from "../../constants";
// import NoRecord from "../../c/omponents/common/NoRecord";
import { TabView, TabBar, SceneMap } from "react-native-tab-view";
class RiderRideHistory extends Component {
  constructor(props) {
    super(props);
    this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
    this.state = {
      page: 1,
      index: 0,
      routes: [{ key: "first", title: "Past" }, { key: "second", title: "Upcoming" }]
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };
  componentDidMount() {
    let { navigator } = this.props;
    this.fetchRideHistory();
    this.getUpcoming(navigator);
  }

  onEndReached = () => {
    let { page } = this.state;
    let { totalNoOfPages } = this.props.user && this.props.user.history && this.props.user.history.meta;
    if (page < totalNoOfPages) {
      page++;
      this.setState({ page: page }, () => {
        this.fetchRideHistory();
      });
    }
  };

  cancelTrip = requestId => {
    let { navigator, appActions } = this.props;
    Alert.alert(
      "Cancel Trip",
      "Are you sure you want to cancel this trip?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => {
            let data = {
              requestId: requestId
            };

            appActions.cancelRideRider(data, navigator);
          }
        }
      ],
      { cancelable: true }
    );
  };

  onRefresh = tabIndex => {
    let { navigator } = this.props;
    this.setState({ page: 1 }, () => {
      if (tabIndex == 0) this.fetchRideHistory();
      else {
        this.getUpcoming(navigator);
      }
    });
  };
  fetchRideHistory() {
    this.props.appActions.getRideHistory(this.state.page);
  }
  getUpcoming(navigator) {
    this.props.appActions.getUpcomingRides(navigator);
  }
  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 500);

  renderItem = ({ item }) => {
    // let { destLoc, adminId, srcLoc, tripRequestStatus } = item;
    let { index } = this.state;
    return (
      <View style={Styles.listContainer}>
        <View style={{ flexDirection: "row" }}>
          {item.status || item.tripRequestStatus ? (
            <View style={Styles.statusIcon}>
              <View
                style={[
                  Styles.statusView,
                  {
                    backgroundColor:
                      item.status == "cancelled" ||
                      item.tripRequestStatus == "cancelled" ||
                      (item.status == "rejected" || item.tripRequestStatus == "rejected")
                        ? Constants.Colors.red
                        : item.status == "request" || item.tripRequestStatus == "request"
                          ? "#A9AFAF"
                          : "#8BCC82"
                  }
                ]}
              >
                <Image
                  source={
                    item.status == "cancelled" || item.tripRequestStatus == "cancelled"
                      ? Constants.Images.Common.Cancel
                      : item.status == "request" || item.tripRequestStatus == "request"
                        ? require("../../assets/images/tripWaiting.png")
                        : Constants.Images.Common.Accept
                  }
                  style={{
                    height:
                      item.status == "cancelled" || item.tripRequestStatus == "cancelled"
                        ? moderateScale(23)
                        : moderateScale(18),
                    width:
                      item.status == "cancelled" || item.tripRequestStatus == "cancelled"
                        ? moderateScale(23)
                        : moderateScale(18)
                  }}
                  resizeMode={"contain"}
                />
              </View>
            </View>
          ) : null}
          <View style={[Styles.rideInfo, { flex: 1, paddingLeft: moderateScale(7) }]}>
            <Text numberOfLines={1} style={Styles.riderName}>
              {this.props.user ? this.props.user.name : "Dummy Name"}
              {/* Rider Name */}
            </Text>

            <View style={Styles.rideDetails}>
              <View style={Styles.srcDestView}>
                <View style={Styles.srcView}>
                  <Image
                    source={Constants.Images.Common.Source}
                    resizeMode={"contain"}
                    style={{
                      height: moderateScale(13),
                      width: moderateScale(13)
                    }}
                  />
                  <Text numberOfLines={1} style={[Styles.srcText, { paddingHorizontal: moderateScale(10) }]}>
                    {item.srcLoc.name}
                  </Text>
                </View>
                <View style={Styles.srcView}>
                  <Image
                    source={Constants.Images.Common.Destination}
                    resizeMode={"contain"}
                    style={{
                      height: moderateScale(15),
                      width: moderateScale(15)
                    }}
                  />
                  <Text numberOfLines={1} style={[Styles.srcText, { paddingLeft: moderateScale(5) }]}>
                    {item.destLoc.name}
                  </Text>
                </View>
              </View>
              <View style={Styles.srcDestView}>
                <View style={Styles.infoView}>
                  <Image
                    source={Constants.Images.Common.Calendar}
                    resizeMode="contain"
                    style={{
                      height: moderateScale(16),
                      width: moderateScale(16)
                    }}
                  />
                  <Text numberOfLines={1} style={Styles.destText}>
                    {moment(item.scheduledTime).format("D MMM YYYY")}
                  </Text>
                </View>
                <View style={[Styles.infoView, { flex: 0.4, paddingLeft: moderateScale(15) }]}>
                  <Image
                    source={Constants.Images.RideInfo.ClockGray}
                    resizeMode="contain"
                    style={{
                      height: moderateScale(16),
                      width: moderateScale(16)
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
          </View>
        </View>
        {index == 0 ? null : item.status == "cancelled" ||
        item.status == "assigned" ||
        item.status == "accepted" ||
        item.status == "rejected" ? null : (
          <View
            style={{
              justifyContent: "flex-end",
              flexDirection: "row",
              paddingVertical: moderateScale(14)
            }}
          >
            <TouchableOpacity
              style={[
                Styles.statusViewRejected,
                {
                  backgroundColor: Constants.Colors.red,
                  marginRight: moderateScale(18),
                  height: moderateScale(35),
                  width: moderateScale(35)
                }
              ]}
              onPress={() => this.cancelTrip(item._id)}
            >
              <Image
                source={Constants.Images.Common.Cancel}
                resizeMode={"contain"}
                style={{
                  height: moderateScale(25),
                  width: moderateScale(25)
                }}
              />
            </TouchableOpacity>
            {item.createBYDetails && item.createBYDetails._id === this.props.user._id ? (
              <TouchableOpacity
                style={[
                  Styles.statusViewRejected,
                  {
                    backgroundColor: Constants.Colors.Yellow,
                    marginRight: moderateScale(18),
                    height: moderateScale(35),
                    width: moderateScale(35)
                  }
                ]}
                onPress={() =>
                  this.props.navigator.push({
                    screen: "ScheduleRideRider",
                    passProps: {
                      updateTrip: true,
                      editData: item,
                      riderDetails: item.riderDetails,
                      srcLoc: item.srcLoc,
                      destLoc: item.destLoc,
                      scheduledTime: item.scheduledTime,
                      requestId: item._id,
                      seatBooked: item.seatBooked
                    }
                  })
                }
              >
                <Image
                  source={require("../../assets/images/editWhite.png")}
                  resizeMode={"contain"}
                  style={{
                    height: moderateScale(18),
                    width: moderateScale(18)
                  }}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    );
  };
  tabContainer = tabIndex => {
    let { user, loader } = this.props;
    let { history } = user;
    return (
      <View style={Styles.noOfRidesView}>
        <Text style={Styles.noOfRidesTxt}>
          {tabIndex === 0 ? history.rides && history.rides.length : user.upcomingRide && user.upcomingRide.length} Rides
        </Text>
        <FlatList
          style={{ flex: 0.9 }}
          numColumns={1}
          keyExtractor={item => item._id}
          data={tabIndex === 0 ? history.rides : user.upcomingRide}
          onRefresh={() => this.onRefresh(tabIndex)}
          refreshing={loader.riderHistory}
          onEndReached={this.onEndReached}
          onEndReachedThreshold={0}
          renderItem={this.renderItem}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          // ListEmptyComponent={() => {
          //   return loader.riderHistory ? null : <NoRecord msg="No History Found" />;
          // }}
        />
      </View>
    );
  };
  render() {
    let { navigator } = this.props;
    return (
      <View style={Styles.mainView}>
        <Header navigator={navigator} title={"My Trips"} />
        <TabView
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          navigationState={this.state}
          swipeEnabled={false}
          renderScene={SceneMap({
            first: () => this.tabContainer(0),
            second: () => this.tabContainer(1)
          })}
          onIndexChange={index => this.setState({ index })}
          initialLayout={{ width: Dimensions.get("window").width }}
          renderTabBar={props => (
            <TabBar
              {...props}
              getLabelText={({ route: { title } }) => title}
              tabStyle={Styles.tabStyle}
              style={Styles.tabBarStyle}
              labelStyle={Styles.riderName}
              indicatorStyle={{ backgroundColor: Constants.Colors.Yellow, height: moderateScale(3) }}
            />
          )}
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
    loader: state.loader,
    upcomingRides: state.user
  };
}
const Styles = StyleSheet.create({
  mainView: {
    flex: 1
  },
  noOfRidesView: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: moderateScale(20)
  },
  noOfRidesTxt: {
    paddingTop: moderateScale(10),
    color: "#A9AFAF",
    fontSize: moderateScale(17),
    ...Constants.Fonts.TitilliumWebRegular
  },
  listContainer: {
    flex: 1,
    borderBottomColor: "#D8D8D8",
    borderBottomWidth: 1,
    justifyContent: "space-between"
  },

  statusIcon: {
    flex: 0.13,
    justifyContent: "space-between",
    flexDirection: "column",
    paddingVertical: moderateScale(20)
  },
  rideInfo: {
    flexDirection: "column",
    paddingVertical: moderateScale(10),
    justifyContent: "flex-start"
  },
  statusView: {
    height: moderateScale(30),
    width: moderateScale(30),
    backgroundColor: "#8BCC82",
    borderRadius: moderateScale(100),
    justifyContent: "center",
    alignItems: "center"
  },
  statusViewRejected: {
    height: moderateScale(37),
    width: moderateScale(37),
    backgroundColor: Constants.Colors.red,
    borderRadius: moderateScale(100),
    justifyContent: "center",
    alignItems: "center"
  },
  rideDetails: { flexDirection: "column" },
  srcDestView: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  srcView: {
    flex: 0.5,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center"
  },
  infoView: {
    flex: 0.45,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center"
  },
  timeView: {
    // flex: 0.3,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center"
  },
  personView: {
    flex: 0.1,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center"
  },
  riderName: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(19),
    color: Constants.Colors.Primary
  },
  phone: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.placehoder
  },
  srcText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.Primary,
    paddingVertical: moderateScale(3)
  },
  destText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.gray,
    paddingVertical: moderateScale(3),
    paddingHorizontal: moderateScale(8)
  },

  dateTxt: {
    color: "#A9AFAF",
    fontSize: moderateScale(17),
    ...Constants.Fonts.TitilliumWebRegular
  },

  tabStyle: {
    borderLeftWidth: 0.5,
    borderColor: "#D8D8D8"
  },
  tabBarStyle: {
    backgroundColor: Constants.Colors.White,
    borderBottomColor: "#D8D8D8",
    borderBottomWidth: 0.5,
    elevation: 0
    // height:moderateScale(47),
  }
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RiderRideHistory);
