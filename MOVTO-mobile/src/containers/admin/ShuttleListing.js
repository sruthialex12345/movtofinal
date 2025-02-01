/*
Name : Gurtej Singh
File Name : ShuttleListing.js
Description : Contains the Shuttle Listing
Date : 21 Nov 2018
*/
import React, { Component } from "react";
import { View, Text, FlatList, StyleSheet, Image } from "react-native";
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
import ShuttleStatus from "../../components/common/ShuttleStatus";


class ShuttleListing extends Component {
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
    this.setTimeout(() => {
      this.props.appActions.getShuttleListing(this.state.page, "", this.props.navigator);
    }, 500);
  }

  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 500);

  updateShuttleStatus() {
    alert("under development");
  }

  onEndReached = () => {
    let { page } = this.state;
    let { listing, appActions } = this.props;
    let { shuttleMeta } = listing;
    let { totalNoOfPages } = shuttleMeta;
    if (page < totalNoOfPages) {
      page++;
      this.setState({ page }, () => {
        appActions.getShuttleListing(page, "", this.props.navigator);
      });
    }
  };

  onRefresh = () => {
    let { appActions } = this.props;
    this.setState({ page: 1 }, () => {
      appActions.getShuttleListing(this.state.page, "", this.props.navigator);
    });
  };
  renderShuttle = ({ item }) => {
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
            height: moderateScale(50),
            width: moderateScale(50),
            borderRadius: moderateScale(100),
            borderWidth: 0.4,
            borderColor: Constants.Colors.gray,
            overflow: "hidden",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Image
            source={Constants.Images.RideInfo.InActiveShuttle}
            resizeMode={"contain"}
            style={{
              height: moderateScale(40),
              width: moderateScale(40)
            }}
          />
        </View>
        <View
          style={{
            width: Constants.BaseStyle.DEVICE_WIDTH - moderateScale(220),
            justifyContent: "flex-start",
            paddingHorizontal: moderateScale(5)
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              ...Constants.Fonts.TitilliumWebSemiBold,
              fontSize: moderateScale(19),
              color: Constants.Colors.Primary
            }}
          >
            {`${item.name} ${item.carModel}`}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              ...Constants.Fonts.TitilliumWebRegular,
              fontSize: moderateScale(19),
              color: Constants.Colors.gray
            }}
          >
            {item.vehicleNo}
            
          </Text>
        </View>
        <ShuttleStatus active={item.activeStatus} />
      </View>
    );
  };

  render() {
    let { listing, loader, user } = this.props;
    let { shuttles, shuttleMeta } = listing;
    console.log("type ---- ", user.userType);
    return (
      <View style={Styles.mainView}>
         
       {user.userType === "admin" ?
          <Header
            navigator={this.props.navigator}
            title={"Shuttles"}
            rightIcon={Constants.Images.Common.Chat}
            onRightPress={() => {
              this.props.navigator.push({
                screen: "AdminScreen",
                passProps: { ChatRoomId: "1" },
                animated: true,
                animationType: "slide-horizontal"
              });
            }}
          />
          :
          <Header
            navigator={this.props.navigator}
            title={"Shuttles"}
            rightIcon={Constants.Images.Common.Chat}
            onRightPress={() => {
              //@GR - 05/06/2020 - Added Chat functionality
                this.props.navigator.push({
                    screen: "ChatWindow",
                    animated: true,
                    passProps: {
                        crtransportId : user.route.adminId,
                        crselectId: user._id,
                        crselectName: user.name,
                        crprofileUrl: user.profileUrl,
                        crselectType : 'Passenger'
                    }
                });
            }}
          />
             }   
        <View style={Styles.noOfRidesView}>
          <Text style={Styles.noOfRidesTxt}>
            {shuttleMeta.activeShuttles > 0 ? shuttleMeta.activeShuttles : "No"} Active Shuttles
          </Text>
          <Text style={Styles.noOfRidesTxt}>{shuttleMeta.totalShuttles} Shuttles</Text>
        </View>
        <FlatList
          data={shuttles}
          keyExtractor={(item, index) => item._id + index}
          numColumns={1}
          renderItem={this.renderShuttle}
          onRefresh={this.onRefresh}
          refreshing={loader.shuttleListing}
          onEndReached={this.onEndReached}
          onEndReachedThreshold={0}
          style={{ marginBottom: moderateScale(25) }}
          showsHorizontalScrollIndicator={false}
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

reactMixin(ShuttleListing.prototype, TimerMixin);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ShuttleListing);

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
  }
});
