/*
Name : Amit Singh
File Name : ScheduleTripAdmin.js
Description : Contains the Admin schedule screen
Date : 4 Mar 2019
*/
import React, { Component } from "react";
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import Constants from "../../constants";
import Header from "../../components/common/Header";
import * as appActions from "../../actions";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import { handleDeepLink } from "../../config/navigators";
import moment from "moment";
import NoRecord from "../../components/common/NoRecord";

class ScheduleTripDriver extends Component {
  constructor(props) {
    super(props);
    this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
    this.state = {
      page: 1,
      // index: 0,
      routes: [{ key: "first", title: "Past" }, { key: "second", title: "Upcoming" }]
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };

  componentDidMount() {
    let { navigator, appActions } = this.props;
    appActions.getScheduleListingDriver(navigator);
  }

  onEndReached = () => {
    let { page } = this.state;
    let { totalNoOfPages } = this.props.user && this.props.user.history && this.props.user.history.meta;
    if (page < totalNoOfPages) {
      page++;
      this.setState({ page: page }, () => {});
    }
  };

  acceptTrip = id => {
    Alert.alert(
      "Accept trip request",
      "Are you sure you want to accept this trip?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => {
            let data = {
              requestId: id
            };
            this.props.appActions.acceptTripRequest(data, this.props.navigator);
          }
        }
      ],
      { cancelable: true }
    );
  };

  rejectTrip = id => {
    Alert.alert(
      "Reject trip request",
      "Are you sure you want to reject this trip?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => {
            let data = {
              requestId: id
            };
            this.props.appActions.rejectTripRequest(data, this.props.navigator);
          }
        }
      ],
      { cancelable: true }
    );
  };

  onRefresh = () => {
    let { navigator, appActions } = this.props;
    appActions.getScheduleListingDriver(navigator);
  };

  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 500);

  renderItem = ({ item }) => {
    // let { index } = this.state;
    return (
      <View style={Styles.listContainer}>
        <View style={{ flexDirection: "row" }}>
          {item.status ? (
            <View style={Styles.statusIcon}>
              <View
                style={[
                  Styles.statusView,
                  {
                    backgroundColor:
                      item.status == "cancelled" || item.status == "rejected"
                        ? Constants.Colors.red
                        : item.status == "request"
                          ? "#A9AFAF"
                          : "#8BCC82"
                  }
                ]}
              >
                <Image
                  source={
                    item.status == "cancelled" || item.status == "rejected"
                      ? Constants.Images.Common.Cancel
                      : item.status == "request"
                        ? require("../../assets/images/tripWaiting.png")
                        : Constants.Images.Common.Accept
                  }
                  style={{
                    height:
                      item.status == "cancelled" || item.status == "rejected" ? moderateScale(23) : moderateScale(18),
                    width:
                      item.status == "cancelled" || item.status == "rejected" ? moderateScale(23) : moderateScale(18)
                  }}
                  resizeMode={"contain"}
                />
              </View>
            </View>
          ) : null}
          <View style={[Styles.rideInfo, { flex: 1, paddingLeft: moderateScale(7) }]}>
            <Text numberOfLines={1} style={Styles.riderName}>
              {item.riderDetails.name ? item.riderDetails.name : "Dummy Name"}
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
        {item.status == "assigned" ? (
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
              onPress={() => this.rejectTrip(item._id)}
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

            <TouchableOpacity
              style={[
                Styles.statusViewRejected,
                {
                  backgroundColor: Constants.Colors.Yellow,
                  height: moderateScale(35),
                  width: moderateScale(35)
                }
              ]}
              onPress={() => this.acceptTrip(item._id)}
            >
              <Image
                source={Constants.Images.Common.Accept}
                resizeMode={"contain"}
                style={{
                  height: moderateScale(18),
                  width: moderateScale(18)
                }}
              />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };
  renderList = () => {
    let { trip } = this.props;
    return (
      <View style={Styles.noOfRidesView}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: moderateScale(20),
            paddingHorizontal: moderateScale(20)
          }}
        >
          <Text style={Styles.dateTxt}>{trip.scheduledTrips && trip.scheduledTrips.length} Trips</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                flexDirection: "row",
                width: moderateScale(100),
                justifyContent: "flex-end",
                alignItems: "center"
              }}
            >
              <TouchableOpacity
                onPress={() =>
                  this.props.navigator.push({
                    screen: "Filters",
                    passProps: { scheduleDriver: true, statusDate: true }
                  })
                }
                style={{
                  flex: 0.52,
                  justifyContent: "space-between",
                  flexDirection: "row",
                  alignItems: "center"
                }}
              >
                <View>
                  <Image
                    source={Constants.Images.Common.Filter}
                    resizeMode={"contain"}
                    style={{
                      height: moderateScale(12),
                      width: moderateScale(12),
                      marginRight: moderateScale(7)
                    }}
                  />
                </View>
                <Text style={Styles.dateTxt}>Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <FlatList
          style={{ flex: 0.9 }}
          numColumns={1}
          keyExtractor={item => item._id}
          data={trip.scheduledTrips}
          onRefresh={() => this.onRefresh()}
          refreshing={trip.scheduledTripsLoader}
          // onEndReached={this.onEndReached}
          // onEndReachedThreshold={0}
          renderItem={this.renderItem}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => {
            return <NoRecord msg="No Trips Found" />;
          }}
        />
      </View>
    );
  };
  render() {
    let { navigator } = this.props;

    return (
      <View style={Styles.mainView}>
        <Header
          navigator={navigator}
          title={"Scheduled Trips"}
          rightIcon={Constants.Images.Common.Chat}
          onRightPress={() => alert("under development")}
        />
        {this.renderList()}
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
    upcomingRides: state.user,
    trip: state.trip
  };
}
const Styles = StyleSheet.create({
  mainView: {
    flex: 1
  },
  noOfRidesView: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: moderateScale(7)
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
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(18)
  },
  statusIcon: {
    flex: 0.13,
    justifyContent: "flex-start",
    paddingVertical: moderateScale(18)
  },
  rideInfo: {
    flexDirection: "column",
    paddingVertical: moderateScale(10),
    justifyContent: "flex-start"
  },
  statusView: {
    height: moderateScale(32),
    width: moderateScale(32),
    backgroundColor: "#8BCC82",
    borderRadius: moderateScale(100),
    justifyContent: "center",
    alignItems: "center"
  },
  statusViewRejected: {
    height: moderateScale(30),
    width: moderateScale(30),
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
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(19),
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
  tabStyle: {
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: Constants.Colors.gray
  },
  tabBarStyle: {
    backgroundColor: Constants.Colors.White,
    borderBottomColor: Constants.Colors.gray,
    borderBottomWidth: 0.5,
    elevation: 0
  },
  dateTxt: {
    color: "#A9AFAF",
    fontSize: moderateScale(17),
    ...Constants.Fonts.TitilliumWebSemiBold
  }
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ScheduleTripDriver);
