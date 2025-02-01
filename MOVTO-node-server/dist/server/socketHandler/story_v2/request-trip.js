'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _APIError = require('../../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _appConfig = require('../../models/appConfig');

var _appConfig2 = _interopRequireDefault(_appConfig);

var _shared = require('../../service/shared');

var Shared = _interopRequireWildcard(_shared);

var _pushNotification = require('../../service/pushNotification');

var PushNotification = _interopRequireWildcard(_pushNotification);

var _socketStore = require('../../service/socket-store.js');

var _socketStore2 = _interopRequireDefault(_socketStore);

var _tripRequest = require('../../models/tripRequest');

var _tripRequest2 = _interopRequireDefault(_tripRequest);

var _user = require('../../models/user');

var _user2 = _interopRequireDefault(_user);

var _trip = require('../../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _userTypes = require('../../constants/user-types');

var _tripType = require('../../constants/trip-type');

var _adminLocation = require('../../models/adminLocation');

var _adminLocation2 = _interopRequireDefault(_adminLocation);

var _tripRequestStatuses = require('../../constants/trip-request-statuses');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function requestTripHandler_v2(socket) {

  socket.on('requestTrip_v2', function (payload) {
    /**
     * 1. lookup nearby drivers. preffered way is to lookup for the driver who has yet to reach the pickup point on it's way
     * 2. create new requestTrip on terminal selected as source by the rider
     * 2. notify the driver with event "requestDriver" and payload with created requestTrip obj
     * 3. wait for 10 minutes for driver response
     * 4. if driver accept the request notify the user with driver details along with vehicle details
     * 5. else if driver doesn't respond in 10 minutes or reject, respond with
     */
    console.log("           ");
    console.log("REQUSTE REPETE Payload:  ", (0, _stringify2.default)(payload));
    console.log("           ");
    console.log("           ");

    // check reservation code
    var riderID = payload.rider._id;
    validateReservationCodeAsync(payload.request).then(function (result) {
      if (!result.success) {
        return _socketStore2.default.emitByUserId(riderID, 'socketError', { code: 504, success: false, message: result.message, data: null });
      } else {
        checkIfRideReqInProgress(riderID).then(function (result) {

          console.log("           ");
          console.log("REQUSTE REPETE result:  ", result);
          console.log("           ");
          console.log("           ");
          if (result) {
            console.log("result1 checkIfRideReqInProgress ", result);
            _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: "Request already in progress", data: result });
            return false;
          } else {
            console.log("result2 checkIfRideReqInProgress>>>>>>>>>>>> ", result);
            if (payload.request.tripType == _tripType.TRIP_DYNAMIC) {
              // return;
              nearByDynamicRouteDriver(riderID, payload.request).then(function (result) {
                if (result) {
                  var nearByDriversDoc = result.foundDrivers;
                  // add rider details to the payload on request to attach the riderdetails to the payload sent to the driver with event
                  payload.request.riderDetails = result.riderDetails;

                  if (nearByDriversDoc && nearByDriversDoc.length) {
                    // send notification event to the driver
                    sendRequestToDriver(payload, nearByDriversDoc[0].driver[0]).then(function (res) {
                      if (res) {
                        _socketStore2.default.emitByUserId(res.tripRequest && res.tripRequest.riderId && res.tripRequest.riderId || riderID, 'rideRequestSentToDriver', { success: true,
                          message: 'Request Sent to the driver', data: res.tripRequest });
                        var pushData = {
                          payload: { success: true, message: 'Request Sent to the driver', data: res.tripRequest },
                          body: 'Request has been sent to the driver: ' + res.driver.name,
                          title: 'New Request'
                        };
                        PushNotification.sendNotificationByUserIdAsync(riderID, pushData);
                      } else {
                        _socketStore2.default.emitByUserId(riderID, 'noDriverOnRequestRide', { success: false, message: 'No drivers around', data: null });
                      }
                    }).catch(function (err) {
                      console.log('request to driver err', err);
                      _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: 'Error while notifying driver', data: null });
                    });
                  } else {
                    // SendNotification(riderID, 'No nearby drivers');
                    _socketStore2.default.emitByUserId(riderID, 'noDriverOnRequestRide', { success: false, message: 'No drivers around', data: null });
                  }
                } else {
                  // SendNotification(riderID, 'No nearby drivers');
                  _socketStore2.default.emitByUserId(riderID, 'noDriverOnRequestRide', { success: false, message: 'No drivers around', data: null });
                }
              }).catch(function (e) {
                _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: e instanceof _APIError2.default && e.isPublic && e.message || 'Something went wrong, while looking for nearby driver', data: null });
              });
            } else if (payload.request.tripType == _tripType.TRIP_CIRCULAR_STATIC || payload.request.tripType == _tripType.TRIP_DIRECT_STATIC) {
              var sourceDestIds = [payload.request.sourceLoc, payload.request.destLoc];
              _bluebird2.default.all(sourceDestIds.map(function (id) {
                return _trip2.default.aggregateAsync([{ $match: { 'activeStatus': true, 'driver.tripType': { $in: [_tripType.TRIP_DIRECT_STATIC, _tripType.TRIP_CIRCULAR_STATIC] } } }, { $unwind: '$driver.route.terminals' }, { $match: { 'driver.route.terminals._id': _mongoose2.default.Types.ObjectId(id) } }, { $project: { 'terminal': '$driver.route.terminals' } }]).then(function (result) {
                  if (result && result.length) {
                    return result[0].terminal || {};
                  } else {
                    return {};
                  }
                  return result;
                });
              })).then(function (sourceDestterminals) {
                // results is an array of source and destination terminals
                if (sourceDestterminals && sourceDestterminals.length && sourceDestterminals[0] && sourceDestterminals[1]) {
                  payload.request.sourceLoc = sourceDestterminals[0];
                  payload.request.destLoc = sourceDestterminals[1];
                  // eslint-disable-next-line
                  var quantum = 10;
                  // eslint-disable-next-line
                  nearByCircularDriver(riderID, payload.request).then(function (result) {
                    var nearByDriversDoc = result.foundDrivers;
                    // add rider details to the payload on request to attach the riderdetails to the payload sent to the driver with event
                    payload.request.riderDetails = result.riderDetails;

                    if (nearByDriversDoc && nearByDriversDoc.length) {
                      // send notification event to the driver
                      sendRequestToDriver(payload, nearByDriversDoc[0].driver[0]).then(function (res) {
                        if (res) {
                          _socketStore2.default.emitByUserId(res.tripRequest && res.tripRequest.riderId && res.tripRequest.riderId || riderID, 'rideRequestSentToDriver', { success: true,
                            message: 'Request Sent to the driver', data: res.tripRequest });
                          var pushData = {
                            payload: { success: true, message: 'Request Sent to the driver', data: res.tripRequest },
                            body: 'Request has been sent to the driver: ' + res.driver.name,
                            title: 'New Request'
                          };
                          PushNotification.sendNotificationByUserIdAsync(riderID, pushData);
                        } else {
                          _socketStore2.default.emitByUserId(riderID, 'noDriverOnRequestRide', { success: false, message: 'No drivers around', data: null });
                        }
                      }).catch(function (err) {
                        console.log('request to driver err', err);
                        _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: 'Error while notifying driver', data: null });
                      });
                    } else {
                      // SendNotification(riderID, 'No nearby drivers');
                      _socketStore2.default.emitByUserId(riderID, 'noDriverOnRequestRide', { success: false, message: 'No drivers around', data: null });
                    }
                  }).catch(function (e) {
                    _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: 'Something went wrong, while looking for nearby driver', data: null });
                  });
                } else {
                  _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: 'Something went wrong, terminals not found', data: null });
                }
              }).catch(function (e) {
                console.log("promise all error", e);
                _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: 'Something went wrong', data: null });
              });
            } else {
              _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: 'Invalid trip type', data: null });
            }
          }
        }).catch(function (err) {
          console.log("errror>>>>>>>>", err);
          _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: "Internal server error", data: null });
        });
      }
    }).catch(function (err) {
      console.log("errror>>>>>>>>111111111", err);
      _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: "Internal server error", data: null });
    });
  });

  // check rider authorization by reservation code

  function validateReservationCodeAsync(userData) {

    return new _bluebird2.default(function (resolve, reject) {
      var returnObj = { success: false, message: "", data: null };
      if (userData.reservationCode.length != 4) {
        returnObj.message = 'Please enter last 4 digits of reservation code.';
        return resolve(returnObj);
      }

      _user2.default.findOneAsync({ _id: userData.adminId, isDeleted: false })
      // eslint-disable-next-line consistent-return
      .then(function (user) {
        if (!user) {
          returnObj.message = 'service provider not found';
          return resolve(returnObj);
        } else if (!user.reservationCode) {
          returnObj.success = false;
          returnObj.message = 'No Reservation code found, Please contact your service provider';
          return resolve(returnObj);
        } else {
          var lastFourDigits = user.reservationCode.substr(user.reservationCode.length - 4);
          if (userData.reservationCode != lastFourDigits) {
            returnObj.success = false;
            returnObj.message = 'Invalid reservation code';
            return resolve(returnObj);
          }
          returnObj.success = true;
          returnObj.message = 'Invalid reservation code';
          return resolve(returnObj);
        }
      }).catch(function (err123) {
        var err = new _APIError2.default('error in getting Reservation code ' + err123, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        return reject(err);
      });
    });
  }

  function sendRequestToDriver(payload, driver) {

    return new _bluebird2.default(function (resolve, reject) {
      createTripRequestAsync(payload, driver).then(function (tripRequestObj) {
        if (tripRequestObj) {
          // eslint-disable-next-line
          var resToDriver = (0, _extends3.default)({}, tripRequestObj._doc);
          resToDriver.riderDetails = payload.request.riderDetails;
          _socketStore2.default.emitByUserId(driver._id, 'requestDriver', { success: true, message: "Request received", data: resToDriver });
          notifyDriverAdminTripStatus(driver._id, 'requestAdmin', { success: true, message: "Request received", data: resToDriver });
          var pushData = {
            payload: { success: true, message: 'Request Sent to the driver', data: resToDriver },
            body: 'New request received from the rider: ' + resToDriver.riderDetails.name,
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

        // watchIdObj[tripRequestObj._id] = setInterval(() => {
        //   // eslint-disable-next-line
        //   clearInterval(watchIdObj[tripRequestObj._id]);
        //   // resetTripRequestAsync(driver) // driver did not respond so update the database to clear tripRequest made.
        //   // .then(() => {
        //   //   // eslint-disable-next-line
        //   //   SocketStore.emitByUserId(driver._id, 'responseTimedOut'); // clear tripRequest object on driver side
        //   //   // flag = true;
        //   //   reject('noResponseFromDriver');
        //   // })
        //   // .catch((err)=>{
        //   //   reject(err);
        //   // });
        //   console.log('cleared interval');
        // }, 1000);
      }).catch(function (err) {
        console.log('error', err);
        return reject(err);
      });
    });
  }

  // create trip request on rider trip request
  function createTripRequestAsync(payload, driver) {
    var riderID = payload.rider._id;
    var driverID = driver._id;
    return new _bluebird2.default(function (resolve, reject) {
      // eslint-disable-next-line
      var srcLocation = payload.request.sourceLoc;
      var destLocation = payload.request.destLoc;
      var startAddress = payload.request.startAddress;
      var endAddress = payload.request.endAddress;

      //save request with adminId

      var getDriverTripAdminAsync = [
      // get driver's trip details async
      new _bluebird2.default(function (resolve, reject) {
        _trip2.default.findOneAsync({ 'driver._id': driver._id, activeStatus: true }).then(function (response) {
          if (!response) {
            return resolve(null);
          } else {
            return resolve(response);
          }
        }).catch(function (error) {
          reject(error);
        });
      })];

      _bluebird2.default.all(getDriverTripAdminAsync).then(function (result) {
        if (result && result.length && result[0]) {
          var driverTrip = result[0];
          var driverAdmin = driver.adminId;
          if (!driverTrip) {
            return reject(new Error("No trip found"));
          }
          // else if (!driverAdmin) {
          //   return reject(new Error("No driver admin found"));
          // }

          if (driverTrip.driver.tripType == _tripType.TRIP_DYNAMIC) {
            srcLocation._id = _mongoose2.default.Types.ObjectId();
            destLocation._id = _mongoose2.default.Types.ObjectId();
          }

          var timeStampvalue = new Date().toISOString();
          var tripRequestObj = new _tripRequest2.default({
            riderId: riderID,
            driverId: driverID,
            tripId: driverTrip._id,
            adminId: driverAdmin,
            srcLoc: srcLocation,
            destLoc: destLocation,
            endAddress: endAddress,
            startAddress: startAddress,
            seatBooked: payload.request.seats ? payload.request.seats : 1,
            requestTime: timeStampvalue
          });
          tripRequestObj.saveAsync().then(function (savedTripRequest) {
            savedTripRequest.rider = null;
            savedTripRequest.driver = null;
            resolve(savedTripRequest);
          }).error(function (e) {
            _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: "Something went wrong", data: null });
            reject(e);
          });
        } else {
          resolve(null);
          // return reject(new Error('driver admin and trip not found'))
        }
      }).catch(function (error) {
        return reject(error);
      });
    });
  }

  function nearByCircularDriver(riderId, request) {
    var sourceLocId = _mongoose2.default.Types.ObjectId(request.sourceLoc._id);
    var destLocId = _mongoose2.default.Types.ObjectId(request.destLoc._id);
    // var request = JSON.parse(JSON.stringify(request));
    return new _bluebird2.default(function (resolve, reject) {
      return _user2.default.findOneAsync({ _id: riderId, userType: _userTypes.USER_TYPE_RIDER }).then(function (userDoc) {
        var result = {
          foundDrivers: [],
          riderDetails: {}
        };
        if (userDoc) {
          /**
           * matches driver that contains the trip request source and destination
           * as their route waypoints
           */

          var pipelineStages = [{ $project: { 'driver': 1, "visitedTerminal": 1, "seatsAvailable": 1, "visitedTerminalsCount": 1, "visitedTerminalIds": 1, 'activeStatus': 1 } }, {
            $match: {
              "driver.tripType": request.tripType,
              "visitedTerminal.sequenceNo": { $lt: request.sourceLoc.sequenceNo },
              "driver.adminId": _mongoose2.default.Types.ObjectId(request.sourceLoc.adminId),
              "seatsAvailable": { $gte: parseInt(request.seats) },
              "activeStatus": true
            }
          }, { $unwind: "$driver.route.terminals" }, {
            $group: {
              "visitedTerminalSequenceNo": { "$first": "$visitedTerminal.sequenceNo" },
              _id: "$driver._id",
              terminals: { $addToSet: "$driver.route.terminals._id" }
            }
          }, {
            $match: {
              "terminals": {
                $all: [sourceLocId, destLocId]
              }
            }
          }, {
            $lookup: {
              from: 'users',
              localField: '_id',
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
          pipelineStages.push({ $sort: { "visitedTerminalSequenceNo": -1 } });
          pipelineStages.push({ $limit: 1 });

          return _trip2.default.aggregateAsync(pipelineStages).then(function (foundDrivers) {
            if (foundDrivers && foundDrivers.length) {
              // Drivers who has to visit the requested source
              result.foundDrivers = foundDrivers;
              result.riderDetails = userDoc;
              return resolve(result);
            } else {
              // Check for drivers who has visited the requested source
              pipelineStages[1]["$match"] = {
                "driver.tripType": request.tripType,
                "activeStatus": true,
                // "visitedTerminalIds":{
                //   $all: [sourceLocId]
                // },
                "driver.adminId": _mongoose2.default.Types.ObjectId(request.sourceLoc.adminId),
                "seatsAvailable": { $gte: parseInt(request.seats) }
              };
              return _trip2.default.aggregateAsync(pipelineStages).then(function (foundDrivers) {
                if (foundDrivers) {
                  result.foundDrivers = foundDrivers;
                  result.riderDetails = userDoc;
                  return resolve(result);
                } else {
                  var _err = new _APIError2.default('no nearByDriver found', _httpStatus2.default.INTERNAL_SERVER_ERROR);
                  return reject(_err);
                }
              }).catch(function (err) {
                return reject(err);
              });
              var err = new _APIError2.default('no nearByDriver found', _httpStatus2.default.INTERNAL_SERVER_ERROR);
              return reject(err);
            }
          }).error(function (driverErr) {
            return reject(driverErr);
          });
        } else {
          var err = new _APIError2.default('no rider found with the given id', _httpStatus2.default.INTERNAL_SERVER_ERROR);
          return resolve(result);
        }
      }).error(function (e) {
        var err = new _APIError2.default('error while searching user', _httpStatus2.default.INTERNAL_SERVER_ERROR);
        return reject(err);
      });
    });
  }
} //eslint-disable-line


function nearByDynamicRouteDriver(riderId, request) {
  var sourceLoc = request.sourceLoc;
  var destLoc = request.destLoc;
  return new _bluebird2.default(function (resolve, reject) {
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
      console.log("foundLocations", foundLocations);
      if (foundLocations && foundLocations.length) {
        // const foundLocation = foundLocations[0];
        var foundLocationIds = foundLocations.map(function (location) {
          return _mongoose2.default.Types.ObjectId(location._id);
        });
        _user2.default.findOneAsync({ _id: riderId, userType: _userTypes.USER_TYPE_RIDER }).then(function (userDoc) {
          var result = {
            foundDrivers: [],
            riderDetails: {}
          };
          if (userDoc) {
            /**
             * matches driver that contains the trip request source and destination
             * as their route waypoints
             */

            var pipelineStages = [{ $project: (0, _defineProperty3.default)({ "gpsLoc": 1, 'driver': 1, "seatsAvailable": 1, "activeStatus": 1 }, 'gpsLoc', 1) }, {
              $match: {
                "activeStatus": true,
                "driver.tripType": request.tripType,
                "driver.adminId": _mongoose2.default.Types.ObjectId(request.adminId),
                "seatsAvailable": { $gte: parseInt(request.seats) },
                // "driver.locationId": mongoose.Types.ObjectId(foundLocation._id)
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
            return _trip2.default.aggregateAsync(pipelineStages).then(function (foundDrivers) {
              console.log("founddrivers", foundDrivers);
              if (foundDrivers && foundDrivers.length) {
                // if(result){
                //   result.foundDrivers = foundDrivers;
                //   result.riderDetails = userDoc;
                //   return resolve(result);
                // }else{
                //   const err = new APIError('no nearByDriver found', httpStatus.INTERNAL_SERVER_ERROR);
                //   return resolve(null);
                // }
                Shared.sortDynamicDriversAsync(request, foundDrivers).then(function (sortedDrivers) {
                  console.log("sorteddrivers", sortedDrivers);
                  result.foundDrivers = sortedDrivers;
                  result.riderDetails = userDoc;
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
            var err = new _APIError2.default('no rider found with the given id', _httpStatus2.default.INTERNAL_SERVER_ERROR);
            return resolve(result);
          }
        }).error(function (e) {
          var err = new _APIError2.default('error while searching user', _httpStatus2.default.INTERNAL_SERVER_ERROR);
          return reject(err);
        });
      } else {
        var err = new _APIError2.default('no service at this location', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
        return resolve(null);
      }
    });
  });
}

function notifyDriverAdminTripStatus(driverId, event, payload) {
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
}

function checkIfRideReqInProgress(riderId) {
  console.log("                           ");
  console.log("checkIfRideReqInProgress", riderId);
  console.log("                           ");
  var requestStatuses = [_tripRequestStatuses.TRIP_REQUEST_INIT, _tripRequestStatuses.TRIP_REQUEST_ACCEPTED, _tripRequestStatuses.TRIP_REQUEST_ENROUTE];
  var query = { riderId: _mongoose2.default.Types.ObjectId(riderId), "tripRequestStatus": { $in: requestStatuses } };
  console.log("                           ");
  console.log("TEsting By Rj query", query);
  console.log("                           ");
  return new _bluebird2.default(function (resolve, reject) {
    _tripRequest2.default.find(query).then(function (foundTripRequest) {
      console.log("                           ");
      console.log("TEsting By Rj foundTripRequest >>>>>>>>>>>>", foundTripRequest);
      console.log("                           ");

      if (foundTripRequest && foundTripRequest.length > 0) {
        return resolve(foundTripRequest);
      } else {
        return resolve(false);
      }
    }).catch(function (err) {
      return reject(new Error("Something went wrong: checking if ride already exist"));
    });
  });
}

exports.default = requestTripHandler_v2;
module.exports = exports.default;
//# sourceMappingURL=request-trip.js.map
