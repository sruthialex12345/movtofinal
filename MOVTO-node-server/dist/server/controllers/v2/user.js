'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.riderAdminList = exports.driverAddRider = exports.driverCurrentToTerminals = exports.driverCurrentFromTerminals = exports.ridesCompletingAtTerminal = exports.driverHistory = exports.nearByDropOffPoints = exports.nearByPickupPoints = exports.updateShuttleStatus = undefined;

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _requestUpdateEventTo, _requestUpdateEventTo2, _requestUpdateMessage, _requestUpdateEventTo3;

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

var _tripRequestStatuses = require('../../constants/trip-request-statuses');

var TRIP_REQUEST_STATUS = _interopRequireWildcard(_tripRequestStatuses);

var _terminalType = require('../../constants/terminal-type');

var terminalType = _interopRequireWildcard(_terminalType);

var _shared = require('../../service/shared');

var SharedService = _interopRequireWildcard(_shared);

var _tripType = require('../../constants/trip-type');

var _userTypes = require('../../constants/user-types');

var _adminVehicle = require('../../models/adminVehicle');

var _adminVehicle2 = _interopRequireDefault(_adminVehicle);

var _trip = require('../../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _socketStore = require('../../service/socket-store');

var _socketStore2 = _interopRequireDefault(_socketStore);

var _pushNotification = require('../../service/pushNotification');

var PushNotification = _interopRequireWildcard(_pushNotification);

var _express = require('express');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ObjectId = require('mongoose').Types.ObjectId;

var randomstring = require("randomstring");
var async = require('async');
var debug = require('debug')('MGD-API: admin-user');

var requestUpdateEventToRider = (_requestUpdateEventTo = {}, (0, _defineProperty3.default)(_requestUpdateEventTo, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, "requestAcceptedRider"), (0, _defineProperty3.default)(_requestUpdateEventTo, TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED, "requestRejectedRider"), (0, _defineProperty3.default)(_requestUpdateEventTo, TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED, "requestCancelledRider"), (0, _defineProperty3.default)(_requestUpdateEventTo, TRIP_REQUEST_STATUS.TRIP_REQUEST_COMPLETED, "requestCompletedRider"), (0, _defineProperty3.default)(_requestUpdateEventTo, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE, "requestEnrouted"), _requestUpdateEventTo);

var requestUpdateEventToDriver = (_requestUpdateEventTo2 = {}, (0, _defineProperty3.default)(_requestUpdateEventTo2, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, "requestAcceptedDriver"), (0, _defineProperty3.default)(_requestUpdateEventTo2, TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED, "requestRejectedDriver"), (0, _defineProperty3.default)(_requestUpdateEventTo2, TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED, "requestCancelledDriver"), (0, _defineProperty3.default)(_requestUpdateEventTo2, TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED, "requestTransferredDriver"), _requestUpdateEventTo2);

var requestUpdateMessageToRider = (_requestUpdateMessage = {}, (0, _defineProperty3.default)(_requestUpdateMessage, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, "Request Accepted"), (0, _defineProperty3.default)(_requestUpdateMessage, TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED, "Request Rejected"), (0, _defineProperty3.default)(_requestUpdateMessage, TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED, "Request Cancelled"), (0, _defineProperty3.default)(_requestUpdateMessage, TRIP_REQUEST_STATUS.TRIP_REQUEST_COMPLETED, "Ride Completed"), (0, _defineProperty3.default)(_requestUpdateMessage, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE, "Ride Onboard"), (0, _defineProperty3.default)(_requestUpdateMessage, TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED, "Request transferred"), _requestUpdateMessage);

var requestUpdateEventToAdmin = (_requestUpdateEventTo3 = {}, (0, _defineProperty3.default)(_requestUpdateEventTo3, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, "requestAcceptedAdmin"), (0, _defineProperty3.default)(_requestUpdateEventTo3, TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED, "requestRejectedAdmin"), (0, _defineProperty3.default)(_requestUpdateEventTo3, TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED, "requestCancelledAdmin"), (0, _defineProperty3.default)(_requestUpdateEventTo3, TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED, "requestTransferredAdmin"), _requestUpdateEventTo3);

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
                      returnObj.success = false;
                      returnObj.message = 'Driver already activated another shuttle';
                      returnObj.data = { response: result, driverRoute: [] };
                      if (_mongoose2.default.Types.ObjectId(shuttleId).equals(result.shuttleId._id)) {
                        returnObj.success = true;
                        returnObj.message = 'Shuttle is already activated';
                        returnObj.data = { response: result, driverRoute: result.driver && result.driver.route && result.driver.route.terminals || [] };
                        return res.send(returnObj);
                      } else {
                        notifyDriverAdminTripStatus(driverId, result._id);
                        return res.send(returnObj);
                      }
                    } else {
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
            _trip2.default.findOneAsync({ _id: id }).then(function (foundTrip) {
              if (!foundTrip) {
                returnObj.message = "Trip not found";
                return res.send(returnObj);
              }
              var trip = foundTrip;
              var tripRequestStatuses = [TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED];
              var pipelineStages = [{
                $match: {
                  tripId: _mongoose2.default.Types.ObjectId(id),
                  tripRequestStatus: { $in: tripRequestStatuses }
                }
              }, {
                $group: {
                  _id: "$tripId",
                  tripId: { $first: '$tripId' },
                  "seats": { $sum: "$seatBooked" },
                  "requests": { $addToSet: "$$ROOT" },
                  "riderIds": { $addToSet: "$riderId" }
                }
              }];

              _tripRequest2.default.aggregateAsync(pipelineStages).then(function (acceptedRequests) {
                if (acceptedRequests && acceptedRequests.length) {
                  nearByShuttleAsync(id, { seats: acceptedRequests[0].seats }).then(function (response) {
                    if (!response.success) {

                      /**
                       * no other driver found
                       * 1. reject all pending requests
                       * 2. notify all riders with admin phone no to contact
                       * 3. Notify admin with trip deactivation as before to remove from list of active shuttles on map
                       */

                      var allRequestsToUpdate = acceptedRequests[0].requests;

                      var updateRequestsAsync = allRequestsToUpdate.map(function (req, index) {
                        return rejectTripRequestNotifyRiderAsync(foundTrip, req);
                      });

                      _promise2.default.all(updateRequestsAsync).then(function (updatedReqs) {
                        if (updatedReqs && updatedReqs.length) {
                          console.log("all requests rejected and riders notified");
                          _trip2.default.findOneAndUpdateAsync({ _id: id, activeStatus: true }, { $set: {
                              activeStatus: false, tripEndTime: new Date().toISOString(),
                              visitedTerminalIds: [], visitedTerminalsCount: 0
                            } }, { new: true }).then(function (updatedTrip) {
                            updateDriverVehicleStatusAsync(updatedTrip, updatedTrip.shuttleId, false).then(function (results) {
                              returnObj.success = true;
                              returnObj.message = "Shuttle deactivated and pending requests were rejected";
                              returnObj.data = updatedTrip;
                              notifyDriverAdminTripStatus(updatedTrip.driver._id, updatedTrip._id);
                              return res.send(returnObj);
                            }).catch(function (error) {
                              next(e);
                            });
                          }).catch(function (error) {
                            console.log("Error while transfering request1", error);
                            returnObj.success = false;
                            returnObj.message = "Error while transfering request";
                            return res.send(returnObj);
                          });
                        } else {
                          console.log("something went wrong rejecting reqs >>>>>>>>", updatedReqs);
                          next(new Error("something went wrong"));
                        }
                      }).catch(function (err) {
                        console.log("something went wrong rejecting reqs notifying riders", err);
                        next(err);
                      });
                    } else {
                      // notify the driver on other trip, to request to transfer of all pending requests
                      var transferToShuttle = response && response.data && response.data[0];
                      if (transferToShuttle) {
                        if (trip.driver.tripType == _tripType.TRIP_DYNAMIC) {
                          /**
                           * get requests with status as request
                           * get requests with status as accepted and enrouted
                           * transfer requests and update route for accepted and enrouted
                           * update trip active status to false
                           */

                          transferRequestsDynamicAsync(trip._id, transferToShuttle._id).then(function (result) {
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
                              console.log("Error while transfering request1", error);
                              returnObj.success = false;
                              returnObj.message = "Error while transfering request";
                              return res.send(returnObj);
                            });
                          }).catch(function (err) {
                            console.log("Error while transfering request2", err);
                            returnObj.success = false;
                            returnObj.message = "Error while transfering requests";
                            return res.send(returnObj);
                          });
                        } else {
                          // send request to the other trip driver
                          var eventPayload = { success: true, message: "New transfer request", data: { tripId: id } };
                          _socketStore2.default.emitByUserId(transferToShuttle.driver._id, 'transferRequest', eventPayload);

                          transferRequestsAsync(id, transferToShuttle._id).then(function (result) {
                            _trip2.default.findOneAndUpdateAsync({ _id: id, activeStatus: true }, { $set: {
                                activeStatus: false, tripEndTime: new Date().toISOString(), transferredTo: transferToShuttle._id,
                                visitedTerminalIds: [], visitedTerminalsCount: 0
                              } }, { new: true }).then(function (updatedTrip) {
                              updateDriverVehicleStatusAsync(trip, trip.shuttleId, false).then(function (results) {
                                returnObj.success = true;
                                returnObj.message = "Shuttle deactivated and pending requests were transferred";
                                returnObj.data = updatedTrip;
                                notifyDriverAdminTripStatus(updatedTrip.driver._id, updatedTrip._id);
                                return res.send(returnObj);
                              }).catch(function (error) {
                                next(error);
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
                        }
                      } else {
                        if (acceptedRequests && acceptedRequests.length) {
                          async.eachOf(acceptedRequests, function (request, key, cb) {
                            rejectTripRequestNotifyRiderAsync(trip, request).then(function (result) {
                              if (result.success) {
                                return cb();
                              }
                              cb(new Error(result.message));
                            }).catch(function (err) {
                              cb(err);
                            });
                          }, function (e) {
                            if (e) {
                              return reject(e);
                            } else {
                              returnObj.success = true;
                              returnObj.message = "Shuttle deactivated";
                              returnObj.data = trip;
                            }
                          });
                        } else {
                          returnObj.success = false;
                          returnObj.message = "No pending requests found";
                          return res.send(returnObj);
                        }
                      }
                    }
                  }).catch(function (error) {
                    return next(error);
                  });
                } else {
                  _trip2.default.findOneAndUpdateAsync({ _id: id, activeStatus: true }, { $set: {
                      activeStatus: false, tripEndTime: new Date().toISOString(),
                      visitedTerminalIds: [], visitedTerminalsCount: 0
                    } }, { new: true }).then(function (updatedTrip) {
                    if (updatedTrip) {
                      updateDriverVehicleStatusAsync(trip, trip.shuttleId, false).then(function (results) {
                        returnObj.success = true;
                        returnObj.message = "Shuttle deactivated";
                        returnObj.data = trip;
                        notifyDriverAdminTripStatus(updatedTrip.driver._id, updatedTrip._id);
                        return res.send(returnObj);
                      }).catch(function (error) {
                        console.log("error is >>>>>>>>>>>>>>", error);
                        next(error);
                      });
                    } else {
                      returnObj.success = false;
                      returnObj.message = "Trip not found, Trip already deactivated.";
                      return res.send(returnObj);
                    }
                  }).catch(function (error) {
                    returnObj.success = false;
                    returnObj.message = "Error while transfering request";
                    return res.send(returnObj);
                  });
                }
              }).catch(function (err) {
                console.log('error searching accepted requests', err);
                var error = new _APIError2.default('Something went wrong, while searching accepted requests', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
                return next(error);
              });
            }).catch(function (err) {
              console.log('error searching accepted requests', err);
              var error = new _APIError2.default('Something went wrong, while searching accepted requests', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
              return next(error);
            });
          }
        }
      }
    }
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

function rejectTripRequestNotifyRiderAsync(tripObj, tripReq) {
  var returnObj = {
    success: false, message: '', data: null
  };
  return new _promise2.default(function (resolve, reject) {
    var updateTripRequestData = {
      tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED,
      requestUpdatedTime: new Date().toISOString()
    };

    var query = {
      _id: tripReq._id
    };

    _tripRequest2.default.findOneAndUpdateAsync(query, { $set: updateTripRequestData }, { new: true }).then(function (tripReqObj) {
      if (tripReqObj) {
        _trip2.default.findOneAndUpdateAsync({ _id: tripObj._id, activeStatus: true }, { $addToSet: { tripRequests: tripReqObj } }, { new: true }).then(function (updatedTrip) {
          if (updatedTrip) {

            /** notify rider with following details
             * 1. driver details
             * 2. shuttle details
             */
            _trip2.default.aggregateAsync([{ $match: { _id: _mongoose2.default.Types.ObjectId(tripObj._id), activeStatus: true } }, {
              $lookup: {
                from: "users",
                localField: "driver._id",
                foreignField: "_id",
                as: "driver"
              }
            }, {
              $lookup: {
                from: "adminvehicles",
                localField: "shuttleId",
                foreignField: "_id",
                as: "vehicle"
              }
            }, {
              $lookup: {
                from: "users",
                localField: "driver.adminId",
                foreignField: "_id",
                as: "admin"
              }
            }]).then(function (updatedTrip) {
              if (updatedTrip && updatedTrip.length > 0) {
                var adminDetails = updatedTrip[0].admin[0];
                var resToRider = {
                  driver: updatedTrip[0].driver[0],
                  shuttle: updatedTrip[0].vehicle[0]
                };
                delete resToRider.driver.password;

                // notify the riders witout ETA
                var message = '';
                if (tripReqObj.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED) {
                  message = 'Driver cancelled your trip request, please contact shuttle operator +' + adminDetails.isdCode + adminDetails.phoneNo;
                }
                _socketStore2.default.emitByUserId(tripReqObj.riderId, "requestRejectedRider", { success: true, message: message,
                  data: resToRider });

                var pushData = {
                  success: true, message: message,
                  data: resToRider
                };
                pushNotificationToRider(tripReqObj.riderId, tripReqObj.tripRequestStatus, pushData);
              }
            }).catch(function (err) {
              console.log("error1 notifying rider>>>>", err);
              _socketStore2.default.emitByUserId(tripObj.driver._id, 'socketError', { success: false, message: 'Something went wrong, while notifying the rider', data: null });
            });
            returnObj.success = true;
            returnObj.message = "Request rejected";
            returnObj.data = { updatedTrip: updatedTrip, tripRequest: tripReqObj };
            resolve(returnObj);
          } else {
            return reject(new Error("trip history could not be updated"));
          }
        }).catch(function (err) {
          return reject(err);
        });
      } else {
        return reject(new Error("request could not be updated"));
      }
    }).catch(function (err) {
      return reject(err);
    });
  });
}

function pushNotificationToRider(riderId, status, data) {
  var pushData = {
    body: 'Ride Updated Successfully',
    title: 'Ride Updated',
    payload: data.payload
  };
  if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
    pushData.body = "Your Request has been accepted";
  } else if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED) {
    pushData.body = "Your Request has been rejected";
  } else if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED) {
    pushData.body = "Request has been cancelled successfully";
  } else if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_COMPLETED) {
    pushData.body = "Your ride has been completed.";
  } else if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE) {
    pushData.body = "Your ride has been en routed";
  } else {
    return false;
  }
  PushNotification.sendNotificationByUserIdAsync(riderId, pushData);
}

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
      } else if (results && !results[2]) {
        return reject(new Error("Something went wrong while updating trip"));
      } else if (results && results[0] && results[1] && results[2]) {
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

          if (foundShuttles && foundShuttles.length) {
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
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

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

function transferRequestsDynamicAsync(fromTripId, toTripId, tripRequestID) {
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
      console.log("                                                 ");
      console.log('fromToTrips  ------  >', (0, _stringify2.default)(fromToTrips));
      console.log("                                                 ");
      console.log("                                                 ");
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

      var requestToTransfer = [TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE];
      _tripRequest2.default.find({ tripId: fromTrip._id, tripRequestStatus: { $in: requestToTransfer } }).then(function (pendingRequests) {
        console.log("                                                 ");
        console.log('pendingRequests  ------  >', (0, _stringify2.default)(pendingRequests));
        console.log("                                                 ");
        console.log("                                                 ");
        if (pendingRequests && pendingRequests.length) {
          async.eachOf(pendingRequests, function (request, key, cb) {
            var newTripReqObj = {
              driverId: toTrip.driver._id,
              tripId: toTrip._id,
              requestUpdatedTime: new Date().toISOString()
            };
            // Updating Triprequest Schema with new driver and new TripId
            _tripRequest2.default.findOneAndUpdateAsync({ _id: request._id }, newTripReqObj, { new: true }).then(function (savedTripRequest) {
              console.log("                                                 ");
              console.log('savedTripRequest  ------  >', (0, _stringify2.default)(savedTripRequest));
              console.log("                                                 ");
              console.log("                                                 ");
              notifyRideTransferRider(savedTripRequest, toTrip);
              var toTripUpdates = {
                $addToSet: { tripRequests: savedTripRequest }
              };

              if (savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED || savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE) {
                toTripUpdates["$inc"] = { seatBooked: request.seatBooked, seatsAvailable: -request.seatBooked };
              }

              // Updating To trip with updated Triprequest Start
              _trip2.default.findOneAndUpdateAsync({ _id: toTrip._id, activeStatus: true }, toTripUpdates, { new: true }).then(function (updatedTrip) {
                console.log("                                                 ");
                console.log('updatedTrip updatedTrip  ------  >', (0, _stringify2.default)(updatedTrip));
                console.log("                                                 ");
                console.log("                                                 ");
                // Updating from trip with Old Triprequest Start
                _trip2.default.findOneAndUpdateAsync({ _id: fromTrip._id, activeStatus: true }, { $pull: { tripRequests: { _id: tripRequestID, tripId: fromTrip._id } } }, { new: true }).then(function (updatedfromTripRequest) {
                  var requestPrevStatus = request.tripRequestStatus;
                  request.tripRequestStatus = TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED, request.requestUpdatedTime = new Date().toISOString();
                  _trip2.default.findOneAndUpdateAsync({ _id: fromTrip._id, activeStatus: true }, { $addToSet: { tripRequests: request } }, { new: true }).then(function (updatedfromTrip) {
                    if (savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED || savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE) {
                      var availableSeats = fromTrip.seatBooked + request.seatBooked;
                      var bookedSeat = fromTrip.seatsAvailable - request.seatBooked;
                      var tripQuery = { "_id": fromTrip._id, activeStatus: true };
                      _trip2.default.updateSeats(tripQuery, availableSeats, bookedSeat).then(function (totalTripRecords) {
                        request.tripRequestStatus = requestPrevStatus;
                        updateDriverRouter(toTrip._id, toTrip.driver._id, request).then(function (updatedTripRoutes) {
                          // const fromTripRouteUpdated = updatedTripRoutes[0];
                          // const toTripRouteUpdated = updatedTripRoutes[1];
                          // console.log("fromTripRouteUpdated", JSON.stringify(fromTripRouteUpdated))
                          // console.log("toTripRouteUpdated", JSON.stringify(toTripRouteUpdated))
                          // if(!fromTripRouteUpdated || !toTripRouteUpdated) {
                          //   if(!fromTripRouteUpdated) {
                          //     return cb(new Error("trip route not updated for source trip "));
                          //   } else {
                          //     return cb(new Error("trip route not updated for destination trip  "));
                          //   }
                          // }
                          notifyDynamicUpdatedRoute(fromTrip.driver._id, savedTripRequest, fromTrip);
                          request.tripRequestStatus = TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED, notifyDynamicUpdatedRoute(toTrip.driver._id, request, toTrip);
                          cb();
                        }).catch(function (err) {
                          cb(err);
                        });
                      }).catch(function (error) {
                        cb(error);
                      });
                    } else {
                      cb();
                    }
                  }).catch(function (error) {
                    cb(error);
                  });
                  /******* END :- Updating from trip with Old Triprequest Start ************/
                }).catch(function (error) {
                  cb(error);
                });
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

function updateDriverRouter(tripID, driverID, tripRequestData) {
  console.log("updating adding terminal on route driver > ", driverID);
  return new _promise2.default(function (resolve, reject) {
    _trip2.default.findOneAsync({ _id: tripID }).then(function (tripData) {

      if (tripData && tripData.driver.route.terminals.length > 0) {
        console.log("add terminals consecutive request");
        var obj = [];
        obj.push(tripRequestData.srcLoc);
        obj.push(tripRequestData.destLoc);

        // calculate duration on each terminal


        var promisesToCheckIfLocExists = obj.map(function (terminal, index) {
          return function (callback) {
            var selectedIndex = index;
            var pipelineStages = [{
              $match: { _id: _mongoose2.default.Types.ObjectId(tripID) }
            }, {
              $unwind: "$driver.route.terminals" }, {
              // $match: {"driver.route.terminals.loc": { $geoWithin: { $centerSphere: [ terminal.loc, 0 ] } }}
              $match: { "driver.route.terminals.address": terminal.address }
            }];
            _trip2.default.aggregateAsync(pipelineStages).then(function (results) {
              console.log("terminals to add on consecutive requests", (0, _stringify2.default)(results));
              if (results && results.length) {
                var existingTerminal = results[0];
                var query = { _id: tripRequestData._id };
                var updateData = { $set: {} };
                if (selectedIndex === 0) {
                  // update src loc _id
                  updateData["$set"]["srcLoc._id"] = existingTerminal.driver.route.terminals._id;
                } else {
                  updateData["$set"]["destLoc._id"] = existingTerminal.driver.route.terminals._id;
                }
                _tripRequest2.default.findOneAndUpdate(query, updateData, { new: true }).then(function (updateTripRequest) {
                  return callback(null, results[0]);
                }).catch(function (err) {
                  return callback(null, results[0]);
                });
              } else {
                console.log("add new terminal>>>>>>>>>>>>");
                SharedService.addReorderDynamicTerminal(terminal, tripData, null).then(function (tripDataUpdate) {
                  return callback(null, tripDataUpdate);
                }).catch(function (err) {
                  console.log('error while find trip request', err);
                  _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong', data: null });
                  return callback(err, null);
                });
              }
            });
          };
        });
        async.series(promisesToCheckIfLocExists, function (err, results) {
          if (err) {
            return reject(err);
          }
          if (results && results.length) {
            _trip2.default.findOneAsync({ _id: tripID }).then(function (tripData) {
              return resolve(tripData);
            }).catch(function (error) {
              console.log('error while find trip request', error);
              _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong', data: null });
              return reject(error);
            });
          }
        });
      } else if (!tripData.driver.route.terminals.length) {
        console.log("add terminals as initial request");
        // add terminals as initial request
        SharedService.addReorderDynamicTerminal(null, tripData, tripRequestData).then(function (updatedTrip) {
          return resolve(updatedTrip);
        }).catch(function (err) {
          _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong', data: null });
          return reject(err);
        });
      } else {
        _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong', data: null });
        return reject(new Error("trip not found"));
      }
    }).catch(function (err) {
      reject(err);
    });
  });
}

function notifyDynamicUpdatedRoute(driverId, tripReqObj) {
  var tripObj = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;


  console.log("         ");
  console.log("         ");
  console.log("    notifyDynamicUpdatedRoute,driver     ", tripObj.driver.email);
  console.log("         ");
  console.log("         ");
  _user2.default.findOneAsync({ _id: tripReqObj.riderId }, '-password')
  // eslint-disable-next-line consistent-return
  .then(function (user) {
    var res = {
      ride: (0, _extends3.default)({}, tripReqObj._doc, {
        riderDetails: user
      }),
      driverRoute: tripObj && tripObj.driver && tripObj.driver.route && tripObj.driver.route.terminals || []
    };
    getDynamicRouteOrderAsync(tripObj).then(function (terminals) {
      res.driverRoute = terminals || [];
      if (user) {
        console.log("                                              ");
        console.log("res", (0, _stringify2.default)(res));
        console.log("                                              ");
        _socketStore2.default.emitByUserId(driverId, requestUpdateEventToDriver[tripReqObj.tripRequestStatus], {
          success: true,
          message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
          data: res
        });
        // notify the driver's admin
        notifyDriverAdminTripStatusDynamic(driverId, requestUpdateEventToAdmin[tripReqObj.tripRequestStatus], {
          success: true,
          message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
          data: res
        });
        var pushData = {
          payload: {
            success: true,
            message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
            data: res
          }
        };
        pushNotificationToDriver(driverId, tripReqObj.tripRequestStatus, pushData);
      } else {
        // eslint-disable-next-line consistent-return
        _socketStore2.default.emitByUserId(tripObj.driverId, requestUpdateEventToDriver[tripReqObj.tripRequestStatus], { success: true, message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus], data: res });

        var _pushData = {
          payload: {
            success: true,
            message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
            data: res
          }
        };
        pushNotificationToDriver(tripObj.driver._id, tripReqObj.tripRequestStatus, _pushData);
      }
    }).catch(function (err) {
      console.log("error2 notifying rider>>>>", err);
      _socketStore2.default.emitByUserId(tripObj.driver._id || driverId, 'socketError', { success: false, message: 'Something went wrong, while notifying the rider', data: null });
    });
  }).catch(function (e) {
    console.log("error3 notifying rider>>>>", e);
    _socketStore2.default.emitByUserId(tripObj.driver._id || driverId, 'socketError', { success: false, message: 'Something went wrong, while notifying the rider', data: null });
  });
}

function getDynamicRouteOrderAsync(trip) {
  return new _promise2.default(function (resolve, reject) {
    var pipelineStages = [{
      $match: { _id: _mongoose2.default.Types.ObjectId(trip._id) }
    }, {
      $unwind: "$driver.route.terminals"
    }, { $sort: { "driver.route.terminals.sequenceNo": 1 } }, {
      $group: { "_id": "_id", "terminals": { $push: "$driver.route.terminals" } }
    }];
    _trip2.default.aggregateAsync(pipelineStages).then(function (results) {
      if (results && results[0]) {
        var tripTerminals = results[0];
        return resolve(tripTerminals && tripTerminals.terminals || []);
      } else {
        return resolve([]);
      }
    }).catch(function (err) {
      console.log("error getting route terminals ordered", err);
      return reject(err);
    });
  });
}

function pushNotificationToDriver(driverId, status, data) {
  var pushData = {
    body: 'Trip updated successfully',
    title: 'Trip updated',
    payload: data.payload
  };
  if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
    pushData.body = 'Request was accepted successfully';
  } else if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED) {
    pushData.title = "Request was rejected successfully";
  } else if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED) {
    pushData.title = "Request was cancelled successfully";
  } else {
    return false;
  }
  PushNotification.sendNotificationByUserIdAsync(driverId, pushData);
}

function notifyDriverAdminTripStatusDynamic(driverId, event, payload) {
  var resPayload = (0, _extends3.default)({}, payload);
  var query = {
    "driver._id": driverId,
    activeStatus: true
  };

  _trip2.default.findOne(query, { "activeStatus": 1, "visitedTerminal": 1, "gpsLoc": 1 }).populate([{ path: 'driver._id', select: 'name email' }]).then(function (result) {
    if (result) {
      if (payload.data) {
        resPayload.data.tripData = result;
      }
      _socketStore2.default.emitByUserId(result._id, event, resPayload);
    }
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
  console.log("                                   ");
  console.log("toShuttle", (0, _stringify2.default)(toShuttle));
  console.log("                                   ");
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
                var availableSeats = tripSeatCount.seatsAvailable - parseInt(req.body.noOfseats);
                var bookedSeat = tripSeatCount.seatBooked + parseInt(req.body.noOfseats);
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

/*
  END
  Task : Add passangers at driver section (BY DRIVER ON BEHALF OF RIDER)
*/
//# sourceMappingURL=user.js.map
