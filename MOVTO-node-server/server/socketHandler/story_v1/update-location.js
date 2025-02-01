import mongoose from 'mongoose';
import async from "async";
import config from '../../../config/env';
import SocketStore from '../../service/socket-store.js'; //eslint-disable-line
import {staticRouteAsyncETA, dynamicRouteAsyncETA} from '../../service/shared'; //eslint-disable-line
import TripRequestSchema from '../../models/tripRequest';
import TripSchema from '../../models/trip';
import UserSchema from '../../models/user';
import * as TRIP_REQUEST_STATUS from '../../constants/trip-request-statuses';
import * as TRIP_TERMINAL_TYPES from '../../constants/terminal-type';
import { TRIP_DIRECT_STATIC, TRIP_CIRCULAR_STATIC, TRIP_DYNAMIC } from '../../constants/trip-type';
import _ from 'underscore';

/**
 * updateLocation handler, handle location update of the rider or driver
 * @param socket object
 * @returns {*}
 */
function updateLocationHandler(socket) {
  /**
   * updateLocation event is fired by rider or driver whenever their location is changed. also it send location update to corresponding rider or driver if they are in any tripRequest or trip.
   * @returns emit an event updatedTripLocation.
   */

  socket.on('updateTripLocation_v1', (userObj) => {
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
    const { driverId, gpsLoc } = userObj;
    let searchObj = {
      // eslint-disable-next-line
      "driver._id": userObj.driverId,
      activeStatus: true
    };
    // eslint-disable-next-line

    // 1. find and update trip location
    TripSchema.findOneAndUpdateAsync(searchObj, { $set: { gpsLoc: gpsLoc } }, { new: true })
    .then((updatedTrip) => {
      if(updatedTrip) {
        // console.log('emit locationupdated and updated trip', updatedTrip);
        // console.log('emit locationupdated and updated trip', updatedTrip._id);
        userObj.gpsLoc = updatedTrip && updatedTrip.gpsLoc;
        let returnObj={
          success:true,
          message:"Location Updated Sucessfully",
          data:userObj
        }
        // 2. notify the driver with same updated location
        SocketStore.emitByUserId(driverId, 'tripLocationUpdatedDriver', returnObj);
        notifyAdminTripLocationUpdates(updatedTrip, 'tripLocationUpdatedAdmin', returnObj)
        // 5. check if any terminal is approached in nearby area (some radius, assumed to be 100 meters)

        // if(updatedTrip && updatedTrip.driver && ((updatedTrip.driver.tripType == TRIP_CIRCULAR_STATIC) || (updatedTrip.driver.tripType == TRIP_DIRECT_STATIC))) {
          if(updatedTrip && updatedTrip.driver) {
          var query = [
            {$unwind: "$driver.route.terminals"},
            {$match: {
              "driver._id": mongoose.Types.ObjectId(driverId), "activeStatus": true,
              "driver.route.terminals.loc": { $geoWithin: { $centerSphere: [ gpsLoc, config.nearbyTerminalRadius ] } }
            }}, {$sort: {"driver.route.terminals.sequenceNo":1}}
          ]
          TripSchema.aggregateAsync(query)
          .then(async (terminalRes) => {
            let terminalResult = null;
            let visitedTerminalIds = updatedTrip.visitedTerminalIds.map((id) => {return JSON.stringify(id)});
            if(terminalRes && terminalRes.length) {
              // found multiple terminals at the same location within the config radius(100 meters)
              var newTerminals = terminalRes.filter(function(nearByTerminal){
                let terminalId = JSON.stringify(nearByTerminal.driver.route.terminals._id)
                console.log("found new terminal>>>>>>", terminalId, visitedTerminalIds);
                return visitedTerminalIds.indexOf(terminalId) === -1;
              });
              if(newTerminals && newTerminals.length) {
                terminalResult = newTerminals[0].driver.route.terminals;
              }
            }


            if(!terminalResult) {
              console.log("returninf if not new terminal")
              return false;
            }

            var terminal=terminalResult;
            // console.log("RJ nearby terminal found    --  >", terminal);
            // emit event on only those terminals which has not been visited
            // check if the terminal was already visited
            if(terminal) {
              console.log("visiting terminal and updated trip", terminal._id, JSON.stringify(updatedTrip));

              if(!updatedTrip.visitedTerminal) {
                // add visited terminal on trip
                let tripUpdates = {
                  $set: { visitedTerminal: terminal }
                };

                if(updatedTrip.driver.tripType == TRIP_CIRCULAR_STATIC) {
                  tripUpdates["$set"]["toDestination"] = true;
                  tripUpdates["$push"] = {visitedTerminalIds: terminal._id},
                  tripUpdates["$inc"] = {visitedTerminalsCount: 1}
                } else {
                  /**
                   * if dynamic trip
                   * 1. check if terminal is dest of any enrouted request on the same trip
                   * 2. if DEST >
                   *     check if the src of same request is in visited terminals
                   *       if YES > add the terminal to visited terminal ids
                   *       if NO > don't add the terminal to visited terminal ids
                   * 3. if NOT DEST > add the terminal to visited terminal ids
                   */
                  let searchEndRequestsOnTerminal = {
                    tripId: updatedTrip._id,
                    tripRequestStatus: {$in:[TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE]},
                    'destLoc._id': terminal._id
                  }
                  // check if this terminal has any requests as destination

                  let reqsWithTermAsDest = [];
                  try {
                    reqsWithTermAsDest = await TripRequestSchema.findAsync(searchEndRequestsOnTerminal);
                    console.log("enrouted reqs>>>>>>1", JSON.stringify(reqsWithTermAsDest));
                    console.log("enrouted reqs>>>>>>testing>>>>>>1", JSON.stringify(reqsWithTermAsDest));

                    if(reqsWithTermAsDest && Array.isArray(reqsWithTermAsDest) && reqsWithTermAsDest.length > 0) {
                      let srcVisitedReqs = reqsWithTermAsDest.filter(function(reqWithTermAsDest){
                        let terminalId = JSON.stringify(reqWithTermAsDest.srcLoc._id)
                        console.log("srcVisitedReqs comparing src>>>>>>>", terminalId, )
                        return (visitedTerminalIds.indexOf(terminalId) > -1);
                      });

                      if(srcVisitedReqs && srcVisitedReqs.length) {
                        console.log("updating visited terminal ids 1");
                        tripUpdates["$push"] = {visitedTerminalIds: terminal._id}
                      }
                    } else {
                      console.log("updating visited terminal ids 2");
                      tripUpdates["$push"] = {visitedTerminalIds: terminal._id}
                    }
                  } catch (error) {
                    console.log("error finding any enrouted request on the same trip", error);
                  }
                }
                TripSchema.findOneAndUpdateAsync(searchObj, tripUpdates, { new: true })
                .then((updatedTerminalOnTrip)=>{
                  if(updatedTerminalOnTrip){
                    // console.log('trip updated with new terminal visited', JSON.stringify(updatedTerminalOnTrip));
                    let searchEndRequestsOnTerminal = {
                      tripId: updatedTerminalOnTrip._id,
                      tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE,
                      'destLoc._id': terminal._id
                    }
                    // check if this terminal has any requests as destination
                    TripRequestSchema.findAsync(searchEndRequestsOnTerminal)
                    .then(foundRequests=>{

                      // console.log('found requests being completed on first terminal', JSON.stringify(foundRequests));
                      if(foundRequests && Array.isArray(foundRequests) && foundRequests.length > 0) {
                        // if requests fire event to completerides
                        let driverNotificationRes = {
                          success: true,
                          message: "Reaching at terminal",
                          data: terminal
                        }
                        SocketStore.emitByUserId(driverId, 'completeTripOnTerminal', driverNotificationRes);
                        // add region
                        driverNotificationRes.data.region=userObj.region;
                        return notifyAdminTripLocationUpdates(updatedTerminalOnTrip,'completeTripOnTerminalAdmin',driverNotificationRes);
                      } else {
                        // console.log('found requests being enroute on terminal', foundRequests);
                        TripSchema.findOneAndUpdateAsync(searchObj, { $set: { visitedTerminal: terminal } }, { new: true })
                        .then((updatedTerminalOnTrip)=>{
                          if(updatedTerminalOnTrip){
                            //  console.log('trip updated with new terminal visited', JSON.stringify(updatedTerminalOnTrip));
                            let searchSrcRequestsOnTerminal = {
                              tripId: updatedTerminalOnTrip._id,
                              tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED,
                              'srcLoc._id': terminal._id
                            }
                            // check if this terminal has any requests as source
                            TripRequestSchema.findAsync(searchSrcRequestsOnTerminal)
                            .then(foundRequests=>{
                              // console.log('found requests being enroute on first terminal', JSON.stringify(foundRequests));
                              if(foundRequests && Array.isArray(foundRequests) && foundRequests.length > 0) {
                                // if requests fire event to completerides
                                let driverNotificationRes = {
                                  success: true,
                                  message: "New Requests found at terminal",
                                  data: {newRequestsToEnroute: true, terminal: terminal._id}
                                }
                                SocketStore.emitByUserId(driverId, 'completedTerminalRequests', driverNotificationRes);
                                // add region
                                driverNotificationRes.data.region = userObj.region;
                                return notifyAdminTripLocationUpdates(updatedTerminalOnTrip,'completedTerminalRequestsAdmin',driverNotificationRes);
                              }
                            })
                            .catch(error=>{
                              console.log('error updating trip with new terminal visited and to enroute', updatedTerminalOnTrip);
                            })
                          }
                        })
                        .catch(error=>{
                          console.log('error updating trip with new terminal visited and to complete', updatedTerminalOnTrip);
                        })
                      }
                    })
                  }
                })
                .catch(error=>{
                  console.log('error updating trip with new terminal visited', updatedTerminalOnTrip);
                })

              } else if(!mongoose.Types.ObjectId(updatedTrip.visitedTerminal._id).equals(terminal._id)) {
                // check if new terminal doesn't exist in visitterminalids
                // update the visited terminal on trip
                let tripUpdates = {
                  $set: { visitedTerminal: terminal }
                }

                if(updatedTrip.driver.tripType == TRIP_CIRCULAR_STATIC) {

                  if(terminal.type == TRIP_TERMINAL_TYPES.TRIP_END_TERMINAL) {
                    tripUpdates["$set"]["toDestination"] = false;
                    tripUpdates["$set"]["visitedTerminalIds"] = [terminal._id];
                    tripUpdates["$set"]["visitedTerminalsCount"] = 1;
                  }else if(terminal.type != TRIP_TERMINAL_TYPES.TRIP_START_TERMINAL) {
                    tripUpdates["$push"] = {visitedTerminalIds: terminal._id},
                    tripUpdates["$inc"] = {visitedTerminalsCount: 1}
                  } else {
                    tripUpdates["$set"]["toDestination"] = true;
                    tripUpdates["$set"]["visitedTerminalIds"] = [terminal._id];
                    tripUpdates["$set"]["visitedTerminalsCount"] = 1;
                  }


                  // if triptype is circular static route and moving towards source back no requests to process
                  if(!updatedTrip.toDestination && (terminal.type != TRIP_TERMINAL_TYPES.TRIP_START_TERMINAL)) {
                    console.log("triptype is circular static route and moving towards source back no requests to process");
                    try {
                      let updatedTrip = await TripSchema.findOneAndUpdateAsync(searchObj, tripUpdates, { new: true })
                    } catch (error) {
                      console.log("err>>>>>>", error);
                    }
                    return false;
                  }
                } else {
                  /**
                   * if dynamic trip
                   * 1. check if terminal is dest of any enrouted/accepted request on the same trip
                   * 2. if DEST >
                   *     check if the src of same request is in visited terminals
                   *       if YES > add the terminal to visited terminal ids
                   *       if NO > don't add the terminal to visited terminal ids
                   * 3. if NOT DEST > add the terminal to visited terminal ids
                   */
                  let searchEndRequestsOnTerminal = {
                    tripId: updatedTrip._id,
                    tripRequestStatus: {$in:[TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE]},
                    'destLoc._id': terminal._id
                  }
                  // check if this terminal has any requests as destination

                  let reqsWithTermAsDest = [];
                  try {
                    console.log("searchEndRequestsOnTerminal>>>>>", JSON.stringify(searchEndRequestsOnTerminal));
                    reqsWithTermAsDest = await TripRequestSchema.findAsync(searchEndRequestsOnTerminal);
                    console.log("enrouted reqs>>>>>>2", JSON.stringify(reqsWithTermAsDest));
                    if(reqsWithTermAsDest && Array.isArray(reqsWithTermAsDest) && reqsWithTermAsDest.length > 0) {
                      let srcVisitedReqs = reqsWithTermAsDest.filter(function(reqWithTermAsDest){
                        let terminalId = JSON.stringify(reqWithTermAsDest.srcLoc._id)
                        return (visitedTerminalIds.indexOf(terminalId) > -1);
                      });

                      if(srcVisitedReqs && srcVisitedReqs.length) {
                        tripUpdates["$push"] = {visitedTerminalIds: terminal._id}
                      }
                    } else {
                      tripUpdates["$push"] = {visitedTerminalIds: terminal._id}
                    }
                  } catch (error) {
                    console.log("error finding any enrouted request on the same trip", error);
                  }

                  // tripUpdates["$push"] = {visitedTerminalIds: terminal._id}
                }

                TripSchema.findOneAndUpdateAsync(searchObj, tripUpdates, { new: true })
                .then((updatedTerminalOnTrip)=>{
                  if(updatedTerminalOnTrip){
                    // console.log('trip updated with new terminal visited', updatedTerminalOnTrip);
                    let searchEndRequestsOnTerminal = {
                      tripId: updatedTerminalOnTrip._id,
                      tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE,
                      'destLoc._id': terminal._id
                    }
                    // check if this terminal has any requests as destination
                    TripRequestSchema.findAsync(searchEndRequestsOnTerminal)
                    .then(foundRequests=>{
                      // console.log('found requests being completed on new terminal', foundRequests);
                      if(foundRequests && Array.isArray(foundRequests) && foundRequests.length > 0) {
                        // if requests fire event to completerides
                        let driverNotificationRes = {
                          success: true,
                          message: "Reaching at terminal",
                          data: terminal
                        }
                        SocketStore.emitByUserId(driverId, 'completeTripOnTerminal', driverNotificationRes);
                        return notifyAdminTripLocationUpdates(updatedTerminalOnTrip,'completeTripOnTerminalAdmin',driverNotificationRes);
                      } else {
                        let searchEndRequestsOnTerminal = {
                          tripId: updatedTerminalOnTrip._id,
                          tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED,
                          'srcLoc._id': terminal._id
                        }
                        TripRequestSchema.findAsync(searchEndRequestsOnTerminal)
                        .then(foundRequests=>{
                          let driverNotificationRes = {
                            success: true,
                            message: "No rides to complete on terminal",
                            data: {newRequestsToEnroute: false, terminal: terminal._id}
                          }
                          // console.log('found requests being enrouted on the terminal', foundRequests);
                          if(foundRequests && Array.isArray(foundRequests) && foundRequests.length > 0) {
                            // if requests fire event to completerides
                            driverNotificationRes.data.newRequestsToEnroute = true;
                          }
                          SocketStore.emitByUserId(driverId, `completedTerminalRequests`, driverNotificationRes);
                        })
                        .catch(error=>{
                          console.log('error while find trip request', error);
                          SocketStore.emitByUserId(driverId, `socketError`, {success: false, message: 'Something went wrong, while searching new requests to board', data: null });
                        })
                      }
                    })
                  }
                })
                .catch(error=>{
                  console.log('error updating trip with new terminal visited', updatedTerminalOnTrip);
                })
              } else {
                console.log('terminal already visited');
              }

            }
          })
          .catch(error=>{
            console.log("error while searching nearby terminals", error);
            return SocketStore.emitByUserId(driverId, 'socketError', {success:false, message: "Something went wrong while searching nearby terminal", data: null});
          })
        }

        // 3. Get all users on board on this trip
        getAllRidersOnBoard(updatedTrip._id, null)
        .then(tripRequests=>{
          if(tripRequests && Array.isArray(tripRequests)) {
            let riderNotificcationRes = {
              success: true,
              message: "trip location updated",
              data: userObj
            }

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

            tripRequests.forEach((tripRequest, index)=>{
              // 4. notify all riders currently on board with current location
              SocketStore.emitByUserId(tripRequest.riderDetails._id, 'tripLocationUpdatedRider', riderNotificcationRes);
            })
          } else {
            console.log("no new riders found", tripRequests);
          }
        })
        .catch(err=>{
          console.log("something went wrong while searching riders whose request was accepted", err);
        })
        notifyAcceptedRidersETA(updatedTrip);
        // if(updatedTrip.driver.tripType == TRIP_CIRCULAR_STATIC) {
        //   // notify all riders with ETA whose request was accepted
        //   notifyAcceptedRidersETA(updatedTrip);
        // }
      } else {
        console.log("no trip updated with location");
      }
    })
    .error((e) => {
      return SocketStore.emitByUserId(driverId, 'socketError', {success:false, message: "Something went wrong", data: null});
    });
  });

}

function notifyAdminTripLocationUpdates(trip, event, payload) {
  // console.log('notify trip location to admin', trip, event);
  TripSchema.findOne({ _id: trip._id }, {gpsLoc: 1, driver:1})
  .populate([
    {path:'shuttleId',select:'name imageUrl'}
  ]).then(result=>{
    if(result) {
      payload.data.driver = result && result.driver || {};
      payload.data.shuttleId = result && result.shuttleId || {};
      payload.data._id = trip._id;
    }
    SocketStore.emitByUserId(
      `${trip._id}`,
      event,
      payload
    )
    // notify the admin also(to the socket without trip id)
    UserSchema.findOneAsync({_id: trip.driver._id})
    .then((driverAdmin)=>{
      if(driverAdmin) {
        SocketStore.emitByUserId(
          `${driverAdmin.adminId}`,
          event,
          payload
        )
      }
    })
    .catch(err=>{
      console.log('Error while sending notification to admin on trip location changes', err);
    })
  })
  .catch(error=>{
    console.log('error sending notification to driver admin', error);
  })
}

function getAllRidersOnBoard(tripId, terminalId=null){
  console.log('trip and terminal', tripId);
    let aggregateStages = [
      {
        $match: {
          tripId: mongoose.Types.ObjectId(tripId),
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
      }
    ];

    // removes terminalid filter from query if no terminal provided
    if(terminalId) {
      aggregateStages[0].$match["srcLoc._id"] = mongoose.Types.ObjectId(terminalId)
    }

    return TripRequestSchema.aggregateAsync(aggregateStages)
}

function notifyAcceptedRidersETA(trip) {
  let searchSrcRequestsOnTerminal = {
    tripId: trip._id,
    tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED
  }
  // check if this terminal has any requests as source
  TripRequestSchema.findAsync(searchSrcRequestsOnTerminal)
  .then((acceptedRequests)=>{
    if(acceptedRequests && acceptedRequests.length) {
      async.eachOf(acceptedRequests, (acceptedRequest, key, cb)=>{
        // check trip type and call ETA accordingly

        if(trip.driver.tripType == TRIP_DYNAMIC) {
          dynamicRouteAsyncETA(acceptedRequest, trip)
          .then(eta=>{
            console.log("ETA dynamic route>>>>>>>", eta);
            let riderNotificcationRes = {
              success: true,
              message: "ETA Updated",
              data: {"eta": eta}
            }
            SocketStore.emitByUserId(acceptedRequest.riderId, "updatedETA", riderNotificcationRes);
            cb();
          })
          .catch(err=>{
            cb(err);
          })
        } else {
          staticRouteAsyncETA(acceptedRequest, trip)
          .then(eta=>{
            let riderNotificcationRes = {
              success: true,
              message: "ETA Updated",
              data: {"eta": eta}
            }
            SocketStore.emitByUserId(acceptedRequest.riderId, "updatedETA", riderNotificcationRes);
            cb();
          })
          .catch(err=>{
            cb(err);
          })
        }

      }, (e)=>{
        if(e) {
          console.log("ETA error>>>>>>>", e);
          return console.log("error while sending ETA notification", e);
        }
        return console.log("all riders notified with ETA");
      })
    }
  })
}

export default updateLocationHandler;
