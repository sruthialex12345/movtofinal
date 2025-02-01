'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gpsDistance = require('gps-distance');

var _gpsDistance2 = _interopRequireDefault(_gpsDistance);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _env = require('../../../config/env');

var _env2 = _interopRequireDefault(_env);

var _transformResponse = require('../../service/transform-response');

var _pushExpo = require('../../service/pushExpo');

var _pushExpo2 = _interopRequireDefault(_pushExpo);

var _socketStore = require('../../service/socket-store.js');

var _socketStore2 = _interopRequireDefault(_socketStore);

var _tripRequest = require('../../models/tripRequest');

var _tripRequest2 = _interopRequireDefault(_tripRequest);

var _driverRouteTerminal = require('../../models/driverRouteTerminal');

var _driverRouteTerminal2 = _interopRequireDefault(_driverRouteTerminal);

var _trip = require('../../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _user = require('../../models/user');

var _user2 = _interopRequireDefault(_user);

var _userTypes = require('../../constants/user-types');

var _smsApi = require('../../service/smsApi');

var _smsEachRiderApi = require('../../service/smsEachRiderApi');

var _smsEachRiderApi2 = _interopRequireDefault(_smsEachRiderApi);

var _tripRequestStatuses = require('../../constants/trip-request-statuses');

var TRIP_REQUEST_STATUS = _interopRequireWildcard(_tripRequestStatuses);

var _url = require('url');

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _vm = require('vm');

var _adminDriver = require('../../models/adminDriver');

var _adminDriver2 = _interopRequireDefault(_adminDriver);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * updateLocation handler, handle location update of the rider or driver
 * @param socket object
 * @returns {*}
 */
//eslint-disable-line
function updateLocationHandler(socket) {
  var count = 0;
  /**
   * updateLocation event is fired by rider or driver whenever their location is changed. also it send location update to corresponding rider or driver if they are in any tripRequest or trip.
   * @param userObj - user whose location has to be updated
   * @returns emit an updateDriverLocation or updateRiderLocation event based on userType.
   */

  socket.on('updateLocation', function (userObj) {
    // console.log('user udpate location', userObj);
    var userType = userObj.userType;

    var searchObj = {};
    if (userType === _userTypes.USER_TYPE_RIDER) {
      searchObj = {
        // eslint-disable-next-line
        riderId: userObj._id
      };
    } else if (userType === _userTypes.USER_TYPE_DRIVER) {
      searchObj = {
        // eslint-disable-next-line
        driverId: userObj._id
      };
    }
    // eslint-disable-next-line
    var userID = userObj._id;
    _user2.default.findOneAsync({ _id: userID }).then(function (updatedUserData) {
      var gpslocation = userObj.gpsLoc ? userObj.gpsLoc : updatedUserData.gpsLoc;
      _user2.default.findOneAndUpdateAsync({ _id: userID }, { $set: { gpsLoc: gpslocation } }, { new: true }).then(function (updatedUser) {
        var returnObj = {
          success: true,
          message: "Location Updated Sucessfully",
          data: updatedUser
        };
        _socketStore2.default.emitByUserId(userID, 'locationUpdated', returnObj);
        // TripRequestSchema.findOneAsync({
        //   $and: [
        //     searchObj,
        //     {
        //       $or: [{ tripRequestStatus: 'enRoute' }, { tripRequestStatus: 'arriving' }, { tripRequestStatus: 'arrived' }],
        //     },
        //   ],
        // })
        //   .then((tripRequestObj) => {
        //     if (tripRequestObj) {
        //       if (userType === USER_TYPE_DRIVER) {
        //         SocketStore.emitByUserId(tripRequestObj.riderId, 'updateDriverLocation', updatedUser.gpsLoc);
        //         SocketStore.emitByUserId('59428b1bb0c3cc0f554fd52a', 'getDriverDetails', updatedUser.gpsLoc);
        //         const driverObj = updatedUser;
        //         changedTripRequestStatus(driverObj, tripRequestObj);
        //       } else if (userType === USER_TYPE_RIDER) {
        //         SocketStore.emitByUserId(tripRequestObj.driverId, 'updateRiderLocation', updatedUser.gpsLoc);
        //       }
        //     } else {
        //       TripSchema.findOneAsync({
        //         $and: [searchObj, { tripStatus: 'onTrip' }],
        //       })
        //         .then((tripObj) => {
        //           if (tripObj) {
        //             if (userType === USER_TYPE_DRIVER) {
        //               SocketStore.emitByUserId(tripObj.riderId, 'updateDriverLocation', updatedUser.gpsLoc);
        //               SocketStore.emitByUserId('59428b1bb0c3cc0f554fd52a', 'getDriverDetails', updatedUser.gpsLoc);
        //             } else if (userType === USER_TYPE_RIDER) {
        //               SocketStore.emitByUserId(tripObj.driverId, 'updateRiderLocation', updatedUser.gpsLoc);
        //             }
        //           } else {
        //             // no corresponding rider or driver found to emit the update location
        //           }
        //         })
        //         .error((e) => {
        //           SocketStore.emitByUserId(userID, 'socketError', e);
        //         });
        //     }
        //   })
        //   .error((e) => {
        //     SocketStore.emitByUserId(userID, 'socketError', e);
        //   });
      }).error(function (e) {
        _socketStore2.default.emitByUserId(userID, 'socketError', { success: false, message: "Something went wrong", data: null });
      });
    }).error(function (e) {
      _socketStore2.default.emitByUserId(userID, 'socketError', { success: false, message: "Something went wrong", data: null });
    });
  });

  /**
   * updateLocation event is fired by rider or driver whenever their location is changed. also it send location update to corresponding rider or driver if they are in any tripRequest or trip.
   * @returns emit an event updatedTripLocation.
   */

  socket.on('updateTripLocation', function (userObj) {
    count = count + 1;
    // console.log("updateTripLocation", count);
    // console.log('user udpate location', userObj);
    /**
     * 1. find and update trip location
     * 2. notify the driver with same updated location
     * 3. Get all users on board on this trip
     * 4. notify all riders currently on board with current location
     * 5. check if any terminal is approached in nearby area (some radius)
     * 6. if terminal is reached update the terminal on trip as visitedTerminal
     * 7. if any request has the same terminal as destination emit complete ride event
     *    and in complete ride event from driver
     *      1. check if the same destination is source of any requests
     *      2. if source fire event to enroute rides to the driver
     * 8. Emit event to the driver if it reaches any terminal on the route n nearby area (some radius)
     */
    var driverId = userObj.driverId,
        gpsLoc = userObj.gpsLoc;

    var searchObj = {
      // eslint-disable-next-line
      driverId: userObj.driverId,
      activeStatus: true
    };
    // eslint-disable-next-line

    // 1. find and update trip location
    _trip2.default.findOneAndUpdateAsync(searchObj, { $set: { gpsLoc: gpsLoc } }, { new: true }).then(function (updatedTrip) {
      if (updatedTrip) {
        console.log('emit locationupdated and updated trip', updatedTrip && updatedTrip._id);
        userObj.gpsLoc = updatedTrip && updatedTrip.gpsLoc;
        var returnObj = {
          success: true,
          message: "Location Updated Sucessfully",
          data: userObj
          // 2. notify the driver with same updated location
        };_socketStore2.default.emitByUserId(driverId, 'tripLocationUpdatedDriver', returnObj);
        notifyAdminTripLocationUpdates(updatedTrip, 'tripLocationUpdatedAdmin', returnObj);
        // 5. check if any terminal is approached in nearby area (some radius, assumed to be 100 meters)
        _driverRouteTerminal2.default.findOneAsync({
          loc: { $geoWithin: { $centerSphere: [gpsLoc, _env2.default.nearbyTerminalRadius] } },
          driverId: driverId
        }).then(function (terminal) {

          console.log("nearby terminal found", terminal);
          // emit event on only those terminals which has not been visited
          // check if the terminal was already visited
          if (terminal) {

            console.log("visiting terminal and visited terminal", terminal._id, updatedTrip.visitedTerminal);

            if (!updatedTrip.visitedTerminal) {
              // add visited terminal on trip
              _trip2.default.findOneAndUpdateAsync(searchObj, { $set: { visitedTerminal: terminal } }, { new: true }).then(function (updatedTerminalOnTrip) {
                if (updatedTerminalOnTrip) {
                  console.log('trip updated with new terminal visited', updatedTerminalOnTrip);
                  var searchEndRequestsOnTerminal = {
                    tripId: updatedTerminalOnTrip._id,
                    tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE,
                    'destLoc._id': terminal._id
                    // check if this terminal has any requests as destination
                  };_tripRequest2.default.findAsync(searchEndRequestsOnTerminal).then(function (foundRequests) {
                    console.log('found requests being completed on first terminal', foundRequests);
                    if (foundRequests && Array.isArray(foundRequests) && foundRequests.length > 0) {
                      // if requests fire event to completerides
                      var driverNotificationRes = {
                        success: true,
                        message: "Reaching at terminal",
                        data: { terminal: terminal._id }
                      };
                      _socketStore2.default.emitByUserId(driverId, 'completeTripOnTerminal', driverNotificationRes);
                      // add region
                      driverNotificationRes.data.region = userObj.region;
                      return notifyAdminTripLocationUpdates(updatedTerminalOnTrip, 'completeTripOnTerminalAdmin', driverNotificationRes);
                    } else {
                      console.log('found requests being enroute on terminal', foundRequests);
                      _trip2.default.findOneAndUpdateAsync(searchObj, { $set: { visitedTerminal: terminal } }, { new: true }).then(function (updatedTerminalOnTrip) {
                        if (updatedTerminalOnTrip) {
                          console.log('trip updated with new terminal visited', updatedTerminalOnTrip);
                          var searchSrcRequestsOnTerminal = {
                            tripId: updatedTerminalOnTrip._id,
                            tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED,
                            'srcLoc._id': terminal._id
                            // check if this terminal has any requests as source
                          };_tripRequest2.default.findAsync(searchSrcRequestsOnTerminal).then(function (foundRequests) {
                            console.log('found requests being enroute on first terminal', foundRequests);
                            if (foundRequests && Array.isArray(foundRequests) && foundRequests.length > 0) {
                              // if requests fire event to completerides
                              var _driverNotificationRes = {
                                success: true,
                                message: "New Requests found at terminal",
                                data: { newRequestsToEnroute: true, terminal: terminal._id }
                              };
                              _socketStore2.default.emitByUserId(driverId, 'completedTerminalRequests', _driverNotificationRes);
                              // add region
                              _driverNotificationRes.data.region = userObj.region;
                              return notifyAdminTripLocationUpdates(updatedTerminalOnTrip, 'completedTerminalRequestsAdmin', _driverNotificationRes);
                            }
                          }).catch(function (error) {
                            console.log('error updating trip with new terminal visited and to enroute', updatedTerminalOnTrip);
                          });
                        }
                      }).catch(function (error) {
                        console.log('error updating trip with new terminal visited and to complete', updatedTerminalOnTrip);
                      });
                    }
                  });
                }
              }).catch(function (error) {
                console.log('error updating trip with new terminal visited', updatedTerminalOnTrip);
              });
            } else if (!_mongoose2.default.Types.ObjectId(updatedTrip.visitedTerminal._id).equals(terminal._id)) {
              // update the visited terminal on trip
              _trip2.default.findOneAndUpdateAsync(searchObj, { $set: { visitedTerminal: terminal } }, { new: true }).then(function (updatedTerminalOnTrip) {
                if (updatedTerminalOnTrip) {
                  console.log('trip updated with new terminal visited', updatedTerminalOnTrip);
                  var searchEndRequestsOnTerminal = {
                    tripId: updatedTerminalOnTrip._id,
                    tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE,
                    'destLoc._id': terminal._id
                    // check if this terminal has any requests as destination
                  };_tripRequest2.default.findAsync(searchEndRequestsOnTerminal).then(function (foundRequests) {
                    console.log('found requests being completed on new terminal', foundRequests);
                    if (foundRequests && Array.isArray(foundRequests) && foundRequests.length > 0) {
                      // if requests fire event to completerides
                      var driverNotificationRes = {
                        success: true,
                        message: "Reaching at terminal",
                        data: terminal
                      };
                      _socketStore2.default.emitByUserId(driverId, 'completeTripOnTerminal', driverNotificationRes);
                      return notifyAdminTripLocationUpdates(updatedTerminalOnTrip, 'completeTripOnTerminalAdmin', driverNotificationRes);
                    } else {
                      var _searchEndRequestsOnTerminal = {
                        tripId: updatedTerminalOnTrip._id,
                        tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED,
                        'srcLoc._id': terminal._id
                      };
                      _tripRequest2.default.findAsync(_searchEndRequestsOnTerminal).then(function (foundRequests) {
                        var driverNotificationRes = {
                          success: true,
                          message: "No rides to complete on terminal",
                          data: { newRequestsToEnroute: false, terminal: terminal._id }
                        };
                        console.log('found requests being enrouted on the terminal', foundRequests);
                        if (foundRequests && Array.isArray(foundRequests) && foundRequests.length > 0) {
                          // if requests fire event to completerides
                          driverNotificationRes.data.newRequestsToEnroute = true;
                        }
                        _socketStore2.default.emitByUserId(driverId, 'completedTerminalRequests', driverNotificationRes);
                      }).catch(function (error) {
                        console.log('error while find trip request', error);
                        _socketStore2.default.emitByUserId(driverId, 'socketError', { success: false, message: 'Something went wrong, while searching new requests to board', data: null });
                      });
                    }
                  });
                }
              }).catch(function (error) {
                console.log('error updating trip with new terminal visited', updatedTerminalOnTrip);
              });
            } else {
              console.log('terminal already visited');
            }
          }
        }).catch(function (error) {
          console.log("error while searching nearby terminals");
          return _socketStore2.default.emitByUserId(driverId, 'socketError', { success: false, message: "Something went wrong while searching nearby terminal", data: null });
        });
        // 3. Get all users on board on this trip
        getAllRidersOnBoard(updatedTrip._id, null).then(function (tripRequests) {
          if (tripRequests && Array.isArray(tripRequests)) {
            var riderNotificcationRes = {
              success: true,
              message: "trip location updated",
              data: userObj
            };
            tripRequests.forEach(function (tripRequest, index) {
              // 4. notify all riders currently on board with current location
              _socketStore2.default.emitByUserId(tripRequest.riderDetails._id, 'tripLocationUpdatedRider', riderNotificcationRes);
            });
          } else {
            console.log("no new riders found", tripRequests);
          }
        }).catch(function (err) {
          console.log("something went wrong while searching riders whose request was accepted", err);
        });
      } else {
        console.log("no trip updated with location");
      }
    }).error(function (e) {
      return _socketStore2.default.emitByUserId(driverId, 'socketError', { success: false, message: "Something went wrong", data: null });
    });
  });
}

function notifyAdminTripLocationUpdates(trip, event, payload) {
  // console.log('notify trip location to admin', trip, event);
  _trip2.default.findOne({ _id: trip._id }, { gpsLoc: 1 }).populate([{ path: 'driverId', select: 'name email profileUrl' }, { path: 'shuttleId', select: 'name imageUrl' }]).then(function (result) {
    if (result) {
      payload.data.driverId = result && result.driverId || {};
      payload.data.shuttleId = result && result.shuttleId || {};
      payload.data._id = trip._id;
    }
    _socketStore2.default.emitByUserId('' + trip._id, event, payload);
    // notify the admin also(to the socket without trip id)
    _user2.default.findOneAsync({ _id: trip.driverId }).then(function (driverAdmin) {
      if (driverAdmin) {
        _socketStore2.default.emitByUserId('' + driverAdmin.adminId, event, payload);
      }
    }).catch(function (err) {
      console.log('Error while sending notification to admin on trip location changes', err);
    });
  }).catch(function (error) {
    console.log('error sending notification to driver admin', error);
  });
}

function getAllRidersOnBoard(tripId) {
  var terminalId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

  console.log('trip and terminal', tripId);
  var aggregateStages = [{
    $match: {
      tripId: _mongoose2.default.Types.ObjectId(tripId),
      "tripRequestStatus": {
        $in: [TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE]
      }
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

  // removes terminalid filter from query if no terminal provided
  if (terminalId) {
    aggregateStages[0].$match["srcLoc._id"] = _mongoose2.default.Types.ObjectId(terminalId);
  }

  return _tripRequest2.default.aggregateAsync(aggregateStages);
}

function changedTripRequestStatus(driverObj, tripRequestObj) {
  var dist = (0, _gpsDistance2.default)(driverObj.gpsLoc[0], driverObj.gpsLoc[1], tripRequestObj.srcLoc[0], tripRequestObj.srcLoc[1]);
  var newTripRequestStatus = null;
  var currentTripRequestStatus = tripRequestObj.tripRequestStatus;
  dist = dist.toFixed(4) * 1000; // dist in meters
  console.log('gps location driver', driverObj.gpsLoc);
  console.log('distance %%%%%%%%', dist);
  if (dist <= _env2.default.arrivedDistance) {
    newTripRequestStatus = 'arrived';
  } else if (dist > _env2.default.arrivedDistance && dist < _env2.default.arrivingDistance) {
    newTripRequestStatus = 'arriving';
  } else {
    newTripRequestStatus = 'enRoute';
  }
  if (newTripRequestStatus !== currentTripRequestStatus) {
    tripRequestObj.tripRequestStatus = newTripRequestStatus;
    // eslint-disable-next-line
    _tripRequest2.default.findOneAndUpdateAsync({ _id: tripRequestObj._id }, { $set: tripRequestObj }, { new: true }).then(function (updatedTripRequestObj) {
      (0, _transformResponse.fetchReturnObj)(updatedTripRequestObj).then(function (updatedTripRequestObj123) {
        if (updatedTripRequestObj123.tripRequestStatus === 'arrived') {
          notifyRiderBySmsOfArrived(updatedTripRequestObj);
          (0, _pushExpo2.default)(updatedTripRequestObj.riderId, 'Driver has ' + updatedTripRequestObj123.tripRequestStatus);
          (0, _pushExpo2.default)(updatedTripRequestObj.driverId, updatedTripRequestObj123.tripRequestStatus);
        } else {
          notifyRiderBySmsOfEnRoute(updatedTripRequestObj);
          (0, _pushExpo2.default)(updatedTripRequestObj.riderId, 'Driver is ' + updatedTripRequestObj123.tripRequestStatus);
          (0, _pushExpo2.default)(updatedTripRequestObj.driverId, updatedTripRequestObj123.tripRequestStatus);
        }
        _socketStore2.default.emitByUserId(updatedTripRequestObj.riderId, 'tripRequestUpdated', updatedTripRequestObj123);
        _socketStore2.default.emitByUserId(updatedTripRequestObj.driverId, 'tripRequestUpdated', updatedTripRequestObj123);
      });
    }).error(function (err) {
      _socketStore2.default.emitByUserId(tripRequestObj.riderId, 'socketError', {
        message: 'error while updating tripRequestStatus based on distance',
        data: err
      });
      _socketStore2.default.emitByUserId(tripRequestObj.driverId, 'socketError', {
        message: 'error while updating tripRequestStatus based on distance',
        data: err
      });
    });
  }
}

function notifyRiderBySmsOfEnRoute(tripRequestObj) {
  _trip2.default.findOne({ _id: tripRequestObj.tripId }).populate('riderId', '_id fname lname passengerList').populate('driverId', '_id fname lname').exec(function (err, tripObj) {
    if (err) {
      console.log('server error while finding trip ' + err);
    } else {
      try {
        var pickupDate = moment(tripObj.pickUpTime).format('MMMM Do YYYY, h:mm:ss a');
        var passengerName = "";
        if (tripObj.passengerIds.length > 0 && tripObj && tripObj.riderId && tripObj.driverId) {
          if (tripObj.passengerIds.length == 1) {
            tripObj.passengerIds.forEach(function (item, index) {
              tripObj.riderId.passengerList.forEach(function (element) {
                if (item == element._id) {
                  passengerName = element.fname;
                  if (element.phoneNo) {
                    var eachRiderSmsText = 'Your Merry Go Drive driver ' + tripObj.driverId.fname + ' ' + tripObj.driverId.lname + ' has left to pick you up for your ' + pickupDate + ' ride.';
                    sendSmsToRider(tripObj.riderId._id, eachRiderSmsText, element.phoneNo);
                  }
                }
              });
            });
          } else if (tripObj.passengerIds.length == 2) {
            tripObj.passengerIds.forEach(function (item) {
              tripObj.riderId.passengerList.forEach(function (element) {
                if (item == element._id) {
                  if (index == 1) {
                    passengerName = passengerName + " and " + element.fname;
                  } else {
                    passengerName = element.fname;
                  }
                  if (element.phoneNo) {
                    var eachRiderSmsText = 'Your Merry Go Drive driver ' + tripObj.driverId.fname + ' ' + tripObj.driverId.lname + ' has left to pick you up for your ' + pickupDate + ' ride.';
                    sendSmsToRider(tripObj.riderId._id, eachRiderSmsText, element.phoneNo);
                  }
                }
              });
            });
          } else {
            tripObj.passengerIds.forEach(function (item, index) {
              tripObj.riderId.passengerList.forEach(function (element) {
                if (item == element._id) {
                  if (index == tripObj.passengerIds.length - 1) {
                    passengerName = passengerName.slice(0, -2);
                    passengerName = passengerName + " and " + element.fname;
                  } else {
                    passengerName = passengerName + element.fname + ", ";
                  }
                  if (element.phoneNo) {
                    var eachRiderSmsText = 'Your Merry Go Drive driver ' + tripObj.driverId.fname + ' ' + tripObj.driverId.lname + ' has left to pick you up for your ' + pickupDate + ' ride.';
                    sendSmsToRider(tripObj.riderId._id, eachRiderSmsText, element.phoneNo);
                  }
                }
              });
            });
          }

          var smsText = 'Your driver ' + tripObj.driverId.fname + ' ' + tripObj.driverId.lname + ' has left for ' + passengerName + '  scheduled ' + pickupDate + ' pickup.';
          sendSmsToRider(tripObj.riderId._id, smsText);
        } else {
          console.log("No passenger found");
        }
      } catch (err) {
        console.log("Error sending sms to rider", err);
      }
    }
  });
}

function notifyRiderBySmsOfArrived(updatedTripRequestObj) {
  _trip2.default.findOne({ _id: tripRequestObj.tripId }).populate('riderId', '_id fname lname passengerList').populate('driverId', '_id fname lname carDetails').exec(function (err, tripObj) {
    if (err) {
      console.log('server error while finding trip ' + err);
    } else {
      try {
        if (tripObj.passengerIds.length > 0 && tripObj && tripObj.riderId && tripObj.driverId && tripObj.driverId.carDetails) {
          //Sms each rider in the trip
          tripObj.passengerIds.forEach(function (item) {
            tripObj.riderId.passengerList.forEach(function (element) {
              if (item == element._id) {
                if (element.phoneNo) {
                  var eachRiderSmsText = tripObj.driverId.fname + ' ' + tripObj.driverId.lname + ' has arrived and is outside in a ' + tripObj.driverId.carDetails.color + '  ' + tripObj.driverId.carDetails.company + ' ' + tripObj.driverId.carDetails.carModel + '. Don\'t forget to have them tell you your secret code word.';
                  sendSmsToRider(tripObj.riderId._id, eachRiderSmsText, element.phoneNo);
                }
              }
            });
          });
          //Sms user who booked the trip
          var smsText = tripObj.driverId.fname + ' ' + tripObj.driverId.lname + ' has arrived and is outside in a ' + tripObj.driverId.carDetails.color + '  ' + tripObj.driverId.carDetails.company + ' ' + tripObj.driverId.carDetails.carModel + '.';
          sendSmsToRider(tripObj.riderId._id, smsText);
        } else {
          console.log("No passenger found");
        }
      } catch (err) {
        console.log("Error sending sms to rider", err);
      }
    }
  });
}

function sendSmsToRider(userId, smsText, phoneNo) {
  if (phoneNo) {
    (0, _smsEachRiderApi2.default)(smsText, phoneNo, function (err, data) {
      if (err) {
        console.log('server error while sending sms to rider ' + err);
      } else {
        console.log("Sms is successfully sent to rider");
      }
    });
  } else {
    (0, _smsApi.sendSms)(userId, smsText, function (err, data) {
      if (err) {
        console.log('server error while sending sms to rider ' + err);
      } else {
        console.log("Sms is successfully sent to rider");
      }
    });
  }
}

exports.default = updateLocationHandler;
module.exports = exports.default;
//# sourceMappingURL=update-location.js.map
