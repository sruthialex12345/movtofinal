'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _transformResponse = require('../service/transform-response');

var _trip = require('../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _tripRequest = require('../models/tripRequest');

var _tripRequest2 = _interopRequireDefault(_tripRequest);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Return the trip details of the user.
 * @param req
 * @param res
 * @param next
 * @returns { trip: historyObjArray[{ tripObj }]  }
 */

function getSyncData(req, res, next) {
  // const userID = req.user._id;
  var _req$user = req.user,
      currTripId = _req$user.currTripId,
      currTripState = _req$user.currTripState;

  var returnObj = {
    success: true,
    message: 'user is not in any trip or tripRequest',
    data: {
      tripRequest: null,
      trip: null
    }
  };
  if (currTripId === null || currTripId === undefined || currTripState === null || currTripState === undefined) {
    res.send(returnObj);
  }
  if (currTripState === 'tripRequest') {
    _tripRequest2.default.findOneAsync({ $and: [{ _id: currTripId }, { $or: [{ tripRequestStatus: 'enRoute' }, { tripRequestStatus: 'arriving' }, { tripRequestStatus: 'arrived' }] }] }).then(function (tripRequestObj) {
      if (tripRequestObj) {
        (0, _transformResponse.fetchReturnObj)(tripRequestObj).then(function (transformedTripRequestObj) {
          returnObj.message = 'user is in tripRequest state';
          returnObj.data.tripRequest = transformedTripRequestObj;
          res.send(returnObj);
        }).error(function (e) {
          var err = new _APIError2.default('error occurred when transforming tripRequestObj ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          return next(err);
        });
      } else {
        returnObj.message = 'no trip request object found for the current tripRequest state for the corresponding user';
        res.send(returnObj);
      }
    }).error(function (e) {
      var err = new _APIError2.default('error occurred when feteching user data from tripRequest schema ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      return next(err);
    });
  }
  if (currTripState === 'trip') {
    _trip2.default.findOneAsync({ $and: [{ _id: currTripId }, { tripStatus: 'onTrip' }] }).then(function (tripObj) {
      if (tripObj) {
        (0, _transformResponse.fetchReturnObj)(tripObj).then(function (transformedTripObj) {
          returnObj.message = 'user is in trip state';
          returnObj.data.trip = transformedTripObj;
          returnObj.data.tripRequest = null;
          res.send(returnObj);
        }).error(function (e) {
          var err = new _APIError2.default('error occurred when feteching user data from trip schema ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          return next(err);
        });
      } else {
        returnObj.message = 'no trip object found for the current trip state for the corresponding user';
        res.send(returnObj);
      }
    }).error(function (e) {
      var err = new _APIError2.default('error occurred when feteching user data from trip schema ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      return next(err);
    });
  }
}

exports.default = { getSyncData: getSyncData };
module.exports = exports.default;
//# sourceMappingURL=sync-data.js.map
