'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.processScheduledRequests = exports.notifyIfDriverNotActive = exports.notifyNextHourAcceptedRequest = undefined;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _trip = require('../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _tripRequestStatuses = require('../constants/trip-request-statuses');

var TRIP_REQUEST_STATUS = _interopRequireWildcard(_tripRequestStatuses);

var _scheduledTripRequest = require('../models/scheduledTripRequest');

var _scheduledTripRequest2 = _interopRequireDefault(_scheduledTripRequest);

var _tripRequest = require('../models/tripRequest');

var _tripRequest2 = _interopRequireDefault(_tripRequest);

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

var _scheduleRequestStatuses = require('../constants/schedule-request-statuses');

var ScheduledRequestStatus = _interopRequireWildcard(_scheduleRequestStatuses);

var _socketEvents = require('../constants/socket-events');

var _socketEvents2 = _interopRequireDefault(_socketEvents);

var _pushNotification = require('../service/pushNotification');

var PushNotification = _interopRequireWildcard(_pushNotification);

var _socketStore = require('../service/socket-store');

var _socketStore2 = _interopRequireDefault(_socketStore);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getAcceptedRequestsNextHourAsync = function getAcceptedRequestsNextHourAsync() {
  return new _promise2.default(function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(resolve, reject) {
      var currentDate, nextOneHourDate, dateToMatch, queryFilters, query, pipelineStages, requestsFound;
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              currentDate = (0, _moment2.default)();
              // convert current date into utc to compare with db stored utc scheduled time

              currentDate.utc();

              nextOneHourDate = currentDate.add(1, 'hours');
              dateToMatch = nextOneHourDate.format("YYYY-MM-DD HH:mm");
              queryFilters = [{
                isDeleted: false,
                status: ScheduledRequestStatus.TRIP_REQUEST_ACCEPTED,
                scheduledTimePart: dateToMatch
              }];
              query = { $and: queryFilters };
              pipelineStages = [{
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
                  scheduledTimePart: { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$scheduledTime" } },
                  riderId: "$riderId",
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
                    profileUrl: "$riderInfo.profileUrl"
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
              _context.next = 11;
              return _scheduledTripRequest2.default.aggregateAsync(pipelineStages);

            case 11:
              requestsFound = _context.sent;
              return _context.abrupt('return', resolve(requestsFound));

            case 15:
              _context.prev = 15;
              _context.t0 = _context['catch'](0);
              return _context.abrupt('return', reject(_context.t0));

            case 18:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, undefined, [[0, 15]]);
    }));

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }());
};

var getRequestsToNotifyIfNoActiveTrip = function getRequestsToNotifyIfNoActiveTrip() {
  return new _promise2.default(function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(resolve, reject) {
      var currentDate, nextOneHourDate, dateToMatch, queryFilters, query, pipelineStages, requestsFound;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              currentDate = (0, _moment2.default)();
              // convert current date into utc to compare with db stored utc scheduled time

              currentDate.utc();

              nextOneHourDate = currentDate.add(30, 'minutes');
              dateToMatch = nextOneHourDate.format("YYYY-MM-DD HH:mm");
              queryFilters = [{
                isDeleted: false,
                status: ScheduledRequestStatus.TRIP_REQUEST_ACCEPTED,
                scheduledTimePart: dateToMatch
              }];
              query = { $and: queryFilters };
              pipelineStages = [{
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
                  scheduledTimePart: { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$scheduledTime" } },
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
                    profileUrl: "$riderInfo.profileUrl"
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
              _context2.next = 11;
              return _scheduledTripRequest2.default.aggregateAsync(pipelineStages);

            case 11:
              requestsFound = _context2.sent;
              return _context2.abrupt('return', resolve(requestsFound));

            case 15:
              _context2.prev = 15;
              _context2.t0 = _context2['catch'](0);
              return _context2.abrupt('return', reject(_context2.t0));

            case 18:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, undefined, [[0, 15]]);
    }));

    return function (_x3, _x4) {
      return _ref2.apply(this, arguments);
    };
  }());
};

var getRequestsToProcessAsync = function getRequestsToProcessAsync() {
  return new _promise2.default(function () {
    var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(resolve, reject) {
      var currentDate, dateToMatch, queryFilters, query, pipelineStages, requestsFound;
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.prev = 0;
              currentDate = (0, _moment2.default)();
              // convert current date into utc to compare with db stored utc scheduled time

              currentDate.utc();

              dateToMatch = currentDate.format("YYYY-MM-DD HH:mm");
              queryFilters = [{
                isDeleted: false,
                status: ScheduledRequestStatus.TRIP_REQUEST_ACCEPTED,
                scheduledTimePart: dateToMatch
              }];
              query = { $and: queryFilters };
              pipelineStages = [{
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
                  scheduledTimePart: { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$scheduledTime" } },
                  riderId: "$riderId",
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
                    profileUrl: "$riderInfo.profileUrl"
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
              _context3.next = 10;
              return _scheduledTripRequest2.default.aggregateAsync(pipelineStages);

            case 10:
              requestsFound = _context3.sent;
              return _context3.abrupt('return', resolve(requestsFound));

            case 14:
              _context3.prev = 14;
              _context3.t0 = _context3['catch'](0);
              return _context3.abrupt('return', reject(_context3.t0));

            case 17:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, undefined, [[0, 14]]);
    }));

    return function (_x5, _x6) {
      return _ref3.apply(this, arguments);
    };
  }());
};

var creatNewTripRequestAsync = function creatNewTripRequestAsync(scheduledTripRequest, trip) {
  var tripRequestObj = new _tripRequest2.default({
    riderId: scheduledTripRequest.riderId,
    driverId: scheduledTripRequest.driverId,
    tripId: trip._id,
    adminId: scheduledTripRequest.adminId,
    seatBooked: scheduledTripRequest.seatBooked,
    srcLoc: scheduledTripRequest.srcLoc,
    destLoc: scheduledTripRequest.destLoc,
    isScheduled: true,
    scheduledRequestId: scheduledTripRequest._id,
    tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT
  });

  return tripRequestObj.saveAsync();
};

var notifyDriverAdminTripStatus = function notifyDriverAdminTripStatus(driverId, event, payload) {
  var resPayload = (0, _extends3.default)({}, payload);
  var query = {
    'driver._id': driverId,
    activeStatus: true
  };
  _trip2.default.findOne(query, { "activeStatus": 1, "visitedTerminal": 1, "gpsLoc": 1 }).populate([{ path: 'driverId', select: 'name email' }]).then(function (result) {
    if (result) {
      resPayload.tripData = result;
      _socketStore2.default.emitByUserId(payload.data.tripId, event, resPayload);
    }
  });
};

var sendRequestToDriverAsync = function sendRequestToDriverAsync(tripRequestObj, driver) {

  return new _promise2.default(function () {
    var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(resolve, reject) {
      var resToDriver, riderDetailsToDriver, riderDetails, pushData, udpatedTrip, resData;
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.prev = 0;

              if (!tripRequestObj) {
                _context4.next = 20;
                break;
              }

              // eslint-disable-next-line
              resToDriver = (0, _extends3.default)({}, tripRequestObj._doc);
              riderDetailsToDriver = {
                name: 1, email: 1, profileUrl: 1, phoneNo: 1, isdCode: 1
              };
              _context4.next = 6;
              return _user2.default.findOneAsync(tripRequestObj.riderId, riderDetailsToDriver);

            case 6:
              riderDetails = _context4.sent;

              console.log("riderDetails to driver", (0, _stringify2.default)(riderDetails));
              resToDriver.riderDetails = riderDetails;
              _socketStore2.default.emitByUserId(driver._id, 'requestDriver', { success: true, message: "Request received", data: resToDriver });
              notifyDriverAdminTripStatus(driver._id, 'requestAdmin', { success: true, message: "Request received", data: resToDriver });
              pushData = {
                payload: { success: true, message: 'Request Sent to the driver', data: resToDriver },
                body: 'New request received from the rider: ' + resToDriver.riderDetails.name,
                title: 'New Request received'
              };

              PushNotification.sendNotificationByUserIdAsync(driver._id, pushData);
              _context4.next = 15;
              return _trip2.default.findOneAndUpdateAsync({ 'driver._id': tripRequestObj.driverId, activeStatus: true }, { $addToSet: { tripRequests: tripRequestObj } }, { new: true });

            case 15:
              udpatedTrip = _context4.sent;
              resData = {
                tripRequest: tripRequestObj,
                driver: driver
              };
              return _context4.abrupt('return', resolve(resData));

            case 20:
              return _context4.abrupt('return', resolve(null));

            case 21:
              _context4.next = 26;
              break;

            case 23:
              _context4.prev = 23;
              _context4.t0 = _context4['catch'](0);
              return _context4.abrupt('return', reject(_context4.t0));

            case 26:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, undefined, [[0, 23]]);
    }));

    return function (_x7, _x8) {
      return _ref4.apply(this, arguments);
    };
  }());
};

var notifyNextHourAcceptedRequest = exports.notifyNextHourAcceptedRequest = function () {
  var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5() {
    var requestsFound;
    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;
            _context5.next = 3;
            return getAcceptedRequestsNextHourAsync();

          case 3:
            requestsFound = _context5.sent;

            if (requestsFound && requestsFound.length) {
              requestsFound.forEach(function (request, index) {
                // notify rider via socket event
                var eventPayload = { success: true, message: 'You have scheduled trip after 1 hour', data: request };
                _socketStore2.default.emitByUserId(request.riderId, _socketEvents2.default.scheduled_trip_notification, eventPayload);
                console.log('request found>>>>' + index, (0, _stringify2.default)(request));
                var pushData = {
                  payload: { success: true, message: 'You have scheduled trip after 1 hour', data: null },
                  body: 'Scheduled request - scheduled trip after 1 hour',
                  title: 'Scheduled request - scheduled trip after 1 hour'
                };

                PushNotification.sendNotificationByUserIdAsync(request.riderId, pushData);

                // notify driver via socket event
                eventPayload = { success: true, message: 'You have scheduled trip after 1 hour', data: request };
                _socketStore2.default.emitByUserId(request.assignedTo, _socketEvents2.default.scheduled_trip_notification, eventPayload);
                console.log('request found>>>>' + index, (0, _stringify2.default)(request));
                pushData = {
                  payload: { success: true, message: 'You have scheduled trip after 1 hour', data: null },
                  body: 'Scheduled request - You have scheduled trip after 1 hour',
                  title: 'Scheduled request - You have scheduled trip after 1 hour'
                };
                PushNotification.sendNotificationByUserIdAsync(request.assignedTo, pushData);
              });
            } else {
              console.log("getAcceptedRequestsNextHour result >>>>>>> ", requestsFound);
            }
            _context5.next = 10;
            break;

          case 7:
            _context5.prev = 7;
            _context5.t0 = _context5['catch'](0);

            console.log('getAcceptedRequestsNextHour error>>>>', _context5.t0);

          case 10:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, undefined, [[0, 7]]);
  }));

  return function notifyNextHourAcceptedRequest() {
    return _ref5.apply(this, arguments);
  };
}();

var notifyIfDriverNotActive = exports.notifyIfDriverNotActive = function () {
  var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7() {
    var requestsFound;
    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;
            _context7.next = 3;
            return getRequestsToNotifyIfNoActiveTrip();

          case 3:
            requestsFound = _context7.sent;


            if (requestsFound && requestsFound.length) {
              requestsFound.forEach(function () {
                var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(request, index) {
                  var activeTripQuery, driverActiveTrip, assignedDriver, eventPayload, pushData;
                  return _regenerator2.default.wrap(function _callee6$(_context6) {
                    while (1) {
                      switch (_context6.prev = _context6.next) {
                        case 0:
                          // check driver trip if active
                          activeTripQuery = {
                            activeStatus: true, "driver._id": request.assignedTo
                          };
                          _context6.next = 3;
                          return _trip2.default.findOneAsync(activeTripQuery);

                        case 3:
                          driverActiveTrip = _context6.sent;

                          console.log("check driver trip if active-trip", (0, _stringify2.default)(driverActiveTrip));

                          if (!driverActiveTrip) {
                            _context6.next = 7;
                            break;
                          }

                          return _context6.abrupt('return', true);

                        case 7:
                          _context6.next = 9;
                          return _user2.default.findOneAsync({ _id: request.assignedTo });

                        case 9:
                          assignedDriver = _context6.sent;

                          console.log("check driver trip if active-driver assigned", (0, _stringify2.default)(assignedDriver));

                          if (assignedDriver) {
                            _context6.next = 15;
                            break;
                          }

                          return _context6.abrupt('return', true);

                        case 15:
                          if (!assignedDriver.isDeleted) {
                            _context6.next = 17;
                            break;
                          }

                          return _context6.abrupt('return', true);

                        case 17:
                          // notify admin via socket event
                          eventPayload = {
                            success: true,
                            message: 'Driver has scheduled trip after 30 min, but no active trip. Please contact +' + assignedDriver.isdCode + assignedDriver.phoneNo,
                            data: request
                          };


                          _socketStore2.default.emitByUserId(request.adminId, _socketEvents2.default.no_active_trip, eventPayload);
                          console.log('request found>>>>' + index, (0, _stringify2.default)(request));
                          pushData = {
                            payload: { success: true, message: 'Driver has no active trip', data: null },
                            body: 'Scheduled request - Driver has no active trip',
                            title: 'Scheduled request - Driver has no active trip'
                          };

                          PushNotification.sendNotificationByUserIdAsync(request.adminId, pushData);

                          // notify driver via socket event
                          eventPayload = { success: true, message: 'You have scheduled trip in 30 min, please activate trip', data: request };
                          _socketStore2.default.emitByUserId(request.assignedTo, _socketEvents2.default.no_active_trip, eventPayload);
                          console.log('request found>>>>' + index, (0, _stringify2.default)(request));
                          pushData = {
                            payload: { success: true, message: 'You have scheduled trip after 30 min, please activate trip', data: null },
                            body: 'Scheduled request - scheduled trip after 30 min',
                            title: 'Scheduled request - scheduled trip after 30 min'
                          };
                          PushNotification.sendNotificationByUserIdAsync(request.assignedTo, pushData);

                        case 27:
                        case 'end':
                          return _context6.stop();
                      }
                    }
                  }, _callee6, undefined);
                }));

                return function (_x9, _x10) {
                  return _ref7.apply(this, arguments);
                };
              }());
            } else {
              console.log("getAcceptedRequestsNextHour result >>>>>>> ", requestsFound);
            }
            _context7.next = 10;
            break;

          case 7:
            _context7.prev = 7;
            _context7.t0 = _context7['catch'](0);

            console.log('getAcceptedRequestsNextHour error>>>>', _context7.t0);

          case 10:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, undefined, [[0, 7]]);
  }));

  return function notifyIfDriverNotActive() {
    return _ref6.apply(this, arguments);
  };
}();

var processScheduledRequests = exports.processScheduledRequests = function () {
  var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee9() {
    var requestsFound, processRequestsAsync, processedAllRequests;
    return _regenerator2.default.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.prev = 0;
            _context9.next = 3;
            return getRequestsToProcessAsync();

          case 3:
            requestsFound = _context9.sent;

            if (requestsFound && requestsFound.length) {
              processRequestsAsync = requestsFound.map(function (request, index) {
                /**
                 * 1. check if the assigned driver has active trip
                 * 2. create new trip request
                 * 3. update scheduled request with trip id
                 * 2. send new request to the driver assigned
                 */
                return new _promise2.default(function () {
                  var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8(resolve, reject) {
                    var promiseResult, queryTripSchema, activeTrip, newTripRequest, scheduleRequestUpdate, updatedScheduleRequest, requestSentResponse, pushData;
                    return _regenerator2.default.wrap(function _callee8$(_context8) {
                      while (1) {
                        switch (_context8.prev = _context8.next) {
                          case 0:
                            _context8.prev = 0;
                            promiseResult = { success: false, message: '', data: { scheduledTripRequest: request, activeTrip: null, newTripRequest: null } };
                            queryTripSchema = { "driver._id": request.assignedTo, activeStatus: true };
                            _context8.next = 5;
                            return _trip2.default.findOneAsync(queryTripSchema);

                          case 5:
                            activeTrip = _context8.sent;

                            if (activeTrip) {
                              _context8.next = 11;
                              break;
                            }

                            promiseResult.success = false;
                            promiseResult.message = "Assigned driver has no active trip";
                            // notify admin about driver did not active trip
                            _socketStore2.default.emitByUserId(request.adminId, 'noDriverActiveScheduleTrip', { success: false, message: 'No active trip for the driver', data: null });
                            return _context8.abrupt('return', resolve(promiseResult));

                          case 11:
                            _context8.next = 13;
                            return creatNewTripRequestAsync(request, activeTrip);

                          case 13:
                            newTripRequest = _context8.sent;

                            // update scheduled request with trip id
                            scheduleRequestUpdate = {
                              tripId: activeTrip._id,
                              tripRequestId: newTripRequest._id
                            };
                            _context8.next = 17;
                            return _scheduledTripRequest2.default.findOneAndUpdate({ _id: request._id }, scheduleRequestUpdate, { new: true });

                          case 17:
                            updatedScheduleRequest = _context8.sent;


                            console.log("updatedScheduleRequest", (0, _stringify2.default)(updatedScheduleRequest));
                            // send request to the driver

                            _context8.next = 21;
                            return sendRequestToDriverAsync(newTripRequest, activeTrip.driver);

                          case 21:
                            requestSentResponse = _context8.sent;

                            if (requestSentResponse) {
                              _socketStore2.default.emitByUserId(requestSentResponse.tripRequest && requestSentResponse.tripRequest.riderId && requestSentResponse.tripRequest.riderId, 'rideRequestSentToDriver', { success: true,
                                message: 'Request Sent to the driver', data: requestSentResponse.tripRequest });
                              pushData = {
                                payload: { success: true, message: 'Request Sent to the driver', data: requestSentResponse.tripRequest },
                                body: 'Request has been sent to the driver: ' + requestSentResponse.driver.name,
                                title: 'New Request'
                              };

                              PushNotification.sendNotificationByUserIdAsync(requestSentResponse.tripRequest.riderId, pushData);
                            }

                            _context8.next = 28;
                            break;

                          case 25:
                            _context8.prev = 25;
                            _context8.t0 = _context8['catch'](0);
                            return _context8.abrupt('return', reject(_context8.t0));

                          case 28:
                          case 'end':
                            return _context8.stop();
                        }
                      }
                    }, _callee8, undefined, [[0, 25]]);
                  }));

                  return function (_x11, _x12) {
                    return _ref9.apply(this, arguments);
                  };
                }());
              });
              processedAllRequests = _promise2.default.all(processRequestsAsync);

              console.log("auto processedAllRequests", (0, _stringify2.default)(processedAllRequests));
            } else {
              console.log("getAcceptedRequestsNextHour result >>>>>>> ", requestsFound);
            }

            _context9.next = 10;
            break;

          case 7:
            _context9.prev = 7;
            _context9.t0 = _context9['catch'](0);

            console.log('getAcceptedRequestsNextHour error>>>>', _context9.t0);

          case 10:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, undefined, [[0, 7]]);
  }));

  return function processScheduledRequests() {
    return _ref8.apply(this, arguments);
  };
}();
//# sourceMappingURL=schedule-trip.js.map
