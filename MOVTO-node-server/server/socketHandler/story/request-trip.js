import deferred from 'deferred';
import mongoose from 'mongoose';
import Promise from 'bluebird';
import httpStatus from 'http-status';
import APIError from '../../helpers/APIError';
import AppConfig from '../../models/appConfig';
import config from '../../../config/env';
import { fetchReturnObj } from '../../service/transform-response';
import sendEmail from '../../service/emailApi';
import SendNotification from '../../service/pushExpo';
import * as PushNotification from '../../service/pushNotification';
import { sendSms } from '../../service/smsApi';
import SocketStore from '../../service/socket-store.js'; //eslint-disable-line
import TripRequest from '../../models/tripRequest';
import UserSchema from '../../models/user';
import TripSchema from '../../models/trip';

import DriverRouteTerminalSchema from '../../models/driverRouteTerminal';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER } from '../../constants/user-types';
import moment from 'moment';
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
  socket.on('requestTrip', (payload) => {
    console.log("requestTrip payload", payload);
    /**
     * 1. lookup nearby drivers. preffered way is to lookup for the driver who has yet to reach the pickup point on it's way
     * 2. create new requestTrip on terminal selected as source by the rider
     * 2. notify the driver with event "requestDriver" and payload with created requestTrip obj
     * 3. wait for 10 minutes for driver response
     * 4. if driver accept the request notify the user with driver details along with vehicle details
     * 5. else if driver doesn't respond in 10 minutes or reject, respond with
     */
    const riderID = payload.rider._id;
    let sourceDestIds = [payload.request.sourceLoc, payload.request.destLoc]
    Promise.all(sourceDestIds.map(function(id) {
      return DriverRouteTerminalSchema.findOneAsync({_id: id}).then(function(result) {
        return result;
      });
    })).then(function(sourceDestterminals) {
      console.log('results of terminals', JSON.stringify(sourceDestterminals));
      // results is an array of source and destination terminals
      if(sourceDestterminals && sourceDestterminals.length) {
        payload.request.sourceLoc = sourceDestterminals[0];
        payload.request.destLoc = sourceDestterminals[1];
        // eslint-disable-next-line
        const quantum = 10;
        // eslint-disable-next-line
        nearByDriver(riderID, payload.request)
        .then((result) => {
          let nearByDriversDoc = result.foundDrivers;
          // add rider details to the payload on request to attach the riderdetails to the payload sent to the driver with event
          payload.request.riderDetails = result.riderDetails;

          if(nearByDriversDoc && nearByDriversDoc.length) {
            // send notification event to the driver
            sendRequestToDriver(payload, nearByDriversDoc[0].driver[0])
            .then(res=>{
              if(res) {
                console.log('request sent to driver', res);
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
          console.log('error', e)
          SocketStore.emitByUserId(riderID, 'socketError', { success: false, message: 'Something went wrong, while looking for nearby driver', data: null });
        });
      } else {
        SocketStore.emitByUserId(riderID, 'socketError', { success: false, message: 'Something went wrong, terminals not found', data: null });
      }
    }).catch(e=>{
      console.log("promise all error", e);
      SocketStore.emitByUserId(riderID, 'socketError', { success: false, message: 'Something went wrong', data: null });
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
            console.log('updatedTripRequestObj.riderId', updatedTripRequestObj.riderId);
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
    console.log('inside sendRequestAsync', driver.fname);
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
          console.log("request sent to the driver here", tripRequestObj.driverId);
          SocketStore.emitByUserId(driver._id, 'requestDriver', {success: true, message: "Request received", data: resToDriver});
          notifyDriverAdminTripStatus(driver._id, 'requestAdmin', {success: true, message: "Request received", data: resToDriver});
          let pushData = {
            payload: { success: true, message: 'Request Sent to the driver', data: resToDriver },
            body: `New request received from the rider: ${resToDriver.riderDetails.name}`,
            title: 'New Request received'
          }
          PushNotification.sendNotificationByUserIdAsync(driver._id, pushData);
          TripSchema
          .findOneAndUpdateAsync({driverId: tripRequestObj.driverId, activeStatus: true},{ $addToSet: { tripRequests: tripRequestObj } }, {new: true})
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
    console.log("createrequstobj", driver);
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
      TripSchema.findOneAsync({driverId: driver._id, activeStatus: true})
      .then(response=>{
        console.log("saved request obj", response);
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
        console.log('SAVING HERE',tripRequestObj)
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
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line
      const srcLocation = payload.request.sourceLoc;
      const destLocation = payload.request.destLoc;
      const startAddress = payload.request.startAddress;
      const endAddress = payload.request.endAddress;
      // const pickUpAdrs = payload.tripRequest.pickUpAddress;
      // const destAdrs = payload.tripRequest.destAddress;
      // const latDelta = payload.tripRequest.latitudeDelta;
      // const lonDelta = payload.tripRequest.longitudeDelta;
      // const { paymentMode } = payload.tripRequest;
      // eslint-disable-next-line
      const driverID = driver._id;
      // let timeStampvalue = (new Date()).toISOString();
      // TripSchema.findOneAsync({driverId: driver._id, activeStatus: true})
      // .then(response=>{
      //   if(!response) {
      //     return reject(new Error("No trip found"));
      //   }
      //   const tripRequestObj = new TripRequest({
      //     riderId: riderID,
      //     driverId: driverID,
      //     tripId: response._id,
      //     srcLoc: srcLocation,
      //     destLoc: destLocation,
      //     endAddress:endAddress,
      //     startAddress:startAddress,
      //     seatBooked: payload.request.seats ? payload.request.seats : 1,
      //     requestTime: timeStampvalue
      //   });
      //   console.log('SAVING THERE',tripRequestObj)
      //   tripRequestObj
      //   .saveAsync()
      //   .then((savedTripRequest) => {
      //     savedTripRequest.rider = null;
      //     savedTripRequest.driver = null;
      //     resolve(savedTripRequest);
      //   })
      //   .error((e) => {
      //     SocketStore.emitByUserId(riderID, 'socketError', {success: false, message: "Something went wrong", data: null});
      //     reject(e);
      //   });
      // })
      // .catch(error=>{
      //   SocketStore.emitByUserId(riderID, 'socketError', error);
      //   reject(error)
      // })

      //save request with adminId

      let getDriverTripAdminAsync = [
        // get driver's trip details async
        new Promise((resolve, reject)=>{
          TripSchema.findOneAsync({driverId: driver._id, activeStatus: true})
          .then(response=>{
            console.log("driver trip found", response);
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
        console.log('admintripresult found', result);
        if(result && result.length && result[0]) {
          let driverTrip = result[0];
          let driverAdmin = payload.request.sourceLoc.adminId;
          if(!driverTrip) {
            return reject(new Error("No trip found"));
          }
          // else if (!driverAdmin) {
          //   return reject(new Error("No driver admin found"));
          // }
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
          console.log('SAVING THERE',tripRequestObj)
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

  function nearByDriver(riderId, request) {
    console.log('request is', request, typeof request.sourceLoc, typeof request.destLoc);
    var sourceLoc = request.sourceLoc.loc;
    var destLoc = request.destLoc.loc;
    console.log("driver nearby src dest", request)
    // var request = JSON.parse(JSON.stringify(request));
    return new Promise((resolve, reject) =>
      UserSchema.findOneAsync({ _id: riderId, userType: USER_TYPE_RIDER })
      .then((userDoc) => {
        let result = {
          foundDrivers: [],
          riderDetails: {}
        }
        if (userDoc) {
          console.log('rider found', userDoc);
          /**
           * matches driver that contains the trip request source and destination
           * as their route waypoints
           */
          return DriverRouteTerminalSchema.aggregateAsync([
            {
              $match: {
                "adminId": mongoose.Types.ObjectId(request.sourceLoc.adminId || request.destLoc.adminId)
              }
            },
            {
              $group: {
                _id: "$driverId",
                terminals: {$addToSet: "$loc"},
              }
            }, {
              $match: {
                "terminals":{
                  $all: [sourceLoc, destLoc]
                }
              }
            }, {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'driver'
              }
            },  {
              $match: {
                "driver.loginStatus": true,
                "driver.isAvailable" : true
              }
            }
          ])
          .then((foundDrivers) => {
            if (foundDrivers) {
              console.log('drivers found on request ride', foundDrivers);
              result.foundDrivers = foundDrivers;
              result.riderDetails = userDoc;
              return resolve(result);
            } else {
              // console.log('no nearByDriver driver found');
              const err = new APIError('no nearByDriver found', httpStatus.INTERNAL_SERVER_ERROR);
              return reject(err);
            }
          })
          .error((driverErr) => {
            // console.log('error while searching near by driver ');
            return reject(driverErr);
          });
        } else {
          // console.log('no rider found with the given rider id');
          const err = new APIError('no rider found with the given id', httpStatus.INTERNAL_SERVER_ERROR);
          // return reject(err);
          return resolve(result);
        }
      })
      .error((e) => {
        // console.log('error while searching rider ');
        const err = new APIError(`error while searching user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        return reject(err);
      })
    );
  }
}

function notifyDriverAdminTripStatus(driverId, event, payload) {
  let resPayload = {...payload};
  let query = {
    driverId: driverId,
    activeStatus: true
  }
  TripSchema.findOne(query, {"activeStatus":1, "visitedTerminal":1, "gpsLoc":1})
  .populate([
    {path:'driverId',select:'name email'}
  ])
  .then(result=>{
    console.log('updated trip status, found admin', result);
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

export default requestTripHandler;
