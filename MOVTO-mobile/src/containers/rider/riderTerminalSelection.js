/*
Name : Gurtej Singh
File Name : RiderTerminal.js
Description : Contains the RiderTerminal screen
Date : 28 Sept 2018
*/
/* eslint-disable */
import React, { Component } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import Constants from "../../constants";
import Styles from "../../styles/container/riderTerminal";
import Header from "../../components/common/Header";
import * as appActions from "../../actions";
import LocationInput from "../../components/common/LocationInput";
class RiderTerminal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      region: null,
      lastLat: null,
      lastLong: null,
      source: "",
      destination: ""
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };

  componentDidMount() {
    let { navigator, admin, sourceAdmin } = this.props;
    let { locationType } = this.props.riderLocation;
    if (locationType == Constants.AppConstants.UserLocation.Source) {
      this.props.appActions.getRiderPickupPoints("", navigator, admin);
    } else {
      this.props.appActions.getRiderDropupPoints("", navigator, admin, sourceAdmin);
    }
  }
  componentWillUnmount() {
    this.props.appActions.resetTerminals();
  }
  onSelectTerminal = _.debounce(terminal => {
    let { admin, appActions, navigator, onSelectTerminal } = this.props;
    if (admin) {
      onSelectTerminal(terminal);
      navigator.pop();
    } else {
      appActions.setRiderLocation(terminal, navigator);
    }
  });

  onChangeSource = _.debounce(source => {
    let { navigator } = this.props;
    this.setState({ source }, () => {
      this.props.appActions.getRiderPickupPoints(source, navigator);
    });
  });

  onChangeDestination = _.debounce(destination => {
    let { navigator, riderLocation } = this.props;
    // let {source}=riderLocation;

    // let sourceLatLong={latitude:source.loc[1],longitude:source.loc[0]};
    // let destinationLatLong={latitude:destination.loc[1],longitude:source.loc[0]};
    // alert("ererer");
    // console.log(sourceLatLong,destinationLatLong,"----------------------->");
    this.setState({ destination }, () => {
      this.props.appActions.getRiderDropupPoints(destination, navigator);
    });
  });

  render() {
    let { terminals, source, destination, locationType } = this.props.riderLocation;
    let { terminalLoder } = this.props.loader;
    return (
      <View style={Styles.mainView}>
        <KeyboardAwareScrollView style={Styles.container} scrollEnabled={false}>
          <Header hideDrawer color={Constants.Colors.transparent} navigator={this.props.navigator} />
          <View style={Styles.keyboardScroll}>
            <View style={Styles.wrapper}>
              <LocationInput
                sourcePlaceholder={Constants.Strings.PlaceHolder.Pickup}
                destinationPlaceholder={Constants.Strings.PlaceHolder.Destination}
                onSelectTerminal={this.onSelectTerminal}
                terminal={terminals}
                source={source && source.name}
                destination={destination && destination.name}
                loading={terminalLoder}
                disabledSource={true}
                disabledDestination={true}
                style={{ marginHorizontal: 0 }}
                renderInputBox={true}
                onChangeSource={this.onChangeSource}
                onChangeDestination={this.onChangeDestination}
                hideDestination={locationType !== Constants.AppConstants.UserLocation.Destination ? true : false}
                hideSource={locationType !== Constants.AppConstants.UserLocation.Source ? true : false}
              />
            </View>
            <View style={{ flex: 0.6 }} />
          </View>
        </KeyboardAwareScrollView>
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
    riderLocation: state.riderLocation,
    loader: state.loader
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RiderTerminal);

{
  /* */
}
