/* @GR - 05/08/2010 - Refactored Firebase backend
*  connection module to use primed keys from config file and all refs catagorised to unique roomId for One to one chat
*  between drivers and with admin.
*/
import Constants from "../constants";
//import firebase from 'firebase'; // 4.8.1
import firebase from "react-native-firebase";

class Fire {
  constructor(props) {
    //this.init();
      this.state = {
          transportId: props.crtransportId,
          selectId: props.crselectId, // Selected Target User Id to chat with - To be used for Driver to Driver Chat.
          currentUserId : props.currUserId, //Logged in user Id - To be used for Driver to Driver Chat.
          uid : ""
      }
      this.observeAuth();
      //@GR - Badge/Notification POC is works fine but, We need a better algo to capture message notifications
      // on both ends, lets look at it in the next iteration
      //this.showNotification();
  }



  init = () => {
    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: Constants.DevKeys.firebase.APIKey,
        authDomain: Constants.DevKeys.firebase.authDomain,
        databaseURL: Constants.DevKeys.firebase.databaseURL,
        projectId: Constants.DevKeys.firebase.projectId,
        storageBucket: Constants.DevKeys.firebase.storageBucket,
        messagingSenderId: Constants.DevKeys.firebase.messagingSenderId
      });
    }

  };

  observeAuth = () =>{
        firebase.auth().onAuthStateChanged(this.onAuthStateChanged);
   }

    onAuthStateChanged = user => {
      //console.log("Firebase signin user: ", user);
      if (!user) {
        firebase
          .auth()
          .signInWithEmailAndPassword(Constants.DevKeys.firebase.chatUser, 
          Constants.DevKeys.firebase.chatPassword)
          .catch(error => {
            console.log("sign in error: ", error);
            alert(error.message);
          });
      }else{
      //const authUserId =  firebase.auth().currentUser;
        console.log("Firebase auth user: ", user.uid);
        this.state.uid = user.uid;
      }
  };

  async showNotification(){
    //Create the channel
    const channel = new firebase.notifications.Android.Channel(
    'test-channel',
    'Test Channel',
    firebase.notifications.Android.Importance.Max,
    ).setDescription('My apps test channel');
    firebase.notifications().android.createChannel(channel);
    console.log('Channel Created');
    const localNotification = new firebase.notifications.Notification({
            show_in_foreground: true,
          })
          .setNotificationId('100')
          .setTitle('My Notification')
          .setBody('Hello World Testing');
           localNotification.android
              .setChannelId('test-channel');
          await firebase.notifications().setBadge(1);
          firebase.notifications()
            .displayNotification(localNotification);
    console.log("Notification fired");
  }

   /*
    * Generate Admin2UserChatId - when you are the user sending message to admin you take logged in user user._id(selectId)
    * and your admin takes admin User(transportId)
    * If admin sends message to user then admin taked logged in admin user user._id(transportId)
    * and you take selected user (selectId)
    */
      generateAdmin2UserChatId() {
        console.log("transportId : ", this.state.transportId);
        console.log("chatuserId : ", this.state.selectId);
        return `${this.state.transportId}-${this.state.selectId}`;
      }
   /*
    * Generate User2UserChatId - when you are the user sending message to friend you take logged in user user._id(currentUserId)
    * and your friend takes Selected User(selectId)
    * If your friend sends message to you then you take the Selected User(selectId)
    * and your friend takes the logged in user user._id(currentUserId)
    */
      generateUser2UserChatId(){
        console.log("logged in userId : ", this.state.currentUserId);
        console.log("chatuserId : ", this.state.selectId);
        if (this.state.currentUserId > this.state.selectId) return `${this.state.currentUserId}-${this.state.selectId}`;
        else return `${this.state.selectId}-${this.state.currentUserId}`;
      }


      adminChatRef() {
        return firebase.database().ref("chat").child(this.generateAdmin2UserChatId());
      }

      chatRef() {
          return firebase.database().ref().child("chat/");
      }

      adminmessageRef(ref) {
          return ref.child("messages/" );
      }

      userChatRef() {
        return firebase.database().ref("chat").child(this.generateUser2UserChatId());
      }

      timestamp() {
        return firebase.database.ServerValue.TIMESTAMP;
      }

      //Close the connection to the Backend
      off(ref) {
        ref.off();
      }
}


export default Fire;
