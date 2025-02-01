'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _twilio = require('twilio');

var _twilio2 = _interopRequireDefault(_twilio);

var _serverConfig = require('../models/serverConfig');

var _serverConfig2 = _interopRequireDefault(_serverConfig);

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

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

function sendSmsEachRider(smsText, phoneNo, cb) {
    getSmsApiDetails().then(function (details) {
        var twilio = new _twilio2.default(details.accountSid, details.token);
        twilio.messages.create({
            from: details.from,
            to: phoneNo,
            body: smsText
        }, function (err, result) {
            if (err) {
                console.log('Error', err);
                cb(err, null);
            } else {
                console.log('Result', result);
                cb(null, result);
            }
        });
    });
}
exports.default = sendSmsEachRider;
module.exports = exports.default;
//# sourceMappingURL=smsEachRiderApi.js.map
