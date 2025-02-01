/*
Name : Ganesh Singh
File Name : SendMessages.js
Description : Contains the Admin can send/update messages
Date : 18 Apr 2019
*/
import React, { Component } from "react";
import { View, StyleSheet, TouchableOpacity, Text, FlatList, Image, TextInput, ActivityIndicator } from "react-native";
import { connect } from "react-redux";
import _ from "lodash";
import Constants from "../../constants";
import CountryPickerModal from "../../components/common/CountryPicker";
import FloatingInput from "../../components/common/FloatingInput";
import Header from "../../components/common/Header";
import { RF } from "../../helpers/ResponsiveFonts";
import { handleDeepLink } from "../../config/navigators";
import Regex from "../../helpers/Regex";
import { getPreviousMessage, sendMessage, saveMessage } from "../../actions";

import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// let flag = true;
class SendMessages extends Component {
  constructor(props) {
    super(props);
    this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
    this.state = {
      phoneNo: "",
      isdCode: "1",
      countryCode: "US",
      country: "United States",
      contacts: [],
      message: "",
      keyboardScrol: false,
      flatHeight: 0
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };
  async componentDidMount() {
    const { getPreviousMessage, navigator } = this.props;
    await getPreviousMessage(navigator);
    const { currentMessage = {} } = this.props;
    this.setState({ message: currentMessage.message ? currentMessage.message : "" });
  }

  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 500);

  async addMobile() {
    let { contacts = [], phoneNo = "", isdCode = "", flatHeight = RF(7) } = this.state;
    const contact = `+${isdCode}${phoneNo}`;

    if (contacts.map(_ => _.contact).indexOf(contact) < 0) {
      await this.setState({ flatHeight: contacts.length % 2 !== 1 ? flatHeight + RF(7) : flatHeight });
      contacts = [...contacts, { isdCode, phoneNo, contact }];
    }
    this.setState(
      { contacts, isdCode: "1", phoneNo: "", countryCode: "US", country: "United States", keyboardScrol: true },
      () => {
        if (this.scrollRed) this.scrollRed.scrollToEnd();
      }
    );
  }

  removeContact(item) {
    let { contacts = [], flatHeight = RF(7) } = this.state;
    this.setState({ contacts: contacts.filter(contact => contact.contact !== item) }, () =>
      this.setState({ flatHeight: flatHeight ? (contacts.length % 2 === 1 ? flatHeight - RF(7) : flatHeight) : 0 })
    );
  }

  renderContactsList = ({ item }) => {
    return (
      <View style={Styles.renderContactsListContainer}>
        <View style={{ justifyContent: "center" }}>
          <TouchableOpacity onPress={() => this.removeContact(item)} style={Styles.crossImage}>
            <Image
              source={Constants.Images.Common.Cancel}
              style={{
                height: RF(2),
                width: RF(2)
              }}
            />
          </TouchableOpacity>
        </View>
        <View style={{ justifyContent: "center", marginLeft: RF(0.8) }}>
          <Text style={Styles.badgeText}>{item}</Text>
        </View>
      </View>
    );
  };
  renderContacts(contacts = []) {
    return (
      <View style={{ height: this.state.flatHeight, backgroundColor: "#FFF" }}>
        <FlatList
          scrollEnabled={false}
          contentContainerStyle={Styles.flatListContainer}
          numColumns={2}
          ref={ref => (this.flatlist = ref)}
          keyExtractor={item => item}
          data={contacts.map(_ => _.contact)}
          renderItem={this.renderContactsList}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  renderMobile() {
    return (
      <View style={Styles.renderMobileContainer}>
        <View style={Styles.mobileNumber}>
          <TouchableOpacity
            onPress={() => {
              this.callingCode && this.callingCode.openModal();
            }}
          >
            <CountryPickerModal
              innerref={ref => (this.callingCode = ref)}
              disabled={false}
              onChange={value => {
                this.setState({
                  countryCode: value.cca2,
                  country: value.name,
                  isdCode: value.callingCode
                });
              }}
              filterable={true}
              closeable={true}
              isdCode={this.state.isdCode}
              cca2={this.state.countryCode}
              animationType={"fade"}
              translation="eng"
            />
          </TouchableOpacity>
          <View style={{ flex: 0.02 }} />
          <View style={{ flex: 0.73 }}>
            <FloatingInput
              label={"Mobile Number"}
              onChangeText={phoneNo => {
                this.setState({ phoneNo });
              }}
              autoCapitalize={"none"}
              value={this.state.phoneNo}
              returnKeyType={"next"}
              keyboardType={"numeric"}
              maxLength={10}
              isBlack={true}
            />
          </View>
          <View style={{ flex: 0.1 }}>
            {this.state.phoneNo && Regex.validateMobile(this.state.phoneNo) ? (
              <TouchableOpacity onPress={() => this.addMobile()} style={Styles.roundButton}>
                <Image resizeMode={"contain"} source={Constants.Images.Common.Accept} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  saveMessage() {
    const { saveMessage, navigator, currentMessage } = this.props;
    const { message } = this.state;
    saveMessage(navigator, { ...currentMessage, message });
  }

  sendMessage() {
    const { navigator, sendMessage } = this.props;
    const { message, contacts } = this.state;
    sendMessage(navigator, { message, itemRows: contacts });
  }
  cancleMessage() {
    const { currentMessage = {} } = this.props;
    this.setState({ message: currentMessage.message });
  }

  render() {
    let { contacts = [], message = "" } = this.state;
    const { loader, currentMessage, navigator } = this.props;
    return (
      <View style={Styles.container}>
        <Header navigator={navigator} title={"Send Messages"} />
        {this.renderMobile()}
        <KeyboardAwareScrollView ref={ref => (this.scrollRed = ref)} scrollEnabled={this.state.keyboardScrol}>
          {this.renderContacts(contacts)}
          <View style={{ height: RF(2) }} />
          <View style-={{ height: RF(30) }}>
            <View style={Styles.textViewContainer}>
              <View style={Styles.textView}>
                <TextInput
                  placeholder={Constants.Strings.PlaceHolder.EnterMessage}
                  style={{ flex: 1, justifyContent: "flex-start" }}
                  numberOfLines={4}
                  onChangeText={message => this.setState({ message })}
                  onFocus={() => this.setState({ keyboardScrol: true })}
                  onBlur={() => this.setState({ keyboardScrol: false })}
                  onSubmitEditing={() => this.setState({ keyboardScrol: false })}
                  value={this.state.message}
                />
                {/* </View> */}

                {message && message !== currentMessage.message ? (
                  <TouchableOpacity
                    onPress={() => this.cancleMessage()}
                    style={{ ...Styles.roundButton, marginTop: RF(6), backgroundColor: "#828282" }}
                  >
                    {loader.saveMessage ? (
                      <ActivityIndicator size={"small"} />
                    ) : (
                      <Image resizeMode={"contain"} source={Constants.Images.Common.Cancel} />
                    )}
                  </TouchableOpacity>
                ) : null}
                {message && message !== currentMessage.message ? (
                  <TouchableOpacity
                    onPress={() => this.saveMessage()}
                    style={{ ...Styles.roundButton, marginTop: RF(6), marginLeft: RF(1) }}
                  >
                    {loader.saveMessage ? (
                      <ActivityIndicator size={"small"} />
                    ) : (
                      <Image resizeMode={"contain"} source={Constants.Images.Common.Accept} />
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <View style={Styles.sendButtonContainer}>
              {contacts.length > 0 ? (
                <TouchableOpacity
                  disabled={loader.sendMessage}
                  onPress={() => this.sendMessage()}
                  style={{
                    ...Styles.sendButton,
                    marginRight: RF(2),
                    backgroundColor: loader.sendMessage ? "#ffdf89" : "#F6CF65"
                  }}
                >
                  {loader.sendMessage ? (
                    <ActivityIndicator size={"small"} />
                  ) : (
                    <Text style={Styles.sendText}>Send</Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <View style={{ height: RF(3) }} />
        </KeyboardAwareScrollView>
      </View>
    );
  }
}
const mapDispatchToProps = dispatch => ({
  getPreviousMessage: navigator => dispatch(getPreviousMessage(navigator)),
  sendMessage: (navigator, obj) => dispatch(sendMessage(navigator, obj)),
  saveMessage: (navigator, obj) => dispatch(saveMessage(navigator, obj))
});
const mapStateToProps = ({ user, loader, listing, admin }) => {
  return {
    user,
    loader,
    listing,
    currentMessage: admin.currentMessage
  };
};
const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF"
  },
  mobileNumber: {
    marginTop: RF(2),
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between"
  },
  sendText: { color: "#FFF", fontSize: RF(2.5), ...Constants.Fonts.TitilliumWebSemiBold },
  sendButton: {
    alignItems: "center",
    justifyContent: "center",
    height: RF(5),
    width: RF(8),
    borderRadius: RF(0.8)
  },
  roundButton: {
    alignItems: "center",
    justifyContent: "center",
    height: RF(5),
    width: RF(5),
    borderRadius: RF(10),
    backgroundColor: "#F6CF65",
    marginTop: RF(3)
  },
  crossImage: {
    height: RF(3),
    width: RF(3),
    borderRadius: RF(15),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ff5151"
  },
  textViewContainer: { height: RF(15), alignItems: "center", justifyContent: "center" },
  textView: {
    flexDirection: "row",
    width: "90%",
    flex: 1,
    borderBottomColor: "grey",
    borderBottomWidth: 0.5
  },
  sendButtonContainer: { height: RF(10), justifyContent: "center", alignItems: "flex-end" },
  renderMobileContainer: { flex: 0.2, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF" },
  flatListContainer: { justifyContent: "center", paddingHorizontal: RF(1), backgroundColor: "#FFF" },
  renderContactsListContainer: {
    height: RF(5),
    borderRadius: 30,
    backgroundColor: "#e5e5e5",
    flexDirection: "row",
    paddingHorizontal: RF(0.8),
    margin: RF(1)
  },
  badgeText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: RF(2)
  }
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SendMessages);
