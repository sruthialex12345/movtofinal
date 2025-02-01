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
import NoRecord from "../../components/common/NoRecord";
import moment from "moment";

class ScheduleTripAdmin extends Component {
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
    this.getAdminTrips();
  }

  cancelTrip = id => {
    let data = {
      requestId: id
    };
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
            this.props.appActions.cancelTrip(data, this.props.navigator);
          }
        }
      ],
      { cancelable: true }
    );
  };

  removeDriver = (driverId, tripId) => {
    let data = {
      driverId: driverId,
      requestId: tripId,
      isAssign: false
    };
    Alert.alert(
      "Unassign Driver",
      "Are you sure you want to revoke this driver?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => {
            this.props.appActions.assignDriver(data, this.props.navigator, false);
          }
        }
      ],
      { cancelable: true }
    );
  };

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

  onRefresh = () => {
    this.getAdminTrips();
  };

  getAdminTrips() {
    this.props.appActions.getScheduledTrips(this.props.navigator);
  }
  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 500);

  renderItem = ({ item, index }) => {
    // let { index } = this.state;
    return (
      <View
        style={[
          Styles.listContainer,
          { marginBottom: index == this.props.listing.scheduleList.length - 1 ? moderateScale(80) : 0 }
        ]}
      >
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
            </Text>
            <View style={Styles.srcDestView}>
              <View style={[Styles.srcView, { flex: 1 }]}>
                <Image
                  source={require("../../assets/images/call.png")}
                  resizeMode={"contain"}
                  style={{
                    height: moderateScale(15),
                    width: moderateScale(15)
                  }}
                />
                <Text numberOfLines={1} style={[Styles.srcText, { paddingHorizontal: moderateScale(10) }]}>
                  + {item.riderDetails.isdCode}- {item.riderDetails.phoneNo ? item.riderDetails.phoneNo : 99999999999}
                </Text>
              </View>
            </View>
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
        {item.driverDetails && item.driverDetails._id ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: moderateScale(8),
              paddingBottom: moderateScale(15)
            }}
          >
            <View style={{ flex: 0.15 }}>
              <View
                style={{
                  height: moderateScale(45),
                  width: moderateScale(45),
                  borderRadius: 100,
                  backgroundColor: "lightgray",
                  overflow: "hidden"
                }}
              >
                <Image
                  source={{
                    uri: item.driverDetails && item.driverDetails.profileUrl
                  }}
                  // source={Constants.Images.Common.Driver}
                  style={{
                    height: moderateScale(45),
                    width: moderateScale(45)
                  }}
                />
              </View>
            </View>
            <View style={{ paddingLeft: moderateScale(5), flex: 0.7 }}>
              <Text numberOfLines={1} style={Styles.riderName}>
                {item.driverDetails.name}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  Styles.riderName,
                  {
                    color: Constants.Colors.gray,
                    ...Constants.Fonts.TitilliumWebRegular
                  }
                ]}
              >
                Ford GT
              </Text>
            </View>
            <View style={{ flex: 0.15, alignItems: "flex-end" }}>
              {item.status == "accepted" || item.status == "completed" ? null : (
                <TouchableOpacity
                  style={[Styles.statusViewRejected, { marginRight: moderateScale(10) }]}
                  onPress={() => {
                    this.removeDriver(item.driverDetails._id, item._id);
                  }}
                >
                  <Image
                    source={Constants.Images.Common.Cancel}
                    resizeMode={"contain"}
                    style={{
                      height: moderateScale(26),
                      width: moderateScale(26)
                    }}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : item.status == "cancelled" ? null : (
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
                    screen: "ScheduleRideAdmin",
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

            <TouchableOpacity
              style={[
                Styles.statusViewRejected,
                {
                  backgroundColor: Constants.Colors.Yellow,
                  marginRight: moderateScale(10),
                  height: moderateScale(35),
                  width: moderateScale(35)
                }
              ]}
              // ASSIGN DRIVER PAGE CALL
              onPress={() =>
                this.props.navigator.push({
                  screen: "AssignDriver",
                  passProps: { tripId: item._id, item: item }
                })
              }
            >
              <Image
                source={require("../../assets/images/chooseDriver.png")}
                resizeMode={"contain"}
                style={{
                  height: moderateScale(20),
                  width: moderateScale(20)
                }}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };
  renderList = () => {
    let { common } = this.props;
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
          <View style={{ flex: 0.65 }}>
            <Text style={Styles.dateTxt}>
              {this.props.listing.scheduleList ? this.props.listing.scheduleList.length : 0} Trips
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              this.props.navigator.push({
                screen: "Filters",
                passProps: { scheduleAdmin: true, statusDate: true }
              })
            }
            style={{
              flex: 0.35,
              justifyContent: "flex-end",
              flexDirection: "row",
              alignItems: "center"
            }}
          >
            <Image
              source={Constants.Images.Common.Filter}
              resizeMode={"contain"}
              style={{
                height: moderateScale(12),
                width: moderateScale(12),
                marginRight: moderateScale(6)
              }}
            />
            {common.startTime || common.endTime || common.startDate || common.endDate || common.status.length > 0 ? (
              <View
                style={{
                  height: moderateScale(7),
                  width: moderateScale(7),
                  borderRadius: 100,
                  backgroundColor: "#F24848",
                  marginRight: moderateScale(6)
                }}
              />
            ) : null}
            <Text style={[Styles.dateTxt, { ...Constants.Fonts.TitilliumWebSemiBold }]}>Filter</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          style={{ flex: 0.9 }}
          numColumns={1}
          keyExtractor={item => item._id}
          data={this.props.listing.scheduleList}
          onRefresh={this.onRefresh}
          refreshing={this.props.listing.scheduleTripsLoader}
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
        <TouchableOpacity
          onPress={() =>
            this.props.navigator.push({
              screen: "ScheduleRideAdmin",
              passProps: { scheduleAdmin: true }
            })
          }
          style={{
            position: "absolute",
            height: moderateScale(55),
            width: moderateScale(55),
            borderRadius: 100,
            backgroundColor: Constants.Colors.DarkGray,
            right: moderateScale(25),
            bottom: moderateScale(25),
            justifyContent: "center",
            alignItems: "center",
            shadowOffset: { width: 3, height: 3 },
            shadowColor: "black",
            shadowOpacity: 0.3,
            elevation: 2
          }}
        >
          <Image
            source={Constants.Images.Common.Cancel}
            style={{
              height: moderateScale(32),
              width: moderateScale(32),
              transform: [{ rotate: "45deg" }]
            }}
            resizeMode={"contain"}
          />
        </TouchableOpacity>
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
    listing: state.listing,
    common: state.common
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
    fontSize: moderateScale(17),
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
    ...Constants.Fonts.TitilliumWebRegular
  }
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ScheduleTripAdmin);
