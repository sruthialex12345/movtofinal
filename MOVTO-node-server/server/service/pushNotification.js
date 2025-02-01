const FCM = require('fcm-node');
import UserSchema from '../models/user';
import config from '../../config/env';

const fcm = new FCM(config.fcm.serverKey);

export const  sendNotificationByUserIdAsync = (userId, data)=> {
  // eslint-disable-next-line
  return new Promise((resolve, reject)=>{
    console.log(' INSIDE PUSH USERID',userId);
    UserSchema.findOneAsync({ _id: userId }).then(userObj => {
       console.log('sending notification to', JSON.stringify(userObj.loggedInDevices));
        //if (userObj && userObj.loggedInDevices && Array.isArray(userObj.loggedInDevices) && userObj.loggedInDevices.length) {
          console.log(' INSIDE PUSH',userId);
          // if registration_ids option doesn't work uncomment the following to send notification on each device consecutively

          let sendToLoggedInDevices = userObj.loggedInDevices.map((device)=>{
             let message = {
               to: device.token,
               // collapse_key: 'your_collapse_key',

               notification: {
                 title: data.title, // 'Title of your push notification',
                 body: data.body //'Body of your push notification'
               },

               data: {  //you can send only notification or only data(or include both)
                 title: data.title,
                 body: data.body
               }
             };
             return new Promise((resolvefcm, rejectfcm)=>{
               fcm.send(message, function(err, response){
                 if (err) {
                   console.log("Something has gone wrong!", err);
                   return rejectfcm(err);
                 } else {
                   console.log("Successfully sent with response: ", response);
                   return resolvefcm(response)
                 }
               });
             })
           })

           // send notification to all loggedin devices
           Promise.all(sendToLoggedInDevices)
           .then((result)=>{
             return resolve(result);
           })
           .catch((err)=>{
             return reject(err);
           })

          /* sending on multiple token at once with registration_ids option
          //@GR - This option is not working - Sending message one at a time.
          //let deviceTokens = userObj.loggedInDevices.map(device=>device.token);
          let message = {
            registration_ids: deviceTokens,
            priority: "high",
            // collapse_key: 'your_collapse_key',

            notification: {
              title: data.title, // 'Title of your push notification',
              body: data.body, //'Body of your push notification'
              payload: {}
            },

            data: {  //you can send only notification or only data(or include both)
              title: data.title,
              body: data.body,
              payload: {}
            }
          };
          // console.log('message is', message);
          try {
            fcm.send(message, function(err, response){
              if (err) {
                console.log("Something has gone wrong!", err);
                // return reject(err);
              } else {
                console.log(`Successfully sent to userId (${userId}) with response: `, response);
                return resolve(response)
              }
            });

          } catch (error) {
            console.log("Something has gone wrong??????/!", err);
          }

        } else if(!userObj) {
          console.log("user not found to send push notification > ",userId);
        } else {
          console.log("no loggedin device found for push notification to user > ", userObj.email);
        }*/

    }).catch(err=>{
      return reject(err)
    });
  })
}
