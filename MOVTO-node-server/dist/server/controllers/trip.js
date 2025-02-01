'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getClaimedRides = exports.acceptARide = exports.getHistory = undefined;

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _transformResponse = require('../service/transform-response');

var _trip = require('../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _userTypes = require('../constants/user-types');

var _smsApi = require('../service/smsApi');

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var moment = require('moment');

/**
 * Return the trip details of the user.
 * @param req
 * @param res
 * @param next
 * @returns { trip: historyObjArray[{ tripObj }]  }
 */

var getHistory = exports.getHistory = function getHistory(req, res, next) {
  var historyObjArray = [];
  var userID = req.user._id; //eslint-disable-line
  var userType = req.user.userType;

  var searchObj = {};
  if (userType === _userTypes.USER_TYPE_RIDER) {
    searchObj.riderId = userID;
  } else if (userType === _userTypes.USER_TYPE_DRIVER) {
    searchObj.driverId = userID;
  }

  // eslint-disable-next-line
  _trip2.default.find({ $and: [searchObj, { tripStatus: 'endTrip' }] }, null, { sort: { bookingTime: -1 } }, function (tripErr, tripObj) {
    //eslint-disable-line
    if (tripErr) {
      var err = new _APIError2.default('error while finding trip history for the user  ' + tripErr, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      return next(err);
    }
    if (tripObj.length !== 0) {
      tripObj.forEach(function (obj, index) {
        (0, _transformResponse.fetchReturnObj)(obj).then(function (transformedReturnObj) {
          historyObjArray.push(transformedReturnObj);
          if (index === tripObj.length - 1) {
            var returnObj = {
              success: true,
              message: 'user trip history',
              data: historyObjArray
            };
            res.send(returnObj);
          }
        });
      });
    } else {
      var returnObj = {
        success: true,
        message: 'no history available',
        data: []
      };
      res.send(returnObj);
    }
  });
};

var acceptARide = exports.acceptARide = function acceptARide(req, res /* , next */) {
  var tripId = req.body.tripId;

  _trip2.default.findOneAsync({ _id: tripId }).then(function (tripData) {
    if (tripData) {
      tripData.tripStatus = 'claimed';
      tripData.saveAsync().then(function (newTripData) {
        if (newTripData) {
          res.send({ status: true, message: 'ride is successfully accepted' });
          NotifyRiderSms(newTripData);
        } else {
          res.send({ status: false, message: 'server error while accepting ride' });
        }
      });
    } else {
      res.send({ status: false, message: 'No trip data found.' });
    }
  }).catch(function () {
    res.send({ status: false, message: 'server error while accepting ride' });
  });
};

function NotifyRiderSms(tripObj) {
  _user2.default.findOneAsync({ _id: tripObj.riderId }).then(function (userObj) {
    if (userObj) {
      var pickupDate = moment(tripObj.pickUpTime).format('MMMM Do YYYY, h:mm:ss a');
      var passengerName = "";
      var smsText = "";
      if (tripObj.passengerIds.length > 0) {
        tripObj.passengerIds.forEach(function (item) {
          userObj.passengerList.forEach(function (element) {
            if (item == element._id) {
              if (tripObj.passengerIds.length == 1) {
                passengerName = element.fname;
              } else if (tripObj.passengerIds.length == 2) {
                if (index == 1) {
                  passengerName = passengerName + " and " + element.fname;
                } else {
                  passengerName = element.fname;
                }
              } else {
                if (index == tripObj.passengerIds.length - 1) {
                  passengerName = passengerName.slice(0, -2);
                  passengerName = passengerName + " and " + element.fname;
                } else {
                  passengerName = passengerName + element.fname + ", ";
                }
              }
            }
          });
        });
        smsText = 'Your Merry Go Drive driver is now confirmed for your upcoming ride on ' + pickupDate + ' with ' + passengerName + '. Check the app for details.';
      } else {
        smsText = 'Your Merry Go Drive driver is now confirmed for your upcoming ride on ' + pickupDate + '. Check the app for details.';
      }
      (0, _smsApi.sendSms)(tripObj.riderId, smsText, function (err, data) {
        if (err) {
          console.log('server error while sending sms to rider ' + err);
        } else {
          console.log("Sms is successfully sent to rider");
        }
      });
    } else {
      console.log("No user found");
    }
  });
}

// an endpoint to retrieve the driver's claimed rides.
var getClaimedRides = exports.getClaimedRides = function getClaimedRides(req, res, next) {
  var driverId = req.body.driverId;

  var currentDate = new Date().toISOString();
  var sevenDaysDate = new Date(moment(currentDate).add(7, 'days'));
  _trip2.default.findAsync({ driverId: driverId, tripStatus: 'claimed', bookingTime: { $gt: currentDate, $lt: sevenDaysDate } }, {}, { sort: { pickUpTime: 1 } }).then(function (tripData) {
    if (tripData) {
      if (tripData.length > 0) {
        var returnObj = {
          success: true,
          message: 'Successfully fetched claimed rides',
          data: tripData
        };
        res.send(returnObj);
      } else {
        var _returnObj = {
          success: true,
          message: 'No claimed rides',
          data: []
        };
        res.send(_returnObj);
      }
    }
  }).catch(function (tripErr) {
    var err = new _APIError2.default('error while finding claimed rides of driver  ' + tripErr, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    return next(err);
  });
};
//# sourceMappingURL=trip.js.map
