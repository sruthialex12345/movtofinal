import mongoose from 'mongoose';
import Promise from 'bluebird';
import httpStatus from 'http-status';
import APIError from '../../helpers/APIError';
import AppConfig from '../../models/appConfig';
import * as Shared from '../../service/shared';
import * as PushNotification from '../../service/pushNotification';
import SocketStore from '../../service/socket-store.js'; //eslint-disable-line
import TripRequest from '../../models/tripRequest';
import UserSchema from '../../models/user';
import TripSchema from '../../models/trip';

import { USER_TYPE_RIDER, USER_TYPE_DRIVER } from '../../constants/user-types';
import { TRIP_DIRECT_STATIC, TRIP_CIRCULAR_STATIC, TRIP_DYNAMIC } from '../../constants/trip-type';
import adminLocation from '../../models/adminLocation';
import { TRIP_REQUEST_INIT, TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_ENROUTE } from '../../constants/trip-request-statuses';

function requestTripHandler_v2(socket) {

  socket.on('requestTrip_v2', (payload) => {
    /**
     * 1. lookup nearby drivers. preffered way is to lookup for the driver who has yet to reach the pickup point on it's way
     * 2. create new requestTrip on terminal selected as source by the rider
     * 2. notify the driver with event "requestDriver" and payload with created requestTrip obj
     * 3. wait for 10 minutes for driver response
     * 4. if driver accept the request notify the user with driver details along with vehicle details
     * 5. else if driver doesn't respond in 10 minutes or reject, respond with
     */
    console.log("           ");
    console.log("REQUSTE REPETE Payload:  ", JSON.stringify(payload));
    console.log("           ");
    console.log("           ");

    // check reservation code
    const riderID = payload.rider._id;
    validateReservationCodeAsync(payload.request).then(result=>{
      if(!result.success) {
        return SocketStore.emitByUserId(riderID, 'socketError', { code:504,success: false, message: result.message, data: null });
      } else {
        checkIfRideReqInProgress(riderID).then(result=>{

          console.log("           ");
          console.log("REQUSTE REPETE result:  ", result);
          console.log("           ");
          console.log("           ");
          if(result) {
            console.log("result1 checkIfRideReqInProgress ", result)
            SocketStore.emitByUserId(riderID, 'socketError', { success: false, message: "Request already in progress", data: result });
            return false;
          } else {
            console.log("result2 checkIfRideReqInProgress>>>>>>>>>>>> ", result)
            if(payload.request.tripType == TRIP_DYNAMIC) {
              // return;
              nearByDynamicRouteDriver(riderID, payload.request)
              .then((result) => {
                if(result){
                let nearByDriversDoc = result.foundDrivers;
                // add rider details to the payload on request to attach the riderdetails to the payload sent to the driver with event
                payload.request.riderDetails = result.riderDetails;

                if(nearByDriversDoc && nearByDriversDoc.length) {
                  // send notification event to the driver
                  sendRequestToDriver(payload, nearByDriversDoc[0].driver[0])
                  .then(res=>{
                    if(res) {
                      SocketStore.emitByUserId(res.tripRequest && res.tripRequest.riderId && res.tripRequest.riderId || riderID,
                        'rideRequestSentToDriver', { success: true,
                          message: 'Request Sent to the driver', data: res.tripRequest });
                      let pushData = {
                        payload: { success: true, message: 'Request Sent to the driver', data: res.tripRequest },
                        body: `Request has been sent to the driver: ${res.driver.name}`,
                        title: 'New Request'
                      }
                      PushNotification.sendNotificationByUserIdAsync(riderID, pushData);
                    } else {
                      SocketStore.emitByUserId(riderID, 'noDriverOnRequestRide', { success: false, message: 'No drivers around', data: null });
                    }
                  })
                  .catch((err)=>{
                    console.log('request to driver err', err);
                    SocketStore.emitByUserId(riderID, 'socketError', { success: false, message: 'Error while notifying driver', data: null });
                  })
                } else {
                  // SendNotification(riderID, 'No nearby drivers');
                  SocketStore.emitByUserId(riderID, 'noDriverOnRequestRide', { success: false, message: 'No drivers around', data: null });
                }
              } else {
                // SendNotification(riderID, 'No nearby drivers');
                SocketStore.emitByUserId(riderID, 'noDriverOnRequestRide', { success: false, message: 'No drivers around', data: null });
              }
              })
              .catch(e => {
                SocketStore.emitByUserId(riderID, 'socketError', { success: false, message: (e instanceof APIError) && e.isPublic && e.message || `Something went wrong, while looking for nearby driver`, data: null });
              });
            } else if ((payload.request.tripType == TRIP_CIRCULAR_STATIC) || payload.request.tripType == TRIP_DIRECT_STATIC) {
              let sourceDestIds = [payload.request.sourceLoc, payload.request.destLoc]
              Promise.all(sourceDestIds.map(function(id) {
                return TripSchema.aggregateAsync([
                  {$match: {'activeStatus': true, 'driver.tripType': {$in: [TRIP_DIRECT_STATIC, TRIP_CIRCULAR_STATIC]}}},
                  {$unwind: '$driver.route.terminals'},
                  {$match: {'driver.route.terminals._id': mongoose.Types.ObjectId(id)}},
                  {$project: {'terminal': '$driver.route.terminals'}}
                ]).then(function(result) {
                  if(result && result.length) {
                    return result[0].terminal || {}
                  } else {
                    return {}
                  }
                  return result;
                });
              }))
              .then(function(sourceDestterminals) {
                // results is an array of source and destination terminals
                if(sourceDestterminals && sourceDestterminals.length && sourceDestterminals[0] && sourceDestterminals[1]) {
                  payload.request.sourceLoc = sourceDestterminals[0];
                  payload.request.destLoc = sourceDestterminals[1];
                  // eslint-disable-next-line
                  const quantum = 10;
                  // eslint-disable-next-line
                  nearByCircularDriver(riderID, payload.request)
                  .then((result) => {
                    let nearByDriversDoc = result.foundDrivers;
                    // add rider details to the payload on request to attach the riderdetails to the payload sent to the driver with event
                    payload.request.riderDetails = result.riderDetails;

                    if(nearByDriversDoc && nearByDriversDoc.length) {
                      // send notification event to the driver
                      sendRequestToDriver(payload, nearByDriversDoc[0].driver[0])
                      .then(res=>{
                        if(res) {
                          SocketStore.emitByUserId(res.tripRequest && res.tripRequest.riderId && res.tripRequest.riderId || riderID,
                            'rideRequestSentToDriver', { success: true,
                              message: 'Request Sent to the driver', data: res.tripRequest });
                          let pushData = {
                            payload: { success: true, message: 'Request Sent to the driver', data: res.tripRequest },
                            body: `Request has been sent to the driver: ${res.driver.name}`,
                            title: 'New Request'
                          }
                          PushNotification.sendNotificationByUserIdAsync(riderID, pushData);
                        } else {
                          SocketStore.emitByUserId(riderID, 'noDriverOnRequestRide', { success: false, message: 'No drivers around', data: null });
                        }
                      })
                      .catch((err)=>{
                        console.log('request to driver err', err);
                        SocketStore.emitByUserId(riderID, 'socketError', { success: false, message: 'Error while notifying driver', data: null });
                      })
                    } else {
                      // SendNotification(riderID, 'No nearby drivers');
                      SocketStore.emitByUserId(riderID, 'noDriverOnRequestRide', { success: false, message: 'No drivers around', data: null });
                    }
                  })
                  .catch(e => {
                    SocketStore.emitByUserId(riderID, 'socketError', { success: false, message: 'Something went wrong, while looking for nearby driver', data: null });
                  });
                } else {
                  SocketStore.emitByUserId(riderID, 'socketError', { success: false, message: 'Something went wrong, terminals not found', data: null });
                }
              }).catch(e=>{
                console.log("promise all error", e);
                SocketStore.emitByUserId(riderID, 'socketError', { success: false, message: 'Something went wrong', data: null });
              })
            } else {
              SocketStore.emitByUserId(riderID, 'socketError', { success: false, message: 'Invalid trip type', data: null });
            }
          }


        }).catch(err=>{
          console.log("errror>>>>>>>>", err);
          SocketStore.emitByUserId(riderID, 'socketError', { success: false, message: "Internal server error", data: null });
        })
      }
    }).catch(err=>{
      console.log("errror>>>>>>>>111111111", err);
      SocketStore.emitByUserId(riderID, 'socketError', { success: false, message: "Internal server error", data: null });
    })
  });

  // check rider authorization by reservation code

  function validateReservationCodeAsync(userData) {

    return new Promise((resolve, reject)=>{
      const returnObj = {success: false, message: "", data:null};
      if (userData.reservationCode.length!=4) {
        returnObj.message = 'Please enter last 4 digits of reservation code.';
        return resolve(returnObj);
      }

      UserSchema.findOneAsync({_id:userData.adminId,isDeleted:false})
        // eslint-disable-next-line consistent-return
      .then((user) => {
          if (!user) {
            returnObj.message = 'service provider not found';
            return resolve(returnObj);
          } else if(!user.reservationCode){
            returnObj.success = false;
            returnObj.message = 'No Reservation code found, Please contact your service provider';
            return resolve(returnObj);
          } else {
            var lastFourDigits= user.reservationCode.substr(user.reservationCode.length - 4);
            if (userData.reservationCode != lastFourDigits) {
                returnObj.success = false;
                returnObj.message = 'Invalid reservation code';
                return resolve(returnObj);
            }
            returnObj.success = true;
            returnObj.message = 'Invalid reservation code';
            return resolve(returnObj);
          }
      }).catch((err123) => {
        const err = new APIError(`error in getting Reservation code ${err123}`, httpStatus.INTERNAL_SERVER_ERROR);
        return reject(err);
      });
    })

  }

  function sendRequestToDriver(payload, driver){

    return new Promise((resolve, reject)=>{
      createTripRequestAsync(payload, driver)
      .then((tripRequestObj) => {
        if(tripRequestObj) {
          // eslint-disable-next-line
          let resToDriver = {...tripRequestObj._doc};
          resToDriver.riderDetails = payload.request.riderDetails;
          SocketStore.emitByUserId(driver._id, 'requestDriver', {success: true, message: "Request received", data: resToDriver});
          notifyDriverAdminTripStatus(driver._id, 'requestAdmin', {success: true, message: "Request received", data: resToDriver});
          let pushData = {
            payload: { success: true, message: 'Request Sent to the driver', data: resToDriver },
            body: `New request received from the rider: ${resToDriver.riderDetails.name}`,
            title: 'New Request received'
          }
          PushNotification.sendNotificationByUserIdAsync(driver._id, pushData);
          TripSchema
          .findOneAndUpdateAsync({'driver._id': tripRequestObj.driverId, activeStatus: true},{ $addToSet: { tripRequests: tripRequestObj } }, {new: true})
          .then((updatedTrip)=>{
            let resData = {
              tripRequest: tripRequestObj,
              driver: driver
            }
            return resolve(resData)
          })
          .catch(err=>{
            return reject(err);
          })
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
      })
      .catch(err => {
        console.log('error', err);
        return reject(err);
      });
    })
  }

  // create trip request on rider trip request
  function createTripRequestAsync(payload, driver) {
    const riderID = payload.rider._id;
    const driverID = driver._id;
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line
      const srcLocation = payload.request.sourceLoc;
      const destLocation = payload.request.destLoc;
      const startAddress = payload.request.startAddress;
      const endAddress = payload.request.endAddress;

      //save request with adminId

      let getDriverTripAdminAsync = [
        // get driver's trip details async
        new Promise((resolve, reject)=>{
          TripSchema.findOneAsync({'driver._id': driver._id, activeStatus: true})
          .then(response=>{
            if(!response) {
              return resolve(null);
            } else {
              return resolve(response);
            }
          })
          .catch(error=>{
            reject(error)
          })
        }),
      ];

      Promise.all(getDriverTripAdminAsync)
      .then(result=>{
        if(result && result.length && result[0]) {
          let driverTrip = result[0];
          let driverAdmin = driver.adminId;
          if(!driverTrip) {
            return reject(new Error("No trip found"));
          }
          // else if (!driverAdmin) {
          //   return reject(new Error("No driver admin found"));
          // }

          if(driverTrip.driver.tripType == TRIP_DYNAMIC) {
            srcLocation._id= mongoose.Types.ObjectId();
            destLocation._id= mongoose.Types.ObjectId();
          }

          let timeStampvalue = (new Date()).toISOString();
          const tripRequestObj = new TripRequest({
            riderId: riderID,
            driverId: driverID,
            tripId: driverTrip._id,
            adminId: driverAdmin,
            srcLoc: srcLocation,
            destLoc: destLocation,
            endAddress:endAddress,
            startAddress:startAddress,
            seatBooked: payload.request.seats ? payload.request.seats : 1,
            requestTime: timeStampvalue
          });
          tripRequestObj
          .saveAsync()
          .then((savedTripRequest) => {
            savedTripRequest.rider = null;
            savedTripRequest.driver = null;
            resolve(savedTripRequest);
          })
          .error((e) => {
            SocketStore.emitByUserId(riderID, 'socketError', {success: false, message: "Something went wrong", data: null});
            reject(e);
          });
        } else {
          resolve(null);
          // return reject(new Error('driver admin and trip not found'))
        }
      })
      .catch(error=>{
        return reject(error);
      })
    });
  }

  function nearByCircularDriver(riderId, request) {
    var sourceLocId = mongoose.Types.ObjectId(request.sourceLoc._id);
    var destLocId = mongoose.Types.ObjectId(request.destLoc._id);
    // var request = JSON.parse(JSON.stringify(request));
    return new Promise((resolve, reject) =>
      UserSchema.findOneAsync({ _id: riderId, userType: USER_TYPE_RIDER })
      .then((userDoc) => {
        let result = {
          foundDrivers: [],
          riderDetails: {}
        }
        if (userDoc) {
          /**
           * matches driver that contains the trip request source and destination
           * as their route waypoints
           */

          var pipelineStages = [
            {$project: {'driver': 1,"visitedTerminal":1,"seatsAvailable": 1, "visitedTerminalsCount":1, "visitedTerminalIds": 1,'activeStatus':1}},
            {
              $match: {
                "driver.tripType": request.tripType,
                "visitedTerminal.sequenceNo": {$lt: request.sourceLoc.sequenceNo},
                "driver.adminId": mongoose.Types.ObjectId(request.sourceLoc.adminId),
                "seatsAvailable": {$gte: parseInt(request.seats)},
                "activeStatus" : true
              }
            },
            {$unwind: "$driver.route.terminals"},
            {
              $group: {
                "visitedTerminalSequenceNo": {"$first": "$visitedTerminal.sequenceNo"},
                _id: "$driver._id",
                terminals: {$addToSet: "$driver.route.terminals._id"},
              }
            }, {
              $match: {
                "terminals":{
                  $all: [sourceLocId, destLocId]
                },
              }
            }, {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'driver'
              }
            }
          ];
          // driver filter
          let driverMatchOpt = {
            $match: {
              "driver.loginStatus": true,
              "driver.isAvailable" : true,
              "driver.isDeleted" : false,
            }
          }

          pipelineStages.push(driverMatchOpt);
          pipelineStages.push({$sort: {"visitedTerminalSequenceNo": -1}});
          pipelineStages.push({$limit: 1});

          return TripSchema.aggregateAsync(pipelineStages)
          .then((foundDrivers) => {
            if (foundDrivers && foundDrivers.length) {
              // Drivers who has to visit the requested source
              result.foundDrivers = foundDrivers;
              result.riderDetails = userDoc;
              return resolve(result);
            } else {
              // Check for drivers who has visited the requested source
              pipelineStages[1]["$match"] = {
                "driver.tripType": request.tripType,
                "activeStatus" : true,
                // "visitedTerminalIds":{
                //   $all: [sourceLocId]
                // },
                "driver.adminId": mongoose.Types.ObjectId(request.sourceLoc.adminId),
                "seatsAvailable": {$gte: parseInt(request.seats)}
              }
              return TripSchema.aggregateAsync(pipelineStages)
              .then((foundDrivers)=>{
                if(foundDrivers) {
                  result.foundDrivers = foundDrivers;
                  result.riderDetails = userDoc;
                  return resolve(result);
                } else {
                  let err = new APIError('no nearByDriver found', httpStatus.INTERNAL_SERVER_ERROR);
                  return reject(err);
                }
              })
              .catch(err=>{
                return reject(err);
              })
              const err = new APIError('no nearByDriver found', httpStatus.INTERNAL_SERVER_ERROR);
              return reject(err);
            }
          })
          .error((driverErr) => {
            return reject(driverErr);
          });
        } else {
          const err = new APIError('no rider found with the given id', httpStatus.INTERNAL_SERVER_ERROR);
          return resolve(result);
        }
      })
      .error((e) => {
        const err = new APIError(`error while searching user`, httpStatus.INTERNAL_SERVER_ERROR);
        return reject(err);
      })
    );
  }
}

function nearByDynamicRouteDriver(riderId, request) {
  const sourceLoc = request.sourceLoc;
  const destLoc = request.destLoc;
  return new Promise((resolve, reject) => {
    // check if the source and destination exists in admin locations
    let locationPipelineStages = [
      {$match: {
        polygons: {
          $geoIntersects: {
            $geometry:{ "type" : "Point","coordinates" : sourceLoc.loc }
          }
        }
      }}, {$match: {
        polygons: {
          $geoIntersects: {
            $geometry:{ "type" : "Point","coordinates" : destLoc.loc }
          }
        }
      }}
    ]
    adminLocation.aggregate(locationPipelineStages)
    .then((foundLocations)=>{
      console.log("foundLocations", foundLocations);
      if(foundLocations && foundLocations.length) {
        // const foundLocation = foundLocations[0];
        let foundLocationIds = foundLocations.map(location=>{
          return mongoose.Types.ObjectId(location._id);
        })
        UserSchema.findOneAsync({ _id: riderId, userType: USER_TYPE_RIDER })
        .then((userDoc) => {
          let result = {
            foundDrivers: [],
            riderDetails: {}
          }
          if (userDoc) {
            /**
             * matches driver that contains the trip request source and destination
             * as their route waypoints
             */

            var pipelineStages = [
              {$project: {"gpsLoc":1, 'driver': 1,"seatsAvailable": 1, "activeStatus":1, "gpsLoc": 1}},
              {
                $match: {
                  "activeStatus": true,
                  "driver.tripType": request.tripType,
                  "driver.adminId": mongoose.Types.ObjectId(request.adminId),
                  "seatsAvailable": {$gte: parseInt(request.seats)},
                  // "driver.locationId": mongoose.Types.ObjectId(foundLocation._id)
                  "driver.locationId": {$in: foundLocationIds}
                }
              }, {
                $lookup: {
                  from: 'users',
                  localField: 'driver._id',
                  foreignField: '_id',
                  as: 'driver'
                }
              }
            ];

            // driver filter
            let driverMatchOpt = {
              $match: {
                "driver.loginStatus": true,
                "driver.isAvailable" : true,
                "driver.isDeleted" : false,
              }
            }

            pipelineStages.push(driverMatchOpt);
            return TripSchema.aggregateAsync(pipelineStages)
            .then((foundDrivers) => {
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
                Shared.sortDynamicDriversAsync(request, foundDrivers)
                .then(sortedDrivers=>{
                  console.log("sorteddrivers", sortedDrivers);
                  result.foundDrivers = sortedDrivers;
                  result.riderDetails = userDoc;
                  return resolve(result);
                })
                .catch(err=>{
                  console.log("errors>>>>>>>>>>>>>.", err);
                  err = new APIError('no nearByDriver found', httpStatus.INTERNAL_SERVER_ERROR);
                  return reject(err);
                })
              } else {
                const err = new APIError('no nearByDriver found', httpStatus.INTERNAL_SERVER_ERROR);
                return resolve(null);
              }
            })
            .error((driverErr) => {
              return reject(driverErr);
            });
          } else {
            const err = new APIError('no rider found with the given id', httpStatus.INTERNAL_SERVER_ERROR);
            return resolve(result);
          }
        })
        .error((e) => {
          const err = new APIError(`error while searching user`, httpStatus.INTERNAL_SERVER_ERROR);
          return reject(err);
        })
      } else {
        let err = new APIError('no service at this location', httpStatus.INTERNAL_SERVER_ERROR, true);
        return resolve(null);
      }
    })

  });
}

function notifyDriverAdminTripStatus(driverId, event, payload) {
  let resPayload = {...payload};
  let query = {
    'driver._id': driverId,
    activeStatus: true
  }
  TripSchema.findOne(query, {"activeStatus":1, "visitedTerminal":1, "gpsLoc":1})
  .populate([
    {path:'driverId',select:'name email'}
  ])
  .then(result=>{
    if(result) {
      resPayload.tripData = result;
      SocketStore.emitByUserId(
        payload.data.tripId,
        event,
        resPayload
      )
    }
  })
}

function checkIfRideReqInProgress(riderId) {
  console.log("                           ");
  console.log("checkIfRideReqInProgress",riderId);
  console.log("                           ");
  let requestStatuses = [TRIP_REQUEST_INIT, TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_ENROUTE];
  let query={ riderId: mongoose.Types.ObjectId(riderId), "tripRequestStatus": {$in: requestStatuses} };
  console.log("                           ");
  console.log("TEsting By Rj query",query);
  console.log("                           ");
  return new Promise((resolve, reject)=>{
    TripRequest.find(query)
    .then(foundTripRequest=>{
      console.log("                           ");
      console.log("TEsting By Rj foundTripRequest >>>>>>>>>>>>",foundTripRequest);
      console.log("                           ");

      if(foundTripRequest && (foundTripRequest.length>0)) {
        return resolve(foundTripRequest)
      } else {
        return resolve(false);
      }
    }).catch(err=>{
      return reject(new Error("Something went wrong: checking if ride already exist"));
    })
  })
}

export default requestTripHandler_v2;
