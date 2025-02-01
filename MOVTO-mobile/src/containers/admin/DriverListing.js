/*
Name : Gurtej Singh
File Name : DriverListing.js
Description : Contains the Shuttle Listing
Date : 21 Nov 2018
*/
import React, { Component } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import TimerMixin from "react-timer-mixin";
import reactMixin from "react-mixin";

import Constants from "../../constants";
import Header from "../../components/common/Header";
import * as appActions from "../../actions";
import { handleDeepLink } from "../../config/navigators";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import Online from "../../components/common/OnlineDot";

class DriverListing extends Component {
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
      /*this.setTimeout(() => {
        this.props.appActions.getDriverListing(this.state.page, "", this.props.navigator);
      }, 500);*/
      //@GR - 05/07/2020 - Applied block wait logic in here to make sure the data is fetched.
      //The above 0.5 second timeout for fetching might not be sufficient to get all data.
      this.loadData();
  }

  async loadData(){
    await this.props.appActions.getDriverListing(this.state.page, "", this.props.navigator);
  }

  onNavigationEvent = _.debounce( event => {
    handleDeepLink(event, this.props.navigator);
  }, 500);

  onRefresh = () => {
    let { appActions } = this.props;
    this.setState({ page: 1 }, () => {
      appActions.getDriverListing(this.state.page, "", this.props.navigator);
    });
  };

  onEndReached = () => {
    let { page } = this.state;
    let { listing, appActions } = this.props;
    let { driverMeta } = listing;
    let { totalNoOfPages } = driverMeta;
    if (page < totalNoOfPages) {
      page++;
      this.setState({ page }, () => {
        appActions.getDriverListing(page, "", this.props.navigator);
      });
    }
  };

  moveToChatWindow = (driverId, driverName, driverProfile) => {
    //alert("Featue coming soon");
    //@GR - 02/16/2020 - Added Chat feature
    console.log("User prop: ", this.props.user);
    this.props.navigator.push({
        screen: "ChatWindow",
        animated: true,
        passProps: {
            crtransportId : this.props.user._id,
            crselectId: driverId,
            crselectName: driverName,
            crprofileUrl: driverProfile,
            crselectType : 'Driver'
        }
    });

  };

  renderDrivers = ({ item }) => {
    return (
      <View
        key={item._id}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: moderateScale(25),
          borderBottomColor: Constants.Colors.gray,
          borderBottomWidth: 0.4,
          paddingVertical: moderateScale(15)
        }}
      >
        <View
          style={{
            height: moderateScale(60),
            width: moderateScale(60),
            borderRadius: moderateScale(100),
            overflow: "hidden",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginHorizontal: moderateScale(5),
            borderWidth: 0.4
          }}
        >
          {item.activeStatus ? (
            <Online
              dotStyle={{
                bottom: moderateScale(10),
                right: moderateScale(5),
                borderColor: "white",
                borderWidth: moderateScale(2)
              }}
            />
          ) : null}
          <Image
            style={{
              height: moderateScale(60),
              width: moderateScale(60)
            }}
            source={{ uri: item && item.profileUrl }}
            resizeMode={"cover"}
          />
        </View>
        <View
          style={{
            width: Constants.BaseStyle.DEVICE_WIDTH - moderateScale(150),
            justifyContent: "flex-start",
            paddingHorizontal: moderateScale(5)
          }}
        >
          <Text
            style={{
              ...Constants.Fonts.TitilliumWebSemiBold,
              fontSize: moderateScale(19),
              color: Constants.Colors.Primary
            }}
          >
            {item.name}
          </Text>
          <Text
            style={{
              ...Constants.Fonts.TitilliumWebRegular,
              fontSize: moderateScale(19),
              color: Constants.Colors.gray
            }}
          >
            {item.activeStatus ? "ABC 123" : "---"}
          </Text>
        </View>
        <TouchableOpacity
           onPress={() => this.moveToChatWindow(item._id, item.name, item.profileUrl)}
          style={{
            height: moderateScale(40),
            width: moderateScale(40),
            borderRadius: moderateScale(100),
            justifyContent: "center",
            alignItems: "center",
            marginHorizontal: moderateScale(5),
            // right: moderateScale(10),
            backgroundColor: Constants.Colors.Yellow,
            paddingTop: moderateScale(5)
          }}
        >
          <Image
            source={Constants.Images.Common.WhiteChat}
            style={{ height: moderateScale(15), width: moderateScale(15) }}

            // style={{ bottom: moderateScale(8), right: moderateScale(8) }}
          />
        </TouchableOpacity>
      </View>
    );
  };

  render() {
    let { listing, loader } = this.props;
    let { drivers, driverMeta } = listing;
    return (
      <View style={Styles.mainView}>
       <Header
          navigator={this.props.navigator}
          title={"Drivers"}
        />
        <View style={Styles.noOfRidesView}>
          <Text style={Styles.noOfRidesTxt}>
            {driverMeta.activeDrivers > 0 ? driverMeta.activeDrivers : "No"} Active Drivers
          </Text>
          <Text style={Styles.noOfRidesTxt}>{driverMeta.totalDrivers} Drivers</Text>
        </View>
        <FlatList
          data={drivers}
          keyExtractor={(item, index) => item._id + index}
          numColumns={1}
          renderItem={this.renderDrivers}
          onRefresh={this.onRefresh}
          refreshing={loader.driverListing}
          onEndReached={this.onEndReached}
          onEndReachedThreshold={0}
          style={{ marginBottom: moderateScale(25) }}
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

reactMixin(DriverListing.prototype, TimerMixin);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DriverListing);

const Styles = StyleSheet.create({
  mainView: { flex: 1, backgroundColor: Constants.Colors.transparent },
  noOfRidesView: {
    justifyContent: "space-between",
    flexDirection: "row",
    marginHorizontal: moderateScale(25),
    marginVertical: moderateScale(10)
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
    fontSize: moderateScale(17)
  },
  activeBtn: {
    backgroundColor: "red"
    // flexDirection: "row",
    // alignSelf: "center"
  }
});
