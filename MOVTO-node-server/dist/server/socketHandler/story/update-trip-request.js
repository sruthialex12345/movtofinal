'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

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

var _APIError = require('../../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _assert = require('assert');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var requestUpdateMessageToRider = (_requestUpdateMessage = {}, (0, _defineProperty3.default)(_requestUpdateMessage, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, "Request Accepted"), (0, _defineProperty3.default)(_requestUpdateMessage, TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED, "Request Rejected"), (0, _defineProperty3.default)(_requestUpdateMessage, TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED, "Request Cancelled"), (0, _defineProperty3.default)(_requestUpdateMessage, TRIP_REQUEST_STATUS.TRIP_REQUEST_COMPLETED, "Ride Completed"), (0, _defineProperty3.default)(_requestUpdateMessage, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE, "Ride Onboard"), _requestUpdateMessage);

var requestUpdateEventToRider = (_requestUpdateEventTo = {}, (0, _defineProperty3.default)(_requestUpdateEventTo, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, "requestAcceptedRider"), (0, _defineProperty3.default)(_requestUpdateEventTo, TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED, "requestRejectedRider"), (0, _defineProperty3.default)(_requestUpdateEventTo, TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED, "requestCancelledRider"), (0, _defineProperty3.default)(_requestUpdateEventTo, TRIP_REQUEST_STATUS.TRIP_REQUEST_COMPLETED, "requestCompletedRider"), (0, _defineProperty3.default)(_requestUpdateEventTo, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE, "requestEnrouted"), _requestUpdateEventTo);

var requestUpdateEventToDriver = (_requestUpdateEventTo2 = {}, (0, _defineProperty3.default)(_requestUpdateEventTo2, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, "requestAcceptedDriver"), (0, _defineProperty3.default)(_requestUpdateEventTo2, TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED, "requestRejectedDriver"), (0, _defineProperty3.default)(_requestUpdateEventTo2, TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED, "requestCancelledDriver"), _requestUpdateEventTo2);

var requestUpdateEventToAdmin = (_requestUpdateEventTo3 = {}, (0, _defineProperty3.default)(_requestUpdateEventTo3, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, "requestAcceptedAdmin"), (0, _defineProperty3.default)(_requestUpdateEventTo3, TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED, "requestRejectedAdmin"), (0, _defineProperty3.default)(_requestUpdateEventTo3, TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED, "requestCancelledAdmin"), _requestUpdateEventTo3);

function updateTripRequestHandler(socket) {
  socket.on('driverAcceptTripRequest', function (tripReqObj) {
    var tripRequestID = tripReqObj.tripRequestID;
    var tripID = tripReqObj.tripID;
    var driverID = tripReqObj.driverID;
    var queryTripSchema = {
      "_id": tripReqObj.tripID,
      activeStatus: true
    };

    _trip2.default.findOneAsync(queryTripSchema).then(function (tripSeatCount) {
      if (tripSeatCount) {
        // check if request was cancelled or rejected
        if (tripSeatCount.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED) {
          return _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Trip request was cancelled', data: null });
        }

        _tripRequest2.default.findOneAsync({ _id: tripReqObj.tripRequestID }).then(function (triprequest) {
          if (triprequest) {
            // check if the trip request already accepted and notify the driver
            if (triprequest.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
              return _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Trip request was already accepted', data: null });
            }
            // if(tripSeatCount.driver.tripType && tripSeatCount.driver.tripType==TRIP_DYNAMIC){
            //   updateDriverRouter(tripID,driverID,triprequest)
            // }
            // return;
            if (tripSeatCount && tripSeatCount.seatsAvailable && tripSeatCount.seatsAvailable >= triprequest.seatBooked) {
              /**
               * 1. find the trip request
               * 2. update the trip request with trip id provided by driver
               * 3. add the trip request to the driver's current trip requests array with the status changed by driver
               * 3. notify status to the driver
               * 4. notify the rider with the trip driver(current location) and shuttle details and approx arrival time (preffered)
               */
              // Average waiting
              var presentTime = new Date().toISOString();
              _tripRequest2.default.findOneAsync({ _id: tripRequestID }).then(function (findTrip) {
                if (findTrip) {
                  var requestTime = findTrip.requestTime;

                  var requestTimeMili = new Date(requestTime).getTime();
                  var presentTimeMili = new Date(presentTime).getTime();

                  var watingTimeMilli = presentTimeMili - requestTimeMili;
                  console.log("WatingTime", watingTimeMilli);

                  var updateTripRequestData = {
                    tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED,
                    driverId: tripReqObj.driverID,
                    tripId: tripReqObj.tripID,
                    requestUpdatedTime: presentTime, //(new Date()).toISOString()
                    watingTime: watingTimeMilli
                  };

                  var query = {
                    _id: tripRequestID
                  };

                  _tripRequest2.default.findOneAndUpdateAsync(query, { $set: updateTripRequestData }, { new: true }).then(function (tripRequestData) {
                    if (tripRequestData) {

                      _trip2.default.findOneAndUpdateAsync({ _id: tripID, activeStatus: true }, { $addToSet: { tripRequests: tripRequestData } }, { new: true }).then(function (updatedTrip) {
                        if (updatedTrip) {
                          // Updating number of Seats
                          var availableSeats = updatedTrip.seatsAvailable - tripRequestData.seatBooked;
                          var bookedSeat = updatedTrip.seatBooked + tripRequestData.seatBooked;
                          var tripQuery = { "_id": tripID, activeStatus: true };
                          _trip2.default.updateSeats(tripQuery, availableSeats, bookedSeat).then(function (totalTripRecords) {

                            if (tripSeatCount.driver && tripSeatCount.driver.tripType && tripSeatCount.driver.tripType == _tripType.TRIP_DYNAMIC) {
                              updateDriverRouter(tripID, driverID, tripRequestData).then(function (resultUpdateDriver) {
                                _trip2.default.findOneAsync({ _id: tripID }).then(function (updatetrip) {
                                  // notify the driver with trip request data
                                  updateTripRequestNotifyDriver(driverID, tripRequestData, updatetrip);

                                  // notify the rider with driver and shuttle details
                                  udpateTripRequestNotifyRider(updatetrip, tripRequestData);
                                });
                              });
                            } else {
                              // notify the driver with trip request data
                              updateTripRequestNotifyDriver(driverID, tripRequestData);

                              // notify the rider with driver and shuttle details
                              udpateTripRequestNotifyRider(updatedTrip, tripRequestData);
                            }

                            if (tripSeatCount && tripSeatCount.driver && tripSeatCount.driver.adminId) {
                              sendCustomMessageToRider(tripSeatCount.driver.adminId, tripRequestData);
                            }
                          }).error(function (e) {
                            var err = new _APIError2.default('Error occured while counting trip object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
                            next(err);
                          });
                        } else {
                          _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Trip request could not be added successfully', data: null });
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
                  // Average waiting
                } else {
                  res.send("Trip not found");
                }
              }).catch(function (e) {
                var err = new _APIError2.default('Error occured while counting trip object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
                next(err);
              });
              // Average waiting
            } else {
              _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Total seats are greater than available seats: ' + tripSeatCount.seatsAvailable + ', please select manually.', data: null });
              return false;
            }
          } else {
            _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Trip request not found', data: null });
          }
        }).catch(function (e) {
          _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Trip request not found', data: null });
          console.log('error searching trip on accept all request', e);
          return false;
        });
      } else {
        _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Trip request not found', data: null });
      }
    }).error(function (e) {
      _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong, while searching trip', data: null });
      console.log('error searching trip on accept all request', e);
      return false;
    });
  });

  socket.on('acceptAllTripRequests', function (reqPayload) {
    var driverID = reqPayload.driverID;
    getTripTerminalRequestsAsync(reqPayload.tripID, reqPayload.terminalID).then(function (result) {
      if (result && result.length > 0) {
        var noOfseats = result && result.length > 0 && result[0].count && result[0].count > 0 ? result[0].count : 0;
        var queryTripSchema = {
          "_id": reqPayload.tripID,
          activeStatus: true
          // "seatsAvailable": {$gte: noOfseats}
        };

        _trip2.default.findOneAsync(queryTripSchema, "seatsAvailable seatBooked driver").then(function (tripSeatCount) {
          if (tripSeatCount && tripSeatCount.seatsAvailable && tripSeatCount.seatsAvailable >= noOfseats) {
            var requestedRides = [];
            if (result && result.length && Array.isArray(result)) {
              requestedRides = result.map(function (request) {
                var newRequest = (0, _extends3.default)({}, request.rides);
                newRequest.riderDetails && newRequest.riderDetails.password && delete newRequest.riderDetails.password;
                return newRequest;
              });
            }

            // get all requests to be update as async update query for each request
            var updateRequestRides = requestedRides.map(function (ride, index) {
              var tripReqObj = {
                tripRequestID: ride._id,
                tripID: reqPayload.tripID,
                driverID: ride.driverId
              };
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
                tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED,
                driverId: tripReqObj.driverID,
                tripId: tripReqObj.tripID,
                requestUpdatedTime: new Date().toISOString()
              };

              var query = {
                _id: tripRequestID,
                tripRequestStatus: { $nin: [TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED] }
              };
              return function (callback) {
                _tripRequest2.default.findOneAndUpdateAsync(query, { $set: updateTripRequestData }, { new: true }).then(function (tripRequestData) {
                  if (tripRequestData) {
                    _trip2.default.findOneAndUpdateAsync({ _id: tripID, activeStatus: true }, { $addToSet: { tripRequests: tripRequestData } }, { new: true }).then(function (updatedTrip) {
                      if (updatedTrip) {
                        // Updating number of Seats
                        var availableSeats = updatedTrip.seatsAvailable - tripRequestData.seatBooked;
                        var bookedSeat = updatedTrip.seatBooked + tripRequestData.seatBooked;
                        var tripQuery = { "_id": tripID, activeStatus: true };
                        _trip2.default.updateSeats(tripQuery, availableSeats, bookedSeat).then(function (totalTripRecords) {

                          // // notify the driver with trip request data
                          // updateTripRequestNotifyDriver(driverID, tripRequestData)

                          // notify the rider with driver and shuttle details

                          if (tripSeatCount.driver && tripSeatCount.driver.tripType && tripSeatCount.driver.tripType == _tripType.TRIP_DYNAMIC) {
                            updateDriverRouter(tripID, driverID, tripRequestData).then(function (resultUpdateDriver) {
                              _trip2.default.findOneAsync({ _id: tripID }).then(function (updatetrip) {
                                udpateTripRequestNotifyRider(updatetrip, tripRequestData);
                                return callback(null, updatetrip);
                              }).catch(function (err) {
                                console.log("error updating driver router1", err);
                                return callback(err, null);
                              });
                            }).catch(function (err) {
                              return callback(err, null);
                            });
                          } else {
                            udpateTripRequestNotifyRider(updatedTrip, tripRequestData);
                            return callback(null, updatedTrip);
                          }
                          if (tripSeatCount && tripSeatCount.driver && tripSeatCount.driver.adminId) {
                            sendCustomMessageToRider(tripSeatCount.driver.adminId, tripRequestData);
                          }
                        }).error(function (e) {
                          var err = new _APIError2.default('Error occured while counting trip object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
                          next(err);
                        });
                      } else {
                        // SocketStore.emitByUserId(driverID, 'socketError', {success: false, message: 'Trip request could not be added successfully', data: null });
                        return callback(new Error("No trip request data found"), null);
                      }
                    }).catch(function (err) {
                      console.log("error on updating all trip request on terminal", err);
                      // SocketStore.emitByUserId(driverID, 'socketError', {success: false, message: 'Something went wrong while adding trip request', data: null });
                      return callback(err, null);
                    });
                  } else {
                    // SocketStore.emitByUserId(tripReqObj.driverID, 'socketError', {success: false, message: 'Trip request not found', data: null });
                    return callback(null, tripSeatCount);
                  }
                }).catch(function (error) {
                  console.log('error while find trip request', error);
                  _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong', data: null });
                  return callback(error, null);
                });
              };
              //   return new Promise((resolve, reject) => {
              //     TripRequestSchema.findOneAndUpdateAsync(query, {$set: updateTripRequestData}, {new: true})
              //     .then(tripRequestData => {
              //       if(tripRequestData) {
              //         TripSchema
              //         .findOneAndUpdateAsync({_id: tripID, activeStatus: true},{ $addToSet: { tripRequests: tripRequestData } }, {new: true})
              //         .then((updatedTrip)=>{
              //           if(updatedTrip) {
              //           // Updating number of Seats
              //             var availableSeats=updatedTrip.seatsAvailable-noOfseats;
              //             var bookedSeat=updatedTrip.seatBooked+noOfseats;
              //             const tripQuery= {"_id": tripID,activeStatus:true};
              //           TripSchema.updateSeats(tripQuery,availableSeats,bookedSeat)
              //       .then((totalTripRecords) => {

              //             // // notify the driver with trip request data
              //             // updateTripRequestNotifyDriver(driverID, tripRequestData)

              //             // notify the rider with driver and shuttle details

              //             if(tripSeatCount.driver && tripSeatCount.driver.tripType && tripSeatCount.driver.tripType==TRIP_DYNAMIC){
              //               updateDriverRouter(tripID,driverID,tripRequestData).then((resultUpdateDriver)=>{
              //                 TripSchema.findOneAsync({_id:tripID}).then((updatetrip) => {
              //                   udpateTripRequestNotifyRider(updatetrip, tripRequestData);
              //                   return resolve(updatetrip);
              //                 }).catch(err=>{
              //                   console.log("error updating driver router1", err);
              //                   return reject(err);
              //                 })
              //               }).catch(err=>{
              //                 return reject(err);
              //               })
              //             }else{
              //               udpateTripRequestNotifyRider(updatedTrip, tripRequestData);
              //               return resolve(updatedTrip);
              //             }
              //             if(tripSeatCount && tripSeatCount.driver && tripSeatCount.driver.adminId){
              //               sendCustomMessageToRider(tripSeatCount.driver.adminId,tripRequestData);
              //             }

              //           }).error((e) => {
              //           const err = new APIError(`Error occured while counting trip object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              //           next(err);
              //         });
              //           } else {
              //             // SocketStore.emitByUserId(driverID, 'socketError', {success: false, message: 'Trip request could not be added successfully', data: null });
              //             return reject(new Error("No trip request data found"));
              //           }
              //         })
              //         .catch((err)=>{
              //           console.log("error on updating all trip request on terminal", err);
              //           // SocketStore.emitByUserId(driverID, 'socketError', {success: false, message: 'Something went wrong while adding trip request', data: null });
              //           return reject(err);
              //         })
              //       } else {
              //         // SocketStore.emitByUserId(tripReqObj.driverID, 'socketError', {success: false, message: 'Trip request not found', data: null });
              //         return resolve(tripSeatCount);
              //       }
              //     })
              //     .catch(error => {
              //       console.log('error while find trip request', error);
              //       SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
              //       return reject(error)
              //     })
              //   }
              // );
            });
            // update each request in series
            _async2.default.series(updateRequestRides, function (error, tripObj) {
              if (error) {
                console.log('error while find trip request', error);
                _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong, while accepting all requests', data: null });
              }
              if (tripObj && tripObj[0] && tripObj[0].driver && tripObj[0].driver.tripType && tripObj[0].driver.tripType == _tripType.TRIP_DYNAMIC) {
                getDynamicRouteOrderAsync(tripObj[0]).then(function (terminals) {
                  var res = {
                    driverRoute: terminals || []
                  };
                  _socketStore2.default.emitByUserId(driverID, 'acceptedAllTripRequests', { success: true, message: 'All requests accepted', data: res });
                  notifyDriverAdminTripStatus(driverID, "acceptedAllTripRequestsAdmin", { success: true, message: 'All requests accepted', data: res });
                }).catch(function (err) {
                  console.log('error while find trip request', error);
                  _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong, getting route info', data: null });
                });
              } else {
                _socketStore2.default.emitByUserId(driverID, 'acceptedAllTripRequests', { success: true, message: 'All requests accepted', data: null });
                notifyDriverAdminTripStatus(driverID, "acceptedAllTripRequestsAdmin", { success: true, message: 'All requests accepted', data: null });
              }
            });
            // update each request in parallel
            // Promise.all(updateRequestRides)
            // .then(tripObj=>{
            //    if (tripObj && tripObj[0] && tripObj[0].driver && tripObj[0].driver.tripType && tripObj[0].driver.tripType == TRIP_DYNAMIC) {
            //     getDynamicRouteOrderAsync(tripObj[0])
            //     .then(terminals=>{
            //       let res = {
            //         driverRoute: terminals || []
            //       };
            //       SocketStore.emitByUserId(driverID, `acceptedAllTripRequests`, { success: true, message: 'All requests accepted', data: res });
            //       notifyDriverAdminTripStatus(
            //         driverID,
            //         "acceptedAllTripRequestsAdmin",
            //         {success: true, message: 'All requests accepted', data: res }
            //       )
            //     }).catch(err=>{
            //       console.log('error while find trip request', error);
            //       SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong, getting route info', data: null });
            //     })
            //   } else {
            //     SocketStore.emitByUserId(driverID, `acceptedAllTripRequests`, { success: true, message: 'All requests accepted', data: null });
            //     notifyDriverAdminTripStatus(
            //       driverID,
            //       "acceptedAllTripRequestsAdmin",
            //       {success: true, message: 'All requests accepted', data: null }
            //     )
            //   }

            //   // updateTripRequestNotifyDriver(driverID, updatedRides)
            // }).catch(error=>{
            //   console.log('error while find trip request', error);
            //   SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong, while accepting all requests', data: null });
            // })
          } else {
            _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Total seats are greater than available seats: ' + tripSeatCount.seatsAvailable + ', please select manually.', data: null });
            return false;
          }
        }).error(function (e) {
          _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong, while searching trip', data: null });
          console.log('error searching trip on accept all request', e);
          return false;
        });
      } else {
        console.log('error while find trip request');
        _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'No trip request Found', data: null });
      }
    }).catch(function (error) {
      console.log('error while find trip request', error);
      _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong, while searching trip requests', data: null });
    });
  });

  socket.on('driverRejectTripRequest', function (tripReqObj) {
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

    _tripRequest2.default.findOneAsync({ _id: tripRequestID }).then(function (tripRequest) {
      if (tripRequest) {
        if (tripRequest.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED) {
          return _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Trip request already rejected', data: null });
        }

        _tripRequest2.default.findOneAndUpdateAsync({ _id: tripRequestID }, { $set: updateTripRequestData }, { new: true }).then(function (tripRequestData) {
          if (tripRequestData) {
            console.log('tripReqestdata', tripRequestData);
            var newTripRequest = tripRequestData;
            _trip2.default.findOneAndUpdateAsync({ _id: tripID, activeStatus: true }, { $push: { tripRequests: newTripRequest } }, { new: true }).then(function (updatedTrip) {
              if (updatedTrip) {
                // notify the driver with trip request data
                updateTripRequestNotifyDriver(driverID, newTripRequest);

                // notify the rider with driver and shuttle details
                udpateTripRequestNotifyRider(updatedTrip, newTripRequest);
              } else {
                _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Trip request could not be added successfully', data: null });
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
      } else {
        _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Trip request not found', data: null });
      }
    }).catch(function (err) {
      _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong: searching trip request', data: null });
    });
  });

  socket.on('riderCancelTripRequest', function (tripReqObj) {
    var tripRequestID = tripReqObj.tripRequestID;
    var riderID = tripReqObj.riderID;
    /**
     * 1. find the trip request
     * 2. update the trip request status
     * 3. add the trip request to the driver's current trip requests array with the status changed by rider
     * 3. notify status to the rider
     * 4. notify the driver
     */
    var updateTripRequestData = {
      tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED,
      requestUpdatedTime: new Date().toISOString()
    };

    _tripRequest2.default.findOneAsync({ _id: tripRequestID }).then(function (tripRequestPreviousData) {
      // check if request was already cancelled
      if (tripRequestPreviousData.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED) {
        return _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: 'Request already cancelled', data: null });
      } else if (tripRequestPreviousData.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE) {
        return _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: 'Sorry,Request Enrouted', data: null });
      }
      _tripRequest2.default.findOneAndUpdateAsync({ _id: tripRequestID }, { $set: updateTripRequestData }, { new: true }).then(function (tripRequestData) {
        if (tripRequestData) {
          var newTripRequest = tripRequestData;
          _trip2.default.findOneAndUpdateAsync({ 'driver._id': tripRequestData.driverId, activeStatus: true }, { $push: { tripRequests: tripRequestData } }, { new: true }).then(function (updatedTrip) {
            if (updatedTrip) {
              // const newDriverTerminal=updatedTrip.driver.route.terminals;
              // var srcIndex = newDriverTerminal.findIndex(x =>JSON.stringify(x._id)===JSON.stringify(tripRequestData.srcLoc._id));
              // newDriverTerminal.splice(srcIndex, 1)
              // var destIndex = newDriverTerminal.findIndex(x => JSON.stringify(x._id)===JSON.stringify(tripRequestData.destLoc._id));
              // newDriverTerminal.splice(destIndex, 1);
              // updatedTrip.driver.route.terminals=newDriverTerminal;

              if (tripRequestPreviousData.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
                // Updating number of Seats
                var availableSeats = updatedTrip.seatsAvailable + tripRequestData.seatBooked;
                var bookedSeat = updatedTrip.seatBooked - tripRequestData.seatBooked;
                var tripQuery = { "_id": tripRequestData.tripId, activeStatus: true };
                _trip2.default.updateSeats(tripQuery, availableSeats, bookedSeat).then(function (totalTripRecords) {
                  if (updatedTrip && updatedTrip.driver && updatedTrip.driver.tripType && updatedTrip.driver.tripType == _tripType.TRIP_DYNAMIC) {
                    // TripSchema.findOneAndUpdateAsync({ _id: tripRequestData.tripId }, {$set: {
                    //   "driver.route.terminals":newDriverTerminal
                    // }}, {new: true})

                    removeTerminalsDynamicRequestsAsync(tripRequestData, updatedTrip).then(function (updatdTypeAfterRemoveRoutes) {
                      // notify the driver with trip request data
                      _trip2.default.findOneAsync({ _id: tripRequestData.tripId }).then(function (tripObj) {
                        updateTripRequestNotifyDriver(tripRequestData.driverId, newTripRequest, tripObj);
                      }).catch(function (e) {
                        var err = new _APIError2.default('Error occured while counting trip object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
                        next(err);
                      });
                    }).catch(function (e) {
                      var err = new _APIError2.default('Error occured while counting trip object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
                      next(err);
                    });
                  } else {
                    // notify the driver with trip request data
                    _trip2.default.findOneAsync({ _id: tripRequestData.tripId }).then(function (tripObj) {
                      updateTripRequestNotifyDriver(tripRequestData.driverId, newTripRequest, tripObj);
                    }).error(function (e) {
                      var err = new _APIError2.default('Error occured while counting trip object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
                      next(err);
                    });
                  }
                }).error(function (e) {
                  var err = new _APIError2.default('Error occured while counting trip object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
                  next(err);
                });
              } else if (tripRequestPreviousData.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT) {
                // notify the driver with trip request data
                _trip2.default.findOneAsync({ _id: tripRequestData.tripId }).then(function (tripObj) {
                  updateTripRequestNotifyDriver(tripRequestData.driverId, newTripRequest, tripObj);
                }).error(function (e) {
                  var err = new _APIError2.default('Error occured while counting trip object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
                  next(err);
                });
              }

              // notify the rider with driver and shuttle details
              _socketStore2.default.emitByUserId(tripRequestData.riderId, requestUpdateEventToRider[tripRequestData.tripRequestStatus], { success: true, message: '' + requestUpdateMessageToRider[tripRequestData.tripRequestStatus],
                data: null });
              var pushData = {
                success: true, message: '' + requestUpdateMessageToRider[tripRequestData.tripRequestStatus],
                data: null
              };
              pushNotificationToRider(tripRequestData.riderId, tripRequestData.tripRequestStatus, pushData);
            } else {
              // notify rider
              _socketStore2.default.emitByUserId(tripRequestData.riderId, requestUpdateEventToRider[tripRequestData.tripRequestStatus], { success: true, message: '' + requestUpdateMessageToRider[tripRequestData.tripRequestStatus],
                data: null });
              var _pushData = {
                success: true, message: '' + requestUpdateMessageToRider[tripRequestData.tripRequestStatus],
                data: null
              };
              pushNotificationToRider(tripRequestData.riderId, tripRequestData.tripRequestStatus, _pushData);
              // notify driver
              _socketStore2.default.emitByUserId(tripRequestData.driverId, 'socketError', { success: false, message: 'Trip request was cancelled, could not be added on trip', data: null });
            }
          }).catch(function (err) {
            console.log('error finding trip', err);
            _socketStore2.default.emitByUserId(tripRequestData.riderId, 'socketError', { success: false, message: 'Something went wrong while updating trip request', data: null });
          });
        } else {
          _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: 'Trip request not found', data: null });
        }
      }).catch(function (error) {
        console.log('error while find trip request', error);
        _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: 'Something went wrong', data: null });
      });
    }).catch(function (error) {
      console.log('error while find trip request', error);
      _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: 'Something went wrong', data: null });
    });
  });

  socket.on('completeTripRequestsTerm', function (reqPayload) {
    var driverID = reqPayload.driverID;
    getTripRequestsToCompleteTerminal(reqPayload.tripID, reqPayload.terminalID).then(function (result) {
      if (result && result.length > 0) {
        var noOfseats = result && result.length > 0 && result[0].count && result[0].count > 0 ? result[0].count : 0;
        // return;
        var requestedRides = [];
        if (result && Array.isArray(result)) {
          requestedRides = result.map(function (request) {
            var newRequest = (0, _extends3.default)({}, request.rides);
            newRequest.riderDetails && newRequest.riderDetails.password && delete newRequest.riderDetails.password;
            return newRequest;
          });
        }
        // get all requests to be update as async update query for each request
        var updateRequestRides = requestedRides.map(function (ride, index) {
          var tripReqObj = {
            tripRequestID: ride._id,
            tripID: reqPayload.tripID,
            driverID: ride.driverId
          };
          var tripRequestID = tripReqObj.tripRequestID;
          var tripID = tripReqObj.tripID;
          var driverID = tripReqObj.driverID;

          /**
           * 1. find the trip request
           * 2. update the trip request with trip id provided by driver
           * 3. add the trip request to the driver's current trip requests array with the status changed by driver
           * 3. notify status to the driver with event completedTerminalRequests
           * 4. notify the rider with the updated trip request data
           */
          var updateTripRequestData = {
            tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_COMPLETED,
            driverId: tripReqObj.driverID,
            tripId: tripReqObj.tripID,
            requestUpdatedTime: new Date().toISOString()
          };

          var query = {
            _id: tripRequestID
          };
          return new _promise2.default(function (resolve, reject) {
            _tripRequest2.default.findOneAndUpdateAsync(query, { $set: updateTripRequestData }, { new: true }).then(function (tripRequestData) {
              if (tripRequestData) {
                _trip2.default.findOneAndUpdateAsync({ _id: tripID, activeStatus: true }, { $addToSet: { tripRequests: tripRequestData } }, { new: true }).then(function (updatedTrip) {
                  if (updatedTrip) {
                    console.log("------------------");
                    console.log("   TESTSTSTSST   ");
                    console.log("------------------");
                    console.log("------------------");
                    var availableSeats = updatedTrip.seatsAvailable + tripRequestData.seatBooked;
                    var bookedSeat = updatedTrip.seatBooked - tripRequestData.seatBooked;
                    var tripQuery = { "_id": reqPayload.tripID, activeStatus: true };
                    _trip2.default.updateSeats(tripQuery, availableSeats, bookedSeat).then(function (totalTripRecords) {
                      // notify the rider with driver and shuttle details
                      _socketStore2.default.emitByUserId(tripRequestData.riderId, requestUpdateEventToRider[tripRequestData.tripRequestStatus], { success: true, message: '' + requestUpdateMessageToRider[tripRequestData.tripRequestStatus],
                        data: tripRequestData });
                      var pushData = {
                        success: true, message: '' + requestUpdateMessageToRider[tripRequestData.tripRequestStatus],
                        data: tripRequestData
                      };
                      pushNotificationToRider(tripRequestData.riderId, tripRequestData.tripRequestStatus, pushData);

                      // Removed route id rider complete their ride
                      if (updatedTrip && updatedTrip.driver && updatedTrip.driver.tripType == _tripType.TRIP_DYNAMIC) {
                        removeTerminalsDynamicRequestsAsync(tripRequestData, updatedTrip).then(function (updatdTypeAfterRemoveRoutes) {
                          return resolve(updatdTypeAfterRemoveRoutes);
                        }).catch(function (err) {
                          return reject(err);
                        });
                      } else {
                        return resolve(updatedTrip);
                      }
                    }).error(function (e) {
                      return reject(new Error("Seats could not be updated."));
                    });
                  } else {
                    return reject(new Error("No trip request data found"));
                  }
                }).catch(function (err) {
                  return reject(err);
                });
              } else {
                return reject(new Error("No trip request data found"));
              }
            }).catch(function (error) {
              console.log('error while find trip request', error);
              _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong', data: null });
              return reject(error);
            });
          });
        });
        // update each request in parallel
        _promise2.default.all(updateRequestRides).then(function (updatedRides) {
          // console.log('rides updated',updatedRides);
          // 1. emit success event to the driver
          // 2. emit event with data set newRequestsOnTerminal flag to true if the same terminal have remaining accepted new requests as source
          console.log("                                 ");
          console.log(" Update TRIp REQUEST", (0, _stringify2.default)(updatedRides));
          console.log("                                 ");
          var searchEndRequestsOnTerminal = {
            tripId: reqPayload.tripID,
            tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED,
            'srcLoc._id': reqPayload.terminalID
          };
          var index = updatedRides.length - 1;
          var lastUpdatedTripRoute = updatedRides[index];
          console.log("                                 ");
          console.log(" lastUpdatedTripRoute", (0, _stringify2.default)(lastUpdatedTripRoute));
          console.log("                                 ");
          _tripRequest2.default.findAsync(searchEndRequestsOnTerminal).then(function (foundRequests) {
            var driverNotificcationRes = {
              success: updatedRides && updatedRides.length && true || false,
              message: updatedRides && updatedRides.length && "All terminal rides completed" || "No terminal rides found to complete",
              data: { newRequestsToEnroute: false, terminal: reqPayload.terminalID, driverRoute: lastUpdatedTripRoute && lastUpdatedTripRoute.driver && lastUpdatedTripRoute.driver.route && lastUpdatedTripRoute.driver.route.terminals || [] }
            };
            if (foundRequests && Array.isArray(foundRequests) && foundRequests.length > 0) {
              // if requests fire event to completerides
              driverNotificcationRes.data.newRequestsToEnroute = true;
            }
            _socketStore2.default.emitByUserId(driverID, 'completedTerminalRequests', driverNotificcationRes);
            notifyDriverAdminTripStatus(driverID, 'completedTerminalRequestsAdmin', driverNotificcationRes);
          }).catch(function (error) {
            console.log('error while find trip request', error);
            _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong, while searching new requests to board', data: null });
          });
        }).catch(function (error) {
          console.log('error while find trip request', error);
          _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong, while completing all requests', data: null });
        });
      } else {
        console.log('error while find trip request');
        _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'No trip request Found', data: null });
      }
    }).catch(function (error) {
      console.log('error while find trip request', error);
      _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong', data: null });
    });
  });

  socket.on('enrouteTripRequestsTerm', function (reqPayload) {
    var driverID = reqPayload.driverID;
    getTripRequestsToEnrouteTerminal(reqPayload.tripID, reqPayload.terminalID).then(function (result) {
      var requestedRides = [];
      if (result && Array.isArray(result)) {
        requestedRides = result.map(function (request) {
          var newRequest = (0, _extends3.default)({}, request);
          newRequest.riderDetails && newRequest.riderDetails.password && delete newRequest.riderDetails.password;
          return newRequest;
        });
      }
      // get all requests to be update as async update query for each request
      var updateRequestRides = requestedRides.map(function (ride, index) {
        var tripReqObj = {
          tripRequestID: ride._id,
          tripID: reqPayload.tripID,
          driverID: ride.driverId
        };
        var tripID = tripReqObj.tripID;
        var driverID = tripReqObj.driverID;

        /**
         * 1. find the trip request
         * 2. update the trip request with trip id provided by driver
         * 3. add the trip request to the driver's current trip requests array with the status changed by driver
         * 3. notify status to the driver with event enroutedTerminalRequests
         * 4. notify the rider with the updated trip request data
         */
        var updateTripRequestData = {
          tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE,
          driverId: tripReqObj.driverID,
          tripId: tripReqObj.tripID,
          requestUpdatedTime: new Date().toISOString()
        };

        var query = {
          _id: tripReqObj.tripRequestID
        };

        return new _promise2.default(function (resolve, reject) {
          _tripRequest2.default.findOneAndUpdateAsync(query, { $set: updateTripRequestData }, { new: true }).then(function (tripRequestData) {
            if (tripRequestData) {
              _trip2.default.findOneAndUpdateAsync({ _id: tripID, activeStatus: true }, { $addToSet: { tripRequests: tripRequestData } }, { new: true }).then(function (updatedTrip) {
                if (updatedTrip) {
                  // notify the rider with driver and shuttle details
                  _socketStore2.default.emitByUserId(tripRequestData.riderId, requestUpdateEventToRider[tripRequestData.tripRequestStatus], { success: true, message: '' + requestUpdateMessageToRider[tripRequestData.tripRequestStatus],
                    data: tripRequestData });
                  var pushData = {
                    success: true, message: '' + requestUpdateMessageToRider[tripRequestData.tripRequestStatus],
                    data: tripRequestData
                  };
                  pushNotificationToRider(tripRequestData.riderId, tripRequestData.tripRequestStatus, pushData);
                  return resolve(tripRequestData);
                } else {
                  console.log("No trip data found of the requested trip with active status, could not add to trip request history");
                  return resolve(tripRequestData);
                }
              }).catch(function (err) {
                return reject(err);
              });
            } else {
              return reject(new Error("No trip request data found"));
            }
          }).catch(function (error) {
            console.log('error while find trip request', error);
            _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong', data: null });
            notifyDriverAdminTripStatus(driverID, 'socketError', { success: false, message: 'Something went wrong', data: null });
            return reject(error);
          });
        });
      });
      // update each request in parallel
      _promise2.default.all(updateRequestRides).then(function (updatedRides) {
        // console.log('rides updated',updatedRides);
        _socketStore2.default.emitByUserId(driverID, 'enroutedTerminalRequests', { success: true, message: 'All terminal rides enrouted', data: null });
        notifyDriverAdminTripStatus(driverID, 'enroutedTerminalRequestsAdmin', { success: true, message: 'All terminal rides enrouted', data: {} });
        // updateTripRequestNotifyDriver(driverID, updatedRides)
      }).catch(function (error) {
        console.log('error while updating trip request and trip with enroute status', error);
        _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong, while enrouting all requests', data: null });
        notifyDriverAdminTripStatus(driverID, 'socketError', { success: false, message: 'Something went wrong, while enrouting all requests', data: null });
      });
    }).catch(function (error) {
      console.log('error while find trip request', error);
      _socketStore2.default.emitByUserId(driverID, 'socketError', { success: false, message: 'Something went wrong', data: null });
    });
  });

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
    }]).then(function (updatedTrip) {
      if (updatedTrip && updatedTrip.length > 0) {
        var resToRider = {
          driver: updatedTrip[0].driver[0],
          shuttle: updatedTrip[0].vehicle[0]
        };
        delete resToRider.driver.password;

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
              console.log("ETA ERROR>>>>>>>>>>", err);
              _socketStore2.default.emitByUserId(tripReqObj.riderId, requestUpdateEventToRider[tripReqObj.tripRequestStatus], { success: true, message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
                data: resToRider });
            });
          } else {
            // if driver is on static route
            SharedService.staticRouteAsyncETA(tripReqObj, tripObj).then(function (eta) {
              // add eta to response
              resToRider["ETA"] = eta;
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
          // notify the riders witout ETA
          _socketStore2.default.emitByUserId(tripReqObj.riderId, requestUpdateEventToRider[tripReqObj.tripRequestStatus], { success: true, message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
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
    console.log("                                              ");
    console.log("tripObj", (0, _stringify2.default)(tripObj));
    console.log("                                              ");
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
            console.log("                                              ");
            console.log("res", (0, _stringify2.default)(res));
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
        }).catch(function (err) {
          console.log("error2 notifying rider>>>>", err);
          _socketStore2.default.emitByUserId(tripObj.driver._id || driverId, 'socketError', { success: false, message: 'Something went wrong, while notifying the rider', data: null });
        });
      } else {
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

          var _pushData3 = {
            payload: {
              success: true,
              message: '' + requestUpdateMessageToRider[tripReqObj.tripRequestStatus],
              data: res
            }
          };
          pushNotificationToDriver(tripObj.driver._id, tripReqObj.tripRequestStatus, _pushData3);
        }
      }
    }).error(function (e) {
      console.log("error3 notifying rider>>>>", e);
      _socketStore2.default.emitByUserId(tripObj.driver._id || driverId, 'socketError', { success: false, message: 'Something went wrong, while notifying the rider', data: null });
    });
  }

  function getTripRequestsToEnrouteTerminal(tripId, terminalId) {
    var aggregateStages = [{
      $match: {
        tripId: _mongoose2.default.Types.ObjectId(tripId),
        "tripRequestStatus": TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED,
        "srcLoc._id": _mongoose2.default.Types.ObjectId(terminalId)
      }
    }, {
      $lookup: {
        from: 'users',
        localField: "riderId",
        foreignField: '_id',
        as: 'riderDetails'
      }
    }, {
      $unwind: "$riderDetails"
    }];

    return _tripRequest2.default.aggregateAsync(aggregateStages);
  }

  function getTripRequestsToCompleteTerminal(tripId, terminalId) {
    var aggregateStages = [{
      $match: {
        tripId: _mongoose2.default.Types.ObjectId(tripId),
        "tripRequestStatus": TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE,
        "destLoc._id": _mongoose2.default.Types.ObjectId(terminalId)
      }
    }, {
      $lookup: {
        from: 'users',
        localField: "riderId",
        foreignField: '_id',
        as: 'riderDetails'
      }
    }, {
      $unwind: "$riderDetails"
    }, {
      $group: {
        _id: '$tripId',
        count: { $sum: "$seatBooked" },
        rides: { $push: "$$ROOT" }
      }
    }, { '$unwind': '$rides' }];
    return _tripRequest2.default.aggregateAsync(aggregateStages);
  }

  function getTripTerminalRequestsAsync(tripId, terminalId) {
    var aggregateStages = [{
      $match: {
        tripId: _mongoose2.default.Types.ObjectId(tripId),
        "tripRequestStatus": TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT
      }
    }, {
      $lookup: {
        from: 'users',
        localField: "riderId",
        foreignField: '_id',
        as: 'riderDetails'
      }
    }, {
      $unwind: "$riderDetails"
    }, {
      $group: {
        _id: '$tripId',
        count: { $sum: "$seatBooked" },
        rides: { $push: "$$ROOT" }
      }
    }, { '$unwind': '$rides' }];

    // removes terminalid filter from query if no terminal provided
    if (terminalId) {
      aggregateStages[0].$match["srcLoc._id"] = _mongoose2.default.Types.ObjectId(terminalId);
    }
    console.log("aggregateStages", (0, _stringify2.default)(aggregateStages));
    return _tripRequest2.default.aggregateAsync(aggregateStages);
  }

  function updateDriverRouter(tripID, driverID, tripRequestData) {
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

                  // UserSchema.findOneAndUpdateAsync({_id: driverID}, {$push:{"route.terminals":terminal}}, {new: true,projection:{email:1,gpsLoc:1, locationId:1, adminId:1, isAvailable:1, route:1, tripType:1, activeStatus:1, profileUrl:1, longitudeDelta:1, latitudeDelta:1, lname:1, fname:1, name:1}})
                  // .then(driverDataUpdate => {
                  //   SharedService.addReorderDynamicTerminal(terminal, tripData, null)
                  //   .then(tripDataUpdate=>{
                  //     return callback(null, tripDataUpdate);
                  //   })
                  //   .catch(err=>{
                  //     console.log('error while find trip request', err);
                  //     SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
                  //     return callback(err, null);
                  //   })
                  //   // TripSchema.findOneAndUpdateAsync({_id: tripID}, {$push:{"driver.route.terminals":terminal}},{new: true})
                  //   // .then(tripDataUpdate => {
                  //   //   return callback(null, tripDataUpdate);
                  //   // })
                  //   // .catch(error => {
                  //   //   console.log('error while find trip request', error);
                  //   //   SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
                  //   //   return callback(error, null);
                  //   // })
                  // })
                  // .catch(error => {
                  //   console.log('error while find trip request', error);
                  //   SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
                  //   return callback(error, null);
                  // })
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

  function checkIfToRemoveRequestSrcDest(request, tripID) {
    console.log("checkIfToRemoveRequestSrcDest request ", request);
    var srcDest = [request.srcLoc, request.destLoc];
    var tripRequestStatus = [TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE];
    var resObj = { src: false, dest: false };
    return new _promise2.default(function (resolve, reject) {

      var srcDestPromises = srcDest.map(function (terminal, index) {
        // if terminal is source, check for source terminal to remove
        if (index == 0) {
          return new _promise2.default(function (resolve, reject) {
            _tripRequest2.default.findAsync({
              tripRequestStatus: { $in: tripRequestStatus },
              "srcLoc.loc": { $geoWithin: { $centerSphere: [terminal.loc, 0] } }
            }).then(function (requestsAsSrc) {
              if (requestsAsSrc && requestsAsSrc.length) {
                return resolve(resObj.src = false);
              } else {
                _tripRequest2.default.findAsync({
                  tripRequestStatus: { $in: tripRequestStatus },
                  "destLoc.loc": { $geoWithin: { $centerSphere: [terminal.loc, 0] } }
                }).then(function (requestsAsDest) {
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
          // if terminal is dest, check for dest terminal to remove
          return new _promise2.default(function (resolve, reject) {
            _tripRequest2.default.findAsync({
              tripRequestStatus: { $in: tripRequestStatus },
              "srcLoc.loc": { $geoWithin: { $centerSphere: [terminal.loc, 0] } }
            }).then(function (requestsAsSrc) {
              if (requestsAsSrc && requestsAsSrc.length) {
                return resolve(resObj.dest = false);
              } else {
                _tripRequest2.default.findAsync({
                  tripRequestStatus: { $in: tripRequestStatus },
                  "destLoc.loc": { $geoWithin: { $centerSphere: [terminal.loc, 0] } }
                }).then(function (requestsAsDest) {
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
    return new _promise2.default(function (resolve, reject) {
      checkIfToRemoveRequestSrcDest(tripRequestData).then(function (srcDestToRemove) {
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

        /**
         * if src/dest has pending requests either to enroute/complete remove it's id from visitedterminalids of the trip
         */

        var tripUpdateData = {
          $set: {
            "driver.route.terminals": newDriverTerminal
          }
        };

        if (!srcDestToRemove.src) {
          tripUpdateData['$pull'] = {
            visitedTerminalIds: tripRequestData.srcLoc._id
          };
        } else if (!srcDestToRemove.dest) {
          tripUpdateData['$pull'] = {
            visitedTerminalIds: tripRequestData.destLoc._id
          };
        } else if (!srcDestToRemove.src && !srcDestToRemove.dest) {
          tripUpdateData['$pull'] = {
            visitedTerminalIds: { $in: [tripRequestData.srcLoc._id, tripRequestData.destLoc._id] }
          };
        }

        _trip2.default.findOneAndUpdateAsync({ _id: tripRequestData.tripId }, tripUpdateData, { new: true }).then(function (tripRequestedData) {
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

  function sendCustomMessageToRider(adminId, tripRequest) {
    _user2.default.findOneAsync({ _id: adminId }, { custom_message: 1 }).then(function (adminCustomMessage) {
      if (adminCustomMessage && adminCustomMessage.custom_message) {
        _user2.default.findOneAsync({ _id: tripRequest.riderId }, { isdCode: 1, phoneNo: 1 }).then(function (riderDetailsMsg) {
          var phoneDetails = {
            isdCode: riderDetailsMsg.isdCode,
            phoneNo: riderDetailsMsg.phoneNo
          };
          var smsText = adminCustomMessage.custom_message;
          (0, _smsApi.sendSmsUpdateMobile)(phoneDetails, smsText, function (err /* , data */) {
            if (!err) {}
          });
        }).catch(function (e) {
          var err = new _APIError2.default('Error occured while sending custom message ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          throw err;
        });
      }
    }).catch(function (e) {
      var err = new _APIError2.default('Error occured while sending custom message ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      throw err;
    });
  }
}

exports.default = updateTripRequestHandler;
module.exports = exports.default;
//# sourceMappingURL=update-trip-request.js.map
