'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.fromTerminalToTerminalTimeAsync = fromTerminalToTerminalTimeAsync;
exports.staticRouteAsyncETA = staticRouteAsyncETA;
exports.dynamicRouteAsyncETA = dynamicRouteAsyncETA;
exports.sortDynamicDriversAsync = sortDynamicDriversAsync;
exports.addReorderDynamicTerminal = addReorderDynamicTerminal;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _trip = require('../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _tripRequestStatuses = require('../constants/trip-request-statuses');

var TRIP_REQUEST_STATUS = _interopRequireWildcard(_tripRequestStatuses);

var _tripType = require('../constants/trip-type');

var TRIP_TYPES = _interopRequireWildcard(_tripType);

var TERMINAL_TYPES = _interopRequireWildcard(_tripType);

var _tripRequest = require('../models/tripRequest');

var _tripRequest2 = _interopRequireDefault(_tripRequest);

var _global = require('../constants/global');

var _express = require('express');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//const curl = new (require( 'curl-request' ))();
var request = require('request');
function fromTerminalToTerminalTimeAsync(routeTerminals) {
  return new _promise2.default(function (resolve, reject) {
    if (!routeTerminals || !Array.isArray(routeTerminals)) {
      return reject(new Error("Invalid Params to calculate time between each terminal"));
    } else {
      var fromTerminalToTerminalTimePromises = routeTerminals.map(function (terminal, index) {
        var src = terminal.address;
        var des = "";
        if (index < routeTerminals.length - 1) {
          des = routeTerminals[index + 1].address;
        } else {
          des = routeTerminals[0].address;
        }

        return function (callback) {

          // curl.setHeaders([
          //   'Content-Type:application/json'
          // ])
          // .get(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${src}&destinations=${des}&units=imperial&mode=driving&key=${GOOGLE_API_KEY}`)
          distanceMatrix(src, des).then(function (result) {
            console.log("distanceMatrix result fromTerminalToTerminalTimeAsync>>", (0, _stringify2.default)(result));
            return callback(null, JSON.parse(result.body));
          }).catch(function (err) {
            return callback(err, null);
          });
        };
      });

      _async2.default.series(fromTerminalToTerminalTimePromises, function (err, results) {
        if (err) {
          return reject(err);
        }
        var endTerminalToSrcTime = 0;
        var routeTerminalsTime = routeTerminals.map(function (terminal, index) {
          var result = results[index];
          console.log("                     ");
          console.log("result>>>>>>>>>>>>>>", (0, _stringify2.default)(result));
          console.log("                     ");
          if (result.status == "OK") {
            terminal["timeToNextTerminal"] = result.rows[0] && result.rows && result.rows[0].elements && result.rows[0].elements[0].status == "OK" && result.rows[0].elements[0].duration.value;
          }
          if (index < routeTerminals.length - 1) {
            endTerminalToSrcTime += terminal["timeToNextTerminal"];
          } else {
            terminal["timeToNextTerminal"] = endTerminalToSrcTime;
          }
          return terminal;
        });
        return resolve(routeTerminalsTime);
      });
    }
  });
}

function staticRouteAsyncETA(tripRequest, trip) {
  return new _promise2.default(function (resolve, reject) {

    // when it reaches the terminal requested as src
    if (trip && trip.visitedTerminal && tripRequest.srcLoc._id && _mongoose2.default.Types.ObjectId(trip.visitedTerminal._id).equals(tripRequest.srcLoc._id) && trip.toDestination) {
      return resolve(0);
    }

    var sequenceNo = trip.visitedTerminal && trip.visitedTerminal.sequenceNo || 0;
    var pipelineStages = [{
      $match: { _id: _mongoose2.default.Types.ObjectId(trip._id) }
    }, {
      $unwind: "$driver.route.terminals"
    }];

    if (tripRequest.srcLoc.sequenceNo < sequenceNo && trip.toDestination) {

      pipelineStages.push({
        $match: {
          $or: [{ "driver.route.terminals.sequenceNo": { $lt: tripRequest.srcLoc.sequenceNo } }, { "driver.route.terminals.sequenceNo": { $gte: sequenceNo } }]
        }
      });
    } else if ((tripRequest.srcLoc.sequenceNo <= sequenceNo || tripRequest.srcLoc.sequenceNo > sequenceNo) && !trip.toDestination) {

      pipelineStages.push({
        $match: {
          "driver.route.terminals.sequenceNo": { $lt: tripRequest.srcLoc.sequenceNo }
        }
      });
    } else if (tripRequest.srcLoc.sequenceNo > sequenceNo && trip.toDestination) {

      pipelineStages.push({
        $match: {
          $and: [{ "driver.route.terminals.sequenceNo": { $lt: tripRequest.srcLoc.sequenceNo } }, { "driver.route.terminals.sequenceNo": { $gte: sequenceNo } }]

        }
      });
    }

    pipelineStages.push({
      $group: {
        _id: "_id",
        eta: { $sum: "$driver.route.terminals.timeToNextTerminal" }
      }
    });

    _trip2.default.aggregateAsync(pipelineStages).then(function (result) {
      if (result && result.length && trip.toDestination) {
        var _etaObj = result[0];
        if (sequenceNo == 0 || tripRequest.srcLoc.sequenceNo < sequenceNo) {
          _etaObj.eta += trip.driver && trip.driver.route && trip.driver.route.stopDurationSource || 0;
        }
        tripToNextTerminalTimeAsync(trip, tripRequest).then(function (time) {
          _etaObj.eta += time;
          return resolve(_etaObj.eta);
        }).catch(function (err) {
          return reject(err);
        });
        // return resolve(etaObj.eta)
      } else if (!trip.toDestination) {
        if (tripRequest.srcLoc.sequenceNo <= sequenceNo || tripRequest.srcLoc.sequenceNo > sequenceNo) {
          pipelineStages[2] = {
            $match: {
              "driver.route.terminals.sequenceNo": { $lt: sequenceNo }
            }
          };
          _trip2.default.aggregateAsync(pipelineStages).then(function (reverseTerminalsResult) {
            var totalEta = null;
            if (reverseTerminalsResult && reverseTerminalsResult.length) {
              totalEta = reverseTerminalsResult[0].eta;
              if (result && result.length) {
                totalEta += result[0].eta;
              }
            }

            // check for stop duration
            if (tripRequest.srcLoc.type != TERMINAL_TYPES.TRIP_START_TERMINAL) {
              totalEta += trip.driver && trip.driver.route && trip.driver.route.stopDurationSource || 0;
            }

            // check for current shuttle loc to next terminal time
            tripToNextTerminalTimeAsync(trip, tripRequest).then(function (time) {
              return resolve(totalEta + time);
            }).catch(function (err) {
              return reject(err);
            });
          }).catch(function (err) {
            return reject(err);
          });
        } else {
          if (tripRequest.srcLoc.sequenceNo < sequenceNo) {
            etaObj.eta += trip.driver && trip.driver.route && trip.driver.route.stopDurationSource || 0;
          }
          return resolve(etaObj.eta);
        }
      } else {
        tripToNextTerminalTimeAsync(trip, tripRequest).then(function (time) {
          return resolve(time);
        }).catch(function (err) {
          return reject(err);
        });
        // return resolve(null);
      }
    }).catch(function (err) {
      return reject(err);
    });
  });
}

function dynamicRouteAsyncETA(tripRequest, trip) {

  return new _promise2.default(function (resolve, reject) {
    if (trip && trip.visitedTerminal && tripRequest.srcLoc._id && _mongoose2.default.Types.ObjectId(trip.visitedTerminal._id).equals(tripRequest.srcLoc._id)) {
      return resolve(0);
    }

    var pipelineStages = [{
      $match: { _id: _mongoose2.default.Types.ObjectId(trip._id) }
    }, {
      $unwind: "$driver.route.terminals"
    }];

    pipelineStages.push({
      $match: {
        $and: [{ "driver.route.terminals.sequenceNo": { $lt: tripRequest.srcLoc.sequenceNo } }, { "driver.route.terminals.sequenceNo": { $gte: trip.visitedTerminal && trip.visitedTerminal.sequenceNo || 0 } }]
      }
    });

    pipelineStages.push({
      $group: {
        _id: "_id",
        eta: { $sum: "$driver.route.terminals.timeToNextTerminal" }
      }
    });
    _trip2.default.aggregateAsync(pipelineStages).then(function (result) {
      if (result && result.length) {
        var _etaObj2 = result[0];
        // check for current shuttle loc to next terminal time
        tripToNextTerminalTimeAsync(trip, tripRequest).then(function (time) {
          _etaObj2.eta += time;
          return resolve(_etaObj2.eta);
        }).catch(function (err) {
          return reject(err);
        });
      } else {
        tripToNextTerminalTimeAsync(trip, tripRequest).then(function (time) {
          // etaObj.eta+=time
          return resolve(time);
        }).catch(function (err) {
          return reject(err);
        });
        // return resolve(null);
      }
    }).catch(function (err) {
      return reject(err);
    });
  });
}

function sortDynamicDriversAsync(request, trips) {
  console.log("                                     ");
  console.log("request  ----  > sendRequestToDriver", (0, _stringify2.default)(request));
  console.log("                                     ");
  return new _promise2.default(function (resolve, reject) {
    var tripsDuration = _lodash2.default.clone(trips);
    // let src = request.sourceLoc.address.split(' ').join('%20');
    // let origins = [src];
    var origins = [request.sourceLoc.address];
    var destinations = tripsDuration.map(function (trip) {
      var latLng = trip.gpsLoc[1] + ',' + trip.gpsLoc[0];
      return latLng;
    });

    var destinationsPiped = destinations.join('|');

    destinations = (0, _stringify2.default)(destinations);
    // let uri = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinationsPiped}&units=imperial&mode=driving&key=${GOOGLE_API_KEY}`;
    // curl.setHeaders([
    //   'Content-Type:application/json'
    // ])
    // .get(encodeURI(uri))
    distanceMatrix(origins, destinationsPiped).then(function (result) {
      console.log("                     ");
      console.log("                     ");
      console.log("DIstance result", (0, _stringify2.default)(result));
      console.log("                     ");
      console.log("                     ");
      var durations = JSON.parse(result.body);
      if (durations.status == "OK") {
        var originToDrivers = durations.rows[0] && durations.rows && durations.rows[0].elements && durations.rows[0].elements[0].status == "OK" && durations.rows[0].elements;
        _lodash2.default.forEach(tripsDuration, function (trip, index) {
          trip["duration"] = originToDrivers[index].duration.value;
        });
        return resolve(_lodash2.default.orderBy(tripsDuration, ['duration', ['asc']]));
      } else {
        return reject(new Error('Error from google api\'s'));
      }
    }).catch(function (err) {
      return reject(err);
    });
  });
}

function addReorderDynamicTerminal(terminalToAdd, tripData, initTripRequest) {

  return new _promise2.default(function (resolve, reject) {

    _trip2.default.findOne({ _id: tripData._id }).then(function (trip) {
      if (trip) {
        // add src and dest as first request on the trip or when trip did not have any terminals
        if (initTripRequest) {
          var src = JSON.parse((0, _stringify2.default)(initTripRequest.srcLoc));
          var dest = JSON.parse((0, _stringify2.default)(initTripRequest.destLoc));
          var srclatLng = src.loc[1] + ',' + src.loc[0];
          var destlatLng = dest.loc[1] + ',' + dest.loc[0];
          // let uri = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${srclatLng}&destinations=${destlatLng}&units=imperial&mode=driving&key=${GOOGLE_API_KEY}`;
          // curl.setHeaders([
          //   'Content-Type:application/json'
          // ])
          // .get(encodeURI(uri))
          distanceMatrix(srclatLng, destlatLng).then(function (response) {
            var result = JSON.parse(response.body);
            if (result.status == 'OK') {
              var srcDuration = result.rows[0] && result.rows && result.rows[0].elements && result.rows[0].elements[0].status == "OK" && result.rows[0].elements && result.rows[0].elements[0];
              src["sequenceNo"] = 1;
              src["timeToNextTerminal"] = srcDuration.duration.value;
              dest["sequenceNo"] = 2;
              dest["timeToNextTerminal"] = 0;
              var terminals = [src, dest];
              _trip2.default.findOneAndUpdateAsync({ _id: trip._id }, { $push: { "driver.route.terminals": { $each: terminals } } }, { new: true }).then(function (result) {
                if (result) {
                  updateTripRequestTerminalSeqNo(result.driver.route.terminals);
                }
                return resolve(result);
              }).catch(function (err) {
                return reject(err);
              });
            } else {
              return reject(new Error("Something went wrong getting time information"));
            }
          }).catch(function (err) {
            return reject(err);
          });
        } else {
          if (!terminalToAdd || !trip || !trip.driver.route.terminals) {
            return reject(new Error("Invalid Params to calculate time between each terminal"));
          } else {
            var currentTerminals = JSON.parse((0, _stringify2.default)(trip.driver.route.terminals));

            currentTerminals = _lodash2.default.orderBy(currentTerminals, ['sequenceNo', ['asc']]);
            var newTerminal = JSON.parse((0, _stringify2.default)(terminalToAdd));
            newTerminal["customType"] = "new";
            // place new terminal on last
            currentTerminals.push(newTerminal);
            console.log("routeTerminals", currentTerminals);
            // let src = request.sourceLoc.address.split(' ').join('%20');
            // let origins = [src];
            var tripLocLatLng = trip.gpsLoc[1] + ',' + trip.gpsLoc[0];

            var destinations = currentTerminals.map(function (terminal) {
              var latLng = terminal.loc[1] + ',' + terminal.loc[0];
              return latLng;
            });

            var destinationsPiped = destinations.join('|');

            // let uri = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${tripLocLatLng}&destinations=${destinationsPiped}&units=imperial&mode=driving&key=${GOOGLE_API_KEY}`;

            // console.log("uri>>>>>>>>>>>>>>", uri);
            // curl.setHeaders([
            //   'Content-Type:application/json'
            // ])
            // .get(encodeURI(uri))
            distanceMatrix(tripLocLatLng, destinationsPiped).then(function (result) {
              var durations = JSON.parse(result.body);
              if (durations.status == "OK") {
                var shuttleToAllCurrentTerminals = durations.rows[0] && durations.rows && durations.rows[0].elements && durations.rows[0].elements[0].status == "OK" && durations.rows[0].elements;
                console.log("distancematrix", (0, _stringify2.default)(shuttleToAllCurrentTerminals));

                _lodash2.default.forEach(currentTerminals, function (terminalDurationTemp, index) {

                  terminalDurationTemp["durationTemp"] = shuttleToAllCurrentTerminals[index].duration.value;
                  console.log("terminalDurationTemp", terminalDurationTemp);
                });

                currentTerminals = _lodash2.default.orderBy(currentTerminals, ['durationTemp', ['asc']]);
                console.log("sorted by duationTemp", currentTerminals);
                // let newTerminalIndex = _.findIndex(currentTerminals, newTerminal);
                // console.log("newterminalIndex", newTerminalIndex, newTerminal, JSON.stringify(currentTerminals));
                currentTerminals.forEach(function (terminal, index) {
                  // reassign sequenceNo
                  terminal["sequenceNo"] = index + 1;
                  // remove temporary field
                  delete terminal.durationTemp;
                });
                updateSeqAndTimeTonextTerminal(currentTerminals, trip).then(function (updatedTripRoute) {
                  return resolve(updatedTripRoute);
                }).catch(function (err) {
                  return reject(err);
                });
                // store each terminal with time to next terminal

                // let timeToNextTerminals = [];

                // check if terminal should be last in list
                // if(newTerminalIndex==(currentTerminals.length-1)) {
                //   // then update sequence for new terminal only
                //   timeToNextTerminals = [currentTerminals[newTerminalIndex-1], newTerminal];
                //   fromTerminalToTerminalDynamicAsync(timeToNextTerminals)
                //   .then(timeToNextTerminals=>{
                //     updateTerminalSeqDurationDynamic(trip, timeToNextTerminals).then(result=>{
                //       return resolve(result);
                //     })
                //     .catch(err=>{
                //       return reject(err);
                //     })
                //   })
                // } else if(newTerminalIndex>=0){
                //   // check if should be first or in between the list

                //   // update sequence of each terminal after the current terminal index
                //   // update timeToNextTerminal for the current terminal
                //   // update timeToNextTerminal for the previous terminal

                //   // if new terminal is in between the list
                //   if(newTerminalIndex>0) {
                //     timeToNextTerminals = [currentTerminals[newTerminalIndex-1], newTerminal, currentTerminals[newTerminalIndex+1]];
                //   } else {
                //     // if new terminal should be the first in remaining terminal to visit
                //     timeToNextTerminals = [newTerminal, currentTerminals[newTerminalIndex+1]];
                //   }
                //   fromTerminalToTerminalDynamicAsync(timeToNextTerminals)
                //   .then(timeToNextTerminals=>{
                //     updateTerminalSeqDurationDynamic(trip, timeToNextTerminals).then(result=>{
                //       return resolve(result);
                //     })
                //     .catch(err=>{
                //       return reject(err);
                //     })
                //   })
                // } else {
                //   return reject(new Error("something went wrong, while reordering terminals"));
                // }
              } else {
                return reject(new Error('Error from google api\'s'));
              }
            }).catch(function (err) {
              return reject(err);
            });
          }
        }
      } else {
        return reject(new Error("Trip not found"));
      }
    }).catch(function (err) {
      return reject(err);
    });
  });
}

// function updateTerminalSeqDurationDynamic(trip, timeToNextTerminals){
//   console.log("updateTerminalSeqDurationDynamic", timeToNextTerminals);
//   return new Promise((resolve, reject)=>{
//     async.eachOf(timeToNextTerminals, (timeToNextTerminal, key, cb)=>{
//       if(timeToNextTerminal) {
//         let updates = {
//           "driver.route.terminals.$.sequenceNo": timeToNextTerminal.sequenceNo,
//           "driver.route.terminals.$.timeToNextTerminal": timeToNextTerminal.timeToNextTerminal
//         }

//         TripSchema.findOneAsync({_id: trip._id, "driver.route.terminals._id": timeToNextTerminal._id})
//         .then(tripData=>{
//           console.log("trip terminals found as>>>>", JSON.stringify(trip));
//           if(tripData) {
//             TripSchema.updateOneAsync({_id: trip._id, "driver.route.terminals._id": timeToNextTerminal._id},
//             {$set: updates}, {new: true})
//             .then(result=>{
//               console.log("update existing terminal", JSON.stringify(result));
//               return cb();
//             }).catch(err=>{
//               return cb(err);
//             })
//           } else {
//             TripSchema.findOneAndUpdateAsync({_id: trip._id},
//               {$push: {"driver.route.terminals":timeToNextTerminal}}, {new: true})
//             .then(result=>{
//               console.log("new terminals added", JSON.stringify(result));
//               return cb();
//             }).catch(err=>{
//               return cb(err);
//             })
//           }
//         }).catch(err=>{
//           return cb(err);
//         })

//       } else {
//         return cb();
//       }

//     }, (err)=>{
//       if(err){
//         console.log("errror", err);
//         return reject(new Error(`Error updating time on each terminal`));
//       } else {
//         // update timeToNextTerminal for previous terminal
//         return resolve(timeToNextTerminals);
//       }
//     })
//   })
// }

// function fromTerminalToTerminalDynamicAsync(routeTerminals){
//   console.log("routeterminals", routeTerminals);
//   return new Promise((resolve, reject)=>{
//     if(!routeTerminals || !Array.isArray(routeTerminals)) {
//       return reject(new Error("Invalid Params to calculate time between each terminal"));
//     } else {

//       let fromTerminalToTerminalTimePromises = [];
//       routeTerminals.forEach((terminal, index)=>{
//         // if new terminal is in between the list
//         if(routeTerminals.length === 3) {
//           // update sequence and timeToNextTerminal for prev and newterminal

//           //update sequence number of all terminal after the current terminal

//         } else {
//           // check if new should be first or in between the list

//           // check if new terminal should be last in list

//         }

//         console.log("terminal to update", terminal);
//         let src = terminal.address.split(' ').join('%20');
//         let des = "";
//         if(index<routeTerminals.length-1) {
//           des = routeTerminals[index+1].address.split(' ').join('%20');
//         } else if((index == (routeTerminals.length-1)) && terminal && terminal.customType && (terminal.customType == 'new')) {
//           des = routeTerminals[index].address.split(' ').join('%20');
//         }

//         let promiseDuration =  function (callback){

//           curl.setHeaders([
//             'Content-Type:application/json'
//           ])
//           .get(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${src}&destinations=${des}&units=imperial&mode=driving&key=${GOOGLE_API_KEY}`)
//           .then(result=>{
//             return callback(null, JSON.parse(result.body));
//           })
//           // .catch(err=>{
//           //   return callback(err);
//           // })

//         }

//         if((index<(routeTerminals.length-1)) || (terminal.customType && (terminal.customType == 'new'))) {
//           fromTerminalToTerminalTimePromises.push(promiseDuration);
//         }
//       })

//       console.log("fromTerminalToTerminalTimePromises", fromTerminalToTerminalTimePromises);
//       async.series(fromTerminalToTerminalTimePromises, (err, results)=>{
//         console.log("async series results", err, results);
//         if(err) {
//           return reject(err);
//         }
//         let routeTerminalsTime = routeTerminals.map((terminal, index)=>{
//           console.log("route terminal>>>>>",terminal, index);
//           if((index==(routeTerminals.length-1)) && (terminal.customType && (terminal.customType == 'new'))) {
//             terminal["timeToNextTerminal"] = 0;
//             return terminal;
//           }
//           let result = results[index];
//           console.log('routeTerminalsTime to resolve', result, terminal, index);
//           if(result && result.status == "OK") {
//             terminal["timeToNextTerminal"] = result.rows[0] && result.rows && result.rows[0].elements && (result.rows[0].elements[0].status == "OK") && result.rows[0].elements[0].duration.value;
//           }
//           if(!terminal.timeToNextTerminal) {
//             terminal["timeToNextTerminal"] = 0;
//           }
//           return terminal;
//         })
//         console.log("routeTerminalsTime>>>>>>>>>>>", routeTerminalsTime);
//         return resolve(routeTerminalsTime);
//       })
//     }
//   })
// }

function updateSeqAndTimeTonextTerminal(orderedTerminals, trip) {
  return new _promise2.default(function (resolve, reject) {
    var fromTerminalToTerminalTimePromises = orderedTerminals.map(function (terminal, index) {
      return function (callback) {
        if (index === orderedTerminals.length - 1) {
          terminal["timeToNextTerminal"] = 0;
          return callback(null, terminal);
        } else {

          var src = terminal.address.split(' ').join('%20');
          var des = orderedTerminals[index + 1].address.split(' ').join('%20');
          // curl.setHeaders([
          //   'Content-Type:application/json'
          // ])
          // .get(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${src}&destinations=${des}&units=imperial&mode=driving&key=${GOOGLE_API_KEY}`)
          distanceMatrix(src, des).then(function (results) {
            var result = JSON.parse(results.body);
            terminal["timeToNextTerminal"] = result.rows[0] && result.rows && result.rows[0].elements && result.rows[0].elements[0].status == "OK" && result.rows[0].elements[0].duration.value;
            return callback(null, terminal);
          }).catch(function (err) {
            return callback(err, null);
          });
        }
      };
    });

    _async2.default.series(fromTerminalToTerminalTimePromises, function (err, results) {
      console.log("async series results", err, results);
      if (err) {
        return reject(err);
      }
      _trip2.default.findOneAndUpdate({ _id: trip._id }, { $set: { "driver.route.terminals": results } }, { new: true }).then(function (updateTripRoute) {
        updateTripRequestTerminalSeqNo(updateTripRoute.driver.route.terminals);
        return resolve(updateTripRoute);
      }).catch(function (err) {
        return reject(err);
      });
    });
  });
}

function updateTripRequestTerminalSeqNo(terminals) {
  return new _promise2.default(function (resolve, reject) {
    _async2.default.eachOf(terminals, function (terminal, key, cb) {

      _tripRequest2.default.update({ "tripRequestStatus": TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, "srcLoc._id": terminal._id }, { $set: { "srcLoc.sequenceNo": terminal.sequenceNo } }, { multi: true })
      // DriverRouteTerminalSchema.insertMany(terminals)
      .then(function (savedTerminal) {
        cb();
      }).catch(function (e) {
        console.log("err>>>>>>>>>>>", e);
        cb(e);
      });
    }, function (e) {
      if (e) {
        return reject(e);
      } else {
        return resolve(terminals);
      }
    });
  });
}

function distanceMatrix(origins, destinations) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

  return new _promise2.default(function (resolve, reject) {
    var uri = 'https://maps.googleapis.com/maps/api/distancematrix/json?origins=' + origins + '&destinations=' + destinations + '&units=imperial&mode=driving&key=' + _global.GOOGLE_API_KEY;
    console.log("distancematrixuri", uri);
    var requestOptions = {
      url: encodeURI(uri),
      headers: {
        'Content-Type': 'application/json'
      }
    };

    function callbackDistance(error, response, body) {
      if (!error) {
        return resolve(response);
      } else {
        return reject(error);
      }
    }
    request(requestOptions, callbackDistance);
  });
}

function tripToNextTerminalTimeAsync(trip, triprequest) {
  console.log("calling next terminal>>>>>>>");
  return new _promise2.default(function (resolve, reject) {
    var orderedTerminals = _lodash2.default.orderBy(trip.driver.route.terminals, ['sequenceNo', ['asc']]);
    var nextTerminal = orderedTerminals[0];
    var tripLocLatLng = trip.gpsLoc[1] + ',' + trip.gpsLoc[0];
    var reqSrclatLng = nextTerminal.loc[1] + ',' + nextTerminal.loc[0];
    if (!trip.visitedTerminal) {
      nextTerminal = triprequest.srcLoc;
      reqSrclatLng = nextTerminal.loc[1] + ',' + nextTerminal.loc[0];
      //time from trip current location to the source(static route) or source of first terminal to visit in dynamic route
      distanceMatrix(tripLocLatLng, reqSrclatLng).then(function (response) {
        var result = JSON.parse(response.body);
        var timeToSrc = result.rows[0] && result.rows && result.rows[0].elements && result.rows[0].elements[0].status == "OK" && result.rows[0].elements[0].duration.value;
        return resolve(timeToSrc || 0);
      }).catch(function (err) {
        return reject(err);
      });
    } else {
      // time from current loc of trip to the next terminal to visit
      var nextTerminalIndex = _lodash2.default.findIndex(orderedTerminals, { "sequenceNo": trip.visitedTerminal.sequenceNo + 1 });
      console.log("next terminal index>>>>>>>>>>>>", nextTerminalIndex);
      if (nextTerminalIndex > -1) {
        nextTerminal = orderedTerminals[nextTerminalIndex];
        reqSrclatLng = nextTerminal.loc[1] + ',' + nextTerminal.loc[0];
        distanceMatrix(tripLocLatLng, reqSrclatLng).then(function (response) {
          var result = JSON.parse(response.body);
          var timeToSrc = result.rows[0] && result.rows && result.rows[0].elements && result.rows[0].elements[0].status == "OK" && result.rows[0].elements[0].duration.value;
          console.log("time??????????????", timeToSrc);
          return resolve(timeToSrc || 0);
        }).catch(function (err) {
          return reject(err);
        });
      } else if (trip.driver.tripType == TRIP_TYPES.TRIP_CIRCULAR_STATIC && !trip.toDestination) {
        var _nextTerminalIndex = _lodash2.default.findIndex(orderedTerminals, { "sequenceNo": trip.visitedTerminal.sequenceNo - 1 });
        if (_nextTerminalIndex > -1) {
          nextTerminal = orderedTerminals[_nextTerminalIndex];
          reqSrclatLng = nextTerminal.loc[1] + ',' + nextTerminal.loc[0];
          distanceMatrix(tripLocLatLng, reqSrclatLng).then(function (response) {
            var result = JSON.parse(response.body);
            var timeToSrc = result.rows[0] && result.rows && result.rows[0].elements && result.rows[0].elements[0].status == "OK" && result.rows[0].elements[0].duration.value;
            return resolve(timeToSrc || 0);
          }).catch(function (err) {
            return reject(err);
          });
        } else {
          return resolve(0);
        }
      } else {
        return resolve(0);
      }
    }
  });
}
//# sourceMappingURL=shared.js.map
