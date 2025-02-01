/*
Name : Gurtej Singh
File Name : RideSelectPerson.js
Description : Contains the select no of Rider view.
Date : 12 oct 2018
*/
import React, { Component } from "react";
import { View, Image, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";

import * as appActions from "../../actions";
import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import { toastMessage } from "../../config/navigators";

class RideSelectPerson extends Component {
  constructor(props) {
    super(props);
    this.state = {
      person: this.props.riderLocation && this.props.riderLocation.person
    };
  }
  static navigatorStyle = {
    navBarHidden: true,
    screenBackgroundColor: "transparent",
    modalPresentationStyle: "overFullScreen"
  };
  onPersonUpdate = _.debounce(() => {
    let { person } = this.state;
    if (_.isEmpty(person)) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: Constants.Strings.Common.MinPersonRide
      });
      return;
    }
    if (Number(person) > 20 || Number(person) < 1) {
      toastMessage(this.props.navigator, {
        type: Constants.AppConstants.Notificaitons.Error,
        message: Constants.Strings.Common.MaxPersonRide
      });
      return;
    }
    this.props.appActions.updateRiders(person, this.props.navigator);
  });
  render() {
    let { person } = this.state;
    return (
      <KeyboardAwareScrollView>
        <View style={Styles.container}>
          <View style={Styles.modalView}>
            <View style={{ flex: 0.3, paddingVertical: moderateScale(10) }}>
              <Text style={Styles.modalTitle}>Number of persons</Text>
            </View>
            <View style={{ flex: 0.3, flexDirection: "row", justifyContent: "space-evenly", alignItems: "flex-end" }}>
              <TextInput
                defaultValue={"1"}
                value={person}
                placeholder={"Enter No of Riders"}
                style={Styles.textInput}
                onChangeText={person => this.setState({ person })}
                keyboardType="numeric"
                maxLength={2}
                numberOfLines={1}
              />
              <TouchableOpacity style={Styles.PickerBtn} onPress={() => this.onPersonUpdate()}>
                <Image source={Constants.Images.Common.Accept} resizeMode={"contain"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    );
  }
}
const mapDispatchToProps = dispatch => ({
  appActions: bindActionCreators(appActions, dispatch)
});
function mapStateToProps(state) {
  return {
    riderLocation: state.riderLocation
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RideSelectPerson);

const Styles = StyleSheet.create({
  container: {
    height: Constants.BaseStyle.DEVICE_HEIGHT,
    backgroundColor: Constants.Colors.transparent,
    justifyContent: "flex-end"
  },
  modalView: {
    backgroundColor: "#fff",
    flex: 0.2,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    flexDirection: "column",
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(10),
    shadowColor: "black",
    shadowOffset: { width: 4, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 2
  },
  PickerBtn: {
    height: moderateScale(40),
    width: moderateScale(40),
    borderRadius: moderateScale(100),
    backgroundColor: Constants.Colors.Yellow,
    justifyContent: "center",
    alignItems: "center"
  },
  modalTitle: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(19),
    color: Constants.Colors.Primary,
    paddingHorizontal: moderateScale(20)
  },
  textInput: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(20),
    color: Constants.Colors.Primary,
    flex: 1,
    borderBottomWidth: 0.3,
    borderColor: Constants.Colors.placehoder,
    marginHorizontal: moderateScale(20),
    paddingVertical: moderateScale(5)
  }
});
