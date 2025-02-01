'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _env = require('../../config/env');

var _env2 = _interopRequireDefault(_env);

var _tripRequest = require('../models/tripRequest');

var _tripRequest2 = _interopRequireDefault(_tripRequest);

var _transformReturnObject = require('../service/transform-return-object');

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

var _userTypes = require('../constants/user-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('MGD-API: admin-trip-user');

function userTripDetails(req, res, next) {
  var userId = req.params.userId;

  debug('user id ' + userId);
  debug('limit value ' + req.query.limit);
  var limit = req.query.limit ? req.query.limit : _env2.default.limit;
  var pageNo = req.query.pageNo ? req.query.pageNo : 1;
  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  _user2.default.findByIdAsync(userId)
  // eslint-disable-next-line consistent-return
  .then(function (userObject) {
    var returnObj = {
      success: false,
      message: 'user not found with the given id',
      data: [],
      meta: {
        totalNoOfPages: null,
        limit: limit,
        currPageNo: pageNo,
        totalRecords: null
      }
    };
    if (userObject === null || userObject === undefined) {
      return res.send(returnObj);
    }
    var userType = userObject.userType;

    _tripRequest2.default.getUserCount(userType, userId)
    // eslint-disable-next-line consistent-return
    .then(function (totalUserTripRequestRecords) {
      returnObj.meta.totalNoOfPages = Math.ceil(totalUserTripRequestRecords / limit);
      returnObj.meta.totalRecords = totalUserTripRequestRecords;

      if (totalUserTripRequestRecords < 1) {
        returnObj.success = true;
        returnObj.message = 'user has zero trip Request records';
        return res.send(returnObj);
      }
      if (skip > totalUserTripRequestRecords) {
        var err = new _APIError2.default('Request Page No does not exists', _httpStatus2.default.NOT_FOUND);
        return next(err);
      }

      _tripRequest2.default.userList({
        skip: skip,
        limit: limit,
        userId: userId,
        userType: userType
      }).then(function (userTripRequestData) {
        var users = userTripRequestData.map(_transformReturnObject.transformReturnObj);
        returnObj.success = true;
        returnObj.message = 'user trip request records';
        returnObj.data = users;
        res.send(returnObj);
      }).error(function (e) {
        var err = new _APIError2.default('Error occured while fetching user trip Request records ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    }).error(function (e) {
      var err = new _APIError2.default('Error occured counting user trip request records ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('Error occured searching for user object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function userTripRequestStatics(req, res, next) {
  var userId = req.params.userId;

  debug('user id ' + userId);
  debug('limit value ' + req.query.limit);
  var limit = req.query.limit ? req.query.limit : _env2.default.limit;
  var pageNo = req.query.pageNo;

  _user2.default.findByIdAsync(userId)
  // eslint-disable-next-line consistent-return
  .then(function (userObject) {
    var returnObj = {
      success: false,
      message: 'user not found with the given id',
      data: null,
      meta: {
        totalNoOfPages: null,
        limit: limit,
        currPageNo: pageNo,
        totalRecords: null
      }
    };
    if (userObject === null || userObject === undefined) {
      return res.send(returnObj);
    }
    var userType = userObject.userType;

    var searchObj = {};
    var groupBy = null;
    if (userType === _userTypes.USER_TYPE_RIDER) {
      searchObj = {};
      groupBy = 'riderId';
      searchObj.riderId = userObject._id; // eslint-disable-line no-underscore-dangle
    }
    if (userType === _userTypes.USER_TYPE_DRIVER) {
      groupBy = 'driverId';
      searchObj = {};
      searchObj.driverId = userObject._id; // eslint-disable-line no-underscore-dangle
    }
    _tripRequest2.default.aggregateAsync([{ $match: searchObj }, {
      $group: {
        _id: '$' + groupBy,
        completed: { $sum: { $cond: [{ $eq: ['$tripRequestStatus', 'completed'] }, 1, 0] } },
        inQueue: {
          $sum: {
            $cond: [{
              $anyElementTrue: {
                $map: {
                  input: ['enRoute', 'arriving', 'arrived', 'request'],
                  as: 'status',
                  in: { $eq: ['$$status', '$tripRequestStatus'] }
                }
              }
            }, 1, 0]
          }
        },
        cancelled: { $sum: { $cond: [{ $or: [{ $eq: ['$tripRequestStatus', 'cancelled'] }, { $eq: ['$tripRequestStatus', 'rejected'] }] }, 1, 0] } },
        totalRequest: { $sum: 1 }
      }
    }]).then(function (chartStats) {
      returnObj.success = true;
      returnObj.message = 'user trip request statistic';
      returnObj.data = chartStats;
      res.send(returnObj);
    }).error(function (e) {
      var err = new _APIError2.default('Error occured while grouping the _id ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('Error occured searching for user object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}
exports.default = { userTripDetails: userTripDetails, userTripRequestStatics: userTripRequestStatics };
module.exports = exports.default;
//# sourceMappingURL=admin-trip-user.js.map
