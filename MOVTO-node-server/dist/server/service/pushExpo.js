'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _expoServerSdk = require('expo-server-sdk');

var _expoServerSdk2 = _interopRequireDefault(_expoServerSdk);

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// To check if something is a push token
// const isPushToken = Exponent.isExponentPushToken(somePushToken);
var expo = new _expoServerSdk2.default();

function sendNotification(userId, notification) {
  // eslint-disable-next-line
  _user2.default.findOneAsync({ _id: userId }).then(function (userObj) {
    try {
      var isPushToken = _expoServerSdk2.default.isExponentPushToken(userObj.pushToken);
      if (isPushToken) {
        var receipts = expo.sendPushNotificationsAsync([{
          to: userObj.pushToken,
          sound: 'default',
          body: notification,
          data: { withSome: notification }
        }]);
        // console.log(receipts);
        return receipts;
      }
    } catch (error) {
      return error;
      // console.error(error);
    }
  });
}
exports.default = sendNotification;
module.exports = exports.default;
//# sourceMappingURL=pushExpo.js.map
