'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _env = require('../../../config/env');

var _env2 = _interopRequireDefault(_env);

var _socketStore = require('../../service/socket-store.js');

var _socketStore2 = _interopRequireDefault(_socketStore);

var _shared = require('../../service/shared');

var _tripRequest = require('../../models/tripRequest');

var _tripRequest2 = _interopRequireDefault(_tripRequest);

var _trip = require('../../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _user = require('../../models/user');

var _user2 = _interopRequireDefault(_user);

var _tripRequestStatuses = require('../../constants/trip-request-statuses');

var TRIP_REQUEST_STATUS = _interopRequireWildcard(_tripRequestStatuses);

var _terminalType = require('../../constants/terminal-type');

var TRIP_TERMINAL_TYPES = _interopRequireWildcard(_terminalType);

var _tripType = require('../../constants/trip-type');

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * updateLocation handler, handle location update of the rider or driver
 * @param socket object
 * @returns {*}
 */
//eslint-disable-line
function updateLocationHandler(socket) {
  var _this = this;

  /**
   * updateLocation event is fired by rider or driver whenever their location is changed. also it send location update to corresponding rider or driver if they are in any tripRequest or trip.
   * @returns emit an event updatedTripLocation.
   */

  socket.on('updateTripLocation_v1', function (userObj) {
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
      "driver._id": userObj.driverId,
      activeStatus: true
    };
    // eslint-disable-next-line

    // 1. find and update trip location
    _trip2.default.findOneAndUpdateAsync(searchObj, { $set: { gpsLoc: gpsLoc } }, { new: true }).then(function (updatedTrip) {
      if (updatedTrip) {
        // console.log('emit locationupdated and updated trip', updatedTrip);
        // console.log('emit locationupdated and updated trip', updatedTrip._id);
        userObj.gpsLoc = updatedTrip && updatedTrip.gpsLoc;
        var returnObj = {
          success: true,
          message: "Location Updated Sucessfully",
          data: userObj
          // 2. notify the driver with same updated location
        };_socketStore2.default.emitByUserId(driverId, 'tripLocationUpdatedDriver', returnObj);
        notifyAdminTripLocationUpdates(updatedTrip, 'tripLocationUpdatedAdmin', returnObj);
        // 5. check if any terminal is approached in nearby area (some radius, assumed to be 100 meters)

        // if(updatedTrip && updatedTrip.driver && ((updatedTrip.driver.tripType == TRIP_CIRCULAR_STATIC) || (updatedTrip.driver.tripType == TRIP_DIRECT_STATIC))) {
        if (updatedTrip && updatedTrip.driver) {
          var query = [{ $unwind: "$driver.route.terminals" }, { $match: {
              "driver._id": _mongoose2.default.Types.ObjectId(driverId), "activeStatus": true,
              "driver.route.terminals.loc": { $geoWithin: { $centerSphere: [gpsLoc, _env2.default.nearbyTerminalRadius] } }
            } }, { $sort: { "driver.route.terminals.sequenceNo": 1 } }];
          _trip2.default.aggregateAsync(query).then(function () {
            var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(terminalRes) {
              var terminalResult, visitedTerminalIds, newTerminals, terminal, tripUpdates, searchEndRequestsOnTerminal, reqsWithTermAsDest, srcVisitedReqs, _tripUpdates, _updatedTrip, _searchEndRequestsOnTerminal2, _reqsWithTermAsDest, _srcVisitedReqs;

              return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      terminalResult = null;
                      visitedTerminalIds = updatedTrip.visitedTerminalIds.map(function (id) {
                        return (0, _stringify2.default)(id);
                      });

                      if (terminalRes && terminalRes.length) {
                        // found multiple terminals at the same location within the config radius(100 meters)
                        newTerminals = terminalRes.filter(function (nearByTerminal) {
                          var terminalId = (0, _stringify2.default)(nearByTerminal.driver.route.terminals._id);
                          console.log("found new terminal>>>>>>", terminalId, visitedTerminalIds);
                          return visitedTerminalIds.indexOf(terminalId) === -1;
                        });

                        if (newTerminals && newTerminals.length) {
                          terminalResult = newTerminals[0].driver.route.terminals;
                        }
                      }

                      if (terminalResult) {
                        _context.next = 6;
                        break;
                      }

                      console.log("returninf if not new terminal");
                      return _context.abrupt('return', false);

                    case 6:
                      terminal = terminalResult;
                      // console.log("RJ nearby terminal found    --  >", terminal);
                      // emit event on only those terminals which has not been visited
                      // check if the terminal was already visited

                      if (!terminal) {
                        _context.next = 69;
                        break;
                      }

                      console.log("visiting terminal and updated trip", terminal._id, (0, _stringify2.default)(updatedTrip));

                      if (updatedTrip.visitedTerminal) {
                        _context.next = 33;
                        break;
                      }

                      // add visited terminal on trip
                      tripUpdates = {
                        $set: { visitedTerminal: terminal }
                      };

                      if (!(updatedTrip.driver.tripType == _tripType.TRIP_CIRCULAR_STATIC)) {
                        _context.next = 16;
                        break;
                      }

                      tripUpdates["$set"]["toDestination"] = true;
                      tripUpdates["$push"] = { visitedTerminalIds: terminal._id }, tripUpdates["$inc"] = { visitedTerminalsCount: 1 };
                      _context.next = 30;
                      break;

                    case 16:
                      /**
                       * if dynamic trip
                       * 1. check if terminal is dest of any enrouted request on the same trip
                       * 2. if DEST >
                       *     check if the src of same request is in visited terminals
                       *       if YES > add the terminal to visited terminal ids
                       *       if NO > don't add the terminal to visited terminal ids
                       * 3. if NOT DEST > add the terminal to visited terminal ids
                       */
                      searchEndRequestsOnTerminal = {
                        tripId: updatedTrip._id,
                        tripRequestStatus: { $in: [TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE] },
                        'destLoc._id': terminal._id
                        // check if this terminal has any requests as destination

                      };
                      reqsWithTermAsDest = [];
                      _context.prev = 18;
                      _context.next = 21;
                      return _tripRequest2.default.findAsync(searchEndRequestsOnTerminal);

                    case 21:
                      reqsWithTermAsDest = _context.sent;

                      console.log("enrouted reqs>>>>>>1", (0, _stringify2.default)(reqsWithTermAsDest));
                      console.log("enrouted reqs>>>>>>testing>>>>>>1", (0, _stringify2.default)(reqsWithTermAsDest));

                      if (reqsWithTermAsDest && Array.isArray(reqsWithTermAsDest) && reqsWithTermAsDest.length > 0) {
                        srcVisitedReqs = reqsWithTermAsDest.filter(function (reqWithTermAsDest) {
                          var terminalId = (0, _stringify2.default)(reqWithTermAsDest.srcLoc._id);
                          console.log("srcVisitedReqs comparing src>>>>>>>", terminalId);
                          return visitedTerminalIds.indexOf(terminalId) > -1;
                        });


                        if (srcVisitedReqs && srcVisitedReqs.length) {
                          console.log("updating visited terminal ids 1");
                          tripUpdates["$push"] = { visitedTerminalIds: terminal._id };
                        }
                      } else {
                        console.log("updating visited terminal ids 2");
                        tripUpdates["$push"] = { visitedTerminalIds: terminal._id };
                      }
                      _context.next = 30;
                      break;

                    case 27:
                      _context.prev = 27;
                      _context.t0 = _context['catch'](18);

                      console.log("error finding any enrouted request on the same trip", _context.t0);

                    case 30:
                      _trip2.default.findOneAndUpdateAsync(searchObj, tripUpdates, { new: true }).then(function (updatedTerminalOnTrip) {
                        if (updatedTerminalOnTrip) {
                          // console.log('trip updated with new terminal visited', JSON.stringify(updatedTerminalOnTrip));
                          var _searchEndRequestsOnTerminal = {
                            tripId: updatedTerminalOnTrip._id,
                            tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE,
                            'destLoc._id': terminal._id
                            // check if this terminal has any requests as destination
                          };_tripRequest2.default.findAsync(_searchEndRequestsOnTerminal).then(function (foundRequests) {

                            // console.log('found requests being completed on first terminal', JSON.stringify(foundRequests));
                            if (foundRequests && Array.isArray(foundRequests) && foundRequests.length > 0) {
                              // if requests fire event to completerides
                              var driverNotificationRes = {
                                success: true,
                                message: "Reaching at terminal",
                                data: terminal
                              };
                              _socketStore2.default.emitByUserId(driverId, 'completeTripOnTerminal', driverNotificationRes);
                              // add region
                              driverNotificationRes.data.region = userObj.region;
                              return notifyAdminTripLocationUpdates(updatedTerminalOnTrip, 'completeTripOnTerminalAdmin', driverNotificationRes);
                            } else {
                              // console.log('found requests being enroute on terminal', foundRequests);
                              _trip2.default.findOneAndUpdateAsync(searchObj, { $set: { visitedTerminal: terminal } }, { new: true }).then(function (updatedTerminalOnTrip) {
                                if (updatedTerminalOnTrip) {
                                  //  console.log('trip updated with new terminal visited', JSON.stringify(updatedTerminalOnTrip));
                                  var searchSrcRequestsOnTerminal = {
                                    tripId: updatedTerminalOnTrip._id,
                                    tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED,
                                    'srcLoc._id': terminal._id
                                    // check if this terminal has any requests as source
                                  };_tripRequest2.default.findAsync(searchSrcRequestsOnTerminal).then(function (foundRequests) {
                                    // console.log('found requests being enroute on first terminal', JSON.stringify(foundRequests));
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

                      _context.next = 69;
                      break;

                    case 33:
                      if (_mongoose2.default.Types.ObjectId(updatedTrip.visitedTerminal._id).equals(terminal._id)) {
                        _context.next = 68;
                        break;
                      }

                      // check if new terminal doesn't exist in visitterminalids
                      // update the visited terminal on trip
                      _tripUpdates = {
                        $set: { visitedTerminal: terminal }
                      };

                      if (!(updatedTrip.driver.tripType == _tripType.TRIP_CIRCULAR_STATIC)) {
                        _context.next = 51;
                        break;
                      }

                      if (terminal.type == TRIP_TERMINAL_TYPES.TRIP_END_TERMINAL) {
                        _tripUpdates["$set"]["toDestination"] = false;
                        _tripUpdates["$set"]["visitedTerminalIds"] = [terminal._id];
                        _tripUpdates["$set"]["visitedTerminalsCount"] = 1;
                      } else if (terminal.type != TRIP_TERMINAL_TYPES.TRIP_START_TERMINAL) {
                        _tripUpdates["$push"] = { visitedTerminalIds: terminal._id }, _tripUpdates["$inc"] = { visitedTerminalsCount: 1 };
                      } else {
                        _tripUpdates["$set"]["toDestination"] = true;
                        _tripUpdates["$set"]["visitedTerminalIds"] = [terminal._id];
                        _tripUpdates["$set"]["visitedTerminalsCount"] = 1;
                      }

                      // if triptype is circular static route and moving towards source back no requests to process

                      if (!(!updatedTrip.toDestination && terminal.type != TRIP_TERMINAL_TYPES.TRIP_START_TERMINAL)) {
                        _context.next = 49;
                        break;
                      }

                      console.log("triptype is circular static route and moving towards source back no requests to process");
                      _context.prev = 39;
                      _context.next = 42;
                      return _trip2.default.findOneAndUpdateAsync(searchObj, _tripUpdates, { new: true });

                    case 42:
                      _updatedTrip = _context.sent;
                      _context.next = 48;
                      break;

                    case 45:
                      _context.prev = 45;
                      _context.t1 = _context['catch'](39);

                      console.log("err>>>>>>", _context.t1);

                    case 48:
                      return _context.abrupt('return', false);

                    case 49:
                      _context.next = 65;
                      break;

                    case 51:
                      /**
                       * if dynamic trip
                       * 1. check if terminal is dest of any enrouted/accepted request on the same trip
                       * 2. if DEST >
                       *     check if the src of same request is in visited terminals
                       *       if YES > add the terminal to visited terminal ids
                       *       if NO > don't add the terminal to visited terminal ids
                       * 3. if NOT DEST > add the terminal to visited terminal ids
                       */
                      _searchEndRequestsOnTerminal2 = {
                        tripId: updatedTrip._id,
                        tripRequestStatus: { $in: [TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE] },
                        'destLoc._id': terminal._id
                        // check if this terminal has any requests as destination

                      };
                      _reqsWithTermAsDest = [];
                      _context.prev = 53;

                      console.log("searchEndRequestsOnTerminal>>>>>", (0, _stringify2.default)(_searchEndRequestsOnTerminal2));
                      _context.next = 57;
                      return _tripRequest2.default.findAsync(_searchEndRequestsOnTerminal2);

                    case 57:
                      _reqsWithTermAsDest = _context.sent;

                      console.log("enrouted reqs>>>>>>2", (0, _stringify2.default)(_reqsWithTermAsDest));
                      if (_reqsWithTermAsDest && Array.isArray(_reqsWithTermAsDest) && _reqsWithTermAsDest.length > 0) {
                        _srcVisitedReqs = _reqsWithTermAsDest.filter(function (reqWithTermAsDest) {
                          var terminalId = (0, _stringify2.default)(reqWithTermAsDest.srcLoc._id);
                          return visitedTerminalIds.indexOf(terminalId) > -1;
                        });


                        if (_srcVisitedReqs && _srcVisitedReqs.length) {
                          _tripUpdates["$push"] = { visitedTerminalIds: terminal._id };
                        }
                      } else {
                        _tripUpdates["$push"] = { visitedTerminalIds: terminal._id };
                      }
                      _context.next = 65;
                      break;

                    case 62:
                      _context.prev = 62;
                      _context.t2 = _context['catch'](53);

                      console.log("error finding any enrouted request on the same trip", _context.t2);

                    case 65:

                      _trip2.default.findOneAndUpdateAsync(searchObj, _tripUpdates, { new: true }).then(function (updatedTerminalOnTrip) {
                        if (updatedTerminalOnTrip) {
                          // console.log('trip updated with new terminal visited', updatedTerminalOnTrip);
                          var _searchEndRequestsOnTerminal3 = {
                            tripId: updatedTerminalOnTrip._id,
                            tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE,
                            'destLoc._id': terminal._id
                            // check if this terminal has any requests as destination
                          };_tripRequest2.default.findAsync(_searchEndRequestsOnTerminal3).then(function (foundRequests) {
                            // console.log('found requests being completed on new terminal', foundRequests);
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
                              var _searchEndRequestsOnTerminal4 = {
                                tripId: updatedTerminalOnTrip._id,
                                tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED,
                                'srcLoc._id': terminal._id
                              };
                              _tripRequest2.default.findAsync(_searchEndRequestsOnTerminal4).then(function (foundRequests) {
                                var driverNotificationRes = {
                                  success: true,
                                  message: "No rides to complete on terminal",
                                  data: { newRequestsToEnroute: false, terminal: terminal._id }
                                  // console.log('found requests being enrouted on the terminal', foundRequests);
                                };if (foundRequests && Array.isArray(foundRequests) && foundRequests.length > 0) {
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
                      _context.next = 69;
                      break;

                    case 68:
                      console.log('terminal already visited');

                    case 69:
                    case 'end':
                      return _context.stop();
                  }
                }
              }, _callee, _this, [[18, 27], [39, 45], [53, 62]]);
            }));

            return function (_x) {
              return _ref.apply(this, arguments);
            };
          }()).catch(function (error) {
            console.log("error while searching nearby terminals", error);
            return _socketStore2.default.emitByUserId(driverId, 'socketError', { success: false, message: "Something went wrong while searching nearby terminal", data: null });
          });
        }

        // 3. Get all users on board on this trip
        getAllRidersOnBoard(updatedTrip._id, null).then(function (tripRequests) {
          if (tripRequests && Array.isArray(tripRequests)) {
            var riderNotificcationRes = {
              success: true,
              message: "trip location updated",
              data: userObj

              // async.eachOf(tripRequests, (tripRequest, key, cb) => {
              //   if((tripRequest.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) && (updatedTrip.driver.tripType == TRIP_CIRCULAR_STATIC)) {
              //     staticRouteAsyncETA(tripRequest, trip)
              //     .then(eta=>{
              //       let riderNotificcationRes = {
              //         success: true,
              //         message: "ETA Updated",
              //         data: {"eta": eta}
              //       }
              //       SocketStore.emitByUserId(acceptedRequest.riderId, "updatedETA", riderNotificcationRes);
              //       cb();
              //     })
              //     .catch(err=>{
              //       cb(err);
              //     })
              //   } else {
              //     SocketStore.emitByUserId(tripRequest.riderDetails._id, 'tripLocationUpdatedRider', riderNotificcationRes);
              //   }

              // }, (e)=>{
              //   if(e) {
              //       return console.log("error while sending ETA notification", e);
              //   }
              //   return console.log("all riders notified with ETA");
              // })

            };tripRequests.forEach(function (tripRequest, index) {
              // 4. notify all riders currently on board with current location
              _socketStore2.default.emitByUserId(tripRequest.riderDetails._id, 'tripLocationUpdatedRider', riderNotificcationRes);
            });
          } else {
            console.log("no new riders found", tripRequests);
          }
        }).catch(function (err) {
          console.log("something went wrong while searching riders whose request was accepted", err);
        });
        notifyAcceptedRidersETA(updatedTrip);
        // if(updatedTrip.driver.tripType == TRIP_CIRCULAR_STATIC) {
        //   // notify all riders with ETA whose request was accepted
        //   notifyAcceptedRidersETA(updatedTrip);
        // }
      } else {
        console.log("no trip updated with location");
      }
    }).error(function (e) {
      return _socketStore2.default.emitByUserId(driverId, 'socketError', { success: false, message: "Something went wrong", data: null });
    });
  });
} //eslint-disable-line


function notifyAdminTripLocationUpdates(trip, event, payload) {
  // console.log('notify trip location to admin', trip, event);
  _trip2.default.findOne({ _id: trip._id }, { gpsLoc: 1, driver: 1 }).populate([{ path: 'shuttleId', select: 'name imageUrl' }]).then(function (result) {
    if (result) {
      payload.data.driver = result && result.driver || {};
      payload.data.shuttleId = result && result.shuttleId || {};
      payload.data._id = trip._id;
    }
    _socketStore2.default.emitByUserId('' + trip._id, event, payload);
    // notify the admin also(to the socket without trip id)
    _user2.default.findOneAsync({ _id: trip.driver._id }).then(function (driverAdmin) {
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

function notifyAcceptedRidersETA(trip) {
  var searchSrcRequestsOnTerminal = {
    tripId: trip._id,
    tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED
    // check if this terminal has any requests as source
  };_tripRequest2.default.findAsync(searchSrcRequestsOnTerminal).then(function (acceptedRequests) {
    if (acceptedRequests && acceptedRequests.length) {
      _async2.default.eachOf(acceptedRequests, function (acceptedRequest, key, cb) {
        // check trip type and call ETA accordingly

        if (trip.driver.tripType == _tripType.TRIP_DYNAMIC) {
          (0, _shared.dynamicRouteAsyncETA)(acceptedRequest, trip).then(function (eta) {
            console.log("ETA dynamic route>>>>>>>", eta);
            var riderNotificcationRes = {
              success: true,
              message: "ETA Updated",
              data: { "eta": eta }
            };
            _socketStore2.default.emitByUserId(acceptedRequest.riderId, "updatedETA", riderNotificcationRes);
            cb();
          }).catch(function (err) {
            cb(err);
          });
        } else {
          (0, _shared.staticRouteAsyncETA)(acceptedRequest, trip).then(function (eta) {
            var riderNotificcationRes = {
              success: true,
              message: "ETA Updated",
              data: { "eta": eta }
            };
            _socketStore2.default.emitByUserId(acceptedRequest.riderId, "updatedETA", riderNotificcationRes);
            cb();
          }).catch(function (err) {
            cb(err);
          });
        }
      }, function (e) {
        if (e) {
          console.log("ETA error>>>>>>>", e);
          return console.log("error while sending ETA notification", e);
        }
        return console.log("all riders notified with ETA");
      });
    }
  });
}

exports.default = updateLocationHandler;
module.exports = exports.default;
//# sourceMappingURL=update-location.js.map
