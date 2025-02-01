/*
Name : Gurtej Singh
File Name : ActiveTripDriverModal.js
Description : Contains the ActiveTripDriverModal view.
Date : 27 Nov 2018
*/
import React from "react";
import { View, Image, Text, StyleSheet, Platform } from "react-native";

import Constants from "../../constants";
import AuthButton from "../common/AuthButton";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import OnlineDot from "../common/OnlineDot";

const ActiveTripDriverModal = props => {
  let { driver, shuttle, meta, driverTripListing, disabled, navigator } = props;
  let { name, profileUrl } = driver;
  return (
    <View style={Styles.container}>
      <View style={Styles.modalView}>
        <View style={[Styles.sideMenuImageContainer, { bottom: moderateScale(-40), elevation: 20 }]}>
          <View style={Styles.profileImg}>
            <Image source={{ uri: profileUrl }} style={Styles.imgAvatar} resizeMode={"cover"} />
            <OnlineDot
              size={15}
              active
              dotStyle={{
                bottom: Platform.isPad ? moderateScale(12) : moderateScale(12),
                right: Platform.isPad ? moderateScale(12) : moderateScale(6),
                borderWidth: moderateScale(2.5),
                borderColor: "white"
              }}
            />
          </View>
        </View>
        <View
          style={{
            backgroundColor: Constants.Colors.White,
            width: Constants.BaseStyle.DEVICE_WIDTH,
            // justifyContent: "space-between",
            //alignItems: "center",
            flexDirection: "column",
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            height: moderateScale(100),
            shadowColor: "black",
            shadowOffset: { width: 2, height: -1 },
            shadowOpacity: 0.4,
            shadowRadius: 2,
            elevation: 20
          }}
        >
          <View style={{ flex: 0.4, backgroundColor: "transparent" }} />
          <View
            style={{
              flex: 0.3,
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
              paddingHorizontal: moderateScale(25)
            }}
          >
            <View style={[Styles.timePersonContainer]}>
              <Text style={[Styles.userName]} numberOfLines={1}>
                {name}
              </Text>
            </View>
            <View style={[Styles.timePersonContainer, { flex: 0.5, justifyContent: "flex-end", marginHorizontal: 0 }]}>
              <Text style={[Styles.userName, { paddingRight: moderateScale(20) }]}>{shuttle.name}</Text>
              <View
                style={[
                  Styles.timeManContainer,
                  {
                    height: moderateScale(40),
                    width: moderateScale(40),
                    backgroundColor: Constants.Colors.transparent,
                    borderColor: Constants.Colors.gray,
                    borderWidth: 0.4,
                    overflow: "hidden"
                  }
                ]}
              >
                <Image
                  source={{ uri: shuttle.imageUrl }}
                  style={{
                    height: moderateScale(60),
                    width: moderateScale(60)
                  }}
                  resizeMode={"cover"}
                />
              </View>
            </View>
            {/* <View style={Styles.timePersonContainer}>
              <Text style={Styles.userName}>{shuttle.name}</Text>
              <View style={Styles.timeManContainer}>
                <Image source={Constants.Images.Common.Bus} resizeMode={"contain"} />
              </View>
            </View> */}
          </View>
          <View
            style={{
              flex: 0.3,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: moderateScale(25)

              // paddingLeft: moderateScale(5)
            }}
          >
            <View style={[Styles.timePersonContainer, { marginHorizontal: 0, flex: 0.5 }]}>
              {/* <View style={Styles.timeManContainer}>
              <Image source={Constants.Images.RideInfo.Clock} resizeMode={"contain"} />
            </View> */}
              <Text style={Styles.buttonText}>{meta && meta.onBoardCount} Passengers</Text>
            </View>
            <View style={[Styles.bookBtnContainer]}>
              <View
                style={[
                  Styles.waitTime,
                  { justifyContent: "center", flexDirection: "row", elevation: 2, alignItems: "center" }
                ]}
              >
                <Text numberOfLines={1} style={[Styles.buttonText]}>
                  {meta && meta.newRequestsCount} New Requests
                </Text>
                <View
                  style={[
                    {
                      height: moderateScale(40),
                      width: moderateScale(40)
                    }
                  ]}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
      <View
        style={{
          justifyContent: "space-between",
          flexDirection: "row",
          borderColor: Constants.Colors.placehoder,
          borderWidth: 0.4
        }}
      >
        <AuthButton
          buttonStyle={Styles.buttonStyle}
          gradientStyle={Styles.gradientStyle}
          buttonName={"Start Chat"}
          textStyle={{ color: Constants.Colors.Primary }}
          onPress={() =>
         //alert("underdevelopment")
          //@GR - 02/16/2020 - Added Chat feature
          {
                navigator.handleDeepLink({
                  link: "Chat",
                  payload: {
                    passProps: {
                      userData: driver
                    },
                    push: true
                  }
                });
            }

          }
          loading={false}
          gradientColors={["#FFFFFF", "#FFFFFF"]}
        />
        <AuthButton
          buttonStyle={Styles.buttonStyle}
          gradientStyle={Styles.gradientStyle}
          gradientColors={["#F6CF65", "#F6CF65"]}
          buttonName={"View Details"}
          onPress={driverTripListing}
          textStyle={{ color: "#fff" }}
          loading={false}
          disabled={disabled}
        />
      </View>
    </View>
  );
};

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.Colors.transparent,
    justifyContent: "flex-end",
    position: "absolute",
    bottom: 0
  },
  modalView: {
    backgroundColor: Constants.Colors.transparent,
    flex: 0.4,
    width: Constants.BaseStyle.DEVICE_WIDTH,
    justifyContent: "space-between",
    //alignItems: "center",
    flexDirection: "column"
    // borderRadius: moderateScale(10)
  },
  timePersonContainer: {
    flex: 0.5,
    flexDirection: "row",
    // justifyContent: "space-evenly",
    alignItems: "center",
    // marginHorizontal: moderateScale(15),
    height: moderateScale(40)
  },
  timeManContainer: {
    borderRadius: moderateScale(100),
    height: moderateScale(40),
    width: moderateScale(40),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.4,
    borderColor: Constants.Colors.gray,
    overflow: "hidden"
  },
  buttonText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.Primary
  },
  bookBtnContainer: {
    flex: 0.5,
    flexDirection: "column",
    justifyContent: "flex-start"
    // marginHorizontal: moderateScale(2)
  },
  bookBtn: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center"
  },
  buttonStyle: { flex: 0.5 },
  gradientStyle: { borderRadius: 0 },
  WaitText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.placehoder,
    textAlign: "left"
  },
  bookText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(18),
    color: Constants.Colors.Black,
    textAlign: "right"
  },
  waitTime: {
    // justifyContent: "flex-end",
    // alignItems: "flex-end"
  },

  sideMenuImageContainer: {
    paddingHorizontal: moderateScale(10),
    zIndex: 99
  },
  profileImg: {
    height: Constants.BaseStyle.DEVICE_WIDTH * 0.2,
    width: Constants.BaseStyle.DEVICE_WIDTH * 0.2,
    borderColor: Constants.Colors.Primary,
    borderWidth: 0.4,
    borderRadius: moderateScale(100),
    marginLeft: moderateScale(15),
    backgroundColor: Constants.Colors.transparent,
    overflow: "hidden"
  },
  imgAvatar: {
    // height: Constants.BaseStyle.DEVICE_WIDTH * 0.2,
    // width: Constants.BaseStyle.DEVICE_WIDTH * 0.2
    flex: 1
  },
  userInfo: {
    padding: moderateScale(5)
  },
  userName: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(19),
    color: Constants.Colors.Primary
  }
});

export default ActiveTripDriverModal;
