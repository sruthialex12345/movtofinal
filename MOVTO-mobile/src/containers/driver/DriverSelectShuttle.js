/*
Name : Gurtej Singh
File Name : SelectShuttle.js
Description : Contains the Select shuttle screen
Date : 25 Sept 2018
*/

import React, { Component } from "react";
import { View, Text, Image, TouchableOpacity, FlatList, Platform } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";

import * as appActions from "../../actions";
import Constants from "../../constants";
import Styles from "../../styles/container/Driver.Selectshuttle";
import Header from "../../components/common/Header";
import AuthButton from "../../components/common/AuthButton";
import { handleDeepLink } from "../../config/navigators";
import NoRecord from "../../components/common/NoRecord";
import { moderateScale } from "../../helpers/ResponsiveFonts";

class SelectShuttle extends Component {
  constructor(props) {
    super(props);
    this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
    this.state = {
      myShuttle: {}
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };
  componentDidMount() {
    let { navigator, appActions } = this.props;
    appActions.getDriverShuttle(navigator);
  }
  drawerPress() {
    this.props.navigator.toggleDrawer({
      side: "left"
    });
  }
  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 10);

  onShuttlePress = _.debounce(shuttle => {
    this.setState({ myShuttle: shuttle });
  });

  onCanclePress = _.debounce(() => {
    this.setState({ myShuttle: {} });
  });

  onShuttleActive = _.debounce(() => {
    let { myShuttle } = this.state;
    let { user, navigator, appActions, editVehicle, trip } = this.props;
    let { response } = trip;
    let { _id } = user;
    let data = editVehicle
      ? {
          driverId: _id,
          tripId: response && response._id,
          vehicalId: myShuttle._id,
          shuttle: myShuttle
        }
      : {
          shuttle: myShuttle,
          tripId: "",
          status: true,
          driverId: _id
        };
    editVehicle ? appActions.changeVechicle(data, navigator) : appActions.updateTripStatus(data, navigator);
  });

  renderItem = ({ item }) => {
    let { myShuttle } = this.state;
    return (
      <TouchableOpacity onPress={() => this.onShuttlePress(item)} key={item._id} style={Styles.itemContaier}>
        {/* <View style={Styles.imageContainer}>
          <Image source={{ uri: item.imageUrl }} resizeMode={"contain"} style={Styles.shuttleImg} />
        </View> */}
        <View
          style={{
            height: moderateScale(60),
            width: moderateScale(60),
            overflow: "hidden",
            borderRadius: moderateScale(100),
            borderWidth: 0.4,
            borderColor: Constants.Colors.gray
          }}
        >
          <Image source={{ uri: item.imageUrl }} resizeMode={"cover"} style={Styles.shuttleImg} />
        </View>
        <View style={Styles.textContainer}>
          <Text style={Styles.titleText}>{`${item.company} ${item.carModel}`}</Text>
          <Text style={Styles.subText}>{item.vehicleNo}</Text>
        </View>
        {myShuttle._id == item._id ? (
          <View style={Styles.yellowBtn}>
            <Image
              source={Constants.Images.Common.Accept}
              resizeMode={"contain"}
              style={{
                height: !Platform.isPad ? moderateScale(16) : moderateScale(15),
                width: !Platform.isPad ? moderateScale(16) : moderateScale(15)
              }}
            />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };
  onRefresh = () => {
    this.props.appActions.getDriverShuttle(this.props.navigator);
  };

    moveToChatWindow = _.debounce(() => {
      this.props.navigator.push({
          screen: "ChatWindow",
          animated: true,
          passProps: {
              crtransportId : this.props.user.route.adminId,
              crselectId: this.props.user._id,
              crselectName: this.props.user.name,
              crprofileUrl: this.props.user.profileUrl,
              crselectType : 'Driver'
          }
      });

    });

  render() {
    let { loader, navigator, shuttle } = this.props;
    let { myShuttle } = this.state;
    return (
      <View style={Styles.container}>
        <Header color={Constants.Colors.Yellow} navigator={navigator}
        title={"Select Shuttle"}
          rightIcon={Constants.Images.Common.Chat}
          onRightPress={() =>
            this.moveToChatWindow()
          }
        />
        {myShuttle._id ? (
          <View style={Styles.wraper}>
            <AuthButton
              buttonStyle={Styles.buttonStyle}
              gradientStyle={Styles.gradientStyle}
              buttonName={"Cancel"}
              gradientColors={["#FFFFFF", "#FFFFFF"]}
              textStyle={{ color: Constants.Colors.Primary }}
              onPress={() => this.onCanclePress()}
              //loading={this.props.loader && this.props.loader.changePasswordLoader}
            />
            <AuthButton
              buttonStyle={Styles.buttonStyle}
              gradientStyle={Styles.gradientStyle}
              gradientColors={["#F6CF65", "#F6CF65"]}
              buttonName={"Activate"}
              textStyle={{ color: "#fff" }}
              icon={Constants.Images.Common.Accept}
              onPress={() => this.onShuttleActive()}
              //loading={this.props.loader && this.props.loader.changePasswordLoader}
            />
          </View>
        ) : null}

        <View style={Styles.shuttleContainer}>
          {shuttle.shuttles && shuttle.shuttles.length ? (
            <Text style={Styles.textStyle}>
              {shuttle.shuttles.length} {shuttle.shuttles.length == 1 ? " Shuttle Available" : "Shuttles Available"}{" "}
            </Text>
          ) : null}
          <FlatList
            data={shuttle.shuttles}
            renderItem={this.renderItem}
            numColumns={1}
            keyExtractor={item => item._id}
            style={Styles.listStyle}
            extraData={this.state.myShuttle}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            onRefresh={this.onRefresh}
            refreshing={loader.shuttleList}
            ListEmptyComponent={() => {
              return loader.shuttleList ? null : <NoRecord msg="No Shuttle Available" />;
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
    loader: state.loader,
    shuttle: state.shuttle,
    trip: state.trip
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SelectShuttle);
