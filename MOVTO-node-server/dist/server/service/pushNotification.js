'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendNotificationByUserIdAsync = undefined;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

var _env = require('../../config/env');

var _env2 = _interopRequireDefault(_env);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var FCM = require('fcm-node');


var fcm = new FCM(_env2.default.fcm.serverKey);

var sendNotificationByUserIdAsync = exports.sendNotificationByUserIdAsync = function sendNotificationByUserIdAsync(userId, data) {
  // eslint-disable-next-line
  return new _promise2.default(function (resolve, reject) {
    console.log(' INSIDE PUSH USERID', userId);
    _user2.default.findOneAsync({ _id: userId }).then(function (userObj) {
      console.log('sending notification to', (0, _stringify2.default)(userObj.loggedInDevices));
      //if (userObj && userObj.loggedInDevices && Array.isArray(userObj.loggedInDevices) && userObj.loggedInDevices.length) {
      console.log(' INSIDE PUSH', userId);
      // if registration_ids option doesn't work uncomment the following to send notification on each device consecutively

      var sendToLoggedInDevices = userObj.loggedInDevices.map(function (device) {
        var message = {
          to: device.token,
          // collapse_key: 'your_collapse_key',

          notification: {
            title: data.title, // 'Title of your push notification',
            body: data.body //'Body of your push notification'
          },

          data: { //you can send only notification or only data(or include both)
            title: data.title,
            body: data.body
          }
        };
        return new _promise2.default(function (resolvefcm, rejectfcm) {
          fcm.send(message, function (err, response) {
            if (err) {
              console.log("Something has gone wrong!", err);
              return rejectfcm(err);
            } else {
              console.log("Successfully sent with response: ", response);
              return resolvefcm(response);
            }
          });
        });
      });

      // send notification to all loggedin devices
      _promise2.default.all(sendToLoggedInDevices).then(function (result) {
        return resolve(result);
      }).catch(function (err) {
        return reject(err);
      });

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
    }).catch(function (err) {
      return reject(err);
    });
  });
};
//# sourceMappingURL=pushNotification.js.map
