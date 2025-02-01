/*
Name : Gurtej Singh
File Name : Filters.js
Description : Contains the Filters
Date : 23 Nov 2018
*/
import React, { Component } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  // Platform,
  Image,
  Modal
  // DatePickerIOS
} from "react-native";
import { connect } from "react-redux";
import DatePicker from "react-native-date-picker";
import { bindActionCreators } from "redux";

import _ from "lodash";
// import Image from "react-native-image-progress";
import Constants from "../../constants";
import Header from "../../components/common/Header";
import * as appActions from "../../actions";
import AuthButton from "../../components/common/AuthButton";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import { toastMessage } from "../../config/navigators";
import LocationInput from "../../components/common/LocationInput";
import Online from "../../components/common/OnlineDot";
import moment from "moment";

class Filters extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: this.props.scheduleAdmin || this.props.scheduleDriver ? "status" : "driver",
      selectedDrivers: (this.props.listing && this.props.listing.filters && this.props.listing.filters.drivers) || [],
      selectedRideStatus: (this.props.listing && this.props.listing.filters && this.props.listing.filters.status) || [],
      source: (this.props.listing && this.props.listing.filters && this.props.listing.filters.source) || {},
      destination: (this.props.listing && this.props.listing.filters && this.props.listing.filters.destination) || {},
      locationType: Constants.AppConstants.UserLocation.Source,
      selectedScheduleStatus: [],
      date: "",
      time: "",
      calendarListModal: false,
      timeModalVisible: false,
      selectedDateType: "start",
      startTime: new Date(),
      endTime: new Date(),
      defaultDate: new Date()
    };
  }

  static navigatorStyle = {
    navBarHidden: true
  };

  componentDidMount() {
    // let { appActions, navigator } = this.props;
    // appActions.getDriverListing(1, "", navigator);
    this.props.navigator.setDrawerEnabled({
      side: "left",
      enabled: false
    });
  }

  onSelectTerminal = terminal => {
    let { locationType } = this.state;
    if (locationType === Constants.AppConstants.UserLocation.Source) {
      this.setState({ source: terminal });
    } else {
      this.setState({ destination: terminal });
    }
  };

  componentWillUnmount = () => {
    this.props.navigator.setDrawerEnabled({
      side: "left",
      enabled: true
    });
  };

  setDate = value => {
    this.setState({ defaultDate: value });
    if (this.state.selectedDateType === "start") {
      // this.setState({ startTime: value });
      this.props.appActions.setFilterStartTime(value);
    } else {
      // this.setState({ endTime: value });
      this.props.appActions.setFilterEndTime(value);
    }
  };

  onChangeSource = location => {
    let { user, navigator, appActions } = this.props;
    let { source } = this.state;
    if (location === Constants.AppConstants.UserLocation.Destination && !source._id) {
      toastMessage(navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: Constants.Strings.Error.SourceNotSelected
      });
      return;
    }
    this.setState({ locationType: location });
    appActions.setLocationType(location, navigator, true, user._id, this.state.source, this.onSelectTerminal);
  };

  clearLocation = location => {
    if (location === Constants.AppConstants.UserLocation.Source) {
      this.setState({ source: {}, destination: {} });
    } else {
      this.setState({ destination: {} });
    }
  };

  applyFilters = () => {
    let { listing, navigator, scheduleAdmin, scheduleDriver } = this.props;
    let { filters } = listing;
    let { timeSort } = filters;
    let { source, destination, selectedDrivers, selectedRideStatus } = this.state;
    if (scheduleAdmin) {
      this.props.appActions.getScheduledTrips(navigator);
      navigator.pop();
    } else if (scheduleDriver) {
      this.props.appActions.getScheduleListingDriver(navigator);
      navigator.pop();
    } else {
      if (source && source._id && (!destination || !destination._id)) {
        toastMessage(navigator, {
          type: Constants.AppConstants.Notificaitons.Error,
          message: "Please select destination."
        });

        return;
      }

      let filter = {
        source,
        destination,
        drivers: selectedDrivers,
        status: selectedRideStatus,
        timeSort: timeSort || false
      };
      let data = {
        driverIds: selectedDrivers || [],
        status: selectedRideStatus || [],
        startTerminalID: source && source._id ? source._id : "",
        toTerminalID: destination && destination._id ? destination._id : "",
        timeSort: false
      };
      //to update reducer data
      this.props.appActions.updateFilters(filter, this.props.navigator);
      //to call api filter
      this.props.appActions.getRiderListing(1, data, navigator);
    }
  };

  updateSelectedDriver = id => {
    let { selectedDrivers } = { ...this.state };
    let _selectedDrivers = [...selectedDrivers];
    if (_selectedDrivers.includes(id)) {
      _.remove(_selectedDrivers, item => {
        return item === id;
      });
    } else {
      _selectedDrivers.push(id);
    }
    this.setState({ selectedDrivers: [..._selectedDrivers] });
  };

  clearFilters = () => {
    if (this.props.scheduleAdmin) {
      this.props.appActions.clearFilters();
    } else if (this.props.scheduleDriver) {
      this.props.appActions.clearFilters();
    } else {
      this.setState(
        {
          selectedRideStatus: [],
          selectedDrivers: [],
          source: {},
          destination: {}
        },
        () => {
          let data = {
            driverIds: [],
            status: [],
            startTerminalID: "",
            toTerminalID: "",
            timeSort: false
          };
          this.props.appActions.updateFilters({}, this.props.navigator);
          this.props.appActions.getRiderListing(1, data, navigator);
        }
      );
    }
  };

  updateRequestStatus = status => {
    let { selectedRideStatus } = { ...this.state };
    let _selectedRideStatus = [...selectedRideStatus];
    if (_selectedRideStatus.includes(status)) {
      _.remove(_selectedRideStatus, item => {
        return item === status;
      });
    } else {
      _selectedRideStatus.push(status);
    }
    this.setState({ selectedRideStatus: [..._selectedRideStatus] });
  };

  updateScheduleStatus = status => {
    let { selectedScheduleStatus } = { ...this.state };
    let _selectedScheduleStatus = [...selectedScheduleStatus];
    if (_selectedScheduleStatus.includes(status)) {
      _.remove(_selectedScheduleStatus, item => {
        return item === status;
      });
    } else {
      _selectedScheduleStatus.push(status);
    }
    this.setState({ selectedScheduleStatus: [..._selectedScheduleStatus] });
    this.props.appActions.setFilterStatus([..._selectedScheduleStatus]);
  };

  onFilterChange = filter => {
    let { appActions, navigator } = this.props;
    this.setState(
      {
        filter
      },
      () => {
        if (filter === "driver") {
          appActions.getDriverListing(1, "", navigator);
        }
      }
    );
  };
  renderDriver = () => {
    //let { filter } = this.state;
    const { listing } = this.props;
    const { drivers } = listing;
    let { selectedDrivers } = this.state;
    return drivers.map(driver => {
      let isSelected = selectedDrivers.includes(driver._id);
      return (
        <TouchableOpacity
          onPress={() => this.updateSelectedDriver(driver._id)}
          key={driver._id}
          style={{
            paddingHorizontal: moderateScale(25),
            paddingVertical: moderateScale(10),
            borderBottomColor: Constants.Colors.FilterBackground,
            borderBottomWidth: 1,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <Text
            style={[
              isSelected ? { ...Constants.Fonts.TitilliumWebSemiBold } : { ...Constants.Fonts.TitilliumWebRegular },
              {
                fontSize: moderateScale(17),
                color: isSelected ? Constants.Colors.Primary : Constants.Colors.gray
              }
            ]}
          >
            {driver.name ? driver.name : "--"}
          </Text>
          <View
            style={{
              height: moderateScale(22),
              width: moderateScale(22),
              borderRadius: moderateScale(100),
              borderColor: isSelected ? Constants.Colors.Yellow : Constants.Colors.gray,
              borderWidth: 0.4,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: isSelected ? Constants.Colors.Yellow : Constants.Colors.Transparent
            }}
          >
            {isSelected ? (
              <Image
                source={Constants.Images.Common.Accept}
                style={{
                  height: moderateScale(12),
                  width: moderateScale(12)
                }}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </TouchableOpacity>
      );
    });
  };
  renderOnline = () => {
    return (
      <Online
        size={6}
        dotStyle={{
          bottom: moderateScale(20),
          left: moderateScale(120)
        }}
      />
    );
  };
  renderFilters = () => {
    let { selectedDrivers, filter, selectedRideStatus, source, destination } = this.state;
    let { user, statusDate } = this.props;
    let { adminTripTypes } = user;
    let Filters = [];
    if (statusDate) {
      Filters = [
        {
          type: "status",
          title: "Status",
          onFilterChange: this.onFilterChange
        },
        {
          type: "dateTime",
          title: "Date & Time",
          onFilterChange: this.onFilterChange,
          loading: false
        }
      ];
    } else if (
      (adminTripTypes && adminTripTypes.length && adminTripTypes[0]) == Constants.AppConstants.RouteType.Dynamic
    ) {
      Filters = [
        {
          type: "driver",
          title: "Driver",
          onFilterChange: this.onFilterChange
        },
        {
          type: "passenger",
          title: "Passengers",
          onFilterChange: this.onFilterChange,
          loading: false
        }
      ];
    } else {
      Filters = [
        {
          type: "driver",
          title: "Driver",
          onFilterChange: this.onFilterChange
        },
        {
          type: "passenger",
          title: "Passengers",
          onFilterChange: this.onFilterChange,
          loading: false
        },
        {
          type: "location",
          title: "Location",
          onFilterChange: this.onFilterChange
        }
      ];
    }
    return Filters.map((item, index) => {
      if (filter === item.type) {
        return (
          <TouchableOpacity
            onPress={() => item.onFilterChange(item.type)}
            key={index}
            style={{
              paddingHorizontal: moderateScale(25),
              borderBottomColor: Constants.Colors.Yellow,
              borderBottomWidth: 4,
              paddingVertical: moderateScale(10),
              justifyContent: "space-between",
              flexDirection: "row",
              backgroundColor: "white"
            }}
          >
            <Text
              style={{
                ...Constants.Fonts.TitilliumWebSemiBold,
                fontSize: moderateScale(17),
                color: Constants.Colors.Primary
              }}
            >
              {item.title}
            </Text>
            {item.type === "location" && (source._id || destination._id) ? (
              this.renderOnline()
            ) : (
              <Text
                style={{
                  ...Constants.Fonts.TitilliumWebSemiBold,
                  fontSize: moderateScale(17),
                  color: Constants.Colors.gray
                }}
              >
                {item.type === "driver" && selectedDrivers.length && selectedDrivers.length > 0
                  ? selectedDrivers.length
                  : item.type === "passenger" && selectedRideStatus.length && selectedRideStatus.length > 0
                    ? selectedRideStatus.length
                    : null}
              </Text>
            )}
          </TouchableOpacity>
        );
      } else {
        return (
          <TouchableOpacity
            onPress={() => item.onFilterChange(item.type)}
            key={index}
            style={{
              paddingHorizontal: moderateScale(25),
              paddingVertical: moderateScale(10),
              justifyContent: "space-between",
              flexDirection: "row"
            }}
          >
            <Text
              style={{
                ...Constants.Fonts.TitilliumWebRegular,
                fontSize: moderateScale(17),
                color: Constants.Colors.gray
              }}
            >
              {item.title}
            </Text>
            {item.type === "location" && (source._id || destination._id) ? (
              this.renderOnline()
            ) : (
              <Text
                style={{
                  ...Constants.Fonts.TitilliumWebSemiBold,
                  fontSize: moderateScale(17),
                  color: Constants.Colors.placehoder
                }}
              >
                {item.type === "driver" && selectedDrivers.length && selectedDrivers.length > 0
                  ? selectedDrivers.length
                  : item.type === "passenger" && selectedRideStatus.length && selectedRideStatus.length > 0
                    ? selectedRideStatus.length
                    : null}
              </Text>
            )}
          </TouchableOpacity>
        );
      }
    });
  };
  renderPassenger = () => {
    let { selectedRideStatus } = this.state;
    let rideStatus = [
      {
        type: Constants.AppConstants.RideStatus.Request,
        title: "Request"
      },
      {
        type: Constants.AppConstants.RideStatus.Accepted,
        title: "Accepted"
      },
      {
        type: Constants.AppConstants.RideStatus.Completed,
        title: "Completed"
      },
      {
        type: Constants.AppConstants.RideStatus.Cancelled,
        title: "Cancelled"
      },
      {
        type: Constants.AppConstants.RideStatus.Rejected,
        title: "Rejected"
      },
      {
        type: Constants.AppConstants.RideStatus.EnRoute,
        title: "EnRoute"
      }
    ];

    return rideStatus.map((status, index) => {
      let isSelected = selectedRideStatus.includes(status.type);
      return (
        <TouchableOpacity
          onPress={() => this.updateRequestStatus(status.type)}
          key={index}
          style={{
            paddingHorizontal: moderateScale(25),
            paddingVertical: moderateScale(10),
            borderBottomColor: Constants.Colors.FilterBackground,
            borderBottomWidth: 1,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <Text
            style={[
              isSelected ? { ...Constants.Fonts.TitilliumWebSemiBold } : { ...Constants.Fonts.TitilliumWebRegular },
              {
                fontSize: moderateScale(17),
                color: isSelected ? Constants.Colors.Primary : Constants.Colors.gray
              }
            ]}
          >
            {status.title}
          </Text>
          <View
            style={{
              height: moderateScale(22),
              width: moderateScale(22),
              borderRadius: moderateScale(100),
              borderColor: isSelected ? Constants.Colors.Yellow : Constants.Colors.gray,
              borderWidth: 0.4,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: isSelected ? Constants.Colors.Yellow : Constants.Colors.Transparent
            }}
          >
            {isSelected ? (
              <Image
                source={Constants.Images.Common.Accept}
                style={{
                  height: moderateScale(12),
                  width: moderateScale(12)
                }}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </TouchableOpacity>
      );
    });
  };
  renderLocation = () => {
    let { source, destination } = this.state;
    return (
      <View style={{ marginTop: moderateScale(20) }}>
        <LocationInput
          sourcePlaceholder={Constants.Strings.PlaceHolder.Pickup}
          destinationPlaceholder={Constants.Strings.PlaceHolder.Destination}
          disabledSource={false}
          disabledDestination={false}
          source={source && source.name}
          destination={destination && destination.name}
          onPressSource={() => this.onChangeSource(Constants.AppConstants.UserLocation.Source)}
          onPressDestination={() => this.onChangeSource(Constants.AppConstants.UserLocation.Destination)}
          loading={false}
          renderInputBox={false}
          clearBox={this.clearLocation}
        />
      </View>
    );
  };
  renderStatus() {
    // let { selectedScheduleStatus } = this.state;
    let scheduleStatus = [
      {
        type: Constants.AppConstants.AdminScheduleFilter.Request,
        title: "Request"
      },
      {
        type: Constants.AppConstants.AdminScheduleFilter.Waiting,
        title: "Waiting"
      },
      {
        type: Constants.AppConstants.AdminScheduleFilter.Assigned,
        title: "Assigned"
      },
      {
        type: Constants.AppConstants.AdminScheduleFilter.Cancelled,
        title: "Cancelled"
      }
    ];

    return scheduleStatus.map((status, index) => {
      let isSelected = this.props.common.status.includes(status.type);
      return (
        <TouchableOpacity
          onPress={() => this.updateScheduleStatus(status.type)}
          key={index}
          style={{
            paddingHorizontal: moderateScale(25),
            paddingVertical: moderateScale(10),
            borderBottomColor: Constants.Colors.FilterBackground,
            borderBottomWidth: 1,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <Text
            style={[
              isSelected ? { ...Constants.Fonts.TitilliumWebSemiBold } : { ...Constants.Fonts.TitilliumWebRegular },
              {
                fontSize: moderateScale(17),
                color: isSelected ? Constants.Colors.Primary : Constants.Colors.gray
              }
            ]}
          >
            {status.title}
          </Text>
          <View
            style={{
              height: moderateScale(22),
              width: moderateScale(22),
              borderRadius: moderateScale(100),
              borderColor: isSelected ? Constants.Colors.Yellow : Constants.Colors.gray,
              borderWidth: 0.4,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: isSelected ? Constants.Colors.Yellow : Constants.Colors.Transparent
            }}
          >
            {isSelected ? (
              <Image
                source={Constants.Images.Common.Accept}
                style={{
                  height: moderateScale(12),
                  width: moderateScale(12)
                }}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </TouchableOpacity>
      );
    });
  }
  renderDateTime() {
    return (
      <View
        style={{
          paddingVertical: moderateScale(20),
          paddingHorizontal: moderateScale(20)
        }}
      >
        <TouchableOpacity
          onPress={() =>
            this.props.navigator.push({
              screen: "CalendarListing"
              // passProps: { scheduleAdmin: true }
            })
          }
          style={{
            justifyContent: "center",
            borderBottomWidth: 0.5,
            borderBottomColor: Constants.Colors.gray,
            paddingBottom: moderateScale(12),
            paddingTop: moderateScale(19)
          }}
          ref={ref => (this.dateTime = ref)}
        >
          <Text
            style={{
              ...Constants.Fonts.TitilliumWebRegular,
              fontSize: moderateScale(18),
              color: Constants.Colors.gray
            }}
          >
            {this.state.date ? this.state.date : "Date"}
          </Text>
          {this.props.common.startDate && this.props.common.endDate ? (
            <Text
              style={{
                ...Constants.Fonts.TitilliumWebSemiBold,
                fontSize: moderateScale(20),
                color: "#393B3B",
                fontWeight: "600"
              }}
            >
              {moment(this.props.common.startDate).format("D MMM")} -{" "}
              {moment(this.props.common.endDate).format("D MMM YYYY")}
            </Text>
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => this.setState({ timeModalVisible: true })}
          style={{
            justifyContent: "center",
            borderBottomWidth: 0.5,
            borderBottomColor: Constants.Colors.gray,
            paddingBottom: moderateScale(12),
            paddingTop: moderateScale(19)
          }}
          ref={ref => (this.dateTime = ref)}
        >
          <Text
            style={{
              ...Constants.Fonts.TitilliumWebRegular,
              // height: moderateScale(50),
              fontSize: moderateScale(18),
              color: Constants.Colors.gray,
              fontWeight: this.state.time ? "600" : null
            }}
          >
            {this.state.time ? this.state.time : "Time"}
          </Text>
          {this.props.common.startTime && this.props.common.endTime ? (
            <Text
              style={{
                ...Constants.Fonts.TitilliumWebSemiBold,
                fontSize: moderateScale(20),
                color: "#393B3B",
                fontWeight: "600"
              }}
            >
              {moment(this.props.common.startTime).format("hh:mm A")} -{" "}
              {moment(this.props.common.endTime).format("hh:mm A")}
            </Text>
          ) : null}
        </TouchableOpacity>
      </View>
    );
  }
  render() {
    let { filter } = this.state;
    let { loader, navigator } = this.props;
    return (
      <View style={Styles.container}>
        <Header hideDrawer navigator={navigator} title={"Filter"} color={Constants.Colors.Yellow} />
        <View Opacity style={[Styles.filterContainer, {}]}>
          <View
            style={{
              flex: 0.4,
              backgroundColor: "#FBF8F8",
              paddingBottom: moderateScale(20),
              borderRightWidth: 1,
              borderRightColor: Constants.Colors.FilterBackground
            }}
          >
            {this.renderFilters()}
          </View>
          <View
            style={{
              flex: 0.6,
              backgroundColor: Constants.Colors.White
            }}
          >
            {filter === "driver" ? (
              loader.driverListing ? (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  <ActivityIndicator color={Constants.Colors.Primary} size={"large"} />
                </View>
              ) : (
                this.renderDriver()
              )
            ) : filter === "passenger" ? (
              this.renderPassenger()
            ) : filter === "location" ? (
              this.renderLocation()
            ) : filter === "status" ? (
              this.renderStatus()
            ) : (
              this.renderDateTime()
            )}
          </View>
        </View>
        <View
          style={{
            flex: 0.1,
            justifyContent: "space-between",
            flexDirection: "row",
            borderColor: Constants.Colors.placehoder,
            position: "absolute",
            bottom: 0,
            zIndex: 99,
            shadowColor: "black",
            shadowOffset: {
              width: 2,
              height: 2
            },
            shadowRadius: 5,
            shadowOpacity: 0.2,
            elevation: 2
          }}
        >
          <AuthButton
            buttonStyle={Styles.buttonStyle}
            gradientStyle={Styles.gradientStyle}
            buttonName={"Clear"}
            gradientColors={["#FFFFFF", "#FFFFFF"]}
            textStyle={{
              color: Constants.Colors.Primary
            }}
            onPress={this.clearFilters}
            loading={this.props.loader && this.props.loader.changePasswordLoader}
          />
          <AuthButton
            buttonStyle={Styles.buttonStyle}
            gradientStyle={Styles.gradientStyle}
            gradientColors={["#F6CF65", "#F6CF65"]}
            buttonName={"Apply"}
            onPress={() => this.applyFilters()}
            textStyle={{
              color: "#fff"
            }}
            loading={this.props.loader && this.props.loader.changePasswordLoader}
          />
        </View>
        {/* <DatePicker
          ref={ref => (this.TimePicker = ref || "DatePicker")}
          date={this.state.dateTime}
          style={{ height: 0 }}
          mode="time"
          androidMode="calendar"
          confirmBtnText="Confirm"
          cancelBtnText="Cancel"
          onDateChange={time => {
            this.setState({ time: moment(time).format("LT") });
          }}
        /> */}

        <Modal visible={this.state.timeModalVisible} animationType="slide" onRequestClose={() => null} transparent>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end"
            }}
          >
            <TouchableOpacity onPress={() => this.setState({ timeModalVisible: false })} style={{ flex: 0.4 }} />
            <View style={{ backgroundColor: "#FFFFFF", flex: 0.6 }}>
              <View
                style={{
                  flex: 0.15,
                  justifyContent: "center",
                  paddingHorizontal: moderateScale(27)
                }}
              >
                <Text
                  style={{
                    ...Constants.Fonts.TitilliumWebSemiBold,
                    fontSize: moderateScale(19),
                    color: "#393B3B"
                  }}
                >
                  Choose time
                </Text>
              </View>
              <View
                style={{
                  flex: 0.18,
                  flexDirection: "row",
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  borderColor: "#D8D8D8"
                }}
              >
                <TouchableOpacity
                  onPress={() => this.setState({ selectedDateType: "start" })}
                  style={{
                    flex: 0.5,
                    borderRightWidth: 1,
                    borderColor: "#D8D8D8"
                  }}
                >
                  <View
                    style={{
                      flex: 0.95,
                      paddingLeft: moderateScale(27),
                      justifyContent: "center",
                      alignItems: "center"
                    }}
                  >
                    <Text style={[Styles.txtStyle, { color: "#A9AFAF" }]}>From</Text>
                    <Text style={Styles.txtStyle}>
                      {this.props.common.startTime != null
                        ? moment(this.props.common.startTime).format("hh : mm A")
                        : moment(new Date()).format("hh : mm A")}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 0.05,
                      backgroundColor: this.state.selectedDateType == "start" ? Constants.Colors.Yellow : "#FFFFFF"
                    }}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.setState({ selectedDateType: "end" })} style={{ flex: 0.5 }}>
                  <View
                    style={{
                      flex: 0.95,
                      paddingRight: moderateScale(27),
                      justifyContent: "center",
                      alignItems: "center"
                    }}
                  >
                    <Text style={[Styles.txtStyle, { color: "#A9AFAF" }]}>To</Text>
                    <Text style={Styles.txtStyle}>
                      {this.props.common.endTime != null
                        ? moment(this.props.common.endTime).format("hh : mm A")
                        : moment(new Date()).format("hh : mm A")}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 0.05,
                      backgroundColor: this.state.selectedDateType == "end" ? Constants.Colors.Yellow : "#FFFFFF"
                    }}
                  />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 0.67, alignItems: "center" }}>
                <DatePicker
                  date={this.state.defaultDate}
                  mode="time"
                  // minimumDate
                  // maximumDate
                  onDateChange={value => this.setDate(value)}
                />

                <TouchableOpacity
                  onPress={() => this.setState({ timeModalVisible: false })}
                  style={{
                    backgroundColor: Constants.Colors.Yellow,
                    height: moderateScale(38),
                    width: moderateScale(38),
                    borderRadius: 100,
                    position: "absolute",
                    right: moderateScale(28),
                    bottom: moderateScale(28),
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  <Image
                    source={Constants.Images.Common.Accept}
                    style={{
                      height: moderateScale(18),
                      width: moderateScale(18)
                    }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}

const Styles = StyleSheet.create({
  container: {
    backgroundColor: Constants.Colors.White,
    flex: 1
  },
  filterContainer: {
    flex: 1,
    backgroundColor: Constants.Colors.White,
    justifyContent: "flex-start",
    flexDirection: "row"
  },
  buttonStyle: {
    flex: 0.5
  },
  gradientStyle: {
    borderRadius: 0
  },
  txtStyle: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(18),
    color: "#393B3B"
  }
});

const mapDispatchToProps = dispatch => ({
  appActions: bindActionCreators(appActions, dispatch)
});

function mapStateToProps(state) {
  return {
    user: state.user,
    listing: state.listing,
    loader: state.loader,
    common: state.common
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Filters);
