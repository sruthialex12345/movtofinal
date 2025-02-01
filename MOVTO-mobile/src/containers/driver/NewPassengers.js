/*
Name : Amit Singh
File Name : NewPassengers.js
Description : Contains the add New Passengers screen
Date : 15 OCT 2018
*/
import React, { Component } from "react";
import { View, StyleSheet, Text, Image, FlatList } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";

import Constants from "../../constants";
import Header from "../../components/common/Header";
import * as appActions from "../../actions";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import AuthButton from "../../components/common/AuthButton";

class NewPassengers extends Component {
  constructor(props) {
    super(props);
    this.state = {
      terminal: [
        {
          name: "Terminal 1 Passengers",
          passengers: 1,
          source: "Terminal 1",
          destination: "Terminal 2",
          depatureTime: "10:30 PM",
          totalPassengers: 4
        },
        {
          name: "Terminal 1 Passengers",
          passengers: 1,
          source: "Terminal 1",
          destination: "Terminal 2",
          depatureTime: "10:30 PM",
          totalPassengers: 4
        },
        {
          name: "Terminal 1 Passengers",
          passengers: 1,
          source: "Terminal 1",
          destination: "Terminal 2",
          depatureTime: "10:30 PM",
          totalPassengers: 4
        }
      ]
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };
  componentDidMount() {
    this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
    this.props.navigator.setStyle({
      statusBarColor: Constants.Colors.Yellow
    });
  }
  onNavigationEvent = _.debounce(event => {
    if (event.type == "DeepLink") {
      this.props.navigator.resetTo({
        screen: event.link,
        animated: false,
        animationType: "fade"
      });
    }
  }, 500);

  drawerPress() {
    this.props.navigator.toggleDrawer({
      side: "left"
    });
  }

  render() {
    const { regularTxt, flatlistView, clockImgView, nameTxt, boldTxt } = Styles;
    return (
      <View style={{ flex: 1 }}>
        <Header onDrawerPress={() => this.drawerPress()} title={"New Passengers"} />
        <View
          style={{
            flex: 0.3,
            justifyContent: "center",
            marginHorizontal: Constants.BaseStyle.DEVICE_HEIGHT * 0.03
          }}
        >
          <Text
            style={{
              color: Constants.Colors.gray,
              fontSize: moderateScale(17),
              ...Constants.Fonts.TitilliumWebRegular
            }}
          >
            25 New Passengers
          </Text>
        </View>
        <FlatList
          data={this.state.terminal}
          renderItem={({ item }) => (
            <View style={flatlistView}>
              <View style={clockImgView}>
                <View
                  style={{
                    backgroundColor: "#8BCC82",
                    height: Constants.BaseStyle.DEVICE_HEIGHT * 0.04,
                    width: Constants.BaseStyle.DEVICE_HEIGHT * 0.04,
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: moderateScale(20)
                  }}
                >
                  <Image source={Constants.Images.Common.Accept} />
                </View>
              </View>
              <View
                style={{
                  flex: 0.8,
                  paddingVertical: moderateScale(10)
                }}
              >
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center"
                  }}
                >
                  <View style={{ flex: 0.7 }}>
                    <Text style={nameTxt}>{item.name}</Text>
                  </View>
                  <View style={{ flex: 0.2, alignItems: "center" }}>
                    <View
                      style={{
                        flexDirection: "row"
                      }}
                    >
                      <Text style={boldTxt}>{item.totalPassengers}</Text>
                      <Image
                        source={Constants.Images.Common.Admin}
                        style={{
                          marginHorizontal: Constants.BaseStyle.DEVICE_HEIGHT * 0.01,
                          height: Constants.BaseStyle.DEVICE_HEIGHT * 0.03,
                          width: Constants.BaseStyle.DEVICE_HEIGHT * 0.03
                        }}
                      />
                    </View>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    paddingVertical: moderateScale(10)
                  }}
                >
                  <Image source={Constants.Images.TerminalDetail.Pin} />
                  <View
                    style={{
                      paddingHorizontal: moderateScale(10)
                    }}
                  >
                    <Text style={regularTxt}>{item.source}</Text>
                  </View>
                  <Image source={Constants.Images.TerminalDetail.Pin} />
                  <View
                    style={{
                      paddingHorizontal: moderateScale(10)
                    }}
                  >
                    <Text style={regularTxt}>{item.destination}</Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center"
                  }}
                >
                  <View style={{ flex: 0.1 }}>
                    <Image
                      source={Constants.Images.Common.Admin}
                      style={{
                        height: Constants.BaseStyle.DEVICE_HEIGHT * 0.03,
                        width: Constants.BaseStyle.DEVICE_HEIGHT * 0.03
                      }}
                    />
                  </View>
                  <View style={{ flex: 0.3 }}>
                    <Text style={regularTxt}>{item.depatureTime}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        />
        <View style={{ flex: 0.5 }}>
          <AuthButton
            buttonStyle={Styles.buttonStyle}
            gradientStyle={Styles.gradientStyle}
            gradientColors={[Constants.Colors.Yellow, Constants.Colors.Yellow]}
            buttonName={"Continue Ride"}
            onPress={() => alert("Continue Ride")}
            textStyle={{
              color: Constants.Colors.White,
              fontSize: moderateScale(18)
            }}
            loading={this.props.loader}
          />
        </View>
      </View>
    );
  }
}
const mapdestinationToProps = destination => ({
  appActions: bindActionCreators(appActions, destination)
});
function mapStateToProps(state) {
  return {
    user: state.user,
    riderLocation: state.riderLocation
  };
}
export default connect(
  mapStateToProps,
  mapdestinationToProps
)(NewPassengers);

const Styles = StyleSheet.create({
  gradientStyle: { borderRadius: moderateScale(0) },
  flatlistView: {
    flexDirection: "row",
    borderBottomWidth: 0.4,
    borderBottomColor: Constants.Colors.placehoder,
    paddingVertical: moderateScale(10)
  },
  clockImgView: {
    flex: 0.2,
    paddingVertical: moderateScale(10),
    alignItems: "center"
  },
  nameTxt: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    color: "#3B3B39",
    fontSize: moderateScale(19)
  },
  boldTxt: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(17),
    color: Constants.Colors.Primary
  },
  regularTxt: {
    ...Constants.Fonts.TitilliumWebRegular,
    color: Constants.Colors.placehoder,
    fontSize: moderateScale(17)
  },
  acceptBtnView: {
    flex: 0.4,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(20)
  },
  noOfPassengerTxt: {
    ...Constants.Fonts.TitilliumWebRegular,
    color: Constants.Colors.gray,
    fontSize: moderateScale(17)
  },
  headerView: {
    height: Constants.BaseStyle.DEVICE_HEIGHT * 0.1,
    flexDirection: "row",
    borderBottomWidth: 0.4,
    borderBottomColor: Constants.Colors.placehoder
  },
  noOfPassengerView: {
    flex: 0.4,
    justifyContent: "center",
    alignItems: "center"
  }
});
