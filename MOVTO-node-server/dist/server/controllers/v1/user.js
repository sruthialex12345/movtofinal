'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.driverAddDynamicRider = exports.riderAdminList = exports.driverAddRider = exports.driverCurrentToTerminals = exports.driverCurrentFromTerminals = exports.ridesCompletingAtTerminal = exports.driverHistory = exports.nearByDropOffPoints = exports.nearByPickupPoints = exports.updateShuttleStatus = undefined;

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.driverRoutes = driverRoutes;
exports.getCurrentTripOrRequest = getCurrentTripOrRequest;
exports.getRiderNotificationRequests = getRiderNotificationRequests;

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _APIError = require('../../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _user = require('../../models/user');

var _user2 = _interopRequireDefault(_user);

var _adminLocation = require('../../models/adminLocation');

var _adminLocation2 = _interopRequireDefault(_adminLocation);

var _env = require('../../../config/env');

var _env2 = _interopRequireDefault(_env);

var _tripRequest = require('../../models/tripRequest');

var _tripRequest2 = _interopRequireDefault(_tripRequest);

var _tripRequestStatuses2 = require('../../constants/trip-request-statuses');

var TRIP_REQUEST_STATUS = _interopRequireWildcard(_tripRequestStatuses2);

var _terminalType = require('../../constants/terminal-type');

var terminalType = _interopRequireWildcard(_terminalType);

var _tripType = require('../../constants/trip-type');

var _userTypes = require('../../constants/user-types');

var _adminVehicle = require('../../models/adminVehicle');

var _adminVehicle2 = _interopRequireDefault(_adminVehicle);

var _trip = require('../../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _socketStore = require('../../service/socket-store');

var _socketStore2 = _interopRequireDefault(_socketStore);

var _shared = require('../../../server/service/shared');

var Shared = _interopRequireWildcard(_shared);

var _pushNotification = require('../../service/pushNotification');

var PushNotification = _interopRequireWildcard(_pushNotification);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ObjectId = require('mongoose').Types.ObjectId;

var randomstring = require("randomstring");
var async = require('async');
var debug = require('debug')('MGD-API: admin-user');

var updateShuttleStatus = exports.updateShuttleStatus = function updateShuttleStatus(req, res, next) {

  /**
   * 1. find driver
   * 2. check type of trip the driver is assigned
   * 3. find the vehicle
   * 4. check if the there is any active trip with driver or vehicle
   * 5. create trip with driver>route and vehicle
   */

  var returnObj = {
    success: false,
    message: '',
    data: {}
  };
  var _req$query = req.query,
      activeStatus = _req$query.activeStatus,
      shuttleId = _req$query.shuttleId,
      id = _req$query.id;

  var driverId = req.user._id;

  var promises = [_user2.default.findOneAsync({ _id: driverId }, { password: 0 }), _adminVehicle2.default.findOneAsync({ _id: shuttleId })];

  _promise2.default.all(promises).then(function (result) {
    if (result && result.length) {
      var driver = result[0];
      var vehicle = result[1];
      if (!driver) {
        returnObj.message = "Driver not found";
        return res.send(returnObj);
      } else if (!vehicle) {
        returnObj.message = "Vehicle not found";
        return res.send(returnObj);
      } else {
        /**
         * create trip with driver>route and vehicle
         * fork functionality based on driver's assigned trip type
         */
        // if((driver.tripType != TRIP_DYNAMIC) && driver.route) {
        if (driver.route) {
          if (req.user.userType == _userTypes.USER_TYPE_ADMIN && activeStatus == 'true') {
            var err = new _APIError2.default('You are not authorized to activate trip', _httpStatus2.default.UNAUTHORIZED, true);
            return next(err);
          }

          if (activeStatus == 'true') {

            if (shuttleId) {
              _adminVehicle2.default.findOne({ '_id': shuttleId, activeStatus: false, isDeleted: false, isAvailable: true }).then(function (vehicleDetails) {
                if (vehicleDetails) {
                  var tripUpdateData = {
                    shuttleId: vehicle._id,
                    driver: driver,
                    gpsLoc: driver.gpsLoc,
                    activeStatus: true,
                    seatsAvailable: vehicle.seats
                  };
                  _trip2.default.findOne({ 'driver._id': driver._id, activeStatus: true }).populate('shuttleId').exec().then(function (result) {
                    if (result) {
                      console.log("       I am here", result);
                      returnObj.success = false;
                      returnObj.message = 'Driver already activated another shuttle';
                      returnObj.data = { response: result, driverRoute: [] };
                      if (_mongoose2.default.Types.ObjectId(shuttleId).equals(result.shuttleId._id)) {
                        returnObj.success = true;
                        returnObj.message = 'Shuttle is already activated';
                        returnObj.data = { response: result, driverRoute: result.driver && result.driver.route && result.driver.route.terminals || [] };
                        return res.send(returnObj);
                      } else {
                        res.send(returnObj);
                        return notifyDriverAdminTripStatus(driverId, result._id);
                      }
                    } else {
                      console.log("       I am ELSE", result);
                      var newTrip = new _trip2.default(tripUpdateData);
                      newTrip.save().then(function (response) {
                        updateDriverVehicleStatusAsync(response, shuttleId, true).then(function (results) {

                          returnObj.success = true;
                          returnObj.message = 'Trip activated successfully';
                          returnObj.data = { response: response, driverRoute: response.driver && response.driver.route && response.driver.route.terminals || [] };
                          res.send(returnObj);
                          return notifyDriverAdminTripStatus(driverId, response._id);
                        }).catch(function (error) {
                          next(error);
                        });
                      }).catch(function (e) {
                        return next(e);
                      });
                    }
                  }).catch(function (e) {
                    return next(e);
                  });
                } else {
                  returnObj.success = false;
                  returnObj.message = 'Shuttle is already activated';
                  returnObj.data = { response: "", driverRoute: [] };
                  return res.send(returnObj);
                }
              }).catch(function (e) {
                return next(e);
              });
            }
          } else if (activeStatus == 'false') {
            var tripRequestStatuses = [TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE];

            _tripRequest2.default.find({ tripId: id, tripRequestStatus: { $in: tripRequestStatuses } }).then(function (enRoutedRequests) {
              if (enRoutedRequests && enRoutedRequests.length) {
                returnObj.success = false;
                returnObj.message = "Can not deactivate. Trip has pending requests";
                return res.send(returnObj);
              } else {
                // check for pending request || accepted requests
                var _tripRequestStatuses = [TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED];
                _tripRequest2.default.aggregateAsync([{
                  $match: {
                    tripId: _mongoose2.default.Types.ObjectId(id),
                    tripRequestStatus: { $in: _tripRequestStatuses }
                  }
                }, {
                  $group: {
                    _id: "$tripId",
                    tripId: { $first: '$tripId' },
                    "seats": { $sum: "$seatBooked" }
                  }
                }]).then(function (acceptedRequests) {

                  _trip2.default.findOneAsync({ _id: id }).then(function (trip) {
                    if (trip) {
                      if ((acceptedRequests && acceptedRequests.length || enRoutedRequests && enRoutedRequests.length) && trip.driver.tripType == _tripType.TRIP_DYNAMIC) {
                        returnObj.success = false;
                        returnObj.message = "Can not deactivate. Trip has pending requests";
                        return res.send(returnObj);
                      } else if (trip.driver.tripType == _tripType.TRIP_DYNAMIC) {
                        _trip2.default.findOneAndUpdateAsync({ _id: id, activeStatus: true }, { $set: { activeStatus: false, tripEndTime: new Date().toISOString(), visitedTerminalIds: [], visitedTerminalsCount: 0 } }, { new: true })
                        // eslint-disable-next-line
                        .then(function (updatedTripObj) {
                          returnObj.success = true;
                          returnObj.message = '';
                          returnObj.data = {};
                          if (updatedTripObj) {
                            returnObj.message = 'Shuttle Deactived';
                            updateDriverVehicleStatusAsync(updatedTripObj, updatedTripObj.shuttleId, false).then(function (results) {
                              _user2.default.findOneAndUpdateAsync({ _id: updatedTripObj.driver._id }, { $set: {
                                  "route.terminals": []
                                } }, { new: true }).then(function (tripRequestData) {
                                res.send(returnObj);
                                return notifyDriverAdminTripStatus(updatedTripObj.driver._id, updatedTripObj._doc._id);
                              });
                            }).catch(function (error) {
                              next(e);
                            });
                          } else {
                            returnObj.success = false;
                            returnObj.message = 'No Active Shuttle';
                            return res.send(returnObj);
                          }
                        }).error(function (e) {
                          var err = new _APIError2.default('Something went wrong', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
                          next(err);
                        });
                      } else {
                        if (acceptedRequests && acceptedRequests.length) {
                          nearByShuttleAsync(id, { seats: acceptedRequests[0].seats }).then(function (response) {
                            if (!response.success) {
                              returnObj.success = false;
                              returnObj.message = "Trip has pending requests but no other trip found to transfer requests";
                              return res.send(returnObj);
                            } else {
                              // notify the driver on other trip, to request to transfer of all pending requests
                              var transferToShuttle = response && response.data && response.data[0];
                              if (transferToShuttle) {
                                // send request to the other trip driver
                                var eventPayload = { success: true, message: "New transfer request", data: { tripId: id } };
                                _socketStore2.default.emitByUserId(transferToShuttle.driver._id, 'transferRequest', eventPayload);

                                transferRequestsAsync(id, transferToShuttle._id).then(function (result) {
                                  _trip2.default.findOneAndUpdateAsync({ _id: id, activeStatus: true }, { $set: {
                                      activeStatus: false, tripEndTime: new Date().toISOString(), transferredTo: transferToShuttle._id,
                                      visitedTerminalIds: [], visitedTerminalsCount: 0
                                    } }, { new: true }).then(function (updatedTrip) {
                                    updateDriverVehicleStatusAsync(updatedTrip, updatedTrip.shuttleId, false).then(function (results) {
                                      returnObj.success = true;
                                      returnObj.message = "Shuttle deactivated and pending requests were transferred";
                                      returnObj.data = updatedTrip;
                                      notifyDriverAdminTripStatus(updatedTrip.driver._id, updatedTrip._id);
                                      return res.send(returnObj);
                                    }).catch(function (error) {
                                      next(e);
                                    });
                                  }).catch(function (error) {
                                    returnObj.success = false;
                                    returnObj.message = "Error while transfering request";
                                    return res.send(returnObj);
                                  });
                                }).catch(function (err) {
                                  returnObj.success = false;
                                  returnObj.message = "Error while transfering requests";
                                  return res.send(returnObj);
                                });
                              } else {
                                returnObj.success = false;
                                returnObj.message = "Trip has pending requests but no other trip found to transfer requests";
                                return res.send(returnObj);
                              }
                            }
                          }).catch(function (error) {
                            return next(error);
                          });
                        } else {
                          _trip2.default.findOneAndUpdateAsync({ _id: id, activeStatus: true }, { $set: { activeStatus: false, tripEndTime: new Date().toISOString(), visitedTerminalIds: [], visitedTerminalsCount: 0 } }, { new: true })
                          // eslint-disable-next-line
                          .then(function (updatedTripObj) {
                            returnObj.success = true;
                            returnObj.message = '';
                            returnObj.data = {};
                            if (updatedTripObj) {
                              returnObj.message = 'Shuttle Deactived';
                              updateDriverVehicleStatusAsync(updatedTripObj, updatedTripObj.shuttleId, false).then(function (results) {
                                res.send(returnObj);
                                return notifyDriverAdminTripStatus(updatedTripObj.driver._id, updatedTripObj._doc._id);
                              }).catch(function (error) {
                                next(e);
                              });
                            } else {
                              returnObj.success = false;
                              returnObj.message = 'No Active Shuttle';
                              return res.send(returnObj);
                            }
                          }).error(function (e) {
                            var err = new _APIError2.default('Something went wrong', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
                            next(err);
                          });
                        }
                      }
                    }
                  }).catch(function (err) {
                    console.log('error searching accepted requests', error);
                    var err = new _APIError2.default('Something went wrong, while searching accepted requests', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
                    return next(err);
                  });
                }).catch(function (error) {
                  console.log('error searching accepted requests', error);
                  var err = new _APIError2.default('Something went wrong, while searching accepted requests', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
                  return next(err);
                });
              }
            }).catch(function (error) {
              console.log('error searching current trip to deactivate', error);
              var err = new _APIError2.default('Something went wrong', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
              return next(err);
            });
          }
        } else {

          // needs to be implemented as dynamic route /shared rides
          var err = new _APIError2.default('Something went wrong', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
          return next(err);
        }
      }
    } else {
      var err = new _APIError2.default('Something went wrong', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
      return next(err);
    }
  }).catch(function (err) {
    var err = new _APIError2.default('Something went wrong', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
    return next(err);
  });
};
var tripUpdateMessageToAdmin = {
  true: "New Trip started",
  false: "Trip deactivated"
};

var tripUpdateEventToAdmin = {
  true: "tripCreated",
  false: "tripDeactivated"
};

function notifyDriverAdminTripStatus(driverId, tripId) {
  var query = {
    _id: driverId,
    isDeleted: false
  };
  _user2.default.findOne(query).then(function (result) {
    if (result) {
      _trip2.default.findOne({ _id: tripId }, { gpsLoc: 1, activeStatus: 1, visitedTerminal: 1, 'driver.email': 1,
        'driver.activeStatus': 1,
        'driver.profileUrl': 1,
        'driver.name': 1, 'driver._id': 1 }).populate([{ path: 'driverId', select: 'email activeStatus profileUrl name gpsLoc' }, { path: 'shuttleId', select: 'name activeStatus imageUrl' }]).then(function (trip) {
        var payload = {
          success: false,
          message: "Trip not found",
          data: {}
        };
        if (trip) {
          var data = (0, _assign2.default)({}, trip);
          if (!data._doc.gpsLoc || !data._doc.gpsLoc.length) {
            data._doc.gpsLoc = data._doc.driverId && data._doc.driverId.gpsLoc;
          }
          // data._doc.driverId.activeStatus=data._doc.activeStatus;

          payload.success = true;
          payload.message = tripUpdateMessageToAdmin[trip.activeStatus];
          payload.data = data._doc;
          _socketStore2.default.emitByUserId(result.adminId, tripUpdateEventToAdmin[trip.activeStatus], payload);
        }
      }).catch(function (err) {
        console.log("error while sending notification to the admin", err);
      });
    }
  });
}

function updateDriverVehicleStatusAsync(updatedTripObj, vehicleId, status) {
  return new _promise2.default(function (resolve, reject) {
    var promises = [_adminVehicle2.default.updateAsync({ _id: vehicleId, isDeleted: false }, { $set: { activeStatus: status } }, { new: true }), _user2.default.updateAsync({ _id: updatedTripObj.driver._id, isDeleted: false }, { $set: { activeStatus: status } }, { new: true }), _trip2.default.updateAsync({ _id: updatedTripObj._id }, { $set: { "driver.activeStatus": status } }, { new: true })];

    _promise2.default.all(promises).then(function (results) {
      if (results && !results[0]) {
        return reject(new Error("Something went wrong while updating trip vehicle"));
      } else if (results && !results[1]) {
        return reject(new Error("Something went wrong while updating trip driver"));
      } else if (results && results[0] && results[1]) {
        return resolve(results);
      } else {
        return reject(new Error("Something went wrong while updating trip driver and vehicle"));
      }
    }).catch(function (error) {
      return reject(error);
    });
  });
}

function nearByShuttleAsync(currentShuttleId) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;


  // var request = JSON.parse(JSON.stringify(request));
  return new _promise2.default(function (resolve, reject) {
    var result = {
      success: false,
      message: '',
      data: null
    };
    _trip2.default.findOneAsync({ _id: currentShuttleId, activeStatus: true }).then(function (currentShuttle) {
      if (currentShuttle) {
        var pipelineStages = [{ $project: { 'driver': 1, "seatsAvailable": 1, "activeStatus": 1, "gpsLoc": 1 } }, {
          $match: {
            "_id": { $ne: _mongoose2.default.Types.ObjectId(currentShuttle._id) },
            "activeStatus": true,
            "driver.tripType": currentShuttle.driver.tripType,
            "driver.route._id": _mongoose2.default.Types.ObjectId(currentShuttle.driver.route._id),
            "driver.adminId": _mongoose2.default.Types.ObjectId(currentShuttle.driver.adminId),
            "seatsAvailable": { $gte: parseInt(options.seats) }
          }
        }];

        if (currentShuttle.driver.tripType == _tripType.TRIP_DYNAMIC) {
          delete pipelineStages[1]["$match"]["driver.route._id"];
          pipelineStages[1]["$match"]["gpsLoc"] = {
            $geoWithin: { $centerSphere: [currentShuttle.gpsLoc, _env2.default.dynamicRouteOptions.nearOtherShuttleRadius] }
          };
        }

        _trip2.default.aggregateAsync(pipelineStages).then(function (foundShuttles) {

          if (foundShuttles) {
            result.success = true;
            result.message = 'shuttles found';
            result.data = foundShuttles;
            return resolve(result);
          } else {
            result.message = "No nearby shuttles found";
            return resolve(result);
          }
        }).error(function (driverErr) {
          // console.log('error while searching near by driver ');
          return reject(driverErr);
        });
      } else {
        result.message = 'Shuttle not found';
        return resolve(result);
      }
    }).catch(function (error) {
      return reject(error);
    });
  });
}

function transferRequestsAsync(fromTripId, toTripId) {
  var result = {
    success: false,
    message: '',
    data: null
  };
  return new _promise2.default(function (resolve, reject) {
    if (!fromTripId && !toTripId) {
      return resolve(result.message = 'Misssing from trip id or to Trip Id');
    }

    _promise2.default.all([_trip2.default.findOneAsync({ _id: fromTripId }), _trip2.default.findOneAsync({ _id: toTripId })]).then(function (fromToTrips) {
      var fromTrip = fromToTrips[0];
      var toTrip = fromToTrips[1];
      if (!fromTrip || !toTrip) {
        return resolve(result.message = 'Trips not found');
      }

      /**
       * 1. get fromTrip all pendingRequests with status (request || accepted)
       * 2. map all trip requests with new driverId, tripId, requestUpdatedTime
       * 3. create all mapped new trip requests
       * 4. update all pending trip requests status as transferred with previous tripId and driverId
       */
      var requestStatus = [TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED];
      _tripRequest2.default.find({ tripId: fromTrip._id, tripRequestStatus: { $in: requestStatus } }).then(function (pendingRequests) {
        if (pendingRequests && pendingRequests.length) {
          async.eachOf(pendingRequests, function (request, key, cb) {
            var newTripReqObj = {
              driverId: toTrip.driver._id,
              tripId: toTrip._id,
              requestUpdatedTime: new Date().toISOString()
            };
            // Updating Triprequest Schema with new driver and new TripId
            _tripRequest2.default.findOneAndUpdateAsync({ _id: request._id }, newTripReqObj, { new: true }).then(function (savedTripRequest) {
              notifyRideTransferRider(savedTripRequest, toTrip);
              var toTripUpdates = {
                $addToSet: { tripRequests: savedTripRequest }
              };

              if (savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
                toTripUpdates["$inc"] = { seatBooked: request.seatBooked, seatsAvailable: -request.seatBooked };
              }

              // Updating To trip with updated Triprequest Start
              _trip2.default.findOneAndUpdateAsync({ _id: toTrip._id, activeStatus: true }, toTripUpdates, { new: true }).then(function (updatedTrip) {
                // Updating from trip with Old Triprequest Start
                request.tripRequestStatus = TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED, request.requestUpdatedTime = new Date().toISOString();
                _trip2.default.findOneAndUpdateAsync({ _id: fromTrip._id, activeStatus: true }, { $addToSet: { tripRequests: request } }, { new: true }).then(function (updatedfromTrip) {

                  cb();
                }).catch(function (error) {
                  cb(error);
                });
                /******* END :- Updating from trip with Old Triprequest Start ************/
              }).catch(function (error) {
                cb(error);
              });
              /****** END:- Updating To trip with updated Triprequest END ************/
            }).catch(function (error) {
              cb(error);
            });
            /******* END:- Updating To trip with updated Triprequest END ***************/
          }, function (e) {
            if (e) {
              return reject(e);
            } else {
              result.success = true;
              result.message = 'Requests transferred';
              result.data = pendingRequests;
              // notify other shuttle driver
              notifyShuttleDriverTransfer(fromTrip, toTrip);
              notifyShuttleAdminTransfer(fromTrip, toTrip);
              return resolve(result);
            }
          });
        } else {
          return resolve(result.message = 'No pending request found');
        }
      });
    }).catch(function (error) {
      return reject(error);
    });
  });
}

function notifyRideTransferRider(request, othertrip) {
  var eventPayload = {
    success: true,
    message: 'Request is transferred',
    data: othertrip
  };
  _socketStore2.default.emitByUserId(request.riderId, "requestTransferredRider", eventPayload);
}

function notifyShuttleDriverTransfer(fromShuttle, toShuttle) {
  var eventPayload = {
    success: true,
    message: 'Requests received from shuttle',
    data: fromShuttle.driver
  };
  _socketStore2.default.emitByUserId(toShuttle.driver._id, "requestTransferredDriver", eventPayload);
}

function notifyShuttleAdminTransfer(fromShuttle, toShuttle) {
  var eventPayload = {
    success: true,
    message: 'Request is transferred',
    data: toShuttle.driver
  };
  _socketStore2.default.emitByUserId(toShuttle._id, "requestTransferredAdmin", eventPayload);
}

var nearByPickupPoints = exports.nearByPickupPoints = function nearByPickupPoints(req, res, next) {
  var adminId = req.query.adminId;
  var name = req.query.name ? req.query.name : '';
  var query = {
    "driver.adminId": ObjectId(adminId),
    activeStatus: true,
    "driver.route.terminals.type": { $ne: terminalType.TRIP_END_TERMINAL },
    $or: [{ "driver.route.terminals.name": { $regex: name, $options: 'i' } }, { "driver.route.terminals.address": { $regex: name, $options: 'i' } }]
    // need to remove endTerminal from list
  };_trip2.default.aggregateAsync([{ $unwind: { path: "$driver.route.terminals" } }, { $sort: { "driver.route.terminals.sequenceNo": -1 } }, { $match: query }, {
    $group: {
      _id: null,
      locations: { $addToSet: "$driver.route.terminals" }
    }
  }]).then(function (doc) {
    var returnObj = {
      success: true,
      message: 'No pickup point available',
      data: null,
      meta: null
    };
    if (doc && doc[0] && doc[0].locations && doc[0].locations.length > 0) {
      var _returnObj = {
        success: true,
        message: 'Pickup points are available',
        data: {
          locations: doc[0].locations
        }
      };
      res.send(_returnObj);
    } else {
      returnObj.data = { locations: [] };
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for pickup points ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
};

var nearByDropOffPoints = exports.nearByDropOffPoints = function nearByDropOffPoints(req, res, next) {

  var source = JSON.parse(req.query.source);
  var adminId = req.query.adminId;
  var name = req.query.name ? req.query.name : '';
  // const srcSequenceNo = req.query.sequenceNo ? parseInt(req.query.sequenceNo) : null;
  var query = {
    "driver.adminId": ObjectId(adminId), activeStatus: true,
    'driver.route.terminals.loc': { $ne: source },
    $or: [{ "driver.route.terminals.name": { $regex: name, $options: 'i' } }, { "driver.route.terminals.address": { $regex: name, $options: 'i' } }]
  };

  if (req.query.sequenceNo && req.query.sequenceNo != 'undefined') {
    var srcSequenceNo = parseInt(req.query.sequenceNo);
    query["driver.route.terminals.sequenceNo"] = { $gt: srcSequenceNo };
  }
  // need to filter list by next terminals from selected src loc seq no
  _trip2.default.aggregateAsync([{ $unwind: { path: "$driver.route.terminals" } }, { $sort: { "driver.route.terminals.sequenceNo": -1 } }, { $match: query }, {
    $group: {
      _id: null,
      terminals: { $addToSet: "$driver.route.terminals" }
    }
  }]).then(function (doc) {
    var returnObj = {
      success: true,
      message: 'No location available',
      data: null,
      meta: null
    };
    if (doc && doc[0] && doc[0].terminals && doc[0].terminals.length > 0) {
      var _returnObj2 = {
        success: true,
        message: 'Dropoff points are available',
        data: {
          locations: doc[0].terminals
        }
      };
      res.send(_returnObj2);
    } else {
      returnObj.data = { locations: [] };
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for dropoffs ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
};

function driverRoutes(req, res, next) {
  _user2.default.findOneAsync({ _id: req.query.driverId }, 'route adminId').then(function (userDoc) {
    var returnObj = {
      success: false,
      message: 'Unable to find the driver route',
      data: null,
      meta: null
    };
    if (userDoc && userDoc.route.terminals && userDoc.route.terminals.length > 0) {
      returnObj.success = true;
      returnObj.message = 'Driver route found';
      returnObj.data = userDoc.route.terminals;
      res.send(returnObj);
    } else {
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function getCurrentTripOrRequest(req, res, next) {
  var returnObj = { success: false, message: 'no trip or request found', data: { response: {}, driverRoute: [] } };
  if (req.user.userType == _userTypes.USER_TYPE_DRIVER) {
    _trip2.default.findOne({ "driver._id": req.user._id, activeStatus: true }).populate('shuttleId').exec().then(function (result) {
      if (result) {
        var resultTrip = JSON.parse((0, _stringify2.default)(result));
        resultTrip.driverId = result.driver._id;
        resultTrip.adminId = result.driver.adminId;
        delete resultTrip.driver;
        returnObj = {
          success: false,
          message: 'Currently active trip',
          data: { response: resultTrip, driverRoute: [] }
        };
        returnObj.success = true;
        if (result.driver && result.driver.route && result.driver.route.terminals.length > 0) {
          returnObj.data = { response: resultTrip, driverRoute: result.driver.route.terminals };
        }
        return res.send(returnObj);
      } else {
        returnObj.message = 'No active trip found';
        return res.send(returnObj);
      }
    }).catch(function (e) {
      return next(e);
    });
  } else if (req.user.userType == _userTypes.USER_TYPE_RIDER) {
    var tripRequestStatuses = [TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE];

    _tripRequest2.default.find({ riderId: req.user._id, tripRequestStatus: { $in: tripRequestStatuses } }).populate([{ path: 'adminId', select: 'name fname lname email' }, { path: 'tripId' }]).sort({ requestTime: -1, requestUpdatedTime: -1 }).limit(1).then(function (tripRequests) {
      var tripRequest = tripRequests && Array.isArray(tripRequests) && tripRequests[0] || null;
      if (tripRequest && tripRequest.tripId) {
        if (tripRequest.tripId.driver && tripRequest.tripId.driver.route && tripRequest.tripId.driver.route.terminals.length > 0) {
          returnObj.success = true;
          returnObj.message = "Trip request with active trip found";
          returnObj.data = { response: tripRequest, driverRoute: tripRequest.tripId.driver.route.terminals };
          return res.send(returnObj);
        } else {
          returnObj.message = "Trip request found";
          returnObj.data = { response: tripRequest, driverRoute: [] };
          return res.send(returnObj);
        }
      } else if (tripRequest) {
        returnObj.message = 'Trip request with no trip found';
        returnObj.data = { response: tripRequest, driverRoute: [] };
        return res.send(returnObj);
      } else {
        returnObj.message = "No trip request found";
        return res.send(returnObj);
      }
    }).catch(function (err) {
      res.send('Error', err);
    });
  } else {
    returnObj.message = 'Not a valid user';
    res.send(returnObj);
  }
}

var driverHistory = exports.driverHistory = function driverHistory(req, res, next) {
  var _req$query2 = req.query,
      id = _req$query2.id,
      pageNo = _req$query2.pageNo,
      _req$query2$limit = _req$query2.limit,
      limit = _req$query2$limit === undefined ? 20 : _req$query2$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  debug('skip value: ' + req.query.pageNo);
  _trip2.default.countAsync({ "driver._id": id })
  // eslint-disable-next-line
  .then(function (response) {
    var returnObj = {
      success: true,
      message: 'no of rides are zero', // `no of active vehicles are ${returnObj.data.length}`;
      data: {
        rides: [],
        meta: {
          totalNoOfPages: response < limit ? 1 : Math.ceil(response / limit),
          limit: limit,
          currPageNo: pageNo,
          currNoOfRecord: 0
        }
      }
    };
    if (response.length < 1) {
      return res.send(returnObj);
    }
    if (skip > response.length) {
      var err = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(err);
    }
    _trip2.default.find({ "driver._id": id }).populate({ path: 'shuttleId' }).sort({ tripStartAt: -1 }).limit(limit).skip(skip).then(function (records) {
      returnObj.data.rides = records;
      returnObj.message = 'Rides found';
      returnObj.data.meta.currNoOfRecord = records.length;
      returnObj.data.meta.totalNoOfRecord = response;
      // returnObj.data.meta.totalNoOfPages = returnObj.meta.totalNoOfPages;
      // returnObj.data.meta.currNoOfRecord = records.length;
      debug('no of records are ' + returnObj.data.meta.currNoOfRecord);
      return res.send(returnObj);
    }).catch(function (err) {
      res.send('Error', err);
    });
  }).error(function (e) {
    var returnObj = {
      success: true,
      message: 'no of rides are zero',
      data: {
        rides: [],
        meta: {
          totalNoOfPages: 0,
          limit: limit,
          currPageNo: 0,
          currNoOfRecord: 0
        }
      }
    };
    return res.send(returnObj);
    var err = new _APIError2.default('error occured while counting the no of rides ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside rideHistory records');
    next(err);
  });
};

var ridesCompletingAtTerminal = exports.ridesCompletingAtTerminal = function ridesCompletingAtTerminal(req, res, next) {
  var _req$query3 = req.query,
      driverId = _req$query3.driverId,
      terminalId = _req$query3.terminalId,
      tripId = _req$query3.tripId;

  var returnObj = {
    success: false,
    message: 'Unable to find rides completing at terminal',
    data: []
  };

  // check if trip is active with provided trip details

  _trip2.default.findOneAsync({ _id: tripId, "driver._id": driverId, activeStatus: true }).then(function (trip) {
    if (trip) {
      getAllRidersCompletingTripAtTerminal(tripId, terminalId).then(function (rides) {
        if (rides.length > 0) {
          returnObj.success = true;
          returnObj.message = 'Rides found';
          returnObj.data = rides;
          return res.send(returnObj);
        } else {
          return res.send(returnObj);
        }
      }).error(function (err) {
        var err = new _APIError2.default('Error occured while searching for the route ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        return next(err);
      });
    } else {
      returnObj.message = 'Trip not found';
      return res.send(returnObj);
    }
  }).catch(function (error) {
    var err = new _APIError2.default('Error occured while searching for the trip ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    return next(err);
  });
};

function getRiderNotificationRequests(req, res, next) {
  var returnObj = { success: false, message: 'no request found', data: [] };
  var tripRequestStatuses = [TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE];
  _tripRequest2.default.aggregateAsync([{ $match: { riderId: _mongoose2.default.Types.ObjectId(req.user._id), tripRequestStatus: { $in: tripRequestStatuses } } }, {
    $lookup: {
      from: "trips",
      localField: "tripId",
      foreignField: "_id",
      as: "trip"
    }
  }, { $unwind: "$trip" }, {
    $lookup: {
      from: "adminvehicles",
      localField: "trip.shuttleId",
      foreignField: "_id",
      as: "shuttle"
    }
  }, { $unwind: "$shuttle" }, {
    $lookup: {
      from: "users",
      localField: "trip.driver._id",
      foreignField: "_id",
      as: "driver"
    }
  }, { $unwind: "$driver" },
  // not supported on staging server mongo (v3.2.21) error only _id can be excluded
  // {
  //   $addFields: {
  //     "shuttleLocation": {
  //       "latitude": { $arrayElemAt: [ "$trip.gpsLoc", 1 ] },
  //       "longitude": { $arrayElemAt: [ "$trip.gpsLoc", 0 ] }
  //     }
  //   }
  // },
  {
    $project: {
      "shuttleLocation": {
        "latitude": { $arrayElemAt: ["$trip.gpsLoc", 1] },
        "longitude": { $arrayElemAt: ["$trip.gpsLoc", 0] }
      },
      "driver": { $cond: { if: { $eq: ["$tripRequestStatus", "request"] }, then: {}, else: "$driver" } },
      "shuttle": { $cond: { if: { $eq: ["$tripRequestStatus", "request"] }, then: {}, else: "$shuttle" } },
      "riderId": "$riderId",
      "driverId": "$driverId",
      "tripId": "$tripId",
      "adminId": "$adminId",
      "_id": "$_id",
      "seatBooked": "$seatBooked",
      "requestUpdatedTime": "$requestUpdatedTime",
      "requestTime": "$requestTime",
      "longitudeDelta": "$longitudeDelta",
      "latitudeDelta": "$latitudeDelta",
      "destAddress": "$destAddress",
      "pickUpAddress": "$pickUpAddress",
      "tripRequestIssue": "$tripRequestIssue",
      "tripRequestStatus": "$tripRequestStatus",
      "paymentStatus": "$paymentStatus",
      "paymentMode": "$paymentMode",
      "endAddress": "$endAddress",
      "startAddress": "$startAddress",
      "destLoc": "$destLoc",
      "srcLoc": "$srcLoc"
    }
  },
  // not supported on staging server mongo error only _id can be excluded
  // {
  //   $project: {
  //     'trip': 0,
  //     "driver.password": 0,
  //     "driver.accessCode": 0,
  //   }
  // },
  // not supported on staging server mongo (v3.2.21) error only _id can be excluded
  // {
  //   $addFields: {
  //     "driver": {$cond: { if: { $eq: [ "$tripRequestStatus", "request" ] }, then: {}, else: "$driver" }},
  //     "shuttle": {$cond: { if: { $eq: [ "$tripRequestStatus", "request" ] }, then: {}, else: "$shuttle" }}
  //   }
  // },
  { $sort: { requestTime: -1, requestUpdatedTime: -1 } }, { $limit: 1 }]).then(function (result) {
    if (result && Array.isArray(result) && result.length) {
      returnObj.success = true;
      returnObj.message = "All requests found";
      returnObj.data = result[0];
      return res.send(returnObj);
    } else {
      returnObj.message = "No request found";
      return res.send(returnObj);
    }
  }).catch(function (error) {
    var err = new _APIError2.default('Something went wrong, while searching for rides', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
    console.log("error is:", error);
    return next(err);
  });
}

/*
  Start
  Task : Add passangers at driver section (BY DRIVER ON BEHALF OF RIDER)
*/
/*
  @Function : driverCurrentFromTerminals()
  @functionality : Return driver Route Terminals
*/
var driverCurrentFromTerminals = exports.driverCurrentFromTerminals = function driverCurrentFromTerminals(req, res, next) {
  var driverId = req.user._id;
  var name = req.query.name ? req.query.name : '';
  var query = {
    "driver._id": ObjectId(driverId),
    activeStatus: true,
    $or: [{ "driver.route.terminals.name": { $regex: name, $options: 'i' } }, { "driver.route.terminals.address": { $regex: name, $options: 'i' } }]
  };
  _trip2.default.findOneAsync(query).then(function (doc) {
    var returnObj = {
      success: true,
      message: 'No pickup point available',
      data: null,
      meta: null
    };
    if (doc && doc.driver && doc.driver.route && doc.driver.route.terminals && doc.driver.route.terminals.length > 0) {
      var _returnObj3 = {
        success: true,
        message: 'Pickup points are available',
        data: {
          locations: doc.driver.route.terminals
        }
      };
      res.send(_returnObj3);
    } else {
      returnObj.data = { locations: [] };
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for pickup points ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
};

/*
  @Function : driverCurrentToTerminals()
  @functionality : Return driver Route Terminals excluding Source Terminal
*/
var driverCurrentToTerminals = exports.driverCurrentToTerminals = function driverCurrentToTerminals(req, res, next) {
  var source = _mongoose2.default.Types.ObjectId(req.query.source);
  var driverId = req.user._id;
  var name = req.query.name ? req.query.name : '';
  var query = {
    "driver._id": ObjectId(driverId),
    activeStatus: true,
    'driver.route.terminals._id': { $ne: source },
    $or: [{ "driver.route.terminals.name": { $regex: name, $options: 'i' } }, { "driver.route.terminals.address": { $regex: name, $options: 'i' } }]
  };

  if (req.query.sequenceNo) {
    var srcSequenceNo = parseInt(req.query.sequenceNo);
    query["driver.route.terminals.sequenceNo"] = { $gt: srcSequenceNo };
  }

  _trip2.default.aggregateAsync({ $unwind: { path: "$driver.route.terminals" } }, { $sort: { "driver.route.terminals.sequenceNo": -1 } }, { $match: query }, {
    $group: {
      _id: null,
      terminals: { $addToSet: "$driver.route.terminals" }
    }
  }).then(function (doc) {
    var returnObj = {
      success: true,
      message: 'No location available',
      data: null,
      meta: null
    };
    if (doc && doc[0] && doc[0].terminals && doc[0].terminals.length > 0) {
      var _returnObj4 = {
        success: true,
        message: 'Dropoff points are available',
        data: {
          locations: doc[0].terminals
        }
      };
      res.send(_returnObj4);
    } else {
      returnObj.data = { locations: [] };
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for dropoffs ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
};

/*
  @Function : driverAddRider()
  @functionality :
            a) Checking seats availibility in trip schema
            b) If number of seats are available then follow Steps b, c and d else give response number of seat available
            b) Save passager details in User schema with fields AddedByDriverId, UserType and name.
            c) Create triprequest with default status "enroute".
            d) Updating seats and triprequest in trip Schema.
*/

var driverAddRider = exports.driverAddRider = function driverAddRider(req, res, next) {
  console.log("req == > ", req.body);
  var driverId = req.user._id;
  var query = { "driver._id": ObjectId(driverId), activeStatus: true };
  _trip2.default.findOneAsync(query, "seatsAvailable seatBooked").then(function (tripSeatCount) {
    var returnObj = {
      success: true,
      message: 'No Trip Found',
      data: null,
      meta: null
    };
    if (req.body.noOfseats <= 0) {
      var _returnObj5 = {
        success: false,
        message: 'Please select valid number of seats'
      };
      return res.send(_returnObj5);
    }
    if (tripSeatCount) {
      // a) Checking seats availibility in trip schema
      if (tripSeatCount.seatsAvailable >= req.body.noOfseats) {
        var _returnObj6 = {
          success: true
        };
        saveRiderDetails(req).then(function (result) {
          getTerminalsDetails(req).then(function (responseGetTerminals) {
            createTripRequestByDriver(req, result, responseGetTerminals, tripSeatCount).then(function (responseTripRequest) {

              _trip2.default.findOneAndUpdateAsync({ _id: tripSeatCount._id, activeStatus: true }, { $addToSet: { tripRequests: responseTripRequest } }, { new: true }).then(function (tripSchemaUpdate) {
                console.log("tripSeatCount == > ", (0, _stringify2.default)(tripSeatCount));
                var availableSeats = tripSeatCount.seatsAvailable - parseInt(req.body.noOfseats);
                var bookedSeat = tripSeatCount.seatBooked + parseInt(req.body.noOfseats);
                console.log("availableSeats == > ", availableSeats, bookedSeat);
                // tripSchema.updateAsync(query, {$set: {seatsAvailable: availableSeats,seatBooked: bookedSeat}}, {new: true})
                _trip2.default.updateSeats(query, availableSeats, bookedSeat).then(function (totalTripRecords) {
                  var returnObj = {
                    success: true,
                    message: 'Trip request has beed added successfully'
                  };
                  return res.send(returnObj);
                }).error(function (e) {
                  var err = new _APIError2.default('Error occured while counting trip object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
                  next(err);
                });
              }).catch(function (err) {
                console.log("tripSchema.  findOneAndUpdateAsync", e);
              });
            }).catch(function (e) {
              console.log("createTripRequest", e);
            });
          }).catch(function (e) {
            console.log("getTerminalsDetails", e);
          });
        }).catch(function (e) {
          console.log("saveRiderDetails", e);
        });
      } else {
        var _returnObj7 = {
          success: false,
          message: tripSeatCount.seatsAvailable > 0 ? tripSeatCount.seatsAvailable + ' number of seats are available' : 'Sorry, No seats available'
        };
        return res.send(_returnObj7);
      }
    } else {
      return res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for dropoffs ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
};

var riderAdminList = exports.riderAdminList = function riderAdminList(req, res, next) {

  var filter = { userType: 'admin', isActive: true, isDeleted: false };
  if (req.query.name) {
    var text = req.query.name;
    // var regex = new RegExp('[\\?&]' + text + '=([^&#]*)', 'i');
    filter.name = { $regex: text, $options: 'i' };
  }

  var pipelineStages = [{
    $match: {
      "zone.location": {
        $geoWithin: { $centerSphere: [req.user.gpsLoc, _env2.default.riderProvidersWithinRadius] }
      }
    }
  }, {
    $group: {
      _id: "userIdAdmin",
      admin: { $addToSet: "$userIdAdmin" }
    }
  }, {
    $unwind: "$admin"
  }, {
    $lookup: {
      from: 'users',
      localField: 'admin',
      foreignField: '_id',
      as: 'adminDetails'
    }
  }, {
    $unwind: "$adminDetails"
  }, { $replaceRoot: { newRoot: "$adminDetails" } }, {
    $match: filter
  }, {
    $project: {
      'name': 1, 'tripType': 1, 'reservationCode': 1, 'profileUrl': 1, 'adminTripTypes': 1,
      'settings': 1
    }
  }, { $sort: { name: 1, fname: 1, lname: 1 } }];
  console.log("test");
  console.log("pipelineStages provider list>>>>>>>", (0, _stringify2.default)(pipelineStages));

  _adminLocation2.default.aggregateAsync(pipelineStages).then(function (adminNewArr) {
    getShuttleListByAdmin(adminNewArr).then(function (admins) {
      var returnObj = {};
      if (admins.length !== 0) {
        returnObj.success = true;
        returnObj.message = 'Available service providers';
        returnObj.data = admins;
      } else {
        returnObj.success = true;
        returnObj.message = 'No service provider found';
        returnObj.data = [];
      }
      console.log("filter provider list returned>>>>>>>", (0, _stringify2.default)(returnObj));
      res.send(returnObj);
    }).catch(function (err) {
      next(err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while retreiving list', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
    next(err);
  });
};

function saveRiderDetails(req) {
  var newPassword = randomstring.generate({
    length: 8
  });
  var userObj = new _user2.default({
    email: "anonoymous@abcxyz.com",
    password: newPassword,
    userType: _userTypes.USER_TYPE_ANONYMOUS,
    name: req.body.name,
    fname: req.body.name,
    riderAddedById: req.user._id,
    phoneNo: "0000000000"
  });
  return userObj.saveAsync();
}

function getTerminalsDetails(req) {
  return new _promise2.default(function (resolve, reject) {
    var sourceDestIds = [req.body.sourceLoc, req.body.destLoc];
    _promise2.default.all(sourceDestIds.map(function (id) {
      return _trip2.default.aggregateAsync([{ $match: { 'activeStatus': true } }, { $unwind: '$driver.route.terminals' }, { $match: { 'driver.route.terminals._id': _mongoose2.default.Types.ObjectId(id) } }, { $project: { 'terminal': '$driver.route.terminals' } }]).then(function (result) {
        if (result && result.length) {
          return result || {};
        } else {
          return {};
        }
      });
    })).then(function (sourceDestterminals) {
      return resolve(sourceDestterminals);
    }).catch(function (e) {
      console.log("getTerminalsDetails Promise", e);
      return reject(e);
    });
  });
}

function createTripRequestByDriver(req, result, responseGetTerminals, tripSeatCount) {
  var sourceLoc = responseGetTerminals[0];
  var destLoc = responseGetTerminals[1];
  var tripRequestObj = new _tripRequest2.default({
    riderId: result._id,
    driverId: req.user._id,
    tripId: tripSeatCount._id,
    adminId: req.user.adminId,
    seatBooked: req.body.noOfseats,
    srcLoc: sourceLoc[0].terminal,
    destLoc: destLoc[0].terminal,
    tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE
  });

  return tripRequestObj.saveAsync();
}

function getShuttleListByAdmin(returnObj) {
  return new _promise2.default(function (resolve, reject) {
    _promise2.default.all(returnObj.map(function (objVehicle, index) {
      return _adminVehicle2.default.findOneAsync({ userIdAdmin: _mongoose2.default.Types.ObjectId(objVehicle._id), isDeleted: false, activeStatus: true, isAvailable: true
      }, { userIdAdmin: 1 }).then(function (result) {
        returnObj[index] = (0, _assign2.default)({}, returnObj[index], { shuttelStatus: result ? true : false });
        return _promise2.default.resolve(returnObj[index]);
      });
    })).then(function (adminList) {
      if (adminList) {
        adminList.map(function (vehicle, i) {
          vehicle.shuttelStatus = vehicle.shuttelStatus;
          returnObj[i] = vehicle;
        });
      }
      return resolve(returnObj);
    }).catch(function (err) {
      if (err) {
        console.log('err', err); // eslint-disable-line no-console
      }
      return reject(returnObj);
    });
  });
}

var driverAddDynamicRider = exports.driverAddDynamicRider = function driverAddDynamicRider(req, res, next) {
  console.log("----------------------Start driverAddDynamicRider-------------------------------");
  console.log(req.body);
  console.log(req.user._id);
  console.log("----------------------END driverAddDynamicRider-------------------------------");
  var driverId = req.user._id;
  var query = { "driver._id": ObjectId(driverId), activeStatus: true };
  _trip2.default.findOneAsync(query, "seatsAvailable seatBooked").then(function (tripSeatCount) {
    var returnObj = {
      success: true,
      message: 'No Trip Found',
      data: null,
      meta: null
    };
    if (req.body.seats <= 0) {
      var _returnObj8 = {
        success: false,
        message: 'Please select valid number of seats'
      };
      return res.send(_returnObj8);
    }
    if (tripSeatCount) {
      // a) Checking seats availibility in trip schema
      if (tripSeatCount.seatsAvailable >= req.body.seats) {
        var _returnObj9 = {
          success: true
        };

        saveRiderDetails(req).then(function (saveRiderDetailsResult) {

          nearByDynamicRouteDriver(req).then(function (result) {
            if (result) {
              var nearByDriversDoc = result.foundDrivers;
              // add rider details to the payload on request to attach the riderdetails to the payload sent to the driver with event

              if (nearByDriversDoc && nearByDriversDoc.length) {
                // send notification event to the driver
                sendRequestToDriver(req, saveRiderDetailsResult, nearByDriversDoc[0].driver[0], tripSeatCount).then(function (responsed) {
                  if (responsed) {
                    _returnObj9.success = true, _returnObj9.message = 'Passenger added';
                    _returnObj9.data = responsed;
                    return res.send(_returnObj9);
                  } else {
                    _returnObj9.success = false, _returnObj9.message = 'Something went wronmg while adding passenger';
                    _returnObj9.data = responsed;
                    return res.send(_returnObj9);
                  }
                }).catch(function (err) {
                  console.log('request to driver err', err);
                  _returnObj9.success = false, _returnObj9.message = 'Something went wronmg while adding passenger';
                  _socketStore2.default.emitByUserId(saveRiderDetailsResult._id, 'socketError', { success: false, message: 'Error while notifying driver', data: null });
                });
              } else {
                _returnObj9.success = false, _returnObj9.message = 'Something went wrong while finding driver';
                // SendNotification(riderID, 'No nearby drivers');
                _socketStore2.default.emitByUserId(saveRiderDetailsResult._id, 'noDriverOnRequestRide', { success: false, message: 'No drivers around', data: null });
                return res.send(_returnObj9);
              }
            } else {
              _returnObj9.success = false, _returnObj9.message = 'Something went wrong while finding near by driver';
              // SendNotification(riderID, 'No nearby drivers');
              _socketStore2.default.emitByUserId(riderID, 'noDriverOnRequestRide', { success: false, message: 'No drivers around', data: null });
              return res.send(_returnObj9);
            }
          }).catch(function (e) {
            console.log("nearByDynamicRouteDriver", e);
            _returnObj9.success = false, _returnObj9.message = 'Something went wrong while finding near by driver';
            return res.send(_returnObj9);
          });
        }).catch(function (e) {
          _returnObj9.success = false, _returnObj9.message = 'Something went wrong while save Rider Details';
          return res.send(_returnObj9);
          console.log("saveRiderDetails", e);
        });
      } else {
        var _returnObj10 = {
          success: false,
          message: tripSeatCount.seatsAvailable > 0 ? tripSeatCount.seatsAvailable + ' number of seats are available' : 'Sorry, No seats available'
        };
        return res.send(_returnObj10);
      }
    } else {
      return res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for dropoffs ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
};

function sendRequestToDriver(payload, riderDetails, driver, tripSeatCount) {
  console.log("                                     ");
  console.log("                                     ");
  console.log("driver  ----  11111>sendRequestToDriver", (0, _stringify2.default)(driver));
  console.log("                                     ");
  return new _promise2.default(function (resolve, reject) {
    createDynamicTripRequestByDriver(payload, riderDetails, tripSeatCount).then(function (tripRequestObj) {
      if (tripRequestObj) {
        console.log("                                     ");
        console.log("tripRequestObj  ----  > sendRequestToDriver", (0, _stringify2.default)(tripRequestObj));
        console.log("                                     ");
        // eslint-disable-next-line
        var resToDriver = (0, _extends3.default)({}, tripRequestObj._doc);
        resToDriver.riderDetails = riderDetails;
        _socketStore2.default.emitByUserId(driver._id, 'requestDriver', { success: true, message: "Request received", data: resToDriver });
        notifyDriverAdminTripStatus(driver._id, 'requestAdmin', { success: true, message: "Request received", data: resToDriver });
        var pushData = {
          payload: { success: true, message: 'Request Sent to the driver', data: resToDriver },
          body: 'New request received from the rider: ' + resToDriver.riderDetails,
          title: 'New Request received'
        };
        PushNotification.sendNotificationByUserIdAsync(driver._id, pushData);
        _trip2.default.findOneAndUpdateAsync({ 'driver._id': tripRequestObj.driverId, activeStatus: true }, { $addToSet: { tripRequests: tripRequestObj } }, { new: true }).then(function (updatedTrip) {
          var resData = {
            tripRequest: tripRequestObj,
            driver: driver
          };
          return resolve(resData);
        }).catch(function (err) {
          return reject(err);
        });
      } else {
        resolve(null);
      }
    }).catch(function (err) {
      console.log('error', err);
      return reject(err);
    });
  });
}

function createDynamicTripRequestByDriver(req, result, tripSeatCount) {
  console.log("createDynamicTripRequestByDriver", (0, _stringify2.default)(tripSeatCount));
  var timeStampvalue = new Date().toISOString();
  var srcLocation = req.body.sourceLoc;
  var destLocation = req.body.destLoc;
  var startAddress = req.body.startAddress;
  var endAddress = req.body.endAddress;
  srcLocation._id = _mongoose2.default.Types.ObjectId();
  destLocation._id = _mongoose2.default.Types.ObjectId();
  var tripRequestObj = new _tripRequest2.default({
    riderId: result._id,
    driverId: req.user._id,
    tripId: tripSeatCount._id,
    adminId: req.user.adminId,
    seatBooked: req.body.seats,
    srcLoc: srcLocation,
    destLoc: destLocation,
    endAddress: endAddress,
    startAddress: startAddress,
    tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT,
    requestTime: timeStampvalue
  });
  return tripRequestObj.saveAsync();
}

function nearByDynamicRouteDriver(req) {
  var sourceLoc = req.body.sourceLoc;
  var destLoc = req.body.destLoc;
  return new _promise2.default(function (resolve, reject) {
    // check if the source and destination exists in admin locations
    var locationPipelineStages = [{ $match: {
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
    _adminLocation2.default.aggregate(locationPipelineStages).then(function (foundLocations) {
      if (foundLocations && foundLocations.length) {
        // const foundLocation = foundLocations[0];
        var foundLocationIds = foundLocations.map(function (location) {
          return _mongoose2.default.Types.ObjectId(location._id);
        });
        var result = {
          foundDrivers: []
          /**
           * matches driver that contains the trip request source and destination
           * as their route waypoints
           */

        };var pipelineStages = [{ $project: (0, _defineProperty3.default)({ "gpsLoc": 1, 'driver': 1, "seatsAvailable": 1, "activeStatus": 1 }, 'gpsLoc', 1) }, {
          $match: {
            "activeStatus": true,
            "driver.tripType": _tripType.TRIP_DYNAMIC,
            "driver.adminId": _mongoose2.default.Types.ObjectId(req.user.adminId),
            "seatsAvailable": { $gte: parseInt(req.body.seats) },
            "driver._id": _mongoose2.default.Types.ObjectId(req.user._id),
            "driver.locationId": { $in: foundLocationIds }
          }
        }, {
          $lookup: {
            from: 'users',
            localField: 'driver._id',
            foreignField: '_id',
            as: 'driver'
          }
        }];

        // driver filter
        var driverMatchOpt = {
          $match: {
            "driver.loginStatus": true,
            "driver.isAvailable": true,
            "driver.isDeleted": false
          }
        };

        pipelineStages.push(driverMatchOpt);
        console.log("pipelineStages  -- >", (0, _stringify2.default)(pipelineStages));

        return _trip2.default.aggregateAsync(pipelineStages).then(function (foundDrivers) {
          console.log("founddrivers   ----  >", (0, _stringify2.default)(foundDrivers));
          if (foundDrivers && foundDrivers.length) {
            Shared.sortDynamicDriversAsync(req.body, foundDrivers).then(function (sortedDrivers) {
              console.log("sorteddrivers", (0, _stringify2.default)(sortedDrivers));
              result.foundDrivers = sortedDrivers;
              return resolve(result);
            }).catch(function (err) {
              console.log("errors>>>>>>>>>>>>>.", err);
              err = new _APIError2.default('no nearByDriver found', _httpStatus2.default.INTERNAL_SERVER_ERROR);
              return reject(err);
            });
          } else {
            var err = new _APIError2.default('no nearByDriver found', _httpStatus2.default.INTERNAL_SERVER_ERROR);
            return resolve(null);
          }
        }).error(function (driverErr) {
          return reject(driverErr);
        });
      } else {
        var err = new _APIError2.default('no service at this location', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
        return resolve(null);
      }
    });
  });
}

/*
  END
  Task : Add passangers at driver section (BY DRIVER ON BEHALF OF RIDER)
*/
//# sourceMappingURL=user.js.map
