/*
Name : Gurtej Singh
File Name : DashBoard.js
Description : Contains the Terminal Listing screen
Date : 20 Oct 2018
*/
import React from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from "react-native";
import moment from "moment";

import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import AuthButton from "../../components/common/AuthButton";
import DriverSocket from "../../helpers/socket/driver";
import ViewMoreText from "../../lib/showMore";
import NoRecord from "../common/NoRecord";
import { storeObj } from "../../store/setup";
import { Navigator } from "react-native-navigation";
import * as appActions from "../../actions";
import Swipeout from "react-native-swipeout";
var swipeoutBtnsLeft = [
  {
    text: (
      <TouchableOpacity
        key={Math.random()}
        style={{
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <View
          style={{
            flex: 1,
            width: 150,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <View
            style={{
              width: 50,
              height: 50,
              backgroundColor: Constants.Colors.White,
              borderRadius: 100,
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Image source={Constants.Images.Common.RejectRequest} resizeMode="contain" />
          </View>
          <Text
            style={{
              ...Constants.Fonts.TitilliumWebRegular,
              color: Constants.Colors.White,
              fontSize: moderateScale(19)
            }}
          >
            Reject
          </Text>
        </View>
      </TouchableOpacity>
    ),
    backgroundColor: Constants.Colors.red
  }
];
var swipeoutBtnsRight = [
  {
    text: (
      <View
        key={Math.random()}
        style={{
          backgroundColor: Constants.Colors.Yellow,
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <View
          style={{
            width: 50,
            height: 50,
            backgroundColor: Constants.Colors.White,
            borderRadius: 100,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Image source={Constants.Images.Common.YellowAccept} />
        </View>
        <Text
          style={{
            ...Constants.Fonts.TitilliumWebRegular,
            color: Constants.Colors.White,
            fontSize: moderateScale(19)
          }}
        >
          Accept
        </Text>
      </View>
    ),
    backgroundColor: Constants.Colors.Yellow
  }
];
const onSwipeOpen = (rowIndex, onSwipeOut, _id) => {
  let { contentPos } = this[`swipeout${rowIndex}`].state;
  if (contentPos > 200) {
    Alert.alert(
      "",
      contentPos > 0 ? "Are you sure you want to reject this request?" : "",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel"
        },
        {
          text: "Ok",
          onPress: () => {
            DriverSocket.driverRejectTripRequest(_id);
          }
        }
      ],
      { cancelable: false }
    );
  }
  if (contentPos < -200) {
    DriverSocket.driverAcceptTripRequest(_id);
  }
  onSwipeOut(rowIndex, contentPos);
};
const onClose = (index, rowIndex) => {
  return rowIndex !== index || rowIndex == index;
};
const renderItem = (item, chat, userType, index, onSwipeOut, rowIndex) => {
  let { tripRequestStatus } = item;
  let showRight =
    tripRequestStatus === "accepted" ||
    tripRequestStatus === "enRoute" ||
    tripRequestStatus === "completed" ||
    tripRequestStatus === "rejected" ||
    tripRequestStatus === "cancelled";
  let showLeft =
    tripRequestStatus === "enRoute" ||
    tripRequestStatus === "completed" ||
    tripRequestStatus === "rejected" ||
    tripRequestStatus === "cancelled";
  return (
    <Swipeout
      right={showRight ? null : swipeoutBtnsRight}
      left={showLeft ? null : swipeoutBtnsLeft}
      backgroundColor="#fff"
      onOpen={() => onSwipeOpen(index, onSwipeOut, item._id)}
      close={() => onClose(index, rowIndex)}
      rowIndex={index}
      sectionId={0}
      autoClose={true}
      buttonWidth={500}
      ref={ref => (this[`swipeout${index}`] = ref)}
      disabled={userType === Constants.AppConstants.UserTypes.Driver ? false : true}
    >
      <View style={Styles.flatlistView} key={item._id}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          {item.tripRequestStatus === Constants.AppConstants.RideStatus.Request ? (
            <View style={[Styles.clockImgView]}>
              <Image source={Constants.Images.RideInfo.Clock} />
            </View>
          ) : item.tripRequestStatus === Constants.AppConstants.RideStatus.Accepted ? (
            <View style={[Styles.clockImgView, { backgroundColor: Constants.Colors.green }]}>
              <Image source={Constants.Images.Common.Accept} />
            </View>
          ) : item.tripRequestStatus === Constants.AppConstants.RideStatus.Cancelled ? (
            <View style={[Styles.clockImgView, { backgroundColor: Constants.Colors.red }]}>
              <Image source={Constants.Images.Common.Cancel} />
            </View>
          ) : item.tripRequestStatus === Constants.AppConstants.RideStatus.Rejected ? (
            <View style={[Styles.clockImgView, { backgroundColor: Constants.Colors.red }]}>
              <Image source={Constants.Images.Common.Rejected} />
            </View>
          ) : item.tripRequestStatus === Constants.AppConstants.RideStatus.EnRoute ? (
            <View style={[Styles.clockImgView, { backgroundColor: Constants.Colors.red }]}>
              <Image source={Constants.Images.Common.Enroute} />
            </View>
          ) : item.tripRequestStatus === Constants.AppConstants.RideStatus.Completed ? (
            <View style={[Styles.clockImgView, { backgroundColor: Constants.Colors.red }]}>
              <Image source={Constants.Images.Common.Completed} />
            </View>
          ) : null}

          <View style={{ flex: 0.8, justifyContent: "flex-start" }}>
            <ViewMoreText
              newStyle={{ marginLeft: moderateScale(3) }}
              numberOfLines={1}
              renderViewMore={onPress => {
                return (
                  <TouchableOpacity
                    onPress={onPress}
                    style={{ padding: 5, alignItems: "flex-end", justifyContent: "center" }}
                  >
                    <Image source={Constants.Images.RideInfo.Dropdown} />
                  </TouchableOpacity>
                );
              }}
              renderViewLess={onPress => {
                return (
                  <TouchableOpacity
                    onPress={onPress}
                    style={{ padding: 5, alignItems: "flex-end", justifyContent: "flex-end" }}
                  >
                    <Image source={Constants.Images.Common.UpArrow} />
                  </TouchableOpacity>
                );
              }}
              textStyle={[Styles.nameTxt, {}]}
            >
              {item.riderDetails && item.riderDetails.name}
            </ViewMoreText>
          </View>

          <View
            style={{
              flex: 0.15,
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: "row"
            }}
          >
            <Text numberOfLines={1} style={[Styles.boldTxt, { paddingRight: moderateScale(10) }]}>
              {item.seatBooked}
            </Text>
            <View
              style={{
                height: moderateScale(35),
                width: moderateScale(35),
                borderRadius: moderateScale(100),
                backgroundColor: Constants.Colors.gray,
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <Image
                source={Constants.Images.RideInfo.Man}
                resizeMode={"contain"}
                style={{ height: moderateScale(15), width: moderateScale(15) }}
              />
            </View>
          </View>
        </View>
        <View style={{ marginLeft: moderateScale(35) }}>
          <View
            style={{
              flexDirection: "row",
              paddingVertical: moderateScale(10),
              alignItems: "center"
            }}
          >
            <Image
              source={Constants.Images.Common.Source}
              style={{
                height: Constants.BaseStyle.DEVICE_HEIGHT * 0.02,
                width: Constants.BaseStyle.DEVICE_HEIGHT * 0.02
              }}
            />
            <View
              style={{
                flex: 0.5,
                paddingHorizontal: moderateScale(10)
              }}
            >
              <Text numberOfLines={1} style={Styles.regularTxt}>
                {item.srcLoc && item.srcLoc.name && item.srcLoc.name.trim()}
              </Text>
            </View>
            <Image source={Constants.Images.TerminalDetail.Pin} />
            <View
              style={{
                flex: 0.5,
                paddingHorizontal: moderateScale(10)
              }}
            >
              <Text numberOfLines={1} style={Styles.regularTxt}>
                {item.destLoc && item.destLoc.name && item.destLoc.name.trim()}
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <View style={{ flexDirection: "row", flex: 0.33, alignItems: "center" }}>
              <Image
                source={Constants.Images.RideInfo.ClockGray}
                style={{
                  height: Constants.BaseStyle.DEVICE_HEIGHT * 0.03,
                  width: Constants.BaseStyle.DEVICE_HEIGHT * 0.03
                }}
              />
              <Text numberOfLines={1} style={[Styles.regularTxt, { paddingLeft: moderateScale(5) }]}>
                {moment(item.requestTime).format("hh:mm A")}
              </Text>
            </View>
            {item.tripRequestStatus === Constants.AppConstants.RideStatus.Request ? (
              <View style={{ flexDirection: "row", justifyContent: "space-around", flex: 0.35, alignItems: "center" }}>
                <Text numberOfLines={1} style={Styles.boldTxt}>
                  {moment.duration(moment().diff(moment(item.requestTime)))._data.minutes} Min
                </Text>
              </View>
            ) : null}
            {userType === Constants.AppConstants.UserTypes.Driver &&
            (item.tripRequestStatus === Constants.AppConstants.RideStatus.Request ||
              item.tripRequestStatus === Constants.AppConstants.RideStatus.Accepted) ? (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  flex: 0.25,
                  alignItems: "center"
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      "",
                      "Are you sure you want to reject this request?",
                      [
                        {
                          text: "Cancel",
                          onPress: () => {},
                          style: "cancel"
                        },
                        {
                          text: "Ok",
                          onPress: () => {
                            DriverSocket.driverRejectTripRequest(item._id);
                          }
                        }
                      ],
                      { cancelable: false }
                    );
                    // DriverSocket.driverRejectTripRequest(item._id);
                  }}
                  style={{
                    backgroundColor: "#FF6965",
                    height: Constants.BaseStyle.DEVICE_HEIGHT * 0.04,
                    width: Constants.BaseStyle.DEVICE_HEIGHT * 0.04,
                    borderRadius: moderateScale(100),
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  <Image source={Constants.Images.Common.Cancel} />
                </TouchableOpacity>
                {item.tripRequestStatus === Constants.AppConstants.RideStatus.Request ? (
                  <TouchableOpacity
                    onPress={() => {
                      //alert("under development");
                      DriverSocket.driverAcceptTripRequest(item._id);
                    }}
                    style={{
                      height: Constants.BaseStyle.DEVICE_HEIGHT * 0.04,
                      width: Constants.BaseStyle.DEVICE_HEIGHT * 0.04,
                      borderRadius: moderateScale(100),
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: Constants.Colors.Yellow
                    }}
                  >
                    <Image source={Constants.Images.Common.Accept} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : userType === Constants.AppConstants.UserTypes.Admin &&
            item.tripRequestStatus !== Constants.AppConstants.RideStatus.Rejected &&
            item.tripRequestStatus !== Constants.AppConstants.RideStatus.Cancelled ? (
              <TouchableOpacity
                onPress={() => alert("underdevelopment")}
                style={{
                  height: moderateScale(35),
                  width: moderateScale(35),
                  borderRadius: moderateScale(100),
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: Constants.Colors.Yellow
                }}
              >
                <Image
                  source={Constants.Images.Common.WhiteChat}
                  style={{
                    height: moderateScale(15),
                    width: moderateScale(15)
                  }}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Swipeout>
  );
  // }
};

export const TerminalListing = props => {
  let { meta, rides, terminal, message, hideMeta, chat, userType, onSwipeOut, rowIndex } = props;
  const { getState, dispatch } = storeObj.store;
  let { rideRequests } = getState().loader;
  let navigator = new Navigator();

  return (
    <View
      style={{
        backgroundColor: Constants.Colors.White,
        flex: 1,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        shadowColor: "black",
        shadowOffset: { width: 1, height: -0.1 },
        shadowOpacity: 1,
        shadowRadius: 2,
        elevation: 1
      }}
    >
      <View
        style={{ flex: 0.1, backgroundColor: "white", justifyContent: "center", alignItems: "center" }}
        {...(props.panResponder ? { ...props.panResponder.panHandlers } : {})}
      >
        <Image source={Constants.Images.Common.sliderLine} />
      </View>

      {!hideMeta ? (
        meta.totalSeats ? (
          <View style={Styles.headerView}>
            <View
              style={[
                Styles.noOfPassengerView,
                { flex: 0.95, alignItems: "flex-start", paddingHorizontal: moderateScale(20) }
              ]}
            >
              <Text numberOfLines={1} style={Styles.noOfPassengerTxt}>
                {`${meta.totalSeats} ${message}`}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[Styles.headerView, { paddingRight: moderateScale(25) }]}>
            <View style={[Styles.noOfPassengerView, {}]}>
              <Text numberOfLines={1} style={Styles.noOfPassengerTxt}>
                {meta && meta.onBoardCount} Passengers
              </Text>
            </View>
            <View
              style={{
                flex: 0.2,
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <Text numberOfLines={1} style={Styles.boldTxt}>
                {meta && meta.newRequestsCount} New
              </Text>
            </View>

            <View
              style={[
                Styles.acceptBtnView,
                {
                  flex: 0.4,
                  alignItems: "flex-end"
                }
              ]}
            >
              {userType === Constants.AppConstants.UserTypes.Driver && meta && meta.newRequestsCount > 0 ? (
                <AuthButton
                  buttonStyle={Styles.buttonStyle}
                  gradientStyle={Styles.gradientStyle}
                  gradientColors={[Constants.Colors.Primary, Constants.Colors.Primary]}
                  buttonName={"Accept All"}
                  onPress={() => {
                    //accept all requests
                    DriverSocket.acceptAllTripRequests((terminal && terminal._id) || "");
                  }}
                  textStyle={{ color: Constants.Colors.White }}
                />
              ) : userType === Constants.AppConstants.UserTypes.Admin ? (
                <TouchableOpacity
                  onPress={() => alert("underdevelopment")}
                  style={{
                    height: moderateScale(35),
                    width: moderateScale(35),
                    borderRadius: moderateScale(100),
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: Constants.Colors.Primary,
                    bottom: moderateScale(12),
                    marginLeft: moderateScale(30)
                    // left: moderateScale(35)
                  }}
                >
                  <Image
                    source={Constants.Images.Common.WhiteChat}
                    style={{ height: moderateScale(15), width: moderateScale(15) }}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )
      ) : null}

      <FlatList
        data={rides}
        refreshing={rideRequests}
        onRefresh={() => {
          dispatch(appActions.getRideRequests(navigator));
        }}
        renderItem={({ item, index }) => {
          return renderItem(item, chat, userType, index, onSwipeOut, rowIndex);
        }}
        style={{ marginBottom: moderateScale(2) }}
        numColumns={1}
        keyExtractor={item => item._id}
        ListEmptyComponent={() => {
          return <NoRecord />;
        }}
      />
    </View>
  );
};

const Styles = StyleSheet.create({
  buttonStyle: {
    flex: 1,
    paddingHorizontal: moderateScale(10)
  },
  gradientStyle: {
    borderRadius: moderateScale(10),
    padding: moderateScale(5),
    height: moderateScale(40)
  },
  flatlistView: {
    flexDirection: "column",
    borderBottomWidth: 0.4,
    borderBottomColor: Constants.Colors.placehoder,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(25),
    backgroundColor: Constants.Colors.White,
    // alignItems: "center"
    justifyContent: "space-between"
  },
  clockImgView: {
    //flex: 0.2,
    paddingVertical: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Constants.Colors.gray,
    height: Constants.BaseStyle.DEVICE_HEIGHT * 0.04,
    width: Constants.BaseStyle.DEVICE_HEIGHT * 0.04,
    borderRadius: moderateScale(100),
    marginTop: moderateScale(15)
    // marginRight: moderateScale(2)
  },
  nameTxt: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    color: Constants.Colors.Primary,
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
    top: moderateScale(15)
  },
  noOfPassengerTxt: {
    ...Constants.Fonts.TitilliumWebRegular,
    color: Constants.Colors.placehoder,
    fontSize: moderateScale(19)
  },
  headerView: {
    height: Constants.BaseStyle.DEVICE_HEIGHT * 0.1,
    flexDirection: "row",
    borderBottomWidth: 0.4,
    borderBottomColor: Constants.Colors.White
  },
  noOfPassengerView: {
    flex: 0.4,
    justifyContent: "center",
    alignItems: "center"
  }
});

export default TerminalListing;
