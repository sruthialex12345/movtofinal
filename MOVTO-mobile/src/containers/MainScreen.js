/*
Name : Gurtej Singh
File Name : MainScreen.js
Description : Contains the main page of the app wich contains driver and customer
Date : 6 Sept 2018
*/

import React, { Component } from "react";
import { View, Text, Image } from "react-native";
import { connect } from "react-redux";
import _ from "lodash";
import Styles from "../styles/container/mainScreen";
import GradientImage from "../components/common/GradientImage";
import Constants from "../constants";
import { toastMessage } from "../config/navigators";
// import * as appActions from "../actions";

class MainScreen extends Component {
  constructor(props) {
    super(props);
    this.pushTo = this.pushTo.bind(this);
  }

  static navigatorStyle = {
    navBarHidden: true
  };
  /*
    pushed to next Screen bvased on condition
    */
  pushTo = _.debounce(value => {
    if (value == "Customer") {
      this.props.navigator.push({
        screen: "LoginScreen",
        passProps: { userType: "rider" }
      });
    } else if (value == "Driver") {
      this.props.navigator.push({
        screen: "SignupScreenStep1",
        passProps: { userType: "driver" }
      });
    } else if (value == "Admin") {
      toastMessage(this.props.navigator, { type: 1, message: "Error goes here!" });
    }
  }, 500);

  render() {
    return (
      <View style={Styles.mainScreenContainer}>
        <View style={Styles.header} />
        <View style={Styles.logoSectionContainer}>
          <View style={Styles.logo}>
            <Image source={Constants.Images.Common.Logo} />
          </View>
          <Text style={Styles.logoText}>Welcome to cidr</Text>
        </View>
        <View style={Styles.gradientSectionContainer}>
          <GradientImage
            image={Constants.Images.Common.Rider}
            text={"Login in as rider"}
            onPress={() => this.pushTo("Customer")}
          />
          <GradientImage
            image={Constants.Images.Common.Driver}
            text={"Login in as driver"}
            onPress={() => this.pushTo("Driver")}
          />
          <GradientImage
            image={Constants.Images.Common.Admin}
            text={"Login in as admin"}
            onPress={() => this.pushTo("Admin")}
          />
        </View>
        <View style={Styles.lowerSection}>
          <Image source={Constants.Images.Common.Background} resizeMode={"contain"} />
        </View>
      </View>
    );
  }
}
export default connect(
  null,
  null
)(MainScreen);
