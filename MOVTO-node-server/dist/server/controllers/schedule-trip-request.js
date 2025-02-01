'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rejectRequest = exports.acceptRequest = exports.assignDriver = exports.adminDriversList = exports.updateCancelRide = exports.saveScheduleTripRequest = exports.getScheduledTripRequests = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _util = require('../helpers/util');

var _util2 = _interopRequireDefault(_util);

var _env = require('../../config/env');

var _env2 = _interopRequireDefault(_env);

var _userTypes = require('../constants/user-types');

var USER_TYPES = _interopRequireWildcard(_userTypes);

var _scheduleRequestStatuses = require('../constants/schedule-request-statuses');

var SCHEDULE_TRIP_REQUEST_STATUS = _interopRequireWildcard(_scheduleRequestStatuses);

var _socketEvents = require('../constants/socket-events');

var _socketEvents2 = _interopRequireDefault(_socketEvents);

var _socketStore = require('../service/socket-store');

var _socketStore2 = _interopRequireDefault(_socketStore);

var _pushNotification = require('../service/pushNotification');

var PushNotification = _interopRequireWildcard(_pushNotification);

var _smsApi = require('../service/smsApi');

var _scheduledTripRequest = require('../models/scheduledTripRequest');

var _scheduledTripRequest2 = _interopRequireDefault(_scheduledTripRequest);

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

var _adminLocation = require('../models/adminLocation');

var _adminLocation2 = _interopRequireDefault(_adminLocation);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var randomstring = require("randomstring");


/**
 * Return the trip details of the user.
 * @param req
 * @param res
 * @param next
 * @returns { trip: historyObjArray[{ tripObj }]  }
 */

var getScheduledTripRequests = exports.getScheduledTripRequests = function getScheduledTripRequests(req, res, next) {
  var _req$query = req.query,
      pageNo = _req$query.pageNo,
      _req$query$limit = _req$query.limit,
      limit = _req$query$limit === undefined ? req.query.limit && parseInt(req.query.limit) || _env2.default.limit : _req$query$limit,
      status = _req$query.status,
      fromDate = _req$query.fromDate,
      toDate = _req$query.toDate,
      fromTime = _req$query.fromTime,
      toTime = _req$query.toTime;


  var skip = pageNo ? (parseInt(pageNo) - 1) * limit : _env2.default.skip;

  var queryFilters = [{
    isDeleted: false
  }];

  if (req.user.userType == USER_TYPES.USER_TYPE_RIDER) {
    var riderQuery = {
      $or: [{ createdBy: _mongoose2.default.Types.ObjectId(req.user._id) }, { riderId: _mongoose2.default.Types.ObjectId(req.user._id) }]
    };
    queryFilters.push(riderQuery);
  }

  if (req.user.userType == USER_TYPES.USER_TYPE_ADMIN) {
    var adminQuery = {
      $or: [{ createdBy: _mongoose2.default.Types.ObjectId(req.user._id) }, { adminId: _mongoose2.default.Types.ObjectId(req.user._id) }]
    };
    queryFilters.push(adminQuery);
  }

  if (req.user.userType == USER_TYPES.USER_TYPE_DRIVER) {
    var driverQuery = {
      assignedTo: _mongoose2.default.Types.ObjectId(req.user._id)
    };
    queryFilters.push(driverQuery);
  }

  if (status && status.length) {
    queryFilters.push({ status: { $in: status.split(',') } });
  }

  if (fromDate && fromDate != "") {
    queryFilters.push({ scheduledTime: { $gte: new Date(fromDate) } });
  }

  if (toDate && toDate != "") {
    queryFilters.push({ scheduledTime: { $lte: new Date(toDate) } });
  }

  if (fromTime && fromTime != "") {
    queryFilters.push({ scheduledTimePart: { $gte: fromTime } });
  }

  if (toTime && toTime != "") {
    queryFilters.push({ scheduledTimePart: { $lte: toTime } });
  }

  var query = { $and: queryFilters };

  var pipelineStages = [{
    $lookup: {
      from: "users",
      localField: "assignedTo",
      foreignField: "_id",
      as: "driverInfo"
    }
  }, {
    $unwind: {
      path: "$driverInfo",
      preserveNullAndEmptyArrays: true
    }
  }, {
    $lookup: {
      from: "users",
      localField: "createdBy",
      foreignField: "_id",
      as: "createdByInfo"
    }
  }, {
    $unwind: {
      path: "$createdByInfo",
      preserveNullAndEmptyArrays: true
    }
  }, {
    $lookup: {
      from: "users",
      localField: "riderId",
      foreignField: "_id",
      as: "riderInfo"
    }
  }, {
    $unwind: {
      path: "$riderInfo",
      preserveNullAndEmptyArrays: true
    }
  }, {
    $project: {
      scheduledTimePart: { $dateToString: { format: "%H:%M:%S:%L", date: "$scheduledTime" } },
      riderId: "$riderId",
      adminId: "$adminId",
      createdBy: "$createdBy",
      srcLoc: "$srcLoc",
      destLoc: "$destLoc",
      requestTime: "$requestTime",
      requestUpdatedTime: "$requestUpdatedTime",
      scheduledTime: "$scheduledTime",
      seatBooked: "$seatBooked",
      assignedTo: "$assignedTo",
      status: "$status",
      isDeleted: "$isDeleted",
      driverDetails: {
        _id: "$driverInfo._id",
        name: "$driverInfo.name",
        profileUrl: "$driverInfo.profileUrl"
      },
      riderDetails: {
        _id: "$riderInfo._id",
        name: "$riderInfo.name",
        profileUrl: "$riderInfo.profileUrl",
        isdCode: "$riderInfo.isdCode",
        phoneNo: "$riderInfo.phoneNo"
      },
      createBYDetails: {
        _id: "$createdByInfo._id",
        name: "$createdByInfo.name",
        isdCode: "$createdByInfo.isdCode",
        phoneNo: "$createdByInfo.phoneNo"
      }
    }
  }];

  pipelineStages.push({ $match: query });

  _scheduledTripRequest2.default.aggregateAsync(pipelineStages).then(function (totalRecord) {
    console.log("totalRecord", totalRecord.length);
    var returnObj = {
      success: true,
      message: 'no of trips are zero', // `no of active drivers are ${returnObj.data.length}`;
      data: null,
      meta: {
        totalNoOfPages: Math.ceil(totalRecord.length / limit),
        limit: limit,
        currPageNo: pageNo,
        currNoOfRecord: 0
      }
    };
    if (totalRecord.length < 1) {
      return res.send(returnObj);
    }
    if (limit && skip) {
      pipelineStages.push({ "$limit": parseInt(skip) + parseInt(limit) });
    } else if (limit) {
      pipelineStages.push({ "$limit": parseInt(limit) });
    }

    if (skip) {
      pipelineStages.push({ "$skip": parseInt(skip) });
    }
    _scheduledTripRequest2.default.aggregateAsync(pipelineStages).then(function (userData) {
      returnObj.data = userData;
      returnObj.message = 'Trips found';
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      return res.send(returnObj);
    }).catch(function (err) {
      console.log("Error occured while counting the no of trips>>>>>>", err);
      var error = new _APIError2.default('Error occured while counting the no of trips', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
      next(error);
    });
  }).catch(function (e) {
    console.log("Error occured while counting the no of trips>>>>>>222222222", e);
    var error = new _APIError2.default('Error occured while counting the no of trips11111>>>', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
    next(error);
  });
};

var saveScheduleTripRequest = exports.saveScheduleTripRequest = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(req, res, next) {
    var reqData, returnObj, riderId, adminId, result, query, _query, error;

    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            reqData = req.body;

            reqData.createdBy = req.user._id;
            returnObj = { success: false, message: '', data: null };

            console.log("reqData>>>>>>>>", reqData);
            riderId = null;
            adminId = req.body.adminId || null;

            if (req.user.userType == USER_TYPES.USER_TYPE_ADMIN) {
              adminId = req.user._id;
              reqData.adminId = adminId;
            }

            if (!(req.user.userType == USER_TYPES.USER_TYPE_RIDER && (!adminId || adminId == ""))) {
              _context3.next = 10;
              break;
            }

            returnObj.message = 'Service Provider invalid';
            return _context3.abrupt('return', res.send(returnObj));

          case 10:
            _context3.prev = 10;
            _context3.next = 13;
            return validateReqAdminSettingsAsync(reqData);

          case 13:
            result = _context3.sent;

            if (result.success) {
              _context3.next = 17;
              break;
            }

            returnObj.message = result.message;
            return _context3.abrupt('return', res.send(returnObj));

          case 17:
            if (!(req.user.userType === USER_TYPES.USER_TYPE_ADMIN)) {
              _context3.next = 24;
              break;
            }

            adminId = req.user._id;
            // check if user exist with phone No and rider type
            query = {
              phoneNo: reqData.phoneNo,
              isdCode: reqData.isdCode,
              userType: { $in: [USER_TYPES.USER_TYPE_RIDER, USER_TYPES.USER_TYPE_ANONYMOUS] }
            };


            console.log("checking user/rider query", query);
            _user2.default.findOneAsync(query).then(function () {
              var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(userFound) {
                var isValid;
                return _regenerator2.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        console.log("checking user query found user", userFound);

                        if (!userFound) {
                          _context.next = 8;
                          break;
                        }

                        riderId = userFound._id;
                        reqData.riderId = riderId;
                        reqData.adminId = adminId;
                        if (reqData.requestId && reqData.requestId != "") {
                          updateScheduleRequestAsync(reqData, req).then(function (result) {
                            return res.send(result);
                          }).catch(function (err) {
                            next(err);
                          });
                        } else {
                          addScheduleRequestAsync(reqData, req).then(function (result) {
                            return res.send(result);
                          }).catch(function (err) {
                            next(err);
                          });
                        }

                        _context.next = 25;
                        break;

                      case 8:
                        reqData.adminId = adminId;

                        // validate source and dest

                        _context.prev = 9;
                        _context.next = 12;
                        return validateSrcDestLocationsAsync(reqData);

                      case 12:
                        isValid = _context.sent;

                        if (isValid) {
                          _context.next = 16;
                          break;
                        }

                        returnObj.message = "No service at this location";
                        return _context.abrupt('return', res.send(returnObj));

                      case 16:
                        _context.next = 24;
                        break;

                      case 18:
                        _context.prev = 18;
                        _context.t0 = _context['catch'](9);

                        returnObj.success = false;
                        returnObj.message = 'Something went wrong while checking locations';
                        console.log("saveRiderDetails", _context.t0);
                        return _context.abrupt('return', res.send(returnObj));

                      case 24:

                        saveAnonymousRider(reqData).then(function (saveRiderDetailsResult) {
                          riderId = saveRiderDetailsResult._id;
                          reqData.riderId = riderId;
                          // send sms with app link to sign up and update same anonymous user on signup
                          if (reqData.requestId && reqData.requestId != "") {
                            updateScheduleRequestAsync(reqData, req).then(function (result) {
                              return res.send(result);
                            }).catch(function (err) {
                              next(err);
                            });
                          } else {
                            addScheduleRequestAsync(reqData, req).then(function (result) {
                              return res.send(result);
                            }).catch(function (err) {
                              next(err);
                            });
                          }
                        }).catch(function (e) {
                          returnObj.success = false;
                          returnObj.message = 'Something went wrong while save Rider Details';
                          console.log("saveRiderDetails", e);
                          return res.send(returnObj);
                        });

                      case 25:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, undefined, [[9, 18]]);
              }));

              return function (_x4) {
                return _ref2.apply(this, arguments);
              };
            }()).catch(function (err) {
              console.log("Error while checking if user exist", err);
              var error = new _APIError2.default('Something went wrong', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
              return next(error);
            });

            _context3.next = 39;
            break;

          case 24:
            if (!(req.user.userType === USER_TYPES.USER_TYPE_DRIVER)) {
              _context3.next = 36;
              break;
            }

            if (!(!reqData.phoneNo || reqData.phoneNo == "")) {
              _context3.next = 28;
              break;
            }

            returnObj.message = "Phone No is required";
            return _context3.abrupt('return', res.send(returnObj));

          case 28:
            if (!(!reqData.isdCode || reqData.isdCode == "")) {
              _context3.next = 31;
              break;
            }

            returnObj.message = "ISD code is required";
            return _context3.abrupt('return', res.send(returnObj));

          case 31:

            adminId = req.user.adminId;
            // check if user exist with phone No and rider type
            _query = {
              phoneNo: reqData.phoneNo,
              isdCode: reqData.isdCode,
              userType: { $in: [USER_TYPES.USER_TYPE_RIDER, USER_TYPES.USER_TYPE_ANONYMOUS] }
            };

            _user2.default.findOneAsync(_query).then(function () {
              var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(userFound) {
                var isValid;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        if (!userFound) {
                          _context2.next = 7;
                          break;
                        }

                        riderId = userFound._id;

                        reqData.riderId = riderId;
                        reqData.adminId = adminId;

                        if (reqData.requestId && reqData.requestId != "") {
                          updateScheduleRequestAsync(reqData, req).then(function (result) {
                            return res.send(result);
                          }).catch(function (err) {
                            next(err);
                          });
                        } else {
                          addScheduleRequestAsync(reqData, req).then(function (result) {
                            return res.send(result);
                          }).catch(function (err) {
                            next(err);
                          });
                        }

                        _context2.next = 24;
                        break;

                      case 7:
                        reqData.adminId = adminId;

                        _context2.prev = 8;
                        _context2.next = 11;
                        return validateSrcDestLocationsAsync(reqData);

                      case 11:
                        isValid = _context2.sent;

                        if (isValid) {
                          _context2.next = 15;
                          break;
                        }

                        returnObj.message = "No service at this location";
                        return _context2.abrupt('return', res.send(returnObj));

                      case 15:
                        _context2.next = 23;
                        break;

                      case 17:
                        _context2.prev = 17;
                        _context2.t0 = _context2['catch'](8);

                        returnObj.success = false;
                        returnObj.message = 'Something went wrong while checking locations';
                        console.log("saveRiderDetails", _context2.t0);
                        return _context2.abrupt('return', res.send(returnObj));

                      case 23:

                        saveAnonymousRider(reqData).then(function (saveRiderDetailsResult) {
                          riderId = saveRiderDetailsResult._id;
                          reqData.riderId = riderId;

                          if (reqData.requestId && reqData.requestId != "") {
                            updateScheduleRequestAsync(reqData, req).then(function (result) {
                              return res.send(result);
                            }).catch(function (err) {
                              next(err);
                            });
                          } else {
                            addScheduleRequestAsync(reqData, req).then(function (result) {
                              return res.send(result);
                            }).catch(function (err) {
                              next(err);
                            });
                          }
                        }).catch(function (e) {
                          returnObj.success = false;
                          returnObj.message = 'Something went wrong while save Rider Details';
                          console.log("saveRiderDetails", e);
                          return res.send(returnObj);
                        });

                      case 24:
                      case 'end':
                        return _context2.stop();
                    }
                  }
                }, _callee2, undefined, [[8, 17]]);
              }));

              return function (_x5) {
                return _ref3.apply(this, arguments);
              };
            }()).catch(function (err) {
              console.log("Error while checking if user exist", err);
              var error = new _APIError2.default('Something went wrong', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
              return reject(error);
            });
            _context3.next = 39;
            break;

          case 36:
            reqData.riderId = req.user._id;
            reqData.adminId = adminId;

            if (reqData.requestId && reqData.requestId != "") {
              updateScheduleRequestAsync(reqData, req).then(function (result) {
                return res.send(result);
              }).catch(function (err) {
                next(err);
              });
            } else {
              addScheduleRequestAsync(reqData, req).then(function (result) {
                return res.send(result);
              }).catch(function (err) {
                next(err);
              });
            }

          case 39:
            _context3.next = 46;
            break;

          case 41:
            _context3.prev = 41;
            _context3.t0 = _context3['catch'](10);

            console.log("Error while validating request", _context3.t0);
            error = new _APIError2.default('Error while validating request', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
            return _context3.abrupt('return', next(error));

          case 46:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined, [[10, 41]]);
  }));

  return function saveScheduleTripRequest(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var updateCancelRide = exports.updateCancelRide = function updateCancelRide(req, res, next) {
  var newStatus = SCHEDULE_TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED;
  var returnObj = {
    data: null,
    message: '',
    success: false
  };

  if (req.body.requestId == "") {
    returnObj.message = "Invalid trip request id";
    return res.send(returnObj);
  }

  _scheduledTripRequest2.default.findOneAndUpdateAsync({ _id: req.body.requestId, isDeleted: false }, { $set: { status: newStatus } }, { new: true }).then(function (updatedData) {
    if (!updatedData) {
      returnObj.message = "Request not found";
      return res.send(returnObj);
    }
    returnObj.success = true;
    returnObj.message = "Request Cancelled";
    returnObj.data = updatedData;

    /**
     * 1. notify rider and driver(if assigned) if admin cancel the request
     * 2. notify admin and driver (if assigned) if rider cancel the request
     */

    // 1. notify rider and driver(if assigned) if admin cancel the request
    if (req.user.userType == USER_TYPES.USER_TYPE_ADMIN) {
      var pushData = {
        payload: { success: true, message: 'Driver assigned', data: null },
        body: 'Scheduled request - Admin cancelled request',
        title: 'Scheduled request - Admin cancelled request'
      };
      var socketPayload = { success: true, message: 'Request cancelled', data: updatedData };

      _socketStore2.default.emitByUserId(updatedData.riderId, _socketEvents2.default.schedule_request_updated_rider, socketPayload);
      PushNotification.sendNotificationByUserIdAsync(updatedData.riderId, pushData);
      if (updatedData.assignedTo) {
        _socketStore2.default.emitByUserId(updatedData.assignedTo, _socketEvents2.default.schedule_request_updated_driver, socketPayload);
        PushNotification.sendNotificationByUserIdAsync(updatedData.assignedTo, pushData);
      }
    }
    // 2. notify admin and driver (if assigned) if rider cancel the request
    if (req.user.userType == USER_TYPES.USER_TYPE_RIDER) {
      var _pushData = {
        payload: { success: true, message: 'Request cancelled', data: null },
        body: 'Scheduled request - Admin cancelled request',
        title: 'Scheduled request - Admin cancelled request'
      };

      var _socketPayload = { success: true, message: 'Request cancelled', data: updatedData };
      // notify admin
      _socketStore2.default.emitByUserId(updatedData.adminId, _socketEvents2.default.schedule_request_updated_admin, _socketPayload);
      PushNotification.sendNotificationByUserIdAsync(updatedData.adminId, _pushData);
      // notify driver
      if (updatedData.assignedTo) {
        _socketStore2.default.emitByUserId(updatedData.assignedTo, _socketEvents2.default.schedule_request_updated_driver, _socketPayload);
        PushNotification.sendNotificationByUserIdAsync(updatedData.assignedTo, _pushData);
      }
    }
    res.send(returnObj);
  }).catch(function (err) {
    next(err);
  });
};

var adminDriversList = exports.adminDriversList = function adminDriversList(req, res, next) {

  var filter = { userType: 'driver', isActive: true, isDeleted: false, adminId: req.user._id };
  if (req.query.name) {
    var text = req.query.name;
    // var regex = new RegExp('[\\?&]' + text + '=([^&#]*)', 'i');
    filter.name = { $regex: text, $options: 'i' };
  }

  var _req$query2 = req.query,
      pageNo = _req$query2.pageNo,
      _req$query2$limit = _req$query2.limit,
      limit = _req$query2$limit === undefined ? _env2.default.limit : _req$query2$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  // find all driver under the same admin
  _user2.default.countAsync(filter)
  // eslint-disable-next-line
  .then(function (totalDriversRecord) {
    var returnObj = {
      success: true,
      message: 'Drivers found',
      data: null,
      meta: {
        totalNoOfPages: Math.ceil(totalDriversRecord / limit),
        limit: limit,
        currPageNo: pageNo,
        currNoOfRecord: 0
      }
    };
    if (totalDriversRecord < 1) {
      return res.send(returnObj);
    }
    if (skip > totalDriversRecord) {
      var err = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(err);
    }
    _user2.default.find(filter, { name: 1, email: 1, phoneNo: 1, profileUrl: 1 }).limit(limit).skip(skip).then(function (driversRecord) {
      returnObj.data = driversRecord;
      returnObj.message = 'drivers found';
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      return res.send(returnObj);
    }).catch(function (err) {
      var err = new _APIError2.default('Error finding vehicles', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
      res.send('Error', err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of users ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside getAllDrivers records');
    next(err);
  });
};

var assignDriver = exports.assignDriver = function () {
  var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(req, res, next) {
    var _req$body, driverId, requestId, isAssign, returnObj, queryDriver, foundDriver, updateAssign, scheduleTripToUpdate, prevDriverId, finalResult, eventData, pushData, socketPayload, _pushData2;

    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:

            console.log("                ");
            console.log("                ");
            console.log("                ");
            console.log("    PushNotification.sendNotificationByUserIdAsync    req", req.body);
            console.log("                ");
            console.log("                ");
            _req$body = req.body, driverId = _req$body.driverId, requestId = _req$body.requestId, isAssign = _req$body.isAssign;
            returnObj = { success: false, message: '', data: null };

            if (!(req.user.userType !== USER_TYPES.USER_TYPE_ADMIN)) {
              _context4.next = 11;
              break;
            }

            returnObj.message = "Unauthorized";
            return _context4.abrupt('return', res.send(returnObj));

          case 11:
            queryDriver = {
              _id: driverId
            };
            _context4.prev = 12;
            _context4.next = 15;
            return _user2.default.findOneAsync(queryDriver, { isDeleted: 1, email: 1, profileUrl: 1, isdCode: 1, phoneNo: 1 });

          case 15:
            foundDriver = _context4.sent;

            console.log("foundDriver>>>>>", (0, _stringify2.default)(foundDriver));

            if (foundDriver) {
              _context4.next = 22;
              break;
            }

            returnObj.message = "Driver not found";
            return _context4.abrupt('return', res.send(returnObj));

          case 22:
            if (!foundDriver.isDeleted) {
              _context4.next = 25;
              break;
            }

            returnObj.message = "Driver was deleted";
            return _context4.abrupt('return', res.send(returnObj));

          case 25:
            updateAssign = {
              assignedTo: foundDriver._id,
              status: SCHEDULE_TRIP_REQUEST_STATUS.TRIP_REQUEST_ASSIGNED,
              requestUpdatedTime: new Date().toISOString()
            };

            if (isAssign == false) {
              updateAssign.assignedTo = null;
              updateAssign.status = SCHEDULE_TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT;
            }
            _context4.next = 29;
            return _scheduledTripRequest2.default.findOneAsync({ _id: requestId });

          case 29:
            scheduleTripToUpdate = _context4.sent;
            prevDriverId = scheduleTripToUpdate.assignedTo;
            _context4.next = 33;
            return _scheduledTripRequest2.default.findOneAndUpdate({ _id: requestId }, { $set: updateAssign }, { new: true });

          case 33:
            finalResult = _context4.sent;

            console.log("finalResult", (0, _stringify2.default)(finalResult));
            returnObj.data = finalResult;
            returnObj.success = true;
            returnObj.message = 'Schedule trip requset updated';
            /**
             * notify rider with driver detail
             */
            eventData = { success: true, message: 'Driver assigned', data: foundDriver };

            if (isAssign == false) {
              eventData.message = "Driver unassigned, you will have other driver assigned by admin";
            }
            _socketStore2.default.emitByUserId(scheduleTripToUpdate.riderId, _socketEvents2.default.driver_assigned_request_rider, eventData);

            pushData = {
              payload: { success: true, message: 'Driver assigned', data: null },
              body: 'Scheduled request - Driver assigned',
              title: 'Scheduled request - Driver assigned'
            };

            console.log("                ");
            console.log("                ");
            console.log("                ");
            console.log("    PushNotification.sendNotificationByUserIdAsync    foundDriver._id)        ", foundDriver._id);
            console.log("                ");
            console.log("    PushNotification.sendNotificationByUserIdAsync            ", pushData);
            console.log("                ");
            if (isAssign == true) {
              PushNotification.sendNotificationByUserIdAsync(foundDriver._id, pushData);
            } else {
              if (prevDriverId) {
                pushData.payload.message = "Driver unassigned";
                pushData.body = "Scheduled request - Driver unassigned";
                pushData.title = "Scheduled request - Driver unassigned";
                PushNotification.sendNotificationByUserIdAsync(prevDriverId, pushData);
              }
              pushData.payload.message = "Driver unassigned, you will have other driver assigned by admin";
            }
            PushNotification.sendNotificationByUserIdAsync(scheduleTripToUpdate.riderId, pushData);
            /**
             * notify driver with socket event
             */
            socketPayload = { success: true, message: 'New request assigned', data: finalResult };

            socketPayload.data.isAssign = true;
            if (isAssign == false) {
              socketPayload.message = "Request unassigned";
              socketPayload.data.isAssign = false;
            }

            _socketStore2.default.emitByUserId(foundDriver._id, _socketEvents2.default.schedule_request_assign_driver, socketPayload);
            /**
             * notify previous driver
             */
            if (prevDriverId && !_mongoose2.default.Types.ObjectId(prevDriverId).equals(_mongoose2.default.Types.ObjectId(foundDriver._id)) && isAssign == true) {
              console.log("                ");
              console.log("  mongoose.Types.ObjectId(prevDriverId          ");

              _pushData2 = {
                payload: { success: true, message: 'Driver unassigned', data: null },
                body: 'Scheduled request - Driver unassigned',
                title: 'Scheduled request - Driver unassigned'
              };

              PushNotification.sendNotificationByUserIdAsync(prevDriverId, _pushData2);

              socketPayload.message = "Request unassigned";
              socketPayload.data.isAssign = false;
              _socketStore2.default.emitByUserId(prevDriverId, _socketEvents2.default.schedule_request_assign_driver, socketPayload);
            }

            return _context4.abrupt('return', res.send(returnObj));

          case 57:
            _context4.next = 62;
            break;

          case 59:
            _context4.prev = 59;
            _context4.t0 = _context4['catch'](12);

            next(_context4.t0);

          case 62:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined, [[12, 59]]);
  }));

  return function assignDriver(_x6, _x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();

var acceptRequest = exports.acceptRequest = function () {
  var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(req, res, next) {
    var newStatus, returnObj, requestToUpdate, updatedData, socketPayload;
    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            newStatus = SCHEDULE_TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED;
            returnObj = {
              data: null,
              message: '',
              success: false
            };


            if (req.user.userType != USER_TYPES.USER_TYPE_DRIVER) {
              returnObj.message = "Unauthorized";
              res.send(returnObj);
            }

            if (!(req.body.requestId == "")) {
              _context5.next = 6;
              break;
            }

            returnObj.message = "Invalid trip request id";
            return _context5.abrupt('return', res.send(returnObj));

          case 6:
            _context5.prev = 6;
            _context5.next = 9;
            return _scheduledTripRequest2.default.findOneAsync({ _id: req.body.requestId });

          case 9:
            requestToUpdate = _context5.sent;

            if (requestToUpdate) {
              _context5.next = 13;
              break;
            }

            returnObj.message = "Request not found";
            return _context5.abrupt('return', res.send(returnObj));

          case 13:
            if (!requestToUpdate.isDeleted) {
              _context5.next = 16;
              break;
            }

            returnObj.message = "Request was deleted";
            return _context5.abrupt('return', res.send(returnObj));

          case 16:
            if (!(requestToUpdate.status == SCHEDULE_TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED)) {
              _context5.next = 19;
              break;
            }

            returnObj.message = "Request was already accepted";
            return _context5.abrupt('return', res.send(returnObj));

          case 19:
            if (!(!requestToUpdate.assignedTo || requestToUpdate.assignedTo == "")) {
              _context5.next = 22;
              break;
            }

            returnObj.message = "No driver assigned on the request";
            return _context5.abrupt('return', res.send(returnObj));

          case 22:
            if (_mongoose2.default.Types.ObjectId(req.user._id).equals(_mongoose2.default.Types.ObjectId(requestToUpdate.assignedTo))) {
              _context5.next = 25;
              break;
            }

            returnObj.message = "Request may have assigned another driver";
            return _context5.abrupt('return', res.send(returnObj));

          case 25:
            _context5.next = 27;
            return _scheduledTripRequest2.default.findOneAndUpdateAsync({ _id: req.body.requestId, isDeleted: false }, { $set: { status: newStatus } }, { new: true });

          case 27:
            updatedData = _context5.sent;

            returnObj.success = true;
            returnObj.message = "Request Accepted";
            returnObj.data = updatedData;

            socketPayload = { success: true, message: 'Request accepted', data: updatedData };

            _socketStore2.default.emitByUserId(requestToUpdate.adminId, _socketEvents2.default.schedule_request_updated_admin, socketPayload);

            _socketStore2.default.emitByUserId(requestToUpdate.riderId, _socketEvents2.default.schedule_request_updated_rider, socketPayload);
            return _context5.abrupt('return', res.send(returnObj));

          case 37:
            _context5.prev = 37;
            _context5.t0 = _context5['catch'](6);

            next(_context5.t0);

          case 40:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, undefined, [[6, 37]]);
  }));

  return function acceptRequest(_x9, _x10, _x11) {
    return _ref5.apply(this, arguments);
  };
}();

var rejectRequest = exports.rejectRequest = function () {
  var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(req, res, next) {
    var newStatus, returnObj, requestToUpdate, updatedData, socketPayload;
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            newStatus = SCHEDULE_TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED;
            returnObj = {
              data: null,
              message: '',
              success: false
            };


            if (req.user.userType != USER_TYPES.USER_TYPE_DRIVER) {
              returnObj.message = "Unauthorized";
              res.send(returnObj);
            }

            if (!(req.body.requestId == "")) {
              _context6.next = 6;
              break;
            }

            returnObj.message = "Invalid trip request id";
            return _context6.abrupt('return', res.send(returnObj));

          case 6:
            _context6.prev = 6;
            _context6.next = 9;
            return _scheduledTripRequest2.default.findOneAsync({ _id: req.body.requestId });

          case 9:
            requestToUpdate = _context6.sent;

            if (requestToUpdate) {
              _context6.next = 13;
              break;
            }

            returnObj.message = "Request not found";
            return _context6.abrupt('return', res.send(returnObj));

          case 13:
            if (!(requestToUpdate.status == SCHEDULE_TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED)) {
              _context6.next = 16;
              break;
            }

            returnObj.message = "Request was already rejected";
            return _context6.abrupt('return', res.send(returnObj));

          case 16:
            if (!requestToUpdate.isDeleted) {
              _context6.next = 19;
              break;
            }

            returnObj.message = "Request was deleted";
            return _context6.abrupt('return', res.send(returnObj));

          case 19:
            if (!(!requestToUpdate.assignedTo || requestToUpdate.assignedTo == "")) {
              _context6.next = 22;
              break;
            }

            returnObj.message = "No driver assigned on the request";
            return _context6.abrupt('return', res.send(returnObj));

          case 22:
            if (_mongoose2.default.Types.ObjectId(req.user._id).equals(_mongoose2.default.Types.ObjectId(requestToUpdate.assignedTo))) {
              _context6.next = 25;
              break;
            }

            returnObj.message = "Request may have assigned another driver";
            return _context6.abrupt('return', res.send(returnObj));

          case 25:
            _context6.next = 27;
            return _scheduledTripRequest2.default.findOneAndUpdateAsync({ _id: req.body.requestId, isDeleted: false }, { $set: { status: newStatus } }, { new: true });

          case 27:
            updatedData = _context6.sent;

            returnObj.success = true;
            returnObj.message = "Request rejected";
            returnObj.data = updatedData;
            // notify admin via socket event
            socketPayload = { success: true, message: 'Request rejected', data: updatedData };

            _socketStore2.default.emitByUserId(requestToUpdate.adminId, _socketEvents2.default.schedule_request_updated_admin, socketPayload);
            _socketStore2.default.emitByUserId(requestToUpdate.riderId, _socketEvents2.default.schedule_request_updated_rider, socketPayload);
            return _context6.abrupt('return', res.send(returnObj));

          case 37:
            _context6.prev = 37;
            _context6.t0 = _context6['catch'](6);

            next(_context6.t0);

          case 40:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, undefined, [[6, 37]]);
  }));

  return function rejectRequest(_x12, _x13, _x14) {
    return _ref6.apply(this, arguments);
  };
}();

function addScheduleRequestAsync(reqData, req) {
  var _this = this;

  var returnObj = { success: false, message: '', data: null };
  return new _promise2.default(function () {
    var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7(resolve, reject) {
      var isValid, result, newScheduleTripRequest;
      return _regenerator2.default.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              if (!(req.user.userType === USER_TYPES.USER_TYPE_ADMIN || req.user.userType === USER_TYPES.USER_TYPE_DRIVER)) {
                _context7.next = 7;
                break;
              }

              if (!(!reqData.phoneNo || reqData.phoneNo == "")) {
                _context7.next = 4;
                break;
              }

              returnObj.message = "Phone No is required";
              return _context7.abrupt('return', res.send(returnObj));

            case 4:
              if (!(!reqData.isdCode || reqData.isdCode == "")) {
                _context7.next = 7;
                break;
              }

              returnObj.message = "ISD code is required";
              return _context7.abrupt('return', res.send(returnObj));

            case 7:
              if (reqData.sourceLoc) {
                _context7.next = 12;
                break;
              }

              returnObj.message = "source is required";
              return _context7.abrupt('return', resolve(returnObj));

            case 12:
              if (reqData.destLoc) {
                _context7.next = 17;
                break;
              }

              returnObj.message = "destination is required";
              return _context7.abrupt('return', resolve(returnObj));

            case 17:
              if (reqData.seatBooked) {
                _context7.next = 22;
                break;
              }

              returnObj.message = "seats required";
              return _context7.abrupt('return', resolve(returnObj));

            case 22:
              if (reqData.scheduledTime) {
                _context7.next = 25;
                break;
              }

              returnObj.message = "schedule time is required";
              return _context7.abrupt('return', resolve(returnObj));

            case 25:
              _context7.next = 27;
              return validateSrcDestLocationsAsync(reqData);

            case 27:
              isValid = _context7.sent;

              if (isValid) {
                _context7.next = 31;
                break;
              }

              returnObj.message = "No service at this location";
              return _context7.abrupt('return', resolve(returnObj));

            case 31:

              // check if same request existing

              result = checkIfSameRequestExistAsync({ riderId: reqData.riderId, scheduledTime: reqData.scheduledTime, adminId: reqData.adminId });

              if (!result.success) {
                _context7.next = 35;
                break;
              }

              returnObj.message = result.message;
              return _context7.abrupt('return', resolve(returnObj));

            case 35:
              newScheduleTripRequest = new _scheduledTripRequest2.default({
                createdBy: reqData.createdBy,
                status: SCHEDULE_TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT,
                riderId: reqData.riderId,
                adminId: reqData.adminId,
                srcLoc: reqData.sourceLoc,
                destLoc: reqData.destLoc,
                seatBooked: parseInt(reqData.seatBooked),
                scheduledTime: reqData.scheduledTime ? new Date(reqData.scheduledTime).toISOString() : scheduleTripData.scheduledTime
              });

              newScheduleTripRequest.saveAsync().then(function (savedScheduleTripRequest) {
                returnObj.success = true;
                returnObj.message = 'request submitted successfully';
                returnObj.data = savedScheduleTripRequest;
                /**
                 * notify admin about new scheduled request if created by rider
                 */

                if (req.user.userType === USER_TYPES.USER_TYPE_RIDER) {
                  var socketPayload = { success: true, message: 'New request scheduled', data: savedScheduleTripRequest };
                  _socketStore2.default.emitByUserId(reqData.adminId, _socketEvents2.default.schedule_request_added_admin, socketPayload);
                }

                /**
                 * notify rider about new scheduled request if created by admin/driver
                 */
                if (req.user.userType === USER_TYPES.USER_TYPE_ADMIN || req.user.userType === USER_TYPES.USER_TYPE_DRIVER) {
                  var scheduledTime = reqData.scheduledTime && (0, _moment2.default)(reqData.scheduledTime).format("YYYY-MM-DD HH:mm") || "";
                  var smsText = 'Your trip has been scheduled at ' + scheduledTime + ' ';
                  var fromToText = reqData.sourceLoc && reqData.sourceLoc.name && reqData.destLoc && reqData.destLoc.name && 'from ' + reqData.sourceLoc.name + ' to ' + reqData.destLoc.name || '';
                  smsText += fromToText;
                  (0, _smsApi.sendSms)(reqData.riderId, smsText, function (err, data) {
                    if (err) {
                      console.log(err); // eslint-disable-line no-console
                    } else {
                      console.log("sms sent -", smsText);
                      console.log(data); // eslint-disable-line no-console
                    }
                  });
                }
                return resolve(returnObj);
              }).catch(function (e) {
                console.log("Error while Creating request", e);
                var error = new _APIError2.default('Error while Creating request', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
                reject(error);
              });

            case 37:
            case 'end':
              return _context7.stop();
          }
        }
      }, _callee7, _this);
    }));

    return function (_x15, _x16) {
      return _ref7.apply(this, arguments);
    };
  }());
}

function updateScheduleRequestAsync(reqData, req) {
  var _this2 = this;

  var returnObj = { success: false, message: '', data: null };
  return new _promise2.default(function () {
    var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8(resolve, reject) {
      var _scheduleTripData, updateData, result, isValid, query, updatedData, socketPayload, riderDetail, riderUpdateInfo, riderQuery, riderInfoToUpdate, userUpdatedInfo, error;

      return _regenerator2.default.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              _context8.prev = 0;
              _context8.next = 3;
              return _scheduledTripRequest2.default.findOneAsync({ _id: reqData.requestId });

            case 3:
              _scheduleTripData = _context8.sent;

              if (!_scheduleTripData) {
                _context8.next = 61;
                break;
              }

              updateData = {
                requestUpdatedTime: new Date().toISOString(),
                adminId: reqData.adminId,
                seatBooked: reqData.seatBooked ? parseInt(reqData.seatBooked) : _scheduleTripData.seatBooked,
                srcLoc: reqData.sourceLoc ? reqData.sourceLoc : _scheduleTripData.srcLoc,
                destLoc: reqData.destLoc ? reqData.destLoc : _scheduleTripData.destLoc,
                scheduledTime: reqData.scheduledTime ? new Date(reqData.scheduledTime).toISOString() : _scheduleTripData.scheduledTime

                // check if same request existing

              };
              result = checkIfSameRequestExistAsync({ riderId: _scheduleTripData.riderId, scheduledTime: reqData.scheduledTime, requestId: reqData.requestId });

              if (!result.success) {
                _context8.next = 10;
                break;
              }

              returnObj.message = result.message;
              return _context8.abrupt('return', returnObj);

            case 10:
              if (!(reqData.sourceLoc || reqData.destLoc)) {
                _context8.next = 19;
                break;
              }

              reqData.sourceLoc = updateData.srcLoc;
              reqData.destLoc = updateData.destLoc;

              _context8.next = 15;
              return validateSrcDestLocationsAsync(reqData);

            case 15:
              isValid = _context8.sent;

              if (isValid) {
                _context8.next = 19;
                break;
              }

              returnObj.message = "No service at this location";
              return _context8.abrupt('return', resolve(returnObj));

            case 19:
              query = { _id: reqData.requestId };
              _context8.next = 22;
              return _scheduledTripRequest2.default.findOneAndUpdateAsync(query, updateData, { new: true });

            case 22:
              updatedData = _context8.sent;

              if (!updatedData) {
                _context8.next = 56;
                break;
              }

              returnObj.success = true;
              returnObj.message = "Updated successfully";
              returnObj.data = updateData;

              if (!(req.user.userType == USER_TYPES.USER_TYPE_RIDER)) {
                _context8.next = 31;
                break;
              }

              socketPayload = { success: true, message: 'Request updated', data: updatedData };

              _socketStore2.default.emitByUserId(updatedData.adminId, _socketEvents2.default.schedule_request_updated_admin, socketPayload);
              return _context8.abrupt('return', resolve(returnObj));

            case 31:
              _context8.next = 33;
              return _user2.default.findOneAsync({ _id: updatedData.riderId });

            case 33:
              riderDetail = _context8.sent;

              if (!(riderDetail.userType == USER_TYPES.USER_TYPE_RIDER)) {
                _context8.next = 38;
                break;
              }

              // rider details can not be updated by the admin/driver if it is not anonymous
              returnObj.success = true;
              returnObj.message = "Updated successfully";
              return _context8.abrupt('return', returnObj);

            case 38:
              riderUpdateInfo = {};


              console.log("req props>>>>>>>>", req.name, req.phoneNo, req.isdCode);
              if (reqData.name && reqData.name != "") {
                riderUpdateInfo.name = reqData.name;
              }

              if (reqData.isdCode && reqData.isdCode != "") {
                riderUpdateInfo.isdCode = reqData.isdCode;
              }

              if (reqData.phoneNo && reqData.phoneNo != "") {
                riderUpdateInfo.phoneNo = reqData.phoneNo;
              }

              console.log("_.isEmpty(riderUpdateInfo", _underscore2.default.isEmpty(riderUpdateInfo), (0, _stringify2.default)(riderUpdateInfo));

              if (_underscore2.default.isEmpty(riderUpdateInfo)) {
                _context8.next = 53;
                break;
              }

              riderQuery = { _id: riderDetail._id };
              riderInfoToUpdate = { $set: riderUpdateInfo };
              _context8.next = 49;
              return _user2.default.findOneAndUpdateAsync(riderQuery, riderInfoToUpdate, { new: true });

            case 49:
              userUpdatedInfo = _context8.sent;

              returnObj.success = true;
              returnObj.message = "Updated successfully";
              returnObj.data = updatedData;

            case 53:
              return _context8.abrupt('return', resolve(returnObj));

            case 56:
              returnObj.success = false;
              returnObj.message = 'Something went wrong';
              return _context8.abrupt('return', resolve(returnObj));

            case 59:
              _context8.next = 64;
              break;

            case 61:
              returnObj.success = false;
              returnObj.message = 'No request found';
              return _context8.abrupt('return', resolve(returnObj));

            case 64:
              _context8.next = 71;
              break;

            case 66:
              _context8.prev = 66;
              _context8.t0 = _context8['catch'](0);

              console.log("Error while checking request", _context8.t0);
              error = new _APIError2.default('Error while checking request', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);

              reject(error);

            case 71:
            case 'end':
              return _context8.stop();
          }
        }
      }, _callee8, _this2, [[0, 66]]);
    }));

    return function (_x17, _x18) {
      return _ref8.apply(this, arguments);
    };
  }());
}

function saveAnonymousRider(reqData) {
  var newPassword = randomstring.generate({
    length: 8
  });
  var userObj = new _user2.default({
    email: "anonymous@abcxyz.com",
    password: newPassword,
    userType: USER_TYPES.USER_TYPE_ANONYMOUS,
    name: reqData.name,
    fname: reqData.name,
    riderAddedById: reqData.createdBy,
    phoneNo: reqData.phoneNo,
    isdCode: reqData.isdCode,
    countryCode: reqData.countryCode,
    countryName: reqData.countryName
  });
  return userObj.saveAsync();
}

function validateReqAdminSettingsAsync(reqData) {
  var returnObj = { success: false, message: '', data: null };
  /**
   * 1. holiday
   * 2. working hours daywise
   * 3. in between next seven days
   * 4. if admin allow scheduling
   */
  var today = new Date();
  var dateAfterSevenDays = (0, _moment2.default)(today).add(7, 'days');

  var dateAfterThirtyMins = (0, _moment2.default)(today).add(30, 'minutes');

  return new _promise2.default(function (resolve, reject) {
    console.log("moment(reqData.scheduledTime)", (0, _moment2.default)(reqData.scheduledTime));
    console.log("moment(dateAfterThirtyMins)", dateAfterThirtyMins);
    console.log("moment(dateAfterThirtyMins)", (0, _moment2.default)(dateAfterThirtyMins).diff(reqData.scheduledTime));

    if (new Date(reqData.scheduledTime).getTime() - today.getTime() < 1800000) {
      returnObj.message = "Schedule trip can be booked in minimum 30 minutes advance";
      return resolve(returnObj);
    }

    // check if advance booking is not more than seven days
    if (!(0, _moment2.default)(reqData.scheduledTime).isBetween(today, dateAfterSevenDays)) {
      returnObj.message = "Schedule trip can be booked in 7 days advance";
      return resolve(returnObj);
    }

    _user2.default.findOneAsync({ _id: reqData.adminId }).then(function (admin) {
      if (!admin) {
        returnObj.message = "Service provider not found";
        return resolve(returnObj);
      }

      // if admin allow scheduling
      if (!admin.settings.allowScheduleTrips) {
        returnObj.message = "Service provider does not allow schedule trip service";
        return resolve(returnObj);
      }

      var adminSettings = admin.settings;
      var holidayIndex = adminSettings.holidays.findIndex(function (holiday, index) {
        return checkIfHoliday(holiday.date, reqData.scheduledTime);
      });

      if (holidayIndex >= 0) {
        returnObj.message = "It's holiday";
        return resolve(returnObj);
      }

      // check if not in time slot of the requested day
      // need to fix time setting on web while setting time slots

      if (!isWorkingTime(reqData.scheduledTime, admin.settings)) {
        returnObj.message = "No service on requested time";
        return resolve(returnObj);
      }

      returnObj.success = true;
      return resolve(returnObj);
    });
  });
}

function checkIfHoliday(holiday, requestedDate) {
  console.log("comparing holiday requestedDate", holiday, requestedDate);
  var requestedDateMoment = (0, _moment2.default)(requestedDate);
  var holidayMoment = (0, _moment2.default)(holiday);

  requestedDateMoment.utc();
  holidayMoment.utc();
  console.log("formatted holiday requestDate", holidayMoment.format(), requestedDateMoment.format());
  console.log("result of comparison", requestedDateMoment.isSame(holidayMoment, 'date'));
  return requestedDateMoment.isSame((0, _moment2.default)(holiday), 'date');
}

function isWorkingTime(dateTime, adminSettings) {
  var workingStartTimeMs = adminSettings.dayTimings.monday.slots[0].startTime;
  var workingEndTimeMs = adminSettings.dayTimings.monday.slots[0].endTime;
  var reqScheduledTimeMilisec = _util2.default.hmsToms(dateTime);
  console.log("time slot checking workingStartTimeMs workingEndTimeMs reqScheduledTimeMilisec", workingStartTimeMs, workingEndTimeMs, reqScheduledTimeMilisec);
  if (reqScheduledTimeMilisec >= workingStartTimeMs && reqScheduledTimeMilisec <= workingEndTimeMs) {
    return true;
  } else {
    return false;
  };
}

function checkIfSameRequestExistAsync(data) {
  var returnObj = { success: false, message: '', data: null };

  return new _promise2.default(function (resolve, reject) {
    if (data.requestId && data.requestId != "") {
      // return if editing request
      returnObj.message = 'No pending scheduled trip';
      return resolve(returnObj);
    }

    var query = {
      $and: [{ riderId: data.riderId }, { scheduledTime: new Date(data.scheduledTime).toISOString() }, { scheduledTime: { "$gt": new Date().toISOString() } }]
    };
    console.log("checkIfSameRequestExistAsync", (0, _stringify2.default)(query));
    _scheduledTripRequest2.default.findOneAsync(query).then(function (scheduleTripData) {
      console.log("checkIfSameRequestExistAsync", (0, _stringify2.default)(scheduleTripData));
      if (scheduleTripData) {
        returnObj.success = true;
        returnObj.message = 'Already pending scheduled trip';
        return resolve(returnObj);
      } else {
        returnObj.message = 'No pending scheduled trip';
        return resolve(returnObj);
      }
    }).catch(function (err) {
      console.log("Error while checking request", err);
      var error = new _APIError2.default('Error while checking request', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
      return reject(error);
    });
  });
}

function validateSrcDestLocationsAsync(reqData) {
  var sourceLoc = reqData.sourceLoc;
  var destLoc = reqData.destLoc;
  return new _promise2.default(function (resolve, reject) {
    // check if the source and destination exists in admin locations
    var locationPipelineStages = [{ $match: {
        userIdAdmin: _mongoose2.default.Types.ObjectId(reqData.adminId),
        polygons: {
          $geoIntersects: {
            $geometry: { "type": "Point", "coordinates": sourceLoc.loc }
          }
        }
      } }, { $match: {
        polygons: {
          $geoIntersects: {
            $geometry: { "type": "Point", "coordinates": destLoc.loc }
          }
        }
      } }];

    console.log("locationPipelineStages>>>>>>>>>>", (0, _stringify2.default)(locationPipelineStages));

    _adminLocation2.default.aggregate(locationPipelineStages).then(function (foundLocations) {
      console.log("foundLocations", foundLocations);
      if (foundLocations && foundLocations.length) {
        return resolve(true);
      } else {
        return resolve(false);
      }
    }).catch(function (err) {
      var error = new _APIError2.default('no service at this location', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
      return reject(error);
    });
  });
}
//# sourceMappingURL=schedule-trip-request.js.map
