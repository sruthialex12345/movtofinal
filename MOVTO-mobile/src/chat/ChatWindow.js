import React, { Component } from "react";
import { View, Image } from "react-native";
import { GiftedChat, Send, Bubble, Time } from "react-native-gifted-chat";
import { connect } from "react-redux";
import _ from "lodash";
import { bindActionCreators } from "redux";
import * as appActions from "../actions";
import Header from "../components/common/Header";
import Constants from "../constants";
import LocationInput from "../components/common/LocationInput";
import { moderateScale } from "../helpers/ResponsiveFonts";
import Fire from './Fire';
import { handleDeepLink } from "../config/navigators";

var ref;
var messageRef;

class ChatWindow extends Component<Props> {

  constructor(props) {
    super(props);
    Fire.shared = new Fire(props);
    this.state = {
      messages: [],
      loadEarlier: false,
      isLoadingEarlier: false,
      onReciveMessage:[],
      transportId: props.crtransportId,
      selectId: props.crselectId,
      selectName: props.crselectName,
      selectType: props.crselectType,
      profileUrl: props.crprofileUrl,
      callingScreen: props.callingScreen
    };
    ref = Fire.shared.adminChatRef();
    messageRef = Fire.shared.adminmessageRef(ref);
    this.initAttributes(ref);
  }

  initAttributes(ref) {
    //Check if the attribute is present
    let { user } = this.props;
      var rootRef  = ref.child("name");
      rootRef.once("value", snap => {
        if(!snap.exists()){
           ref.update({
                "name" : this.state.selectName,
                "type" : this.state.selectType,
                "profileImage" : this.state.profileUrl,
                "unReadMessages" : 0,
                "messageReadFlag" : true
            });
        }
      });
    }

      static navigatorStyle = {
        navBarHidden: true
      };

    addMessageToChatNode(messageJson){
        var msgDate = new Date(messageJson.createdAt);
        var hours = msgDate.getHours();
        var minutes = msgDate.getMinutes();
        // Check whether AM or PM
        var newformat = hours >= 12 ? 'PM' : 'AM';
        // Find current hour in AM-PM Format
        hours = hours % 12;
        // To display "0" as "12"
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var msgTime = hours + ':' + minutes + ' ' + newformat;
        //Increment unReadMessage counter
       var msgCountRef  = ref.child("unReadMessages");
       var unreadMsgItems = 0;
       msgCountRef.once("value", snapd => {
            //console.log("In msgCountRef: ", snapd.val());
            unreadMsgItems = snapd.val();
            unreadMsgItems = unreadMsgItems+1;
            //console.log("unReadMessages count: ", unreadMsgItems);
            ref.update({
                    "profileImage" :  messageJson.user.profileUrl,
                    "lastMessageText" : messageJson.text,
                    "lastMessageTime" : msgTime,
                    "lastMessageDate" : messageJson.createdAt,
                    "unReadMessages"  : unreadMsgItems,
                    "messageReadFlag" : false
            });
        });
    }

    /*
    *   Update Read Receipt
    */
   updateReadReceipt() {
        ref.update({
                "messageReadFlag" : true,
                "unReadMessages" : 0
        });
    }
    onNavigationEvent = _.debounce(event => {
        handleDeepLink(event, this.props.navigator);
      }, 500);


      componentDidMount = () => {
        this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
        this.onReceivedMessage(messageRef);
      };

      componentWillUnmount() {
        Fire.shared.off(messageRef);
        //Update Read Receipt if user is Transport admin
        if(this.state.transportId == this.props.user._id){
            console.log("In Update Receipt");
            this.updateReadReceipt();
        }
      };

      onSend = (messages = []) => {
        let { user } = this.props;
        var d = new Date();
        var timeInMillis = d.getTime();
        //console.log("timeInMillis" + timeInMillis);
        let messageJson = {
          _id: messages[0]._id,
          text: messages[0].text,
          createdAt: timeInMillis,
          user: user
        };
        messageRef.push(messageJson);
        //Add the last message and timestamp to the root node for the chat participant
        if(this.state.selectId == messageJson.user._id) {
            //console.log("In addMessageToChatNode");
            this.addMessageToChatNode(messageJson);
         }
      }

      onReceivedMessage = (messageRef)  => {
        let { user } = this.props;
        let message = messageRef.limitToLast(20);
          message.on("value", (snapshot) => {
            var messages = [];
            snapshot.forEach((child) => {
             //console.log("Last 20 Message List: " , child.key, child.val());
             //if(child.val().user._id == global.selectId || child.val().user.receiveName == global.selectname){
                   messages.push(child.val());
              //}
            });
              this.setState({
                  messages: messages.reverse(),
                  loadEarlier: false,
                  isLoadingEarlier: false
              });
        });
    }

    /* Not used for now, We are going with on real time firebase on event(onReceivedMessage) and filtering the last 20 messages every time.
    onLoadEarlier= (messageRef)  => {
        var messages = [];
        let { user } = this.props;
        let message = messageRef.limitToLast(20);
          message.once("value", (snapshot) => {
            snapshot.forEach((child) => {
             console.log("Message Received 20: " , child.key, child.val());
             //if(child.val().user._id == global.selectId || child.val().user.receiveName == global.selectname){
                   messages.push(child.val());
              //}
            });
          this.setState(previousState => ({
              messages: GiftedChat.append(previousState.messages, messages.reverse()),
              loadEarlier: false,
              isLoadingEarlier: false
          }));
        });
    }*/

    /** render the chat bubble */
        renderBubble(props) {
            return (
                <Bubble
                    {...props}
                    wrapperStyle={{
                        left: {
                            backgroundColor: '#ebebeb',
                        },
                        right: {
                            backgroundColor: '#b8b8b8',
                        }
                    }}
                    textStyle={{
                        right: {
                            color: Constants.Colors.Black,
                            fontFamily: 'Times New Roman',
                            fontSize: 14
                        },
                        left: {
                            color: Constants.Colors.Black,
                            fontFamily: 'Times New Roman',
                            fontSize: 14
                        }
                    }}
                    timeTextStyle={{
                        left: { color: 'black' },
                        right: { color:'black'}
                        }}
                />
            );
        }


      renderSend = sendProps => {
        if (sendProps.text.trim().length > 0) {
          return (
            <Send {...sendProps}>
              <View
                style={{
                  backgroundColor: Constants.Colors.Yellow,
                  height: moderateScale(35),
                  width: moderateScale(35),
                  alignSelf: "center",
                  padding: moderateScale(10),
                  borderRadius: moderateScale(100),
                  justifyContent: "center",
                  alignItems: "center",
                  bottom: moderateScale(3)
                }}
                >
                <Image source={Constants.Images.Common.Accept} resizeMode={"contain"} />
              </View>
            </Send>
          );
        }
        return null;
      };

      render() {
        return (
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          {(this.state.callingScreen == 'SideMenu')?
            <Header navigator={this.props.navigator} title={"Chat with Admin"} />
            :
            <Header
                color={Constants.Colors.Yellow}
                navigator={this.props.navigator}
                title={"Chat with Admin"}
                onBackPress={this.onBackPress}
                hideDrawer
            />}
            {/* <ScrollView
              scrollEnabled={true}
              style={{flex:0.5,borderColor:'red',borderWidth:1,width:Constants.BaseStyle.DEVICE_WIDTH }}
            > */}
            <GiftedChat
              minInputToolbarHeight={80}
              messages={this.state.messages}
              keyboardShouldPersistTaps={"always"}
              // renderMessage = {this.onReceivedMessage}
               renderBubble={this.renderBubble.bind(this)}
              onSend={this.onSend.bind(this)}
              user= {this.props.user}
              loadEarlier={this.state.loadEarlier}
              isLoadingEarlier={this.state.isLoadingEarlier}
              alwaysShowSend={true}
              renderSend={this.renderSend}
              showUserAvatar={true}
              showAvatarForEveryMessage={true}
            />
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
             loader: state.loader
           };
     }

export default connect(
  mapStateToProps
)(ChatWindow);