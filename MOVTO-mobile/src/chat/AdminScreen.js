import React, { Component } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl, Image, TouchableOpacity } from 'react-native';
import Header from "../components/common/Header";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import _ from "lodash";
import * as appActions from "../actions";
import { handleDeepLink } from "../config/navigators";
import { moderateScale } from "../helpers/ResponsiveFonts";
import Constants from "../constants";
import IconBadge from 'react-native-icon-badge';
import Fire from './Fire';

var ref;

class AdminScreen extends Component {
    constructor(props) {
        super(props);
        Fire.shared = new Fire(props);
        this.state = {
            isRefreshing: false,
            messagelist: [],
            selectedId : '',
            transportId : '',
            archiveDays: Constants.DevKeys.firebase.messageArchiveDays,
        };
        ref = Fire.shared.chatRef();
        this.loadChatParticipants();
    }

    static navigatorStyle = {
        navBarHidden: true
    };

      onNavigationEvent = _.debounce(event => {
        handleDeepLink(event, this.props.navigator);
      }, 500);

      componentDidMount = () => {
        this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
        //this.cleanup(this.state.messagelist);
      };


      componentWillUnmount() {
        Fire.shared.off(ref);
      }

       //Clean up all messages older than configured Archive days from all chat rooms for this transport admin
      cleanup= (chatRooms) => {
            //configured days back in millis
            console.log("ChatRooms: ", chatRooms);
            var newDate = Date.now() - this.state.archiveDays*24*3600*1000;
            chatRooms.forEach(chatRoom => {
                 console.log("ChatRoom: ", chatRoom);
                 var adminChatRef = ref.child(chatRoom.transportId + '-'+ chatRoom._id);
                 var lastMsgDateRef = adminChatRef.child("lastMessageDate");
                 lastMsgDateRef.once("value", snapm => {
                 if(snapm.exists()) {
                 var lastmessageDate = snapm.val();
                 console.log("lastMessageDate: ", lastmessageDate);
                 console.log("newDate: ", newDate);
                 if(lastmessageDate <= newDate){
                 //Update the last message details
                    adminChatRef.update({
                            "lastMessageText" : null,
                            "lastMessageTime" : null,
                            "lastMessageDate" : null,
                            "unReadMessages"  : 0,
                            "messageReadFlag" : false,
                            "messages" : null
                    });
                    /*var adminMessageRef = adminChatRef.child('messages');
                     adminMessageRef.on("value", (snapshot) => {
                        var updates = {};
                        snapshot.forEach((child) => {
                                //console.log("Snapshot child: " , child.key, child.val());
                                //if(child.val().createdAt <= newDate){
                                        console.log("Removed message: ", child.val().text , " from ", "Chat Room : ", chatRoom.transportId + '-'+ chatRoom._id);
                                        updates[child.key] = null;
                                //}
                            });
                        adminMessageRef.update(updates);
                    });*/
                }
              }
              });
            });
        }

      loadChatParticipants = () => {
        let { user } = this.props;
        ref.on("value", snap => {
            //console.log("snapshot: ", snap);
            var messages = [];
            snap.forEach(child => {
                console.log("firebase: ", child.key, child.val());
                var jsonValString =  child.val();
                var participantName =  jsonValString.name;
                var participantType =  jsonValString.type;
                var lastMessageTime =  jsonValString.lastMessageTime;
                var lastMessageText =  jsonValString.lastMessageText;
                //Adjust the message text length to display in UI within the display bounds
                if(lastMessageText != null && lastMessageText.length > 40){
                    lastMessageText = lastMessageText.substr(0, 40);
                }else if(lastMessageText == null) {
                    lastMessageText = "--";
                }
                var unReadMessages =  jsonValString.unReadMessages;
                var profileImage =  jsonValString.profileImage;
                var transportId = child.key.split("-")[0];
                var participantId = child.key.split("-")[1];
                if(user._id == transportId){
                    let messageJson ={
                        _id : participantId,
                        transportId : transportId,
                        name : participantName,
                        type : participantType,
                        messageTime : lastMessageTime,
                        profileImage : profileImage,
                        lastMessageText : lastMessageText,
                        badgeCount : unReadMessages
                    };
                    if(unReadMessages == 0){
                        //Read message chat rooms move to bottom of the stack
                        messages.push(messageJson);
                    }else{
                        //Unread Message chat rooms move to top of the stack
                        messages.unshift(messageJson);
                    }
                }

            });
            this.setState({
                messagelist:messages
            });
            //Updated logic to cleanup by looking at last message date at the adminchatRef Node level. Less overhead since
            //we are not scanning through every message to look at the date, going with this approach instead of
            //running a cleanup backend cron job.
            this.cleanup(this.state.messagelist);
        });
      }

   /* loadChatParticipants(ref) {
       var context = this;
       //console.log("Message List Size : ", this.state.messagelist.length);
       if(this.state.messagelist.length == 0){
           context.getList( response => {
                console.log("chat room members before filtering: ", response);
                console.log("Message List Size : ", this.state.messagelist.length);
                response = this.getUniqueChatParticipantList(response);
                console.log("chat room members after filtering: ", response);
                context.setState({
                    messagelist:response
                });
            });
        }
    }*/


    getUniqueChatParticipantList(participantList){
        var uniqueKeys = new Set();
        participantList.forEach(participant => {
                uniqueKeys.add(participant.transportId+ '-' +participant._id)
        });

        var uniqueList = [];
        //console.log("uniqueKeys: ", uniqueKeys);
        //Now Fetch the last Object in each keyset
        uniqueKeys.forEach(uniqueKey => {
            var tempObject;
            participantList.forEach(participant => {
                if(uniqueKey == participant.transportId+ '-' +participant._id){
                    tempObject = participant;
                }
            });
         uniqueList.push(tempObject);
        });
        return uniqueList;
    }

   updateReadReceipt(transportId, selectId){
        var childRef = ref.child(transportId + "-" + selectId);
        childRef.update({
                "messageReadFlag" : true,
                "unReadMessages" : 0
        });
    }

    GetItem(id, transportId, name, type) {

        //this.updateReadReceipt(transportId, id);

        this.props.navigator.push({
            screen: "ChatWindow",
            animated : "true",
            passProps: {
                crtransportId : transportId,
                crselectId: id,
                crselectName: name,
                crselectType : type
            }
        });

    }

    render() {
        return (
            <View style={styles.MainContainer}>
                <Header navigator={this.props.navigator} title={"Admin Chat List"} />
               <FlatList
                    ref={'flatList'}
                    data={this.state.messagelist}
                    keyExtractor={item => item._id}
                    numColumns={1}
                    renderItem={this.renderChatMembers}
                    style={{ marginBottom: moderateScale(25) }}
                    showsHorizontalScrollIndicator={false}
                />
            </View>
        );
    }


    renderChatMembers= ({ item }) => {
        return (
          <TouchableOpacity
            key={item._id}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: moderateScale(25),
              borderBottomColor: Constants.Colors.gray,
              borderBottomWidth: 0.4,
              paddingVertical: moderateScale(15)
            }}
          onPress={this.GetItem.bind(this, item._id, item.transportId, item.name, item.type)}>
            <View
              style={{
                height: moderateScale(60),
                width: moderateScale(60),
                borderRadius: moderateScale(100),
                overflow: "hidden",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                marginHorizontal: moderateScale(5),
                borderWidth: 0.4
              }}
            >
              <Image
                source={{uri: `${item.profileImage}`}}
                resizeMode={"cover"}
                style={{
                  height: moderateScale(60),
                  width: moderateScale(60)
                }}
              />
            </View>
            <View
              style={{
                width: Constants.BaseStyle.DEVICE_WIDTH - moderateScale(150),
                justifyContent: "flex-start",
                paddingHorizontal: moderateScale(5)
              }}
            >
              <Text
                style={{
                  ...Constants.Fonts.TitilliumWebSemiBold,
                  fontSize: moderateScale(19),
                  color: Constants.Colors.Primary
                }}
                >{item.name} <Text style={{ color: 'grey', fontSize: moderateScale(14)}}> . {item.type} </Text>
                <Text style={{ color: 'green', fontSize: moderateScale(14)}}>{item.messageTime}</Text>
              </Text>
              <Text
                style={{
                  ...Constants.Fonts.TitilliumWebRegular,
                  fontSize: moderateScale(19),
                  color: Constants.Colors.gray
                }}
              >
                {item.lastMessageText}
              </Text>
              </View>
              <View style={{flex:1, width:'100%', flexDirection: 'row', alignItems: 'stretch'}}>
                <IconBadge
                  MainElement={
                    <View style={{backgroundColor:'#FFFFFF',
                      width:10,
                      height:10,
                      margin:6
                    }}/>
                  }
                  BadgeElement={
                    <Text style={{color:'#FFFFFF'}}>{item.badgeCount}</Text>
                  }
                  IconBadgeStyle={
                    {width:30,
                    height:30,
                    margin:6,
                    alignSelf: 'flex-end',
                    backgroundColor: '#ed4337'}
                  }
                  Hidden={item.badgeCount==0}
                  />
              </View>
        </TouchableOpacity>
        );
   }
}

    const mapDispatchToProps = dispatch => ({
        appActions: bindActionCreators(appActions, dispatch)
    });

    function mapStateToProps(state) {
        return {
          user: state.user
        };
    }


export default connect(
    mapStateToProps,
    mapDispatchToProps
  )(AdminScreen);


const styles = StyleSheet.create({
    MainContainer: {
        flex: 1,
    },

    content: {
        padding: 10,
        fontSize: 18,
        height: 44,
    },

});