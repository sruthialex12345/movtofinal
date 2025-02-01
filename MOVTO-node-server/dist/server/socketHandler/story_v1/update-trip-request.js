'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _requestUpdateMessage, _requestUpdateEventTo, _requestUpdateEventTo2, _requestUpdateEventTo3;

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _tripRequestStatuses = require('../../constants/trip-request-statuses');

var TRIP_REQUEST_STATUS = _interopRequireWildcard(_tripRequestStatuses);

var _smsApi = require('../../service/smsApi');

var _trip = require('../../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _tripRequest = require('../../models/tripRequest');

var _tripRequest2 = _interopRequireDefault(_tripRequest);

var _socketStore = require('../../service/socket-store');

var _socketStore2 = _interopRequireDefault(_socketStore);

var _user = require('../../models/user.js');

var _user2 = _interopRequireDefault(_user);

var _adminVehicle = require('../../models/adminVehicle');

var _adminVehicle2 = _interopRequireDefault(_adminVehicle);

var _pushNotification = require('../../service/pushNotification');

var PushNotification = _interopRequireWildcard(_pushNotification);

var _shared = require('../../service/shared');

var SharedService = _interopRequireWildcard(_shared);

var _tripType = require('../../constants/trip-type');

var _env = require('../../../config/env');

var _env2 = _interopRequireDefault(_env);

var _APIError = require('../../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _assert = require('assert');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var requestUpdateMessageToRider = (_requestUpdateMessage = {}, (0, _defineProperty3.default)(_requestUpdateMessage, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, "Request Accepted"), (0, _defineProperty3.default)(_requestUpdateMessage, TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED, "Request Rejected"), (0, _defineProperty3.default)(_requestUpdateMessage, TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED, "Request Cancelled"), (0, _defineProperty3.default)(_requestUpdateMessage, TRIP_REQUEST_STATUS.TRIP_REQUEST_COMPLETED, "Ride Completed"), (0, _defineProperty3.default)(_requestUpdateMessage, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE, "Ride Onboard"), (0, _defineProperty3.default)(_requestUpdateMessage, TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED, "Ride Transferred"), _requestUpdateMessage);

var requestUpdateEventToRider = (_requestUpdateEventTo = {}, (0, _defineProperty3.default)(_requestUpdateEventTo, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, "requestAcceptedRider"), (0, _defineProperty3.default)(_requestUpdateEventTo, TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED, "requestRejectedRider"), (0, _defineProperty3.default)(_requestUpdateEventTo, TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED, "requestCancelledRider"), (0, _defineProperty3.default)(_requestUpdateEventTo, TRIP_REQUEST_STATUS.TRIP_REQUEST_COMPLETED, "requestCompletedRider"), (0, _defineProperty3.default)(_requestUpdateEventTo, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE, "requestEnrouted"), _requestUpdateEventTo);

var requestUpdateEventToDriver = (_requestUpdateEventTo2 = {}, (0, _defineProperty3.default)(_requestUpdateEventTo2, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, "requestAcceptedDriver"), (0, _defineProperty3.default)(_requestUpdateEventTo2, TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED, "requestRejectedDriver"), (0, _defineProperty3.default)(_requestUpdateEventTo2, TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED, "requestCancelledDriver"), (0, _defineProperty3.default)(_requestUpdateEventTo2, TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED, "requestTransferredDriver"), _requestUpdateEventTo2);

var requestUpdateEventToAdmin = (_requestUpdateEventTo3 = {}, (0, _defineProperty3.default)(_requestUpdateEventTo3, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, "requestAcceptedAdmin"), (0, _defineProperty3.default)(_requestUpdateEventTo3, TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED, "requestRejectedAdmin"), (0, _defineProperty3.default)(_requestUpdateEventTo3, TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED, "requestCancelledAdmin"), (0, _defineProperty3.default)(_requestUpdateEventTo3, TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED, "requestTransferredAdmin"), _requestUpdateEventTo3);

function updateTripRequestHandler(socket) {

  socket.on('driverRejectTripRequest_v1', function (tripReqObj) {

    // var tripReqObj={ tripRequestID: '5c7f98d51d899957e87b1f8b',
    //                   tripID: '5c7f98b71d899957e87b1f8a',
    //                   driverID: '5c7e68e209f9025ffae10c06'
    //                 }

    // console.log("driverRejectTripRequest_v1 ---> ", tripReqObj) ;
    // console.log(typeof(tripReqObj));
    var tripRequestID = tripReqObj.tripRequestID;
    var tripID = tripReqObj.tripID;
    var driverID = tripReqObj.driverID;

    /**
     * 1. find the trip request
     * 2. update the trip request with trip id provided by driver
     * 3. add the trip request to the driver's current trip requests array with the status changed by driver
     * 3. notify status to the driver
     * 4. notify the rider with the trip driver(current location) and shuttle details and approx arrival time (preffered)
     */

    var updateTripRequestData = {
      tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED,
      driverId: tripReqObj.driverID,
      tripId: tripReqObj.tripID,
      requestUpdatedTime: new Date().toISOString()
    };

    console.log("                   ");
    console.log("  tripReqObj.tripRequestID    ", tripRequestID);
    console.log("                   ");

    var query = { _id: tripRequestID, tripId: tripID };

    console.log("                   ");
    console.log("  query    ", query);
    console.log("                   ");

    _tripRequest2.default.findOneAsync(query).then(function (tripRequest) {
      if (tripRequest) {
        if (tripRequest.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED) {
          return _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Trip request already rejected', data: null });
        } else if (tripRequest.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT || tripRequest.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
          nearByShuttleAsync(tripID, { seats: tripRequest.seatBooked }).then(function (response) {
            console.log("                   ");
            console.log("  response    ", response);
            console.log("                   ");

            if (!response.success) {
              sendCancelNotification(tripRequestID, updateTripRequestData, tripID, driverID, tripRequest);
            } else {
              // notify the driver on other trip, to request to transfer of all pending requests
              var transferToShuttle = response && response.data && response.data[0];
              if (transferToShuttle) {
                // send request to the other trip driver
                var eventPayload = { success: true, message: "New transfer request", data: { tripId: tripID } };
                _socketStore2.default.emitByUserId(transferToShuttle.driver._id, 'transferRequest', eventPayload);

                transferRequestsAsync(tripID, transferToShuttle._id, tripRequestID).then(function (result) {
                  _trip2.default.findOneAndUpdateAsync({ _id: tripID, activeStatus: true }, { $set: { tripEndTime: new Date().toISOString()
                    } }, { new: true }).then(function (updatedTrip) {}).catch(function (err) {
                    console.log("ROORE - > ", err);
                    _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Error while transfering requests', data: null });
                  });
                }).catch(function (err) {
                  console.log("ROORE 2- > ", err);
                  _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Error while transfering requests', data: null });
                });
              } else {
                sendCancelNotification(tripRequestID, updateTripRequestData, tripID, driverID, tripRequest);
                // SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Trip has pending requests but no other trip found to transfer requests`, data: null });
              }
            }
          }).catch(function (error) {
            console.log(error);
            _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong: While Transfer Trip ', data: null });
          });
        } else {
          _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Trip request can not be processed', data: null });
        }
      } else {
        _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Trip request not found', data: null });
      }
    }).catch(function (err) {
      _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong: searching trip request', data: null });
    });
  });

  function sendCancelNotification(tripRequestID, updateTripRequestData, tripID, driverID, tripRequest) {
    _tripRequest2.default.findOneAndUpdateAsync({ _id: tripRequestID }, { $set: updateTripRequestData }, { new: true }).then(function (tripRequestData) {
      if (tripRequestData) {
        var newTripRequest = tripRequestData;
        var updateTripData = {
          $push: { tripRequests: newTripRequest }
        };
        if (tripRequest.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
          updateTripData["$inc"] = { seatsAvailable: tripRequest.seatBooked, seatBooked: -tripRequest.seatBooked };
        }
        _trip2.default.findOneAndUpdateAsync({ _id: tripID, activeStatus: true }, updateTripData, { new: true }).then(function (updatedTrip) {
          if (updatedTrip) {
            // notify the driver with trip request data if prev status was accepted or init
            if (updatedTrip.driver.tripType !== _tripType.TRIP_DYNAMIC) {
              updateTripRequestNotifyDriver(driverID, newTripRequest, updatedTrip);
            }
            if (tripRequest.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED && updatedTrip.driver.tripType === _tripType.TRIP_DYNAMIC) {
              /**
               * 1. driver route should be updated for driver rejecting the accepted ride
               * 2. notify the same to the driver
               */
              removeTerminalsDynamicRequestsAsync(tripRequestData, updatedTrip).then(function (res) {
                notifyDynamicUpdatedRoute(updatedTrip.driver._id, tripRequestData, updatedTrip);
              }).catch(function (err) {
                _socketStore2.default.emitByUserId(driverID, "socketError", { success: false, message: 'Something went wrong updating route', data: null });
              });
            } else if (tripRequest.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT && updatedTrip.driver.tripType === _tripType.TRIP_DYNAMIC) {
              notifyDynamicUpdatedRoute(updatedTrip.driver._id, tripRequestData, updatedTrip);
            }

            // notify the rider with driver and shuttle details
            udpateTripRequestNotifyRider(updatedTrip, newTripRequest);
          } else {
            _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Trip request could not be updated', data: null });
          }
        }).catch(function (err) {
          _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong while adding trip request', data: null });
        });
      } else {
        _socketStore2.default.emitByUserId(tripReqObj.driverID, 'socketError', { success: false, message: 'Trip request not found', data: null });
      }
    }).catch(function (error) {
      console.log('error while find trip request', error);
      _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong', data: null });
    });
  }

  function udpateTripRequestNotifyRider(tripObj, tripReqObj) {

    /**
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
        console.log("emitting trip request", (0, _stringify2.default)(tripReqObj));

        if (tripReqObj.tripRequestStatus && tripReqObj.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
          // notify the riders with ETA
          if (tripObj && tripObj.driver.tripType === _tripType.TRIP_DYNAMIC) {
            // if driver is on dynamic route
            SharedService.dynamicRouteAsyncETA(tripReqObj, tripObj).then(function (eta) {
              // add eta to response
              resToRider["ETA"] = eta;
              _socketStore2.default.emitByUserId(tripReqObj.riderId, requestUpdateEventToRider[tripReqObj.tripRequestStatus], { success: true, message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
                data: resToRider });
            }).catch(function (err) {
              resToRider["ETA"] = null;
              _socketStore2.default.emitByUserId(tripReqObj.riderId, requestUpdateEventToRider[tripReqObj.tripRequestStatus], { success: true, message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
                data: resToRider });
            });
          } else {
            // if driver is on static route
            SharedService.staticRouteAsyncETA(tripReqObj, tripObj).then(function (eta) {
              // add eta to response
              resToRider["ETA"] = eta;
              console.log("requestUpdateEventToRider  2", requestUpdateEventToRider[tripReqObj.tripRequestStatus]);
              _socketStore2.default.emitByUserId(tripReqObj.riderId, requestUpdateEventToRider[tripReqObj.tripRequestStatus], { success: true, message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
                data: resToRider });
            }).catch(function (err) {
              console.log("ETA error on accept request", err);
              resToRider["ETA"] = null;
              _socketStore2.default.emitByUserId(tripReqObj.riderId, requestUpdateEventToRider[tripReqObj.tripRequestStatus], { success: true, message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
                data: resToRider });
            });
          }
        } else {
          console.log("requestUpdateEventToRider  3", requestUpdateEventToRider[tripReqObj.tripRequestStatus]);
          // notify the riders witout ETA
          var message = '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus];
          if (tripReqObj.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED) {
            message = 'Driver cancelled your trip request, please contact shuttle operator +' + adminDetails.isdCode + adminDetails.phoneNo;
          }
          _socketStore2.default.emitByUserId(tripReqObj.riderId, requestUpdateEventToRider[tripReqObj.tripRequestStatus], { success: true, message: message,
            data: resToRider });
        }

        var pushData = {
          success: true, message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
          data: resToRider
        };
        pushNotificationToRider(tripReqObj.riderId, tripReqObj.tripRequestStatus, pushData);
      }
    }).catch(function (err) {
      console.log("error1 notifying rider>>>>", err);
      _socketStore2.default.emitByUserId(tripObj.driver._id, 'socketError', { success: false, message: 'Something went wrong, while notifying the rider', data: null });
    });
  }

  function notifyDriverAdminTripStatus(driverId, event, payload) {
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

  function updateTripRequestNotifyDriver(driverId, tripReqObj) {
    var tripObj = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    /**
     * 1. rider details
     */
    _user2.default.findOneAsync({ _id: tripReqObj.riderId }, '-password')
    // eslint-disable-next-line consistent-return
    .then(function (user) {
      var res = {
        ride: (0, _extends3.default)({}, tripReqObj._doc, {
          riderDetails: user
        }),
        driverRoute: tripObj && tripObj.driver && tripObj.driver.route && tripObj.driver.route.terminals || []
      };
      if (tripObj && tripObj.driver.tripType === _tripType.TRIP_DYNAMIC) {
        getDynamicRouteOrderAsync(tripObj).then(function (terminals) {
          res.driverRoute = terminals || [];
          if (user) {
            _socketStore2.default.emitByUserId(driverId, requestUpdateEventToDriver[tripReqObj.tripRequestStatus], {
              success: true,
              message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
              data: res
            });
            // notify the driver's admin
            notifyDriverAdminTripStatus(driverId, requestUpdateEventToAdmin[tripReqObj.tripRequestStatus], {
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
      } else {
        if (user) {
          console.log("                                              ");
          console.log("res   ------ >", (0, _stringify2.default)(tripReqObj));
          console.log("                                              ");
          _socketStore2.default.emitByUserId(driverId, requestUpdateEventToDriver[tripReqObj.tripRequestStatus], {
            success: true,
            message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
            data: res
          });
          // notify the driver's admin
          notifyDriverAdminTripStatus(driverId, requestUpdateEventToAdmin[tripReqObj.tripRequestStatus], {
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

          var _pushData2 = {
            payload: {
              success: true,
              message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
              data: res
            }
          };
          pushNotificationToDriver(tripObj.driver._id, tripReqObj.tripRequestStatus, _pushData2);
        }
      }
    }).error(function (e) {
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

  function nearByShuttleAsync(currentShuttleId) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

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
              "_id": { $ne: _mongoose2.default.Types.ObjectId(currentShuttleId) },
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

  function transferRequestsAsync(fromTripId, toTripId, tripRequestID) {
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
        _tripRequest2.default.find({ tripId: fromTrip._id, _id: tripRequestID }).then(function (pendingRequests) {
          if (pendingRequests && pendingRequests.length) {
            _async2.default.eachOf(pendingRequests, function (request, key, cb) {
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
                  _trip2.default.findOneAndUpdateAsync({ _id: fromTrip._id, activeStatus: true }, { $pull: { tripRequests: { _id: tripRequestID, tripId: fromTrip._id } } }, { new: true }).then(function (updatedfromTripRequest) {
                    var requestPrevStatus = request.tripRequestStatus;
                    request.tripRequestStatus = TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED, request.requestUpdatedTime = new Date().toISOString();
                    _trip2.default.findOneAndUpdateAsync({ _id: fromTrip._id, activeStatus: true }, { $addToSet: { tripRequests: request } }, { new: true }).then(function (updatedfromTrip) {
                      if (savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
                        var availableSeats = fromTrip.seatsAvailable + request.seatBooked;
                        var bookedSeat = fromTrip.seatBooked - request.seatBooked;
                        var tripQuery = { "_id": fromTrip._id, activeStatus: true };
                        console.log("???????????");
                        console.log("updating from trip seats availableseats, bookedseats", availableSeats, bookedSeat);
                        console.log("???????????");
                        _trip2.default.updateSeats(tripQuery, availableSeats, bookedSeat).then(function (totalTripRecords) {
                          // if trip request status is accepted and trip type is dynamic
                          // update driver's route for both from trip and to trip
                          if (fromTrip && fromTrip.driver.tripType === _tripType.TRIP_DYNAMIC) {
                            request.tripRequestStatus = requestPrevStatus;
                            _promise2.default.all([removeTerminalsDynamicRequestsAsync(request, fromTrip), updateDriverRouter(toTrip._id, toTrip.driver._id, request)]).then(function (updatedTripRoutes) {
                              var fromTripRouteUpdated = updatedTripRoutes[0];
                              var toTripRouteUpdated = updatedTripRoutes[1];
                              if (!fromTripRouteUpdated || !toTripRouteUpdated) {
                                if (!fromTripRouteUpdated) {
                                  return cb(new Error("trip route not updated for source trip "));
                                } else {
                                  return cb(new Error("trip route not updated for destination trip  "));
                                }
                              }
                              savedTripRequest.tripRequestStatus = TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED, notifyDynamicUpdatedRoute(fromTrip.driver._id, savedTripRequest, fromTrip);
                              request.tripRequestStatus = TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED, notifyDynamicUpdatedRoute(toTrip.driver._id, request, toTrip);
                              cb();
                            }).catch(function (err) {
                              cb(err);
                            });
                          } else {
                            savedTripRequest.tripRequestStatus = TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED, notifyStaticUpdatedRoute(fromTrip.driver._id, savedTripRequest, fromTrip);
                            request.tripRequestStatus = TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED, notifyStaticUpdatedRoute(toTrip.driver._id, request, toTrip);
                            cb();
                          }
                        }).catch(function (error) {
                          cb(error);
                        });
                      } else {
                        if (fromTrip && fromTrip.driver.tripType === _tripType.TRIP_DYNAMIC && savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT) {
                          savedTripRequest.tripRequestStatus = TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED;
                          notifyDynamicUpdatedRoute(fromTrip.driver._id, savedTripRequest, fromTrip);
                          request.tripRequestStatus = TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED;;
                          notifyDynamicUpdatedRoute(toTrip.driver._id, request, toTrip);
                          cb();
                        } else if (fromTrip && fromTrip.driver.tripType === _tripType.TRIP_CIRCULAR_STATIC && savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT) {
                          //  Need to add evenet for Static Driver request transfer
                          savedTripRequest.tripRequestStatus = TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED, notifyStaticUpdatedRoute(fromTrip.driver._id, savedTripRequest, fromTrip);
                          request.tripRequestStatus = TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED, notifyStaticUpdatedRoute(toTrip.driver._id, request, toTrip);
                          cb();
                          cb();
                        }
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

  function notifyStaticUpdatedRoute(driverId, tripReqObj) {
    var tripObj = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    _user2.default.findOneAsync({ _id: tripReqObj.riderId }, '-password')
    // eslint-disable-next-line consistent-return
    .then(function (user) {
      var res = {
        ride: (0, _extends3.default)({}, tripReqObj._doc, {
          riderDetails: user
        }),
        driverRoute: tripObj && tripObj.driver && tripObj.driver.route && tripObj.driver.route.terminals || []
      };
      if (user) {
        _socketStore2.default.emitByUserId(driverId, requestUpdateEventToDriver[tripReqObj.tripRequestStatus], {
          success: true,
          message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
          data: res
        });
        // notify the driver's admin
        notifyDriverAdminTripStatus(driverId, requestUpdateEventToAdmin[tripReqObj.tripRequestStatus], {
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
        _socketStore2.default.emitByUserId(tripObj.driverId, requestUpdateEventToDriver[tripReqObj.tripRequestStatus], { success: true, message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus], data: res });

        var _pushData3 = {
          payload: {
            success: true,
            message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
            data: res
          }
        };
        pushNotificationToDriver(tripObj.driver._id, tripReqObj.tripRequestStatus, _pushData3);
      }
    }).catch(function (e) {
      console.log("error3 notifying rider>>>>", e);
      _socketStore2.default.emitByUserId(tripObj.driver._id || driverId, 'socketError', { success: false, message: 'Something went wrong, while notifying the rider', data: null });
    });
  }

  function notifyDynamicUpdatedRoute(driverId, tripReqObj) {
    var tripObj = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

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
          _socketStore2.default.emitByUserId(driverId, requestUpdateEventToDriver[tripReqObj.tripRequestStatus], {
            success: true,
            message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
            data: res
          });
          // notify the driver's admin
          notifyDriverAdminTripStatus(driverId, requestUpdateEventToAdmin[tripReqObj.tripRequestStatus], {
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
          _socketStore2.default.emitByUserId(tripObj.driverId, requestUpdateEventToDriver[tripReqObj.tripRequestStatus], { success: true, message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus], data: res });

          var _pushData4 = {
            payload: {
              success: true,
              message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
              data: res
            }
          };
          pushNotificationToDriver(tripObj.driver._id, tripReqObj.tripRequestStatus, _pushData4);
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

  function updateDriverRouter(tripID, driverID, tripRequestData) {
    console.log("updating adding terminal on route driver > ", driverID);
    return new _promise2.default(function (resolve, reject) {
      _trip2.default.findOneAsync({ _id: tripID }).then(function (tripData) {

        if (tripData && tripData.driver.route.terminals.length > 0) {
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
          _async2.default.series(promisesToCheckIfLocExists, function (err, results) {
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

  function checkIfToRemoveRequestSrcDest(request) {
    console.log("checkIfToRemoveRequestSrcDest request ", request);
    var srcDest = [request.srcLoc, request.destLoc];
    var tripRequestStatus = [TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE];
    var resObj = { src: false, dest: false };
    return new _promise2.default(function (resolve, reject) {

      var srcDestPromises = srcDest.map(function (terminal, index) {
        // if terminal is source for any other requests, check for source terminal to remove
        if (index == 0) {
          return new _promise2.default(function (resolve, reject) {
            var query = {
              _id: { $ne: request._id },
              tripRequestStatus: { $in: tripRequestStatus },
              "srcLoc.loc": { $geoWithin: { $centerSphere: [terminal.loc, 0] } }
            };
            _tripRequest2.default.findAsync(query).then(function (requestsAsSrc) {
              if (requestsAsSrc && requestsAsSrc.length) {
                return resolve(resObj.src = false);
              } else {
                query["destLoc.loc"] = { $geoWithin: { $centerSphere: [terminal.loc, 0] } };
                _tripRequest2.default.findAsync(query).then(function (requestsAsDest) {
                  if (requestsAsDest && requestsAsDest.length) {
                    return resolve(resObj.src = false);
                  } else {
                    return resolve(resObj.src = true);
                  }
                }).catch(function (err) {
                  return reject(err);
                });
              }
            }).catch(function (err) {
              return reject(err);
            });
          });
        } else {
          // if terminal is dest for any other requests, check for dest terminal to remove
          return new _promise2.default(function (resolve, reject) {
            var query = {
              _id: { $ne: request._id },
              tripRequestStatus: { $in: tripRequestStatus },
              "srcLoc.loc": { $geoWithin: { $centerSphere: [terminal.loc, 0] } }
            };
            _tripRequest2.default.findAsync(query).then(function (requestsAsSrc) {
              if (requestsAsSrc && requestsAsSrc.length) {
                return resolve(resObj.dest = false);
              } else {
                query["destLoc.loc"] = { $geoWithin: { $centerSphere: [terminal.loc, 0] } };
                _tripRequest2.default.findAsync(query).then(function (requestsAsDest) {
                  if (requestsAsDest && requestsAsDest.length) {
                    return resolve(resObj.dest = false);
                  } else {
                    return resolve(resObj.dest = true);
                  }
                }).catch(function (err) {
                  return reject(err);
                });
              }
            }).catch(function (err) {
              return reject(err);
            });
          });
        }
      });

      _promise2.default.all(srcDestPromises).then(function (results) {
        resolve(resObj);
      }).catch(function (err) {
        reject(err);
      });
    });
  }

  function removeTerminalsDynamicRequestsAsync(tripRequestData, updatedTrip) {
    console.log("removing terminal from dynamic-driver", updatedTrip.driver);
    return new _promise2.default(function (resolve, reject) {
      checkIfToRemoveRequestSrcDest(tripRequestData).then(function (srcDestToRemove) {
        console.log("srcDestToRemove>>>>>>>>>>", srcDestToRemove);
        var newDriverTerminal = updatedTrip.driver.route.terminals;
        if (!srcDestToRemove.src && !srcDestToRemove.dest) {
          return resolve(false);
        }
        if (srcDestToRemove.src) {
          var srcIndex = newDriverTerminal.findIndex(function (x) {
            return (0, _stringify2.default)(x._id) === (0, _stringify2.default)(tripRequestData.srcLoc._id);
          });
          newDriverTerminal.splice(srcIndex, 1);
        }
        if (srcDestToRemove.dest) {
          var destIndex = newDriverTerminal.findIndex(function (x) {
            return (0, _stringify2.default)(x._id) === (0, _stringify2.default)(tripRequestData.destLoc._id);
          });
          newDriverTerminal.splice(destIndex, 1);
        }
        updatedTrip.driver.route.terminals = newDriverTerminal;

        _trip2.default.findOneAndUpdateAsync({ _id: tripRequestData.tripId }, { $set: {
            "driver.route.terminals": newDriverTerminal
          } }, { new: true }).then(function (tripRequestedData) {
          // notify the driver with trip request data
          _trip2.default.findOneAsync({ _id: tripRequestData.tripId }).then(function (tripObj) {
            return resolve(tripObj);
          }).error(function (e) {
            return reject(e);
          });
        }).error(function (e) {
          return reject(e);
        });
      }).catch(function (err) {
        console.log('error finding trip', err);
        return reject(err);
      });
    });
  }
}

exports.default = updateTripRequestHandler;
module.exports = exports.default;
//# sourceMappingURL=update-trip-request.js.map
