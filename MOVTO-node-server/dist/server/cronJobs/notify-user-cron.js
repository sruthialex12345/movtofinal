'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.notifyUserUnclaimedRides30MinBefore = exports.notifyUserUnclaimedRidesAtNine = exports.notifyUserUnclaimedRidesAtEight = undefined;

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _trip = require('../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _smsApi = require('../service/smsApi');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var findUnclaimedRides = function findUnclaimedRides(startDate, endDate) {
  _trip2.default.findAsync({ bookingTime: { $lte: startDate, $gte: endDate }, tripStatus: 'unclaimed' }).then(function (tripData) {
    if (tripData.length > 0) {
      tripData.forEach(function (item) {
        var smsText = '';
        (0, _smsApi.sendSms)(item.riderId, smsText, function (err, data) {
          if (err) {
            console.log(err);
          } else {
            console.log(data);
          }
        });
      });
    } else {
      console.log('No unclaimed rides available found ', startDate);
    }
  }).catch(function (error) {
    console.log('Server error finding unclaimed rides', error);
  });
};
// file not being used

var notifyUserUnclaimedRidesAtEight = exports.notifyUserUnclaimedRidesAtEight = function notifyUserUnclaimedRidesAtEight() {
  var currentDate = new Date().toISOString();
  var tomorrowEndDate = new Date((0, _moment2.default)(currentDate).add(1, 'days'));
  tomorrowEndDate.setHours(23);
  tomorrowEndDate.setMinutes(59);
  tomorrowEndDate.setSeconds(59);
  var tomorrowStartDate = new Date((0, _moment2.default)(currentDate).add(1, 'days'));
  tomorrowStartDate.setHours(0);
  tomorrowStartDate.setMinutes(0);
  tomorrowStartDate.setSeconds(0);
  findUnclaimedRides(tomorrowStartDate, tomorrowEndDate);
};

var notifyUserUnclaimedRidesAtNine = exports.notifyUserUnclaimedRidesAtNine = function notifyUserUnclaimedRidesAtNine() {
  var currentDate = new Date().toISOString();
  var todayEndDate = new Date().toISOString();
  todayEndDate.setHours(23);
  todayEndDate.setMinutes(59);
  todayEndDate.setSeconds(59);
  findUnclaimedRides(currentDate, todayEndDate);
};

var notifyUserUnclaimedRides30MinBefore = exports.notifyUserUnclaimedRides30MinBefore = function notifyUserUnclaimedRides30MinBefore() {
  var currentDate = new Date().toISOString();
  var thirtyBefore = new Date((0, _moment2.default)(currentDate).subtract(30, 'minutes'));
  findUnclaimedRides(currentDate, thirtyBefore);
};
//# sourceMappingURL=notify-user-cron.js.map
