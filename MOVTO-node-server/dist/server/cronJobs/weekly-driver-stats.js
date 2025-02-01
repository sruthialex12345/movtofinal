'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

var _trip = require('../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _emailApi = require('../service/emailApi');

var _emailApi2 = _interopRequireDefault(_emailApi);

var _userTypes = require('../constants/user-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getPreviousWeekTrips(driverId) {
  var currenDate = new Date().toISOString();
  var prevMondayDate = new Date((0, _moment2.default)(currenDate).subtract(7, 'days'));
  var prevSundayDate = new Date((0, _moment2.default)(currenDate).subtract(1, 'days'));

  _trip2.default.aggregateAsync([{ $match: { driverId: driverId, pickUpTime: { $gte: prevMondayDate, $lte: prevSundayDate } } }, {
    $group: {
      _id: null,
      totalUsers: { $sum: 1 },
      totalFare: { $sum: '$tripAmt' },
      onArrivalRate: {
        $sum: {
          $cond: {
            if: { $lte: ['$arrivalTime', '$pickUpTime'] },
            then: 0,
            else: { $divide: [{ $multiply: [1, { $divide: [100, { $sum: 1 }] }] }, { $sum: 1 }] }
          }
        }
      },
      cancellationRate: {
        $sum: {
          $cond: {
            if: { $eq: ['$tripStatus', 'cancelled'] },
            then: { $divide: [{ $multiply: [1, { $divide: [100, { $sum: 1 }] }] }, { $sum: 1 }] },
            else: 0
          }
        }
      },
      extremelyLateArrivals: {
        $sum: {
          $cond: {
            if: { $lte: [{ $subtract: ['$arrivalTime', '$pickUpTime'] }, 900000] },
            then: 1,
            else: 0
          }
        }
      },
      ridesCancelledLastMin: {
        $sum: {
          $cond: {
            if: { $and: [{ $eq: ['$tripStatus', 'cancelled'] }, { $lte: [{ $subtract: ['$pickUpTime', '$tripStatusAt'] }, 86400000] }] },
            then: 1,
            else: 0
          }
        }
      }
    }
  }]).then(function (tripData) {
    if (tripData.length > 0) {
      console.log('Send Email');
      (0, _emailApi2.default)(driverId, tripData[0], 'weeklyStatsDriver');
    } else {
      console.log('No weekly stats found');
    }
  });
} // file not being used

var emailDriverWeekly = function emailDriverWeekly() {
  _user2.default.findAsync({ userType: _userTypes.USER_TYPE_DRIVER, isApproved: true, verified: true }).then(function (driverData) {
    if (driverData.length > 0) {
      driverData.forEach(function (element) {
        getPreviousWeekTrips(element._id);
      });
    } else {
      console.log('No drivers found');
    }
  });
};

exports.default = emailDriverWeekly;
module.exports = exports.default;
//# sourceMappingURL=weekly-driver-stats.js.map
