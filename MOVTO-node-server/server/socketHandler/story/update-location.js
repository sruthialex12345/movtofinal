import gpsDistannce from 'gps-distance';
import mongoose from 'mongoose';
import config from '../../../config/env';
import { fetchReturnObj } from '../../service/transform-response';
import sendNotification from '../../service/pushExpo';
import SocketStore from '../../service/socket-store.js'; //eslint-disable-line
import TripRequestSchema from '../../models/tripRequest';
import DriverRouteTerminalSchema from '../../models/driverRouteTerminal';
import TripSchema from '../../models/trip';
import UserSchema from '../../models/user';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER } from '../../constants/user-types';
import { sendSms } from '../../service/smsApi';
import sendSmsEachRider from '../../service/smsEachRiderApi';
import * as TRIP_REQUEST_STATUS from '../../constants/trip-request-statuses';
import { resolve } from 'url';
import _ from 'underscore';
import { runInNewContext } from 'vm';
import AdminDriverschema from '../../models/adminDriver';

/**
 * updateLocation handler, handle location update of the rider or driver
 * @param socket object
 * @returns {*}
 */
function updateLocationHandler(socket) {
  let count = 0;
  /**
   * updateLocation event is fired by rider or driver whenever their location is changed. also it send location update to corresponding rider or driver if they are in any tripRequest or trip.
   * @param userObj - user whose location has to be updated
   * @returns emit an updateDriverLocation or updateRiderLocation event based on userType.
   */

  socket.on('updateLocation', (userObj) => {
    // console.log('user udpate location', userObj);
    const { userType } = userObj;
    let searchObj = {};
    if (userType === USER_TYPE_RIDER) {
      searchObj = {
        // eslint-disable-next-line
        riderId: userObj._id,
      };
    } else if (userType === USER_TYPE_DRIVER) {
      searchObj = {
        // eslint-disable-next-line
        driverId: userObj._id,
      };
    }
    // eslint-disable-next-line
    const userID = userObj._id;
    UserSchema.findOneAsync({ _id: userID })
      .then((updatedUserData) => {
    let gpslocation= userObj.gpsLoc? userObj.gpsLoc:updatedUserData.gpsLoc;
    UserSchema.findOneAndUpdateAsync({ _id: userID }, { $set: { gpsLoc: gpslocation } }, { new: true })
      .then((updatedUser) => {
        let returnObj={
          success:true,
          message:"Location Updated Sucessfully",
          data:updatedUser
        }
        SocketStore.emitByUserId(userID, 'locationUpdated', returnObj);
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
      })
      .error((e) => {
        SocketStore.emitByUserId(userID, 'socketError', {success:false, message: "Something went wrong", data: null});
      });
    })
    .error((e) => {
      SocketStore.emitByUserId(userID, 'socketError', {success:false, message: "Something went wrong", data: null});
    });
  });

  /**
   * updateLocation event is fired by rider or driver whenever their location is changed. also it send location update to corresponding rider or driver if they are in any tripRequest or trip.
   * @returns emit an event updatedTripLocation.
   */

  socket.on('updateTripLocation', (userObj) => {
    count = count+1;
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
    const { driverId, gpsLoc } = userObj;
    let searchObj = {
      // eslint-disable-next-line
      driverId: userObj.driverId,
      activeStatus: true
    };
    // eslint-disable-next-line

    // 1. find and update trip location
    TripSchema.findOneAndUpdateAsync(searchObj, { $set: { gpsLoc: gpsLoc } }, { new: true })
    .then((updatedTrip) => {
      if(updatedTrip) {
        console.log('emit locationupdated and updated trip', updatedTrip && updatedTrip._id);
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
        DriverRouteTerminalSchema.findOneAsync({
          loc: { $geoWithin: { $centerSphere: [ gpsLoc, config.nearbyTerminalRadius ] } },
          driverId: driverId
        })
        .then(terminal=>{

          console.log("nearby terminal found", terminal);
          // emit event on only those terminals which has not been visited
          // check if the terminal was already visited
          if(terminal) {

            console.log("visiting terminal and visited terminal", terminal._id, updatedTrip.visitedTerminal);

            if(!updatedTrip.visitedTerminal) {
              // add visited terminal on trip
              TripSchema.findOneAndUpdateAsync(searchObj, { $set: { visitedTerminal: terminal } }, { new: true })
              .then((updatedTerminalOnTrip)=>{
                if(updatedTerminalOnTrip){
                  console.log('trip updated with new terminal visited', updatedTerminalOnTrip);
                  let searchEndRequestsOnTerminal = {
                    tripId: updatedTerminalOnTrip._id,
                    tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE,
                    'destLoc._id': terminal._id
                  }
                  // check if this terminal has any requests as destination
                  TripRequestSchema.findAsync(searchEndRequestsOnTerminal)
                  .then(foundRequests=>{
                    console.log('found requests being completed on first terminal', foundRequests);
                    if(foundRequests && Array.isArray(foundRequests) && foundRequests.length > 0) {
                      // if requests fire event to completerides
                      let driverNotificationRes = {
                        success: true,
                        message: "Reaching at terminal",
                        data: {terminal: terminal._id}
                      }
                      SocketStore.emitByUserId(driverId, 'completeTripOnTerminal', driverNotificationRes);
                      // add region
                      driverNotificationRes.data.region=userObj.region;
                      return notifyAdminTripLocationUpdates(updatedTerminalOnTrip,'completeTripOnTerminalAdmin',driverNotificationRes);
                    } else {
                      console.log('found requests being enroute on terminal', foundRequests);
                      TripSchema.findOneAndUpdateAsync(searchObj, { $set: { visitedTerminal: terminal } }, { new: true })
                      .then((updatedTerminalOnTrip)=>{
                        if(updatedTerminalOnTrip){
                          console.log('trip updated with new terminal visited', updatedTerminalOnTrip);
                          let searchSrcRequestsOnTerminal = {
                            tripId: updatedTerminalOnTrip._id,
                            tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED,
                            'srcLoc._id': terminal._id
                          }
                          // check if this terminal has any requests as source
                          TripRequestSchema.findAsync(searchSrcRequestsOnTerminal)
                          .then(foundRequests=>{
                            console.log('found requests being enroute on first terminal', foundRequests);
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
              // update the visited terminal on trip
              TripSchema.findOneAndUpdateAsync(searchObj, { $set: { visitedTerminal: terminal } }, { new: true })
              .then((updatedTerminalOnTrip)=>{
                if(updatedTerminalOnTrip){
                  console.log('trip updated with new terminal visited', updatedTerminalOnTrip);
                  let searchEndRequestsOnTerminal = {
                    tripId: updatedTerminalOnTrip._id,
                    tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE,
                    'destLoc._id': terminal._id
                  }
                  // check if this terminal has any requests as destination
                  TripRequestSchema.findAsync(searchEndRequestsOnTerminal)
                  .then(foundRequests=>{
                    console.log('found requests being completed on new terminal', foundRequests);
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
                        console.log('found requests being enrouted on the terminal', foundRequests);
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
          console.log("error while searching nearby terminals");
          return SocketStore.emitByUserId(driverId, 'socketError', {success:false, message: "Something went wrong while searching nearby terminal", data: null});
        })
        // 3. Get all users on board on this trip
        getAllRidersOnBoard(updatedTrip._id, null)
        .then(tripRequests=>{
          if(tripRequests && Array.isArray(tripRequests)) {
            let riderNotificcationRes = {
              success: true,
              message: "trip location updated",
              data: userObj
            }
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
  TripSchema.findOne({ _id: trip._id }, {gpsLoc: 1})
  .populate([
    {path:'driverId',select:'name email profileUrl'},
    {path:'shuttleId',select:'name imageUrl'}
  ]).then(result=>{
    if(result) {
      payload.data.driverId = result && result.driverId || {};
      payload.data.shuttleId = result && result.shuttleId || {};
      payload.data._id = trip._id;
    }
    SocketStore.emitByUserId(
      `${trip._id}`,
      event,
      payload
    )
    // notify the admin also(to the socket without trip id)
    UserSchema.findOneAsync({_id: trip.driverId})
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

function changedTripRequestStatus(driverObj, tripRequestObj) {
  let dist = gpsDistannce(driverObj.gpsLoc[0], driverObj.gpsLoc[1], tripRequestObj.srcLoc[0], tripRequestObj.srcLoc[1]);
  let newTripRequestStatus = null;
  const currentTripRequestStatus = tripRequestObj.tripRequestStatus;
  dist = dist.toFixed(4) * 1000; // dist in meters
  console.log('gps location driver', driverObj.gpsLoc);
  console.log('distance %%%%%%%%', dist);
  if (dist <= config.arrivedDistance) {
    newTripRequestStatus = 'arrived';
  } else if (dist > config.arrivedDistance && dist < config.arrivingDistance) {
    newTripRequestStatus = 'arriving';
  } else {
    newTripRequestStatus = 'enRoute';
  }
  if (newTripRequestStatus !== currentTripRequestStatus) {
    tripRequestObj.tripRequestStatus = newTripRequestStatus;
    // eslint-disable-next-line
    TripRequestSchema.findOneAndUpdateAsync({ _id: tripRequestObj._id }, { $set: tripRequestObj }, { new: true })
      .then((updatedTripRequestObj) => {
        fetchReturnObj(updatedTripRequestObj).then((updatedTripRequestObj123) => {
          if (updatedTripRequestObj123.tripRequestStatus === 'arrived') {
            notifyRiderBySmsOfArrived(updatedTripRequestObj);
            sendNotification(updatedTripRequestObj.riderId, `Driver has ${updatedTripRequestObj123.tripRequestStatus}`);
            sendNotification(updatedTripRequestObj.driverId, updatedTripRequestObj123.tripRequestStatus);
          } else {
            notifyRiderBySmsOfEnRoute(updatedTripRequestObj);
            sendNotification(updatedTripRequestObj.riderId, `Driver is ${updatedTripRequestObj123.tripRequestStatus}`);
            sendNotification(updatedTripRequestObj.driverId, updatedTripRequestObj123.tripRequestStatus);
          }
          SocketStore.emitByUserId(updatedTripRequestObj.riderId, 'tripRequestUpdated', updatedTripRequestObj123);
          SocketStore.emitByUserId(updatedTripRequestObj.driverId, 'tripRequestUpdated', updatedTripRequestObj123);
        });
      })
      .error((err) => {
        SocketStore.emitByUserId(tripRequestObj.riderId, 'socketError', {
          message: 'error while updating tripRequestStatus based on distance',
          data: err,
        });
        SocketStore.emitByUserId(tripRequestObj.driverId, 'socketError', {
          message: 'error while updating tripRequestStatus based on distance',
          data: err,
        });
      });
  }
}

function notifyRiderBySmsOfEnRoute(tripRequestObj) {
  TripSchema.findOne({ _id: tripRequestObj.tripId })
    .populate('riderId', '_id fname lname passengerList')
    .populate('driverId', '_id fname lname')
    .exec((err, tripObj) => {
      if (err) {
        console.log(`server error while finding trip ${err}`)
      }
      else {
        try {
          let pickupDate = moment(tripObj.pickUpTime).format('MMMM Do YYYY, h:mm:ss a');
          let passengerName = "";
          if (tripObj.passengerIds.length > 0 && tripObj && tripObj.riderId && tripObj.driverId) {
            if (tripObj.passengerIds.length == 1) {
              tripObj.passengerIds.forEach((item, index) => {
                tripObj.riderId.passengerList.forEach(element => {
                  if (item == element._id) {
                    passengerName = element.fname;
                    if (element.phoneNo) {
                      let eachRiderSmsText = `Your Merry Go Drive driver ${tripObj.driverId.fname} ${tripObj.driverId.lname} has left to pick you up for your ${pickupDate} ride.`;
                      sendSmsToRider(tripObj.riderId._id, eachRiderSmsText, element.phoneNo);
                    }
                  }
                })
              })
            }
            else if (tripObj.passengerIds.length == 2) {
              tripObj.passengerIds.forEach(item => {
                tripObj.riderId.passengerList.forEach(element => {
                  if (item == element._id) {
                    if (index == 1) {
                      passengerName = passengerName + " and " + element.fname;
                    }
                    else {
                      passengerName = element.fname;
                    }
                    if (element.phoneNo) {
                      let eachRiderSmsText = `Your Merry Go Drive driver ${tripObj.driverId.fname} ${tripObj.driverId.lname} has left to pick you up for your ${pickupDate} ride.`;
                      sendSmsToRider(tripObj.riderId._id, eachRiderSmsText, element.phoneNo);
                    }
                  }
                })
              })
            }
            else {
              tripObj.passengerIds.forEach((item, index) => {
                tripObj.riderId.passengerList.forEach((element) => {
                  if (item == element._id) {
                    if (index == (tripObj.passengerIds.length - 1)) {
                      passengerName = passengerName.slice(0, -2);
                      passengerName = passengerName + " and " + element.fname;
                    }
                    else {
                      passengerName = passengerName + element.fname + ", ";
                    }
                    if (element.phoneNo) {
                      let eachRiderSmsText = `Your Merry Go Drive driver ${tripObj.driverId.fname} ${tripObj.driverId.lname} has left to pick you up for your ${pickupDate} ride.`;
                      sendSmsToRider(tripObj.riderId._id, eachRiderSmsText, element.phoneNo);
                    }
                  }
                })
              })
            }

            let smsText = `Your driver ${tripObj.driverId.fname} ${tripObj.driverId.lname} has left for ${passengerName}  scheduled ${pickupDate} pickup.`;
            sendSmsToRider(tripObj.riderId._id, smsText);
          }
          else {
            console.log("No passenger found");
          }
        } catch (err) {
          console.log("Error sending sms to rider", err);
        }
      }
    })
}

function notifyRiderBySmsOfArrived(updatedTripRequestObj) {
  TripSchema.findOne({ _id: tripRequestObj.tripId })
    .populate('riderId', '_id fname lname passengerList')
    .populate('driverId', '_id fname lname carDetails')
    .exec((err, tripObj) => {
      if (err) {
        console.log(`server error while finding trip ${err}`)
      }
      else {
        try {
          if (tripObj.passengerIds.length > 0 && tripObj && tripObj.riderId && tripObj.driverId && tripObj.driverId.carDetails) {
            //Sms each rider in the trip
            tripObj.passengerIds.forEach(item => {
              tripObj.riderId.passengerList.forEach(element => {
                if (item == element._id) {
                  if (element.phoneNo) {
                    let eachRiderSmsText = `${tripObj.driverId.fname} ${tripObj.driverId.lname} has arrived and is outside in a ${tripObj.driverId.carDetails.color}  ${tripObj.driverId.carDetails.company} ${tripObj.driverId.carDetails.carModel}. Don't forget to have them tell you your secret code word.`;
                    sendSmsToRider(tripObj.riderId._id, eachRiderSmsText, element.phoneNo);
                  }
                }
              })
            })
            //Sms user who booked the trip
            let smsText = `${tripObj.driverId.fname} ${tripObj.driverId.lname} has arrived and is outside in a ${tripObj.driverId.carDetails.color}  ${tripObj.driverId.carDetails.company} ${tripObj.driverId.carDetails.carModel}.`;
            sendSmsToRider(tripObj.riderId._id, smsText);
          }
          else {
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
    sendSmsEachRider(smsText, phoneNo, (err, data) => {
      if (err) {
        console.log(`server error while sending sms to rider ${err}`);
      }
      else {
        console.log("Sms is successfully sent to rider");
      }
    })
  } else {
    sendSms(userId, smsText, (err, data) => {
      if (err) {
        console.log(`server error while sending sms to rider ${err}`);
      }
      else {
        console.log("Sms is successfully sent to rider");
      }
    })
  }

}

export default updateLocationHandler;
