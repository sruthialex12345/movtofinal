/*
Name : Gurtej Singh
File Name : ActiveTripModal.js
Description : Contains the passengers on terminal.
Date : 08 oct 2018
*/
import React, { Component } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Image, FlatList, Platform, Alert, PanResponder } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
// import Image from "react-native-image-progress";
import Constants from "../../constants";
import * as appActions from "../../actions";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import ShuttleStatus from "../common/ShuttleStatus";

class ActiveTripModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      terminal: []
    };

    this._panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (event, gestureState) => {
        if (gestureState.dy > 0) {
          setTimeout(() => {
            this.dismissModal();
          }, 200);
        }
      }
    });
  }

  static navigatorStyle = {
    navBarHidden: true,
    screenBackgroundColor: "transparent",
    modalPresentationStyle: "overFullScreen"
  };

  updateCurrentTrip = _.debounce(tripId => {
    this.props.appActions.updateCurrentTrip(tripId, this.props.navigator);
  });

  dismissModal = _.debounce(() => {
    this.props.navigator.dismissModal({
      animationType: "slide-down"
    });
  });
  deactiveShuttle = _.debounce(item => {
    let { navigator, user } = this.props;
    let context = this;
    // if(item.activeStatus){
    Alert.alert(
      "CirularDrive",
      "Are you sure you want to deactivate driver?",

      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel"
        },
        {
          text: "Ok",
          onPress: () => {
            let postData = {
              adminId: user && user._id,
              driverId: item.driver && item.driver._id,
              status: false
            };
            context.props.appActions.deactivateShuttle(postData, navigator, () => {
              context.props.appActions.ActiveTrips(1, "", navigator);
            });
          }
        }
      ],
      { cancelable: false }
    );

    // }
  }, 300);
  renderTrip = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => this.updateCurrentTrip(item._id)}
        key={item._id}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginHorizontal: moderateScale(25),
          alignItems: "center",
          paddingVertical: moderateScale(10),
          borderBottomWidth: 0.4,
          borderBottomColor: Constants.Colors.gray
        }}
      >
        <View
          style={{
            flex: 0.65,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start"
          }}
        >
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
            <Image
              source={{ uri: item && item.driver && item.driver.profileUrl }}
              style={{
                flex: 1
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={Styles.bookText}>
              {item.driver.name ? item.driver.name : "--"}
            </Text>
            <Text numberOfLines={1} style={Styles.WaitText}>
              {item.shuttleId.name ? item.shuttleId.name : "--"}
            </Text>
          </View>
        </View>
        <View style={{ flex: 0.35, justifyContent: "center", alignItems: "center" }}>
          <ShuttleStatus
            active={item.driver && item.driver.activeStatus}
            onPress={() => {
              this.deactiveShuttle(item);
            }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  render() {
    let { listing } = this.props;
    let { activeTrips } = listing;
    return (
      <View style={Styles.container}>
        {/* <TouchableOpacity
          onPress={this.dismissModal}
          style={{
            flex: 0.1,
            justifyContent: "center",
            alignItems: "flex-start",
            paddingHorizontal: moderateScale(20),
            backgroundColor: Constants.Colors.transparent
          }}
        >
          <Image
            source={Constants.Images.RideInfo.Dropdown}
            style={{ height: moderateScale(12), width: moderateScale(12) }}
          />
        </TouchableOpacity> */}

        <View style={Styles.modalView}>
          <View
            style={{
              flex: 1,
              bottom: 0,
              width: Constants.BaseStyle.DEVICE_WIDTH,
              borderTopLeftRadius: moderateScale(10),
              borderTopRightRadius: moderateScale(10)
            }}
          >
            <View
              style={{
                flex: 0.1,
                backgroundColor: "white",
                justifyContent: "center",
                alignItems: "center",
                borderTopLeftRadius: moderateScale(10),
                borderTopRightRadius: moderateScale(10)
              }}
              {...this._panResponder.panHandlers}
            >
              <Image source={Constants.Images.Common.sliderLine} />
            </View>
            <Text style={[Styles.WaitText, Styles.activeText]}>
              {activeTrips.length}
              {activeTrips.length > 1 ? " active shuttles" : " active shuttle"}
            </Text>
            <FlatList
              data={activeTrips}
              keyExtractor={(item, index) => item._id + index}
              numColumns={1}
              renderItem={this.renderTrip}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
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
    listing: state.listing,
    user: state.user
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ActiveTripModal);

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.Colors.transparent,
    justifyContent: "flex-end",
    zIndex: 999
  },
  modalView: {
    backgroundColor: Constants.Colors.White,
    flex: 0.8,
    justifyContent: "center",
    alignItems: "flex-start",
    flexDirection: "column",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowOffset: { width: 1, height: 1 },
    shadowColor: "black",
    shadowOpacity: 1.0,
    elevation: Platform.OS === "ios" ? 0 : 20
  },
  WaitText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.placehoder,
    textAlign: "left",
    paddingHorizontal: moderateScale(5),
    marginHorizontal: moderateScale(5)
  },
  activeText: {
    paddingHorizontal: moderateScale(25),
    marginVertical: moderateScale(15)
  },
  bookText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(19),
    color: Constants.Colors.Black,
    textAlign: "left",
    paddingHorizontal: moderateScale(5),
    marginHorizontal: moderateScale(5)
  },
  waitTime: {
    justifyContent: "flex-end",
    alignItems: "flex-end"
  }
});
