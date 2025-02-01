/*
Name : Gurtej Singh
File Name : DriverRideHistory.js
Description : Contains the Driver history screen
Date : 28 OCT 2018
*/
import React, { Component } from "react";
import { View, Text, Image, FlatList } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import moment from "moment";

import Constants from "../../constants";
import Styles from "../../styles/container/Dashboard";
import Header from "../../components/common/Header";
import * as appActions from "../../actions";
import { handleDeepLink } from "../../config/navigators";
import NoRecord from "../../components/common/NoRecord";
import { moderateScale } from "../../helpers/ResponsiveFonts";
class DriverRideHistory extends Component {
  constructor(props) {
    super(props);
    this.state = {
      page: 1
    };
    this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
  }
  static navigatorStyle = {
    navBarHidden: true
  };
  componentDidMount() {
    this.fetchRideHistory();
  }

  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 10);

  onEndReached = () => {
    let { page } = this.state;
    let { totalNoOfPages } = this.props.user && this.props.user.history && this.props.user.history.meta;
    if (page < totalNoOfPages) {
      page++;
      this.setState({ page }, () => {
        this.fetchRideHistory();
      });
    }
  };

  onRefresh = () => {
    this.setState({ page: 1 }, () => {
      this.fetchRideHistory();
    });
  };
  fetchRideHistory() {
    this.props.appActions.getTripHistory(this.state.page);
  }

  renderRides = ({ item, index }) => {
    let { shuttleId, tripEndTime, tripStartAt, tripIssue } = item;
    let duration = moment.duration(moment(tripEndTime).diff(moment(tripStartAt)))._data;
    return (
      <View key={index} style={Styles.riderHistoryRowContainer}>
        {/* {this.state.now && this.state.now.format("DD/MM/YYYY")===moment(tripStartAt).format("DD/MM/YYYY")? */}
        <View style={Styles.rideDateView}>
          <Text style={Styles.dateTxt}>{moment(tripStartAt).format("DD MMM, YYYY")}</Text>
        </View>
        <View>
          <View
            style={{
              flexDirection: "row",
              paddingVertical: Constants.BaseStyle.DEVICE_WIDTH * 0.03,
              marginLeft: moderateScale(15)
            }}
          >
            <View style={Styles.riderHistoryIcon}>
              {tripIssue === Constants.AppConstants.TripIssue.NoIssue ? (
                <View style={Styles.acceptImgView}>
                  <Image source={Constants.Images.Common.Accept} />
                </View>
              ) : (
                <View style={Styles.rejectImgView}>
                  <Image source={Constants.Images.Common.Cross} />
                </View>
              )}
            </View>
            <View style={[Styles.riderHistoryIcon, { marginLeft: moderateScale(10) }]}>
              <View
                style={[
                  Styles.acceptImgView,
                  {
                    backgroundColor: Constants.Colors.transparent,
                    borderWidth: 0,
                    borderColor: Constants.Colors.gray
                  }
                ]}
              >
                <Image source={Constants.Images.RideInfo.InActiveShuttle} resizeMode={"contain"} style={{ flex: 1 }} />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <View>
                <Text numberOfLines={2} style={Styles.carNameTxt}>
                  {shuttleId.company + " " + shuttleId.name}
                </Text>
                <Text style={Styles.carNumTxt}>{shuttleId.vehicleNo}</Text>
              </View>
            </View>
          </View>
          <View style={Styles.timeView}>
            <View style={{ flex: 3.3 }}>
              <Text style={Styles.statusTxt}>Active</Text>
              <Text style={Styles.timeTxt}>
                {moment(tripStartAt)
                  .local()
                  .format("hh:mm A")}
              </Text>
            </View>
            <View style={{ flex: 3.3 }}>
              <Text style={Styles.statusTxt}>In active</Text>
              <Text style={Styles.timeTxt}>
                {tripEndTime
                  ? moment(tripEndTime)
                      .local()
                      .format("hh:mm A")
                  : "-:-"}
              </Text>
            </View>
            <View style={{ flex: 3.3 }}>
              <Text style={Styles.statusTxt}>Completed in</Text>
              <Text style={Styles.timeTxt}>{tripEndTime ? `${duration.hours}:${duration.minutes} Hrs` : "-:-"}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  render() {
    let { user, loader } = this.props;
    let { history } = user;
    let { meta, rides } = history;
    return (
      <View style={Styles.mainView}>
        <Header navigator={this.props.navigator} title={"My History"} />

        <View style={Styles.noOfRidesView}>
          <Text style={Styles.noOfRidesTxt}>{meta.totalNoOfRecord} Rides</Text>
        </View>
        {/* Rides on different date will contain number of rides. Map the array according to no of days travelled. */}
        <FlatList
          data={rides}
          keyExtractor={(item, index) => item._id + index}
          numColumns={1}
          onRefresh={this.onRefresh}
          refreshing={loader.tripLoader}
          onEndReached={this.onEndReached}
          onEndReachedThreshold={0}
          renderItem={this.renderRides}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => {
            return loader.tripLoader ? null : <NoRecord />;
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
    loader: state.loader
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DriverRideHistory);
