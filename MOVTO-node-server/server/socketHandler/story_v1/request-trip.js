import deferred from 'deferred';
import mongoose from 'mongoose';
import Promise from 'bluebird';
import httpStatus from 'http-status';
import APIError from '../../helpers/APIError';
import config from '../../../config/env';
import AppConfig from '../../models/appConfig';
import { fetchReturnObj } from '../../service/transform-response';
import sendEmail from '../../service/emailApi';
import * as Shared from '../../service/shared';
import SendNotification from '../../service/pushExpo';
import * as PushNotification from '../../service/pushNotification';
import { sendSms } from '../../service/smsApi';
import SocketStore from '../../service/socket-store.js'; //eslint-disable-line
import TripRequest from '../../models/tripRequest';
import UserSchema from '../../models/user';
import TripSchema from '../../models/trip';

import { USER_TYPE_RIDER, USER_TYPE_DRIVER } from '../../constants/user-types';
import { TRIP_DIRECT_STATIC, TRIP_CIRCULAR_STATIC, TRIP_DYNAMIC } from '../../constants/trip-type';
import adminLocation from '../../models/adminLocation';
import { TRIP_REQUEST_INIT, TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_ENROUTE } from '../../constants/trip-request-statuses';
const watchIdObj = {};
const promObj = {};
/**
 * Get appConfig
 * @returns {appConfig}
 */
function getConfig() {
  return new Promise((resolve, reject) => {
    AppConfig.findOneAsync({ key: 'sendConfig' })
      .then((foundDetails) => {
        resolve(foundDetails.value);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function requestTripHandler(socket) {

  socket.on('requestTrip_v1', (payload) => {
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

    const riderID = payload.rider._id;
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
		      console.log("Locating new error--------->",e)
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
      SocketStore.emitByUserId(riderID, 'socketError', { success: false, message: err.message, data: null });
    })

  });


  socket.on('requestDriverResponse', (tripRequest) => {
    // eslint-disable-next-line
    clearInterval(watchIdObj[tripRequest._id]);
    // eslint-disable-next-line
    const driverId = tripRequest.driver._id;
    promObj[driverId].resolve(tripRequest); // or resolve promise
  });
  socket.on('tripRequestUpdate', (payload) => {
    // eslint-disable-next-line
    TripRequest.findOneAndUpdateAsync({ _id: payload._id }, { $set: payload }, { new: true })
      .then((updatedTripRequestObject) => {
        if (updatedTripRequestObject.tripRequestStatus === 'cancelled') {
          UserSchema.updateAsync({ $or: [{ _id: payload.riderId }, { _id: payload.driverId }] }, { $set: { currTripId: null, currTripState: null } }, { new: true, multi: true })
            .then(() => {
              // updated user records
            })
            .error((e) => {
              SocketStore.emitByUserId(payload.riderId, 'socketError', { message: 'error while updating curTripId  to null in requestDriverResponse', data: e });
              SocketStore.emitByUserId(payload.driverId, 'socketError', { message: 'error while updating curTripId to null in requestDriverResponse', data: e });
            });
        }
        fetchReturnObj(updatedTripRequestObject).then((updatedTripRequestObj) => {
          if (socket.userId.toString() === updatedTripRequestObj.riderId.toString()) {
            SendNotification(updatedTripRequestObj.riderId, updatedTripRequestObj.tripRequestStatus);
            SendNotification(updatedTripRequestObj.driver, updatedTripRequestObj.tripRequestStatus);
            SocketStore.emitByUserId(updatedTripRequestObj.driverId, 'tripRequestUpdated', updatedTripRequestObj);
          } else if (socket.userId.toString() === updatedTripRequestObj.driverId.toString()) {
            SocketStore.emitByUserId(updatedTripRequestObj.riderId, 'tripRequestUpdated', updatedTripRequestObj);
            SendNotification(updatedTripRequestObj.riderId, updatedTripRequestObj.tripRequestStatus);
            SendNotification(updatedTripRequestObj.driver, updatedTripRequestObj.tripRequestStatus);
          }
        });
      })
      .error((e) => {
        // error occured while updating tripRequestObj
        SocketStore.emitByUserId(payload.riderId, 'socketError', e);
        SocketStore.emitByUserId(payload.driverId, 'socketError', e);
      });
  });
  // Round robin algorithm for driver dispatch:
  function roundRobinAsync(nearByDriversDoc, quantum, rider) {
    // returns promise which resolves in success and faliure boolean values
    // suppose 5 drivers
    // each driver will be sent request.
    // expect a response in quantum time.
    // if response is accept - assign that driver. break process and return
    // if response is reject - remove driver from the list and select next driver to request from queue
    // if no response - next driver please.
    // - no arrival time burst time concept.
    // - queue structure will be based on database query fetch.
    return new Promise((resolve, reject) => {
      const count = 0;
      const remain = nearByDriversDoc.length;
      const prom = deferred();
      dispatchHandlerAsync(nearByDriversDoc, quantum, remain, count, rider, prom)
        .then(result => resolve(result))
        .catch(error => reject(error));
    });
  }
  function dispatchHandlerAsync(nearByDrivers, quantum, remain, count, rider, prom) {
    if (remain <= 0) {
      prom.resolve(false);
      return prom.promise;
    }
    // eslint-disable-next-line
    promObj[nearByDrivers[count]._id] = deferred();
    // eslint-disable-next-line
    sendRequestAsync(nearByDrivers[count], quantum, rider, promObj[nearByDrivers[count]._id]).then(
      (tripRequest) => {
        const response = tripRequest.tripRequestStatus;
        if (response === 'enRoute') {
          dispatchDriverAsync(tripRequest)
            .then(() => prom.resolve(true))
            .catch(error => prom.reject(error));
          getConfig().then((data) => {
            if (data.email.rideAcceptRider) {
              sendEmail(tripRequest.riderId, tripRequest, 'rideAccept');
            }
            if (data.sms.rideAcceptRider) {
              sendSms(tripRequest.riderId, 'Your ride request is accepted .');
            }
          });
        } else if (response === 'rejected') {
          resetTripRequestAsync(nearByDrivers[count]) // driver rejected so update the database to clear tripRequest made
            .then(() => {
              nearByDrivers = removeDriverFromList(nearByDrivers, count);
              // nearByDrivers.forEach((driver) => console.log(driver.fname));
              count = 0;
              remain--;
              setTimeout(() => {
                dispatchHandlerAsync(nearByDrivers, quantum, remain, count, rider, prom);
              }, 1000);
            });
        }
      },
      () => {
        console.log('noResponseFromDriver');
        nearByDrivers = removeDriverFromList(nearByDrivers, count);
        count = 0;
        remain--;
        setTimeout(() => {
          dispatchHandlerAsync(nearByDrivers, quantum, remain, count, rider, prom);
        }, 1000);
      }
    );
    return prom.promise;
  }
  function sendRequestAsync(driver, timeout, rider, def) {
    // return tripRequest object which contain response
    createTripRequestObjAsync(rider, driver)
      .then((tripRequestObj) => {
        // eslint-disable-next-line

        SocketStore.emitByUserId(driver._id, 'requestDriver', tripRequestObj);
        notifyDriverAdminTripStatus(driver._id, 'requestAdmin', tripRequestObj);
        watchIdObj[tripRequestObj._id] = setInterval(() => {
          timeout--;
          if (timeout <= 0) {
            // eslint-disable-next-line
            clearInterval(watchIdObj[tripRequestObj._id]);
            resetTripRequestAsync(driver) // driver did not respond so update the database to clear tripRequest made.
              .then(() => {
                // eslint-disable-next-line
                SocketStore.emitByUserId(driver._id, 'responseTimedOut'); // clear tripRequest object on driver side
                // flag = true;
                def.reject('noResponseFromDriver');
              });
          }
        }, 1000);
      })
      .catch(err => console.log('error', err));
    return def.promise;
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

  function dispatchDriverAsync(tripRequestObj) {
    return new Promise((resolve) => {
      // eslint-disable-next-line
      TripRequest.findOneAndUpdateAsync({ _id: tripRequestObj._id }, { $set: tripRequestObj }, { new: true })
        .then(updatedTripRequestObject =>
          resolve(fetchReturnObj(updatedTripRequestObject).then((updatedTripRequestObj) => {
            if (updatedTripRequestObj.tripRequestStatus === 'noNearByDriver') {
              updatedTripRequestObj.rider = null;
              updatedTripRequestObj.driver = null;
              updatedTripRequestObj.driverId = null;
            }
            SocketStore.emitByUserId(tripRequestObj.riderId, 'tripRequestUpdated', updatedTripRequestObj);
          })))
        .error((e) => {
          SocketStore.emitByUserId(tripRequestObj.driverId, 'socketError', e);
        });
    });
  }
  function removeDriverFromList(drivers, index) {
    // test passed
    return drivers.slice(0, index).concat(drivers.slice(index + 1));
  }
  function createTripRequestObjAsync(payload, driver) {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line
      const riderID = payload.rider._id;
      const srcLocation = payload.tripRequest.srcLoc;
      const destLocation = payload.tripRequest.destLoc;
      const pickUpAdrs = payload.tripRequest.pickUpAddress;
      const destAdrs = payload.tripRequest.destAddress;
      const latDelta = payload.tripRequest.latitudeDelta;
      const lonDelta = payload.tripRequest.longitudeDelta;
      const { paymentMode } = payload.tripRequest;
      // eslint-disable-next-line
      const driverID = driver._id;
      TripSchema.findOneAsync({'driver._id': driver._id, activeStatus: true})
      .then(response=>{
        const tripRequestObj = new TripRequest({
          riderId: riderID,
          driverId: driverID,
          tripId: response._id,
          srcLoc: srcLocation,
          destLoc: destLocation,
          pickUpAddress: pickUpAdrs,
          destAddress: destAdrs,
          latitudeDelta: latDelta,
          longitudeDelta: lonDelta,
          paymentMode,
        });
        tripRequestObj
        .saveAsync()
        .then((savedTripRequest) => {
          savedTripRequest.rider = null;
          savedTripRequest.driver = null;
          UserSchema.updateAsync(
            { $or: [{ _id: savedTripRequest.riderId }, { _id: savedTripRequest.driverId }] },
            // eslint-disable-next-line
            { $set: { currTripId: savedTripRequest._id, currTripState: 'tripRequest' } },
            { new: true, multi: true }
          )
            .then(() => {
              fetchReturnObj(savedTripRequest).then(returnObj => resolve(returnObj));
            })
            .error((e) => {
              SocketStore.emitByUserId(riderID, 'socketError', { message: 'error while updating curTripId in requestTrip', data: e });
              SocketStore.emitByUserId(driverID, 'socketError', { message: 'error while updating curTripId in requestTrip', data: e });
              reject(e);
            });
        })
        .error((e) => {
          SocketStore.emitByUserId(riderID, 'socketError', e);
          reject(e);
        });
      })
      .catch(error=>{
        SocketStore.emitByUserId(riderID, 'socketError', error);
        reject(error)
      })

    });
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
  function resetTripRequestAsync(driverObj) {
    // query to reset tripRequest object for a particular driver in database.
    return new Promise((resolve) => {
      // eslint-disable-next-line
      UserSchema.updateAsync(
        // eslint-disable-next-line
        { $or: [{ _id: driverObj._id }] },
        { $set: { currTripId: null, currTripState: null } },
        { new: true, multi: true }
      )
        .then(() => resolve())
        .error((e) => {
          SocketStore.emitByUserId(driverObj.riderId, 'socketError', { message: 'error while updating curTripId  to null in requestDriverResponse', data: e });
          SocketStore.emitByUserId(driverObj.driverId, 'socketError', { message: 'error while updating curTripId to null in requestDriverResponse', data: e });
        });
    });
  }
  function checkSocketConnection(id) {
    const res = SocketStore.getByUserId(id);
    if (res.success && res.data.length) {
      return true;
    } else {
      return false;
    }
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

export default requestTripHandler;
