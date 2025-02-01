'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.sendSmsBeforeRegister = sendSmsBeforeRegister;
exports.sendSmsUpdateMobile = sendSmsUpdateMobile;
exports.sendSms = sendSms;

var _twilio = require('twilio');

var _twilio2 = _interopRequireDefault(_twilio);

var _serverConfig = require('../models/serverConfig');

var _serverConfig2 = _interopRequireDefault(_serverConfig);

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

var _userTypes = require('../constants/user-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getSmsApiDetails() {
  return new _promise2.default(function (resolve, reject) {
    _serverConfig2.default.findOneAsync({ key: 'smsConfig' }).then(function (foundDetails) {
      resolve(foundDetails.value);
    }).catch(function (err) {
      reject(err);
    });
  });
}

function sendSmsBeforeRegister(phoneDetails, smsText, cb) {
  getSmsApiDetails().then(function (details) {
    console.log("sms api details", details);
    var twilio = new _twilio2.default(details.accountSid, details.token);
    if (phoneDetails.phoneNo) {
      var phoneNO = null;
      phoneNO = '+' + phoneDetails.isdCode + phoneDetails.phoneNo;
      console.log('sending message to:', phoneNO);
      twilio.messages.create({
        from: details.from,
        to: phoneNO,
        body: smsText
      }, function (err, result) {
        if (err) {
          console.log('Error', err);
          cb(err, null);
        } else {
          cb(null, result);
        }
      });
    } else {
      cb(new Error("Country code or phone no is invalid!"), null);
    }
  });
}

function sendSmsUpdateMobile(phoneDetails, smsText, cb) {
  getSmsApiDetails().then(function (details) {
    var twilio = new _twilio2.default(details.accountSid, details.token);
    if (phoneDetails.isdCode && phoneDetails.phoneNo) {
      var phoneNO = null;
      phoneNO = '+' + phoneDetails.isdCode + phoneDetails.phoneNo;
      console.log('sending message to:', phoneNO);
      twilio.messages.create({
        from: details.from,
        to: phoneNO,
        body: smsText
      }, function (err, result) {
        if (err) {
          console.log('Error', err);
          cb(err, null);
        } else {
          // console.log('Result', result);
          cb(null, result);
        }
      });
    } else {
      cb(new Error("Country code or phone no is invalid!"), null);
    }
  });
}

function sendSms(userId, smsText, cb) {
  _user2.default.findOneAsync({ _id: userId }).then(function (userObj) {
    getSmsApiDetails().then(function (details) {
      var twilio = new _twilio2.default(details.accountSid, details.token);
      if (userObj.isdCode && userObj.phoneNo) {
        var phoneNO = null;
        if (userObj.userType === _userTypes.USER_TYPE_RIDER) {
          phoneNO = '+' + userObj.isdCode + userObj.phoneNo;
        } else {
          phoneNO = userObj.phoneNo;
        }
        console.log('sending message to:', phoneNO);
        twilio.messages.create({
          from: details.from,
          to: phoneNO,
          body: smsText
        }, function (err, result) {
          if (err) {
            console.log('Error sending sms', err);
            cb(err, null);
          } else {
            console.log('sms sent Result', result);
            cb(null, result);
          }
        });
      } else {
        cb(new Error("Country code or phone no is invalid!"), null);
      }
    });
  });
}
// export default sendSms;
//# sourceMappingURL=smsApi.js.map
