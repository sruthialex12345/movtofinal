/*
File Name : PrivacyPolicy.js
Description : Contains the rate us screen
Date :26 Nov 2018
*/
import React, { Component } from "react";
import { View, ActivityIndicator } from "react-native";
//Guru - 12/29/2019 - Fix for 0.61.5 Upgrade
import { WebView } from 'react-native-webview';

import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import Styles from "../styles/container/RiderRating";
import Header from "../components/common/Header";
import * as appActions from "../actions";
import { handleDeepLink } from "../config/navigators";
import Connection from "../config/Connection";
class CMSPage extends Component {
  constructor(props) {
    super(props);
    this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
    this.state = {
      html: ""
    };
  }

  static navigatorStyle = {
    navBarHidden: true
  };

  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 500);

  ActivityIndicatorLoadingView() {
    return <ActivityIndicator color="#F6CF65" size="large" style={Styles.ActivityIndicatorStyle} />;
  }

  render() {
    let { PageName, hideDrawer, uri } = this.props;
    let Link = Connection.getCmsUrl() + "/mobile-pages/" + uri;
    return (
      <View style={Styles.mainView}>
        <KeyboardAwareScrollView style={Styles.container} scrollEnabled={false}>
          <Header hideDrawer={hideDrawer} navigator={this.props.navigator} title={PageName} />
          <View style={Styles.keyboardScroll}>
            <View style={{ flex: 1 }}>
              <WebView
                style={Styles.WebViewStyle}
                originWhitelist={["*"]}
                source={{ uri: Link, baseUrl: "" }}
                javaScriptEnabled={true}
                renderLoading={this.ActivityIndicatorLoadingView}
                startInLoadingState={true}
                allowsInlineMediaPlayback={true}
              />
            </View>
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
    loader: state.loader
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CMSPage);
