/*
Name : Gurtej Singh
File Name : Filters.js
Description : Contains the Filters
Date : 23 Nov 2018
*/
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
//Guru - 01/09/2020 Updated for RN0.61.5 Upgrade
import { CalendarList } from "react-native-calendars";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Constants from "../../constants";
import Header from "../../components/common/Header";
import moment from "moment";
import * as appActions from "../../actions";
import AuthButton from "../../components/common/AuthButton";

import { moderateScale } from "../../helpers/ResponsiveFonts";

class CalendarListing extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedDriverIndex: null,
      startDate: null,
      endDate: null
    };
  }

  static navigatorStyle = {
    navBarHidden: true
  };
  componentDidMount() {
    this.props.navigator.setDrawerEnabled({
      side: "left",
      enabled: false
    });
  }

  componentWillUnmount = () => {
    this.props.navigator.setDrawerEnabled({
      side: "left",
      enabled: true
    });
  };

  applyFilters = () => {
    this.props.appActions.setFilterStartDate(new Date(this.state.startDate).toISOString());
    this.props.appActions.setFilterEndDate(new Date(this.state.endDate).toISOString());
    this.props.navigator.pop();
  };

  markedDates = () => {
    let markedDates = {};
    if (this.state.startDate == this.state.endDate) {
      markedDates[moment(this.state.startDate).format("YYYY-MM-DD")] = {
        startingDay: true,
        color: "#858B8B",
        endingDay: true,
        selected: true
      };
    } else {
      markedDates[moment(this.state.startDate).format("YYYY-MM-DD")] = {
        startingDay: true,
        color: "#858B8B",
        selected: true
      };
      // moment().add(15,'days').format('DD-MM-YYYY')
      let step = 1;
      if (this.state.endDate && this.state.endDate >= this.state.startDate) {
        let loopCount = moment(this.state.endDate).diff(this.state.startDate, "days", true);

        for (step = 1; step < loopCount; step++) {
          markedDates[
            moment(this.state.startDate)
              .add(step, "days")
              .format("YYYY-MM-DD")
          ] = {
            selected: true,
            color: "#858B8B"
          };
        }
      }

      markedDates[moment(this.state.endDate).format("YYYY-MM-DD")] = {
        selected: true,
        endingDay: true,
        color: "#858B8B"
      };
    }

    return markedDates;
  };

  render() {
    // let { filter } = this.state;
    let { navigator } = this.props;
    return (
      <View style={Styles.container}>
        <Header
          hideDrawer
          navigator={navigator}
          title={"Select date"}
          color={Constants.Colors.Yellow}
          //   this.props.closeCalendarModal()
        />
        <View style={{ flex: 1, backgroundColor: "lightblue" }}>
          <CalendarList
            // onVisibleMonthsChange={months => {null
            // }}
            pastScrollRange={50}
            calendarHeight={moderateScale(360)}
            futureScrollRange={50}
            scrollEnabled={true}
            onDayPress={day =>
              this.state.startDate && this.state.endDate
                ? this.setState({ startDate: day.dateString, endDate: null })
                : this.state.startDate
                  ? day.dateString < this.state.startDate
                    ? this.setState({ startDate: day.dateString })
                    : this.setState({ endDate: day.dateString })
                  : this.setState({ startDate: day.dateString })
            }
            showScrollIndicator={true}
            minDate={"11/09/2018"}
            maxDate={"11/09/2020"}
            // displayLoadingIndicatorF
            theme={{
              backgroundColor: "#ffffff",
              calendarBackground: "#ffffff",
              selectedDayTextColor: "#ffffff",
              todayTextColor: Constants.Colors.Yellow,
              textDisabledColor: "#d9e1e8",
              monthTextColor: "black",
              textDayFontFamily: "TitilliumWeb-Regular",
              textMonthFontFamily: "TitilliumWeb-Regular",
              textDayHeaderFontFamily: "TitilliumWeb-Regular",
              textDayFontSize: moderateScale(18),
              textMonthFontSize: moderateScale(18),
              textDayHeaderFontSize: moderateScale(14)
            }}
            markedDates={this.markedDates()}
            markingType="period"
          />
        </View>

        <View style={Styles.wraper}>
          <AuthButton
            buttonStyle={Styles.buttonStyle}
            gradientStyle={Styles.gradientStyle}
            buttonName={"Cancel"}
            gradientColors={["#FFFFFF", "#FFFFFF"]}
            textStyle={{ color: Constants.Colors.Primary }}
            onPress={() => navigator.pop()}
          />
          <AuthButton
            buttonStyle={Styles.buttonStyle}
            gradientStyle={Styles.gradientStyle}
            gradientColors={["#F6CF65", "#F6CF65"]}
            buttonName={"Apply"}
            textStyle={{ color: "#fff" }}
            onPress={() => this.applyFilters()}
          />
        </View>
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
    backgroundColor: Constants.Colors.White
  },
  srcView: {
    flex: 0.5,
    flexDirection: "row",
    alignItems: "center"
  },
  buttonStyle: {
    flex: 0.5
  },
  gradientStyle: {
    borderRadius: 0
  },
  srcText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.Primary,
    paddingVertical: moderateScale(3)
  },
  driverName: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(19),
    color: Constants.Colors.Primary
  },
  destText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.gray,
    paddingVertical: moderateScale(3),
    paddingHorizontal: moderateScale(8)
  },
  wraper: {
    flex: 0.1,
    justifyContent: "space-between",
    flexDirection: "row",
    position: "absolute",
    bottom: 0,
    zIndex: 999,
    shadowColor: "black",
    shadowOffset: {
      width: 2,
      height: 2
    },
    shadowRadius: 5,
    shadowOpacity: 0.2,
    elevation: 2,
    // borderWidth: 0.4,
    borderColor: Constants.Colors.placehoder
  }
});

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
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CalendarListing);
