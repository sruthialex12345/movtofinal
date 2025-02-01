import httpStatus from 'http-status';
import mongoose, { mongo } from 'mongoose';

var ObjectId = require('mongoose').Types.ObjectId;
import APIError from '../../helpers/APIError';

import User from '../../models/user';
import AdminLocationSchema from '../../models/adminLocation';
import config from '../../../config/env';
import tripRequestSchema from '../../models/tripRequest';
import * as TRIP_REQUEST_STATUS from '../../constants/trip-request-statuses';
import * as terminalType from '../../constants/terminal-type';
import * as SharedService from '../../service/shared';
import { TRIP_DYNAMIC, TRIP_DIRECT_STATIC, TRIP_CIRCULAR_STATIC } from '../../constants/trip-type';

import { USER_TYPE_RIDER, USER_TYPE_DRIVER, USER_TYPE_ADMIN,USER_TYPE_ANONYMOUS } from '../../constants/user-types';
import AdminVehicleSchema from '../../models/adminVehicle';

import tripSchema from '../../models/trip';
import SocketStore from '../../service/socket-store';
import * as PushNotification from '../../service/pushNotification';
import { json } from 'express';
var randomstring = require("randomstring");
const async = require('async');
const debug = require('debug')('MGD-API: admin-user');

const requestUpdateEventToRider = {
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED]: "requestAcceptedRider",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED]: "requestRejectedRider",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED]: "requestCancelledRider",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_COMPLETED]: "requestCompletedRider",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE]: "requestEnrouted"
}

const requestUpdateEventToDriver = {
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED]: "requestAcceptedDriver",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED]: "requestRejectedDriver",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED]: "requestCancelledDriver",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED]: "requestTransferredDriver"
}

const requestUpdateMessageToRider = {
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED]: "Request Accepted",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED]: "Request Rejected",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED]: "Request Cancelled",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_COMPLETED]: "Ride Completed",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE]: "Ride Onboard",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED]: "Request transferred"
}

const requestUpdateEventToAdmin = {
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED]: "requestAcceptedAdmin",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED]: "requestRejectedAdmin",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED]: "requestCancelledAdmin",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED]: "requestTransferredAdmin"
}

export const updateShuttleStatus = (req, res, next) => {

  /**
   * 1. find driver
   * 2. check type of trip the driver is assigned
   * 3. find the vehicle
   * 4. check if the there is any active trip with driver or vehicle
   * 5. create trip with driver>route and vehicle
   */

  const returnObj = {
    success: false,
    message: '',
    data: {},
  };
  const { activeStatus, shuttleId, id } = req.query;
  const driverId = req.user._id;

  let promises = [
    User.findOneAsync({ _id: driverId}, {password:0}),
    AdminVehicleSchema.findOneAsync({_id: shuttleId})
  ];

  Promise.all(promises).then(result => {
    if (result && result.length) {
      let driver = result[0];
      let vehicle = result[1];
      if (!driver) {
        returnObj.message = "Driver not found";
        return res.send(returnObj);
      } else if (!vehicle) {
        returnObj.message = "Vehicle not found";
        return res.send(returnObj);
      } else {
        /**
         * create trip with driver>route and vehicle
         * fork functionality based on driver's assigned trip type
         */
        // if((driver.tripType != TRIP_DYNAMIC) && driver.route) {

          if(driver.route) {
          if((req.user.userType == USER_TYPE_ADMIN) && (activeStatus == 'true')) {
            var err = new APIError(`You are not authorized to activate trip`, httpStatus.UNAUTHORIZED, true);
            return next(err);
          }

          if (activeStatus == 'true') {

            if(shuttleId){
              AdminVehicleSchema.findOne({ '_id': shuttleId, activeStatus: false,isDeleted:false,isAvailable:true})
              .then(vehicleDetails => {
                if(vehicleDetails){
                  const tripUpdateData = {
                    shuttleId: vehicle._id,
                    driver: driver,
                    gpsLoc: driver.gpsLoc,
                    activeStatus: true,
                    seatsAvailable: vehicle.seats
                  };
                  tripSchema.findOne({ 'driver._id': driver._id, activeStatus: true })
                  .populate('shuttleId')
                  .exec()
                  .then(result => {
                    if (result) {
                      returnObj.success=  false;
                      returnObj.message = 'Driver already activated another shuttle';
                      returnObj.data = { response: result, driverRoute: [] };
                      if (mongoose.Types.ObjectId(shuttleId).equals(result.shuttleId._id)) {
                        returnObj.success = true;
                        returnObj.message = 'Shuttle is already activated';
                        returnObj.data = { response: result, driverRoute: result.driver && result.driver.route && result.driver.route.terminals || [] };
                        return res.send(returnObj);
                      } else {
                         notifyDriverAdminTripStatus(driverId, result._id);
                         return res.send(returnObj);
                      }
                    } else {
                      let newTrip = new tripSchema(tripUpdateData);
                      newTrip
                      .save()
                      .then((response) => {
                        updateDriverVehicleStatusAsync(response, shuttleId, true)
                        .then(results => {
                          returnObj.success = true;
                          returnObj.message = 'Trip activated successfully';
                          returnObj.data = { response: response, driverRoute: response.driver && response.driver.route && response.driver.route.terminals || [] };
                          res.send(returnObj);
                          return notifyDriverAdminTripStatus(driverId, response._id)
                        })
                        .catch(error => {
                          next(error)
                        })

                      })
                      .catch(e => next(e));

                    }
                  })
                  .catch(e => next(e));
                }else{
                  returnObj.success = false;
                  returnObj.message = 'Shuttle is already activated';
                  returnObj.data = { response: "", driverRoute: [] };
                  return res.send(returnObj);
                }
              })
              .catch(e => next(e));
              }
          } else if (activeStatus == 'false') {
            tripSchema.findOneAsync({_id:id}).then(foundTrip=>{
              if(!foundTrip) {
                returnObj.message = "Trip not found";
                return res.send(returnObj);
              }
              let trip = foundTrip;
              let tripRequestStatuses = [TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT,TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED];
              let pipelineStages = [
                {
                  $match: {
                    tripId: mongoose.Types.ObjectId(id),
                    tripRequestStatus: {$in: tripRequestStatuses}
                  }
                }, {
                  $group: {
                    _id: "$tripId",
                    tripId : { $first: '$tripId' },
                    "seats": {$sum: "$seatBooked"},
                    "requests": {$addToSet: "$$ROOT"},
                    "riderIds": {$addToSet: "$riderId"}
                  }
                }
              ]

              tripRequestSchema.aggregateAsync(pipelineStages)
              .then(acceptedRequests=>{
                if(acceptedRequests && acceptedRequests.length) {
                  nearByShuttleAsync(id, {seats: acceptedRequests[0].seats})
                  .then(response=>{
                    if(!response.success) {

                      /**
                       * no other driver found
                       * 1. reject all pending requests
                       * 2. notify all riders with admin phone no to contact
                       * 3. Notify admin with trip deactivation as before to remove from list of active shuttles on map
                       */

                      let allRequestsToUpdate = acceptedRequests[0].requests;

                      let updateRequestsAsync = allRequestsToUpdate.map((req, index)=>{
                        return rejectTripRequestNotifyRiderAsync(foundTrip, req)
                      })

                      Promise.all(updateRequestsAsync).then(updatedReqs=>{
                        if(updatedReqs && updatedReqs.length) {
                          console.log("all requests rejected and riders notified");
                          tripSchema.findOneAndUpdateAsync(
                            { _id: id, activeStatus: true },
                            { $set: {
                              activeStatus: false, tripEndTime: (new Date()).toISOString(),
                              visitedTerminalIds: [], visitedTerminalsCount:0
                            } },
                            { new: true }
                          )
                          .then(updatedTrip=>{
                            updateDriverVehicleStatusAsync(updatedTrip, updatedTrip.shuttleId, false)
                            .then(results => {
                              returnObj.success = true;
                              returnObj.message = "Shuttle deactivated and pending requests were rejected";
                              returnObj.data = updatedTrip;
                              notifyDriverAdminTripStatus(updatedTrip.driver._id, updatedTrip._id);
                              return res.send(returnObj);
                            })
                            .catch(error => {
                              next(e);
                            })
                          })
                          .catch(error=>{
                            console.log("Error while transfering request1", error)
                            returnObj.success = false;
                            returnObj.message = "Error while transfering request";
                            return res.send(returnObj);
                          })
                        } else {
                          console.log("something went wrong rejecting reqs >>>>>>>>", updatedReqs);
                          next(new Error("something went wrong"));
                        }
                      }).catch(err=>{
                        console.log("something went wrong rejecting reqs notifying riders", err);
                        next(err);
                      })

                    } else {
                      // notify the driver on other trip, to request to transfer of all pending requests
                      let transferToShuttle = response && response.data && response.data[0];
                      if(transferToShuttle) {
                        if(trip.driver.tripType == TRIP_DYNAMIC) {
                          /**
                           * get requests with status as request
                           * get requests with status as accepted and enrouted
                           * transfer requests and update route for accepted and enrouted
                           * update trip active status to false
                           */

                          transferRequestsDynamicAsync(trip._id, transferToShuttle._id).then(result=>{
                            tripSchema.findOneAndUpdateAsync(
                              { _id: id, activeStatus: true },
                              { $set: {
                                activeStatus: false, tripEndTime: (new Date()).toISOString(), transferredTo: transferToShuttle._id,
                                visitedTerminalIds: [], visitedTerminalsCount:0
                              } },
                              { new: true }
                            )
                            .then(updatedTrip=>{
                              updateDriverVehicleStatusAsync(updatedTrip, updatedTrip.shuttleId, false)
                              .then(results => {
                                returnObj.success = true;
                                returnObj.message = "Shuttle deactivated and pending requests were transferred";
                                returnObj.data = updatedTrip;
                                notifyDriverAdminTripStatus(updatedTrip.driver._id, updatedTrip._id);
                                return res.send(returnObj);
                              })
                              .catch(error => {
                                next(e);
                              })
                            })
                            .catch(error=>{
                              console.log("Error while transfering request1", error)
                              returnObj.success = false;
                              returnObj.message = "Error while transfering request";
                              return res.send(returnObj);
                            })
                          }).catch(err=>{
                            console.log("Error while transfering request2", err);
                            returnObj.success = false;
                            returnObj.message = "Error while transfering requests";
                            return res.send(returnObj);
                          })

                        } else {
                          // send request to the other trip driver
                          let eventPayload = {success: true, message: "New transfer request", data: {tripId: id}};
                          SocketStore.emitByUserId(transferToShuttle.driver._id, 'transferRequest', eventPayload);

                          transferRequestsAsync(id, transferToShuttle._id)
                          .then(result=>{
                            tripSchema.findOneAndUpdateAsync(
                              { _id: id, activeStatus: true },
                              { $set: {
                                activeStatus: false, tripEndTime: (new Date()).toISOString(), transferredTo: transferToShuttle._id,
                                visitedTerminalIds: [], visitedTerminalsCount:0
                              } },
                              { new: true }
                            )
                            .then(updatedTrip=>{
                              updateDriverVehicleStatusAsync(trip, trip.shuttleId, false)
                              .then(results => {
                                returnObj.success = true;
                                returnObj.message = "Shuttle deactivated and pending requests were transferred";
                                returnObj.data = updatedTrip;
                                notifyDriverAdminTripStatus(updatedTrip.driver._id, updatedTrip._id);
                                return res.send(returnObj);
                              })
                              .catch(error => {
                                next(error);
                              })
                            })
                            .catch(error=>{
                              returnObj.success = false;
                              returnObj.message = "Error while transfering request";
                              return res.send(returnObj);
                            })
                          })
                          .catch(err=>{
                            returnObj.success = false;
                            returnObj.message = "Error while transfering requests";
                            return res.send(returnObj);
                          })
                        }
                      } else {
                        if(acceptedRequests && acceptedRequests.length) {
                          async.eachOf(acceptedRequests,
                            function(request, key, cb){
                              rejectTripRequestNotifyRiderAsync(trip, request)
                              .then(result=>{
                                if(result.success) {
                                  return cb();
                                }
                                cb(new Error(result.message));
                              }).catch(err=>{
                                cb(err);
                              })
                            },
                            function(e){
                              if(e) {
                                return reject(e);
                              } else {
                                returnObj.success = true;
                                returnObj.message = "Shuttle deactivated";
                                returnObj.data = trip;
                              }
                            }
                          )
                        } else {
                          returnObj.success = false;
                          returnObj.message = "No pending requests found";
                          return res.send(returnObj);
                        }
                      }
                    }
                  })
                  .catch(error=>{
                    return next(error);
                  })
                }else{
                  tripSchema.findOneAndUpdateAsync(
                    { _id: id, activeStatus: true },
                    { $set: {
                      activeStatus: false, tripEndTime: (new Date()).toISOString(),
                      visitedTerminalIds: [], visitedTerminalsCount:0
                    } },
                    { new: true }
                  )
                  .then(updatedTrip=>{
                    if(updatedTrip) {
                      updateDriverVehicleStatusAsync(trip, trip.shuttleId, false)
                      .then(results => {
                        returnObj.success = true;
                        returnObj.message = "Shuttle deactivated";
                        returnObj.data = trip;
                        notifyDriverAdminTripStatus(updatedTrip.driver._id, updatedTrip._id);
                        return res.send(returnObj);
                      })
                      .catch(error => {
                        console.log("error is >>>>>>>>>>>>>>", error);
                        next(error);
                      })
                    }else{
                      returnObj.success = false;
                      returnObj.message = "Trip not found, Trip already deactivated.";
                      return res.send(returnObj);
                    }
                  })
                  .catch(error=>{
                    returnObj.success = false;
                    returnObj.message = "Error while transfering request";
                    return res.send(returnObj);
                  })

                }
              }).catch(err=>{
                console.log('error searching accepted requests', err);
                var error = new APIError(`Something went wrong, while searching accepted requests`, httpStatus.INTERNAL_SERVER_ERROR, true);
                return next(error);
              })
            }).catch(err=>{
              console.log('error searching accepted requests', err);
              var error = new APIError(`Something went wrong, while searching accepted requests`, httpStatus.INTERNAL_SERVER_ERROR, true);
              return next(error);
            })

          }

        }
      }
    }
  })
}


const tripUpdateMessageToAdmin = {
  true: "New Trip started",
  false: "Trip deactivated",
}

const tripUpdateEventToAdmin = {
  true: "tripCreated",
  false: "tripDeactivated",
}

function rejectTripRequestNotifyRiderAsync(tripObj, tripReq) {
  let returnObj = {
    success: false, message:'', data: null
  };
  return new Promise((resolve, reject)=>{
    let updateTripRequestData = {
      tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED,
      requestUpdatedTime: (new Date()).toISOString()
    }

    let query = {
      _id: tripReq._id
    }

    tripRequestSchema.findOneAndUpdateAsync(query, {$set: updateTripRequestData}, {new: true})
    .then(tripReqObj => {
      if(tripReqObj) {
        tripSchema
        .findOneAndUpdateAsync({_id: tripObj._id, activeStatus: true},{ $addToSet: { tripRequests: tripReqObj } }, {new: true})
        .then((updatedTrip)=>{
          if(updatedTrip) {

            /** notify rider with following details
             * 1. driver details
             * 2. shuttle details
             */
            tripSchema.aggregateAsync([
              { $match: {_id: mongoose.Types.ObjectId(tripObj._id), activeStatus: true} },
              {
                $lookup: {
                  from: "users",
                  localField: "driver._id",
                  foreignField: "_id",
                  as: "driver"
                }
              },
              {
                $lookup: {
                  from: "adminvehicles",
                  localField: "shuttleId",
                  foreignField: "_id",
                  as: "vehicle"
                }
              }, {
                $lookup: {
                  from: "users",
                  localField: "driver.adminId",
                  foreignField: "_id",
                  as: "admin"
                }
              }
            ])
            .then((updatedTrip)=>{
              if(updatedTrip && updatedTrip.length > 0) {
                let adminDetails = updatedTrip[0].admin[0];
                let resToRider = {
                  driver: updatedTrip[0].driver[0],
                  shuttle: updatedTrip[0].vehicle[0]
                }
                delete resToRider.driver.password;

                // notify the riders witout ETA
                let message = ``;
                if(tripReqObj.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED) {
                  message = `Driver cancelled your trip request, please contact shuttle operator +${adminDetails.isdCode}${adminDetails.phoneNo}`;
                }
                SocketStore.emitByUserId(
                  tripReqObj.riderId,
                  "requestRejectedRider",
                  {success:true, message: message,
                  data: resToRider }
                );

                let pushData = {
                  success:true, message: message,
                  data: resToRider
                }
                pushNotificationToRider(tripReqObj.riderId,tripReqObj.tripRequestStatus, pushData)
              }
            })
            .catch((err)=>{
              console.log("error1 notifying rider>>>>", err);
              SocketStore.emitByUserId(tripObj.driver._id, `socketError`, {success: false, message: 'Something went wrong, while notifying the rider', data: null });
            })
            returnObj.success = true;
            returnObj.message = "Request rejected";
            returnObj.data = {updatedTrip: updatedTrip, tripRequest: tripReqObj}
            resolve(returnObj);
          } else {
            return reject(new Error("trip history could not be updated"));
          }
        })
        .catch(err=>{
          return reject(err);
        })
      } else {
        return reject(new Error("request could not be updated"));
      }
    }).catch(err=>{
      return reject(err);
    })

  })

}

function pushNotificationToRider(riderId, status, data) {
  let pushData = {
    body: `Ride Updated Successfully`,
    title: 'Ride Updated',
    payload: data.payload
  }
  if(status == TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
    pushData.body = "Your Request has been accepted"
  } else if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED) {
    pushData.body = "Your Request has been rejected"
  } else if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED) {
    pushData.body = "Request has been cancelled successfully"
  }  else if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_COMPLETED) {
    pushData.body = "Your ride has been completed."
  } else if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE) {
    pushData.body = "Your ride has been en routed"
  } else {
    return false
  }
  PushNotification.sendNotificationByUserIdAsync(riderId, pushData);
}

function notifyDriverAdminTripStatus(driverId, tripId){
  let query = {
    _id: driverId,
    isDeleted: false
  }
  User.findOne(query)
  .then(result => {
    if (result) {
      tripSchema.findOne(
        { _id: tripId },
        { gpsLoc: 1, activeStatus: 1, visitedTerminal: 1, 'driver.email': 1,
        'driver.activeStatus': 1,
        'driver.profileUrl': 1,
        'driver.name': 1, 'driver._id': 1 }
      )
      .populate([
        { path: 'driverId', select: 'email activeStatus profileUrl name gpsLoc' },
        { path: 'shuttleId', select: 'name activeStatus imageUrl' }
      ])
      .then(trip => {
        let payload = {
          success: false,
          message: "Trip not found",
          data: {}
        }
        if (trip) {
          let data = Object.assign({}, trip);
          if (!data._doc.gpsLoc || (!data._doc.gpsLoc.length)) {
            data._doc.gpsLoc = data._doc.driverId && data._doc.driverId.gpsLoc;
          }
          // data._doc.driverId.activeStatus=data._doc.activeStatus;

          payload.success = true;
          payload.message = tripUpdateMessageToAdmin[trip.activeStatus]
          payload.data = data._doc;
          SocketStore.emitByUserId(
            result.adminId,
            tripUpdateEventToAdmin[trip.activeStatus],
            payload
          )
        }
      })
      .catch(err => {
        console.log("error while sending notification to the admin", err);
      })
    }
  })
}

function updateDriverVehicleStatusAsync(updatedTripObj, vehicleId, status) {
  return new Promise((resolve, reject) => {
    let promises = [
      AdminVehicleSchema.updateAsync({ _id: vehicleId, isDeleted: false }, { $set: { activeStatus: status } }, { new: true }),
      User.updateAsync({ _id: updatedTripObj.driver._id, isDeleted: false }, { $set: { activeStatus: status } }, { new: true }),
      tripSchema.updateAsync({ _id: updatedTripObj._id}, { $set: { "driver.activeStatus": status } }, { new: true })
    ]

    Promise.all(promises)
      .then(results => {
        if (results && !results[0]) {
          return reject(new Error("Something went wrong while updating trip vehicle"));
        } else if (results && !results[1]) {
          return reject(new Error("Something went wrong while updating trip driver"));
        } else if (results && !results[2]) {
          return reject(new Error("Something went wrong while updating trip"));
        } else if (results && results[0] && results[1] && results[2]) {
          return resolve(results);
        } else {
          return reject(new Error("Something went wrong while updating trip driver and vehicle"));
        }
      })
      .catch(error => {
        return reject(error);
      })
  })
}

function nearByShuttleAsync(currentShuttleId, options=null) {

  // var request = JSON.parse(JSON.stringify(request));
  return new Promise((resolve, reject) => {
    let result = {
      success: false,
      message: '',
      data: null
    };
    tripSchema.findOneAsync({_id: currentShuttleId, activeStatus: true})
    .then(currentShuttle=>{
      if(currentShuttle) {
        var pipelineStages = [
          { $project: { 'driver': 1, "seatsAvailable": 1, "activeStatus":1, "gpsLoc": 1 } },
          {
            $match: {
              "_id": {$ne: mongoose.Types.ObjectId(currentShuttle._id)},
              "activeStatus": true,
              "driver.tripType": currentShuttle.driver.tripType,
              "driver.route._id": mongoose.Types.ObjectId(currentShuttle.driver.route._id),
              "driver.adminId": mongoose.Types.ObjectId(currentShuttle.driver.adminId),
              "seatsAvailable": { $gte: parseInt(options.seats) }
            }
          }
        ];

        if(currentShuttle.driver.tripType == TRIP_DYNAMIC) {
          delete pipelineStages[1]["$match"]["driver.route._id"];
          pipelineStages[1]["$match"]["gpsLoc"] = {
            $geoWithin: { $centerSphere: [ currentShuttle.gpsLoc, config.dynamicRouteOptions.nearOtherShuttleRadius ] }
          }
        }

        tripSchema.aggregateAsync(pipelineStages)
        .then((foundShuttles) => {

          if (foundShuttles && foundShuttles.length) {
            result.success = true;
            result.message = 'shuttles found';
            result.data = foundShuttles;
            return resolve(result);
          } else {
            result.message = "No nearby shuttles found";
            return resolve(result);
          }
        })
        .error((driverErr) => {
          // console.log('error while searching near by driver ');
          return reject(driverErr);
        });
      } else {
        result.message = 'Shuttle not found';
        return resolve(result);
      }
    })
    .catch(error=>{
      return reject(error)
    })
  });
}

function transferRequestsAsync(fromTripId, toTripId, options=null){
  let result = {
    success: false,
    message: '',
    data: null
  }
  return new Promise((resolve, reject)=>{
    if(!fromTripId && !toTripId) {
      return resolve(result.message = 'Misssing from trip id or to Trip Id');
    }

    Promise.all([tripSchema.findOneAsync({_id: fromTripId}), tripSchema.findOneAsync({_id: toTripId})])
    .then(fromToTrips=>{
      const fromTrip = fromToTrips[0];
      const toTrip = fromToTrips[1];
      if(!fromTrip || !toTrip) {
        return resolve(result.message = 'Trips not found');
      }

      /**
       * 1. get fromTrip all pendingRequests with status (request || accepted)
       * 2. map all trip requests with new driverId, tripId, requestUpdatedTime
       * 3. create all mapped new trip requests
       * 4. update all pending trip requests status as transferred with previous tripId and driverId
       */
      let requestStatus = [TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT,TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED];
      tripRequestSchema.find({tripId: fromTrip._id, tripRequestStatus: {$in: requestStatus}})
      .then(pendingRequests=>{
        if(pendingRequests && pendingRequests.length) {
          async.eachOf(pendingRequests,
            function(request, key, cb){
              let newTripReqObj = {
                driverId: toTrip.driver._id,
                tripId: toTrip._id,
                requestUpdatedTime: (new Date()).toISOString()
              };
              // Updating Triprequest Schema with new driver and new TripId
            tripRequestSchema.findOneAndUpdateAsync({_id: request._id},newTripReqObj,{new: true})
              .then(savedTripRequest=>{
                notifyRideTransferRider(savedTripRequest, toTrip);
                let toTripUpdates = {
                  $addToSet: { tripRequests: savedTripRequest }
                }

                if(savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
                  toTripUpdates["$inc"] = {seatBooked: request.seatBooked, seatsAvailable: -request.seatBooked}
                }

                // Updating To trip with updated Triprequest Start
                tripSchema.findOneAndUpdateAsync(
                  {_id: toTrip._id, activeStatus: true},
                  toTripUpdates,
                  {new: true}
                )
                .then(updatedTrip=>{
                  // Updating from trip with Old Triprequest Start
                  request.tripRequestStatus= TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED,
                  request.requestUpdatedTime= (new Date()).toISOString()
                  tripSchema
                  .findOneAndUpdateAsync({_id: fromTrip._id, activeStatus: true},{ $addToSet: { tripRequests: request } }, {new: true})
                  .then(updatedfromTrip=>{

                    cb();
                  })
                  .catch(error=>{
                    cb(error);
                  })
                  /******* END :- Updating from trip with Old Triprequest Start ************/
                })
                .catch(error=>{
                  cb(error);
                })
                /****** END:- Updating To trip with updated Triprequest END ************/
              })
              .catch(error=>{
                cb(error);
              })
               /******* END:- Updating To trip with updated Triprequest END ***************/
            },
            function(e){
              if(e) {
                return reject(e);
              } else {
                result.success = true;
                result.message = 'Requests transferred';
                result.data = pendingRequests;
                // notify other shuttle driver
                notifyShuttleDriverTransfer(fromTrip, toTrip);
                notifyShuttleAdminTransfer(fromTrip, toTrip);
                return resolve(result);
              }
            }
          )
        } else {
          return resolve(result.message = 'No pending request found');
        }
      })
    })
    .catch(error=>{
      return reject(error);
    })

  })
}

function transferRequestsDynamicAsync(fromTripId, toTripId,tripRequestID){
  let result = {
    success: false,
    message: '',
    data: null
  }
  return new Promise((resolve, reject)=>{
    if(!fromTripId && !toTripId) {
      return resolve(result.message = 'Misssing from trip id or to Trip Id');
    }

    Promise.all([tripSchema.findOneAsync({_id: fromTripId}), tripSchema.findOneAsync({_id: toTripId})])
    .then(fromToTrips=>{
      console.log("                                                 ");
      console.log('fromToTrips  ------  >', JSON.stringify(fromToTrips));
      console.log("                                                 ");
      console.log("                                                 ");
      const fromTrip = fromToTrips[0];
      const toTrip = fromToTrips[1];
      if(!fromTrip || !toTrip) {
        return resolve(result.message = 'Trips not found');
      }

      /**
       * 1. get fromTrip all pendingRequests with status (request || accepted)
       * 2. map all trip requests with new driverId, tripId, requestUpdatedTime
       * 3. create all mapped new trip requests
       * 4. update all pending trip requests status as transferred with previous tripId and driverId
       */

      let requestToTransfer = [TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE];
      tripRequestSchema.find({tripId: fromTrip._id, tripRequestStatus: {$in: requestToTransfer}})
      .then(pendingRequests=>{
        console.log("                                                 ");
        console.log('pendingRequests  ------  >', JSON.stringify(pendingRequests));
        console.log("                                                 ");
        console.log("                                                 ");
        if(pendingRequests && pendingRequests.length) {
          async.eachOf(pendingRequests,
            function(request, key, cb){
              let newTripReqObj = {
                driverId: toTrip.driver._id,
                tripId: toTrip._id,
                requestUpdatedTime: (new Date()).toISOString()
              };
              // Updating Triprequest Schema with new driver and new TripId
              tripRequestSchema.findOneAndUpdateAsync({_id: request._id},newTripReqObj,{new: true})
              .then(savedTripRequest=>{
                console.log("                                                 ");
                console.log('savedTripRequest  ------  >', JSON.stringify(savedTripRequest));
                console.log("                                                 ");
                console.log("                                                 ");
                notifyRideTransferRider(savedTripRequest, toTrip);
                let toTripUpdates = {
                  $addToSet: { tripRequests: savedTripRequest }
                }

                if((savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) || (savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE)) {
                  toTripUpdates["$inc"] = {seatBooked: request.seatBooked, seatsAvailable: -request.seatBooked}
                }

                // Updating To trip with updated Triprequest Start
                tripSchema.findOneAndUpdateAsync(
                  {_id: toTrip._id, activeStatus: true},
                  toTripUpdates,
                  {new: true}
                )
                .then(updatedTrip=>{
                  console.log("                                                 ");
                  console.log('updatedTrip updatedTrip  ------  >', JSON.stringify(updatedTrip));
                  console.log("                                                 ");
                  console.log("                                                 ");
                  // Updating from trip with Old Triprequest Start
                  tripSchema
                  .findOneAndUpdateAsync({_id: fromTrip._id, activeStatus: true}, { $pull: { tripRequests: { _id: tripRequestID,tripId:fromTrip._id } } }, {new: true})
                  .then(updatedfromTripRequest=>{
                    let requestPrevStatus = request.tripRequestStatus;
                    request.tripRequestStatus= TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED,
                    request.requestUpdatedTime= (new Date()).toISOString()
                    tripSchema
                    .findOneAndUpdateAsync({_id: fromTrip._id, activeStatus: true},{ $addToSet: { tripRequests: request } }, {new: true})
                    .then(updatedfromTrip=>{
                      if((savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) || (savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE)) {
                        var availableSeats=fromTrip.seatBooked+request.seatBooked;
                        var bookedSeat=fromTrip.seatsAvailable-request.seatBooked;
                        const tripQuery= {"_id": fromTrip._id,activeStatus:true};
                        tripSchema.updateSeats(tripQuery,availableSeats,bookedSeat)
                        .then((totalTripRecords) => {
                          request.tripRequestStatus = requestPrevStatus;
                          updateDriverRouter(toTrip._id, toTrip.driver._id, request)
                          .then(updatedTripRoutes=>{
                            // const fromTripRouteUpdated = updatedTripRoutes[0];
                            // const toTripRouteUpdated = updatedTripRoutes[1];
                            // console.log("fromTripRouteUpdated", JSON.stringify(fromTripRouteUpdated))
                            // console.log("toTripRouteUpdated", JSON.stringify(toTripRouteUpdated))
                            // if(!fromTripRouteUpdated || !toTripRouteUpdated) {
                            //   if(!fromTripRouteUpdated) {
                            //     return cb(new Error("trip route not updated for source trip "));
                            //   } else {
                            //     return cb(new Error("trip route not updated for destination trip  "));
                            //   }
                            // }
                            notifyDynamicUpdatedRoute(fromTrip.driver._id, savedTripRequest, fromTrip);
                            request.tripRequestStatus= TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED,
                            notifyDynamicUpdatedRoute(toTrip.driver._id, request, toTrip);
                            cb();
                          }).catch(err=>{
                            cb(err);
                          })
                        }).catch(error=>{
                          cb(error);
                        })
                      }else{
                        cb();
                      }
                    })
                    .catch(error=>{
                      cb(error);
                    })
                    /******* END :- Updating from trip with Old Triprequest Start ************/
                  })
                  .catch(error=>{
                    cb(error);
                  })


                })
                .catch(error=>{
                  cb(error);
                })
                /****** END:- Updating To trip with updated Triprequest END ************/
              })
              .catch(error=>{
                cb(error);
              })
               /******* END:- Updating To trip with updated Triprequest END ***************/
            },
            function(e){
              if(e) {
                return reject(e);
              } else {
                result.success = true;
                result.message = 'Requests transferred';
                result.data = pendingRequests;
                // notify other shuttle driver
                notifyShuttleDriverTransfer(fromTrip, toTrip);
                notifyShuttleAdminTransfer(fromTrip, toTrip);
                return resolve(result);
              }
            }
          )
        } else {
          return resolve(result.message = 'No pending request found');
        }
      })
    })
    .catch(error=>{
      return reject(error);
    })

  })
}

function updateDriverRouter(tripID,driverID,tripRequestData){
  console.log("updating adding terminal on route driver > ", driverID);
  return new Promise((resolve,reject)=>{
    tripSchema.findOneAsync({_id: tripID}).then(tripData=>{

      if(tripData && tripData.driver.route.terminals.length >0) {
        console.log("add terminals consecutive request");
        var obj=[];
        obj.push(tripRequestData.srcLoc);
        obj.push(tripRequestData.destLoc);

        // calculate duration on each terminal


        let promisesToCheckIfLocExists = obj.map((terminal, index)=>{
          return (callback=>{
            let selectedIndex = index;
            var pipelineStages =  [
              {
                $match: {_id: mongoose.Types.ObjectId(tripID)}
              }, {
                $unwind: "$driver.route.terminals"}, {
                // $match: {"driver.route.terminals.loc": { $geoWithin: { $centerSphere: [ terminal.loc, 0 ] } }}
                $match: {"driver.route.terminals.address": terminal.address }
              }
            ];
            tripSchema.aggregateAsync(pipelineStages)
            .then(results=>{
              console.log("terminals to add on consecutive requests", JSON.stringify(results));
              if(results && results.length) {
                let existingTerminal = results[0];
                let query = {_id: tripRequestData._id};
                let updateData = {$set: {}};
                if(selectedIndex === 0) {
                  // update src loc _id
                  updateData["$set"]["srcLoc._id"] = existingTerminal.driver.route.terminals._id;
                } else {
                  updateData["$set"]["destLoc._id"] = existingTerminal.driver.route.terminals._id;
                }
                tripRequestSchema.findOneAndUpdate(query, updateData, {new: true}).then(updateTripRequest=>{
                  return callback(null, results[0])
                }).catch(err=>{
                  return callback(null, results[0])
                })
              } else {
                console.log("add new terminal>>>>>>>>>>>>");
                SharedService.addReorderDynamicTerminal(terminal, tripData, null)
                .then(tripDataUpdate=>{
                  return callback(null, tripDataUpdate);
                })
                .catch(err=>{
                  console.log('error while find trip request', err);
                  SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
                  return callback(err, null);
                })
              }
            });
          })
        })
        async.series(promisesToCheckIfLocExists, (err, results)=>{
          if(err) {
            return reject(err);
          }
          if(results && results.length) {
            tripSchema.findOneAsync({_id: tripID})
            .then(tripData => {
              return resolve(tripData);
            })
            .catch(error => {
              console.log('error while find trip request', error);
              SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
              return reject(error);
            })
          }
        })
      } else if(!tripData.driver.route.terminals.length) {
        console.log("add terminals as initial request")
        // add terminals as initial request
        SharedService.addReorderDynamicTerminal(null, tripData, tripRequestData)
        .then(updatedTrip=>{
          return resolve(updatedTrip);
        })
        .catch(err=>{
          SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
          return reject(err);
        })
      } else {
        SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
        return reject(new Error("trip not found"));
      }
    }).catch(err=>{
      reject(err);
    })

  })
}

function notifyDynamicUpdatedRoute(driverId, tripReqObj, tripObj=null){

  console.log("         ");
  console.log("         ");
  console.log("    notifyDynamicUpdatedRoute,driver     ", tripObj.driver.email);
  console.log("         ");
  console.log("         ");
  User.findOneAsync({ _id: tripReqObj.riderId }, '-password')
  // eslint-disable-next-line consistent-return
  .then((user) => {
    let res={
      ride:{
        ...tripReqObj._doc,
        riderDetails:user,
      },
      driverRoute: tripObj && tripObj.driver && tripObj.driver.route && tripObj.driver.route.terminals || [],
    };
    getDynamicRouteOrderAsync(tripObj).then(terminals=>{
      res.driverRoute = terminals || [];
      if (user) {
        console.log("                                              ");
        console.log("res",JSON.stringify(res));
        console.log("                                              ");
        SocketStore.emitByUserId(
          driverId,
          requestUpdateEventToDriver[tripReqObj.tripRequestStatus],
          {
            success:true,
            message: `${requestUpdateMessageToRider[tripReqObj.tripRequestStatus]}`,
            data: res
          }
        );
        // notify the driver's admin
        notifyDriverAdminTripStatusDynamic(
          driverId,
          requestUpdateEventToAdmin[tripReqObj.tripRequestStatus],
          {
            success:true,
            message: `${requestUpdateMessageToRider[tripReqObj.tripRequestStatus]}`,
            data: res
          }
        )
        let pushData = {
          payload: {
            success:true,
            message: `${requestUpdateMessageToRider[tripReqObj.tripRequestStatus]}`,
            data: res
          }
        }
        pushNotificationToDriver(driverId, tripReqObj.tripRequestStatus, pushData)
      } else {
        // eslint-disable-next-line consistent-return
        SocketStore.emitByUserId(
          tripObj.driverId,
          requestUpdateEventToDriver[tripReqObj.tripRequestStatus],
          {success:true, message: `${requestUpdateMessageToRider[tripReqObj.tripRequestStatus]}`, data: res }
        );

        let pushData = {
          payload: {
            success:true,
            message: `${requestUpdateMessageToRider[tripReqObj.tripRequestStatus]}`,
            data: res
          }
        }
        pushNotificationToDriver(tripObj.driver._id, tripReqObj.tripRequestStatus, pushData)
      }
    }).catch(err=>{
      console.log("error2 notifying rider>>>>", err);
      SocketStore.emitByUserId(tripObj.driver._id || driverId, `socketError`, {success: false, message: 'Something went wrong, while notifying the rider', data: null });
    })
  })
  .catch(e=>{
    console.log("error3 notifying rider>>>>", e);
    SocketStore.emitByUserId(tripObj.driver._id || driverId, `socketError`, {success: false, message: 'Something went wrong, while notifying the rider', data: null });
  })

}

function getDynamicRouteOrderAsync(trip) {
  return new Promise((resolve, reject)=>{
    let pipelineStages = [{
        $match: {_id: mongoose.Types.ObjectId(trip._id)}
      }, {
        $unwind: "$driver.route.terminals"
      }, {$sort: {"driver.route.terminals.sequenceNo": 1}}, {
        $group: {"_id": "_id", "terminals": {$push: "$driver.route.terminals"}}
      }
    ]
    tripSchema.aggregateAsync(pipelineStages).then(results=>{
      if(results && results[0]) {
        let tripTerminals = results[0];
        return resolve(tripTerminals && tripTerminals.terminals || []);
      } else {
        return resolve([]);
      }
    }).catch(err=>{
      console.log("error getting route terminals ordered", err);
      return reject(err);
    })
  })
}

function pushNotificationToDriver(driverId, status, data) {
  let pushData = {
    body: 'Trip updated successfully',
    title: 'Trip updated',
    payload: data.payload
  }
  if(status == TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
    pushData.body = `Request was accepted successfully`
  } else if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED) {
    pushData.title = "Request was rejected successfully"
  } else if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED) {
    pushData.title = "Request was cancelled successfully"
  } else {
    return false
  }
  PushNotification.sendNotificationByUserIdAsync(driverId, pushData);
}

function notifyDriverAdminTripStatusDynamic(driverId, event, payload) {
  let resPayload = {...payload};
  let query = {
    "driver._id": driverId,
    activeStatus: true
  }

  tripSchema.findOne(query, {"activeStatus":1, "visitedTerminal":1, "gpsLoc":1})
  .populate([
    {path:'driver._id',select:'name email'}
  ])
  .then(result=>{
    if(result) {
      if(payload.data) {
        resPayload.data.tripData = result;
      }
      SocketStore.emitByUserId(
        result._id,
        event,
        resPayload
      )
    }
  })
}

function notifyRideTransferRider(request, othertrip){
  let eventPayload = {
    success: true,
    message: 'Request is transferred',
    data: othertrip
  }
  SocketStore.emitByUserId(request.riderId, "requestTransferredRider", eventPayload);
}

function notifyShuttleDriverTransfer(fromShuttle, toShuttle){
  let eventPayload = {
    success: true,
    message: 'Requests received from shuttle',
    data: fromShuttle.driver
  }
  SocketStore.emitByUserId(toShuttle.driver._id, "requestTransferredDriver", eventPayload);
}

function notifyShuttleAdminTransfer(fromShuttle, toShuttle){
  console.log("                                   ");
  console.log("toShuttle", JSON.stringify(toShuttle));
  console.log("                                   ");
  let eventPayload = {
    success: true,
    message: 'Request is transferred',
    data: toShuttle.driver
  }
  SocketStore.emitByUserId(toShuttle._id, "requestTransferredAdmin", eventPayload);
}

export const nearByPickupPoints = (req, res, next)=>{
  const adminId  = req.query.adminId;
  const name  = req.query.name?req.query.name:'';
  const query = {
    "driver.adminId": ObjectId(adminId),
    activeStatus:true,
    "driver.route.terminals.type": {$ne: terminalType.TRIP_END_TERMINAL},
    $or:[
      {"driver.route.terminals.name":{$regex:name,$options:'i'}},
      {"driver.route.terminals.address":{$regex:name,$options:'i'}}
    ]}
  // need to remove endTerminal from list
  tripSchema.aggregateAsync([
    { $unwind: { path: "$driver.route.terminals"}  },
    { $sort: { "driver.route.terminals.sequenceNo":-1}  },
    { $match: query},
   {
    $group : {
       _id : null,
        locations: { $addToSet: "$driver.route.terminals" }
    }
  }
]).then((doc) => {
      const returnObj = {
      success: true,
      message: 'No pickup point available',
      data: null,
      meta: null,
    };
    if (doc && doc[0] && doc[0].locations && doc[0].locations.length>0) {
      const returnObj = {
        success: true,
        message: `Pickup points are available`,
        data: {
          locations: doc[0].locations
        }
      };
      res.send(returnObj);
    } else {
      returnObj.data = {locations: []};
      res.send(returnObj);
    }
  })
  .error((e) => {
    const err = new APIError(`Error occured while searching for pickup points ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

export const nearByDropOffPoints = (req, res, next)=>{

  const source = JSON.parse(req.query.source);
  const adminId  = req.query.adminId;
  const name  = req.query.name?req.query.name:'';
  // const srcSequenceNo = req.query.sequenceNo ? parseInt(req.query.sequenceNo) : null;
  const query = {
    "driver.adminId": ObjectId(adminId),activeStatus:true,
    'driver.route.terminals.loc': {$ne: source},
    $or:[
      {"driver.route.terminals.name":{$regex:name,$options:'i'}},
      {"driver.route.terminals.address":{$regex:name,$options:'i'}}
    ]
  };

  if(req.query.sequenceNo && (req.query.sequenceNo != 'undefined')) {
    const srcSequenceNo = parseInt(req.query.sequenceNo);
    query["driver.route.terminals.sequenceNo"] = {$gt: srcSequenceNo};
  }
  // need to filter list by next terminals from selected src loc seq no
  tripSchema.aggregateAsync([
    { $unwind: { path: "$driver.route.terminals"}  },
    { $sort: { "driver.route.terminals.sequenceNo":-1}  },
    { $match: query},
   {
    $group : {
       _id : null,
        terminals: { $addToSet: "$driver.route.terminals" }
    }
  }
]).then((doc) => {
    const returnObj = {
      success: true,
      message: 'No location available',
      data: null,
      meta: null,
    };
    if (doc && doc[0] && doc[0].terminals && doc[0].terminals.length>0) {
      const returnObj = {
        success: true,
        message: `Dropoff points are available`,
        data: {
          locations: doc[0].terminals
        }
      };
      res.send(returnObj);
    } else {
      returnObj.data = {locations: []};
      res.send(returnObj);
    }
  })
  .error((e) => {
    const err = new APIError(`Error occured while searching for dropoffs ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

export function driverRoutes(req, res, next) {
  User.findOneAsync({ _id: req.query.driverId },'route adminId')
  .then((userDoc) => {
    const returnObj = {
      success: false,
      message: 'Unable to find the driver route',
      data: null,
      meta: null,
    };
    if (userDoc && userDoc.route.terminals && userDoc.route.terminals.length > 0) {
          returnObj.success = true;
          returnObj.message = 'Driver route found';
          returnObj.data = userDoc.route.terminals
          res.send(returnObj);
    } else {
      res.send(returnObj);
    }
  })
  .error((e) => {
    const err = new APIError(`Error occured while searching for the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

export function getCurrentTripOrRequest(req, res, next){
  let returnObj = {success: false, message: 'no trip or request found', data: {response: {}, driverRoute: []}}
  if(req.user.userType == USER_TYPE_DRIVER) {
    tripSchema.findOne({"driver._id": req.user._id, activeStatus: true})
    .populate('shuttleId')
    .exec()
    .then(result=>{
      if(result) {
        var resultTrip=JSON.parse(JSON.stringify(result));
        resultTrip.driverId = result.driver._id;
        resultTrip.adminId = result.driver.adminId;
        delete resultTrip.driver;
        returnObj = {
          success: false,
          message: 'Currently active trip',
          data: {response: resultTrip, driverRoute: []},
        };
        returnObj.success = true;
        if(result.driver && result.driver.route && result.driver.route.terminals.length>0){
          returnObj.data = {response:resultTrip,driverRoute:result.driver.route.terminals}
        }
        return res.send(returnObj);
      } else {
        returnObj.message = 'No active trip found';
        return res.send(returnObj);
      }
    })
    .catch(e => next(e));
  } else if (req.user.userType == USER_TYPE_RIDER) {
    let tripRequestStatuses = [TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE];

    tripRequestSchema.find({ riderId: req.user._id, tripRequestStatus: {$in: tripRequestStatuses} })
    .populate([{path:'adminId',select:'name fname lname email'}, {path:'tripId'}])
    .sort({requestTime: -1, requestUpdatedTime:-1}).limit(1)
    .then((tripRequests) => {
      let tripRequest = tripRequests && Array.isArray(tripRequests) && tripRequests[0] || null;
      if(tripRequest && tripRequest.tripId) {
        if(tripRequest.tripId.driver && tripRequest.tripId.driver.route && tripRequest.tripId.driver.route.terminals.length > 0){
            returnObj.success = true;
            returnObj.message = "Trip request with active trip found"
            returnObj.data = {response:tripRequest,driverRoute:tripRequest.tripId.driver.route.terminals}
            return res.send(returnObj);
          } else {
            returnObj.message = "Trip request found"
            returnObj.data = {response:tripRequest,driverRoute:[]};
            return res.send(returnObj);
          }
      } else if (tripRequest){
        returnObj.message = 'Trip request with no trip found'
        returnObj.data = {response:tripRequest,driverRoute:[]};
        return res.send(returnObj);
      } else {
        returnObj.message = "No trip request found"
        return res.send(returnObj);
      }
    })
    .catch((err) => {
      res.send('Error', err);
    });
  } else {
    returnObj.message = 'Not a valid user'
    res.send(returnObj);
  }
}

export const driverHistory = (req, res, next) => {
  const {id, pageNo, limit = 20 } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  debug(`skip value: ${req.query.pageNo}`);
  tripSchema.countAsync({ "driver._id": id })
    // eslint-disable-next-line
    .then(response => {
      const returnObj = {
        success: true,
        message: `no of rides are zero`, // `no of active vehicles are ${returnObj.data.length}`;
        data: {
          rides:[],
          meta: {
            totalNoOfPages: response<limit?1:Math.ceil(response / limit),
            limit,
            currPageNo: pageNo,
            currNoOfRecord: 0,
          }
        }
      };
      if (response.length < 1) {
        return res.send(returnObj);
      }
      if (skip > response.length) {
        const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
        return next(err);
      }
      tripSchema.find({"driver._id": id })
        .populate({path:'shuttleId'})
        .sort({tripStartAt:-1})
        .limit(limit)
        .skip(skip)
        .then((records) => {
          returnObj.data.rides = records;
          returnObj.message = `Rides found`;
          returnObj.data.meta.currNoOfRecord = records.length;
          returnObj.data.meta.totalNoOfRecord = response;
          // returnObj.data.meta.totalNoOfPages = returnObj.meta.totalNoOfPages;
          // returnObj.data.meta.currNoOfRecord = records.length;
          debug(`no of records are ${returnObj.data.meta.currNoOfRecord}`);
          return res.send(returnObj);
        })
        .catch((err) => {
          res.send('Error', err);
        });
    })
    .error((e) => {
      const returnObj = {
        success: true,
        message: `no of rides are zero`,
        data: {
          rides:[],
          meta: {
            totalNoOfPages: 0,
            limit,
            currPageNo: 0,
            currNoOfRecord: 0,
          },
        }
      };
      return res.send(returnObj);
      const err = new APIError(`error occured while counting the no of rides ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      debug('error inside rideHistory records');
      next(err);
    });
}

export const ridesCompletingAtTerminal = (req, res, next) => {
  const {driverId, terminalId, tripId} = req.query;
  const returnObj = {
    success: false,
    message: 'Unable to find rides completing at terminal',
    data: []
  };

  // check if trip is active with provided trip details

  tripSchema.findOneAsync({_id: tripId, "driver._id": driverId, activeStatus: true })
  .then(trip=>{
    if(trip) {
      getAllRidersCompletingTripAtTerminal(tripId, terminalId)
      .then((rides) => {
        if (rides.length > 0) {
          returnObj.success = true;
          returnObj.message = 'Rides found';
          returnObj.data = rides;
          return res.send(returnObj);
        } else {
          return res.send(returnObj);
        }
      })
      .error((err)=>{
        var err = new APIError(`Error occured while searching for the route ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        return next(err);
      })
    } else {
      returnObj.message = 'Trip not found';
      return res.send(returnObj);
    }
  })
  .catch(error=>{
    var err = new APIError(`Error occured while searching for the trip ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    return next(err);
  })

}

export function getRiderNotificationRequests(req, res, next){
  let returnObj = {success: false, message: 'no request found', data: []};
  let tripRequestStatuses = [
    TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT,
    TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE
  ]
  tripRequestSchema.aggregateAsync([
    {$match: {riderId: mongoose.Types.ObjectId(req.user._id), tripRequestStatus: {$in: tripRequestStatuses}}},
    {
      $lookup: {
        from: "trips",
        localField: "tripId",
        foreignField: "_id",
        as: "trip"
      }
    }, {$unwind: "$trip"},
    {
      $lookup: {
        from: "adminvehicles",
        localField: "trip.shuttleId",
        foreignField: "_id",
        as: "shuttle"
      }
    }, {$unwind: "$shuttle"},
    {
      $lookup: {
        from: "users",
        localField: "trip.driver._id",
        foreignField: "_id",
        as: "driver"
      }
    }, {$unwind: "$driver"},
    // not supported on staging server mongo (v3.2.21) error only _id can be excluded
    // {
    //   $addFields: {
    //     "shuttleLocation": {
    //       "latitude": { $arrayElemAt: [ "$trip.gpsLoc", 1 ] },
    //       "longitude": { $arrayElemAt: [ "$trip.gpsLoc", 0 ] }
    //     }
    //   }
    // },
    {
      $project: {
        "shuttleLocation": {
          "latitude": { $arrayElemAt: [ "$trip.gpsLoc", 1 ] },
          "longitude": { $arrayElemAt: [ "$trip.gpsLoc", 0 ] }
        },
        "driver": {$cond: { if: { $eq: [ "$tripRequestStatus", "request" ] }, then: {}, else: "$driver" }},
        "shuttle": {$cond: { if: { $eq: [ "$tripRequestStatus", "request" ] }, then: {}, else: "$shuttle" }},
        "riderId": "$riderId",
        "driverId": "$driverId",
        "tripId": "$tripId",
        "adminId": "$adminId",
        "_id": "$_id",
        "seatBooked": "$seatBooked",
        "requestUpdatedTime": "$requestUpdatedTime",
        "requestTime": "$requestTime",
        "longitudeDelta": "$longitudeDelta",
        "latitudeDelta": "$latitudeDelta",
        "destAddress": "$destAddress",
        "pickUpAddress": "$pickUpAddress",
        "tripRequestIssue": "$tripRequestIssue",
        "tripRequestStatus": "$tripRequestStatus",
        "paymentStatus": "$paymentStatus",
        "paymentMode": "$paymentMode",
        "endAddress": "$endAddress",
        "startAddress": "$startAddress",
        "destLoc": "$destLoc",
        "srcLoc": "$srcLoc"
      }
    },
    // not supported on staging server mongo error only _id can be excluded
    // {
    //   $project: {
    //     'trip': 0,
    //     "driver.password": 0,
    //     "driver.accessCode": 0,
    //   }
    // },
    // not supported on staging server mongo (v3.2.21) error only _id can be excluded
    // {
    //   $addFields: {
    //     "driver": {$cond: { if: { $eq: [ "$tripRequestStatus", "request" ] }, then: {}, else: "$driver" }},
    //     "shuttle": {$cond: { if: { $eq: [ "$tripRequestStatus", "request" ] }, then: {}, else: "$shuttle" }}
    //   }
    // },
    {$sort: {requestTime: -1, requestUpdatedTime:-1}}, {$limit: 1}
  ])
  .then(result=>{
    if(result && Array.isArray(result) && result.length) {
      returnObj.success = true;
      returnObj.message = "All requests found";
      returnObj.data = result[0];
      return res.send(returnObj);
    } else {
      returnObj.message = "No request found";
      return res.send(returnObj)
    }
  })
  .catch(error=>{
    var err = new APIError(`Something went wrong, while searching for rides`, httpStatus.INTERNAL_SERVER_ERROR, true);
    console.log("error is:", error);
    return next(err);
  })
}

/*
  Start
  Task : Add passangers at driver section (BY DRIVER ON BEHALF OF RIDER)
*/
/*
  @Function : driverCurrentFromTerminals()
  @functionality : Return driver Route Terminals
*/
export const driverCurrentFromTerminals = (req, res, next)=>{
  const driverId  = req.user._id;
  const name  = req.query.name?req.query.name:'';
  const query = {
    "driver._id": ObjectId(driverId),
    activeStatus:true,
    $or:[
      {"driver.route.terminals.name":{$regex:name,$options:'i'}},
      {"driver.route.terminals.address":{$regex:name,$options:'i'}}
    ]
  }
  tripSchema.findOneAsync(query).then((doc) => {
      const returnObj = {
      success: true,
      message: 'No pickup point available',
      data: null,
      meta: null,
    };
    if (doc && doc.driver && doc.driver.route && doc.driver.route.terminals && doc.driver.route.terminals.length>0) {
      const returnObj = {
        success: true,
        message: `Pickup points are available`,
        data: {
          locations: doc.driver.route.terminals
        }
      };
      res.send(returnObj);
    } else {
      returnObj.data = {locations: []};
      res.send(returnObj);
    }
  })
  .error((e) => {
    const err = new APIError(`Error occured while searching for pickup points ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

/*
  @Function : driverCurrentToTerminals()
  @functionality : Return driver Route Terminals excluding Source Terminal
*/
export const driverCurrentToTerminals = (req, res, next)=>{
  const source = mongoose.Types.ObjectId(req.query.source);
  const driverId  = req.user._id;
  const name  = req.query.name?req.query.name:'';
  const query = {
    "driver._id": ObjectId(driverId),
    activeStatus:true,
    'driver.route.terminals._id': {$ne: source},
    $or:[
      {"driver.route.terminals.name":{$regex:name,$options:'i'}},
      {"driver.route.terminals.address":{$regex:name,$options:'i'}}
    ]
  };

  if(req.query.sequenceNo) {
    const srcSequenceNo = parseInt(req.query.sequenceNo);
    query["driver.route.terminals.sequenceNo"] = {$gt: srcSequenceNo};
  }

  tripSchema.aggregateAsync(
    { $unwind: { path: "$driver.route.terminals"}  },
    { $sort: { "driver.route.terminals.sequenceNo":-1}  },
    { $match: query},
   {
    $group : {
       _id : null,
        terminals: { $addToSet: "$driver.route.terminals" }
    }
  }
  ).then((doc) => {
    const returnObj = {
      success: true,
      message: 'No location available',
      data: null,
      meta: null,
    };
    if (doc && doc[0] && doc[0].terminals && doc[0].terminals.length>0) {
      const returnObj = {
        success: true,
        message: `Dropoff points are available`,
        data: {
          locations: doc[0].terminals
        }
      };
      res.send(returnObj);
    } else {
      returnObj.data = {locations: []};
      res.send(returnObj);
    }
  })
  .error((e) => {
    const err = new APIError(`Error occured while searching for dropoffs ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

/*
  @Function : driverAddRider()
  @functionality :
            a) Checking seats availibility in trip schema
            b) If number of seats are available then follow Steps b, c and d else give response number of seat available
            b) Save passager details in User schema with fields AddedByDriverId, UserType and name.
            c) Create triprequest with default status "enroute".
            d) Updating seats and triprequest in trip Schema.
*/

export const driverAddRider = (req, res, next)=>{
  const driverId  = req.user._id;
  const query = {"driver._id": ObjectId(driverId),activeStatus:true};
  tripSchema.findOneAsync(query,"seatsAvailable seatBooked").then((tripSeatCount) => {
    const returnObj = {
      success: true,
      message: 'No Trip Found',
      data: null,
      meta: null,
    };
    if(req.body.noOfseats<=0){
      const returnObj = {
        success: false,
        message: `Please select valid number of seats`
      }
      return res.send(returnObj);
    }
    if (tripSeatCount) {
      // a) Checking seats availibility in trip schema
      if (tripSeatCount.seatsAvailable>=req.body.noOfseats) {
        const returnObj = {
          success: true,
        };
        saveRiderDetails(req)
        .then((result) => {
          getTerminalsDetails(req).then((responseGetTerminals) => {
            createTripRequestByDriver(req,result,responseGetTerminals,tripSeatCount).then((responseTripRequest)=>{

              tripSchema.findOneAndUpdateAsync({_id: tripSeatCount._id, activeStatus: true},{ $addToSet: { tripRequests: responseTripRequest } }, {new: true})
              .then((tripSchemaUpdate)=>{
              var availableSeats=tripSeatCount.seatsAvailable-parseInt(req.body.noOfseats);
              var bookedSeat=tripSeatCount.seatBooked+parseInt(req.body.noOfseats);
             // tripSchema.updateAsync(query, {$set: {seatsAvailable: availableSeats,seatBooked: bookedSeat}}, {new: true})
              tripSchema.updateSeats(query,availableSeats,bookedSeat)
                      .then((totalTripRecords) => {
                        const returnObj = {
                          success: true,
                          message: `Trip request has beed added successfully`,
                        }
                        return res.send(returnObj);
                      })
                    .error((e) => {
                      const err = new APIError(`Error occured while counting trip object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                      next(err);
                    });
                  })
                  .catch((err)=>{
                    console.log("tripSchema.  findOneAndUpdateAsync", e);
                  })
            }).catch(e=>{
              console.log("createTripRequest", e);
            });
          }).catch(e=>{
            console.log("getTerminalsDetails", e);
          })
        }).catch(e=>{
          console.log("saveRiderDetails", e);
          })
      }else{
        const returnObj = {
          success: false,
          message: (tripSeatCount.seatsAvailable>0)?tripSeatCount.seatsAvailable+ ` number of seats are available`:`Sorry, No seats available`
        }
          return res.send(returnObj);
      }
    } else {
      return res.send(returnObj);
    }
  })
  .error((e) => {
    const err = new APIError(`Error occured while searching for dropoffs ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

export const riderAdminList = (req, res, next) => {

  var filter = {userType: 'admin',isActive:true,isDeleted:false};
  if(req.query.name) {
    let text = req.query.name;
    // var regex = new RegExp('[\\?&]' + text + '=([^&#]*)', 'i');
    filter.name = { $regex: text, $options: 'i' }
  }

  let pipelineStages = [
    {
      $match:{
        "zone.location": {
          $geoWithin: { $centerSphere: [ req.user.gpsLoc, config.riderProvidersWithinRadius ] }
        }
      }
    }, {
      $group: {
        _id: "userIdAdmin",
        admin: {$addToSet: "$userIdAdmin"}
      }
    }, {
      $unwind: "$admin"
    }, {
      $lookup: {
        from: 'users',
        localField: 'admin',
        foreignField: '_id',
        as: 'adminDetails',
      }
    }, {
      $unwind: "$adminDetails"
    }, {$replaceRoot: { newRoot: "$adminDetails" }}, {
      $match: filter
    }, {
      $project: {
        'name':1, 'tripType':1, 'reservationCode':1,'profileUrl':1,'adminTripTypes':1,
        'settings':1
      }
    }, {$sort: { name: 1, fname: 1, lname: 1 }}
  ]

  AdminLocationSchema.aggregateAsync(pipelineStages)
  .then((adminNewArr) => {
    getShuttleListByAdmin(adminNewArr)
    .then((admins) => {
          var returnObj = {};
          if (admins.length !== 0) {
            returnObj.success = true;
            returnObj.message = 'Available service providers';
            returnObj.data = admins;
          } else {
            returnObj.success = true;
            returnObj.message = 'No service provider found';
            returnObj.data = [];
          }
      res.send(returnObj);
      })
    .catch((err) => {
      next(err);
    });

  })
  .error((e) => {
    const err = new APIError(`Error occured while retreiving list`, httpStatus.INTERNAL_SERVER_ERROR, true);
    next(err);
  });
}


function saveRiderDetails(req) {
  const newPassword=  randomstring.generate({
    length: 8
  });
var  userObj = new User({
      email: "anonoymous@abcxyz.com",
      password: newPassword,
      userType: USER_TYPE_ANONYMOUS,
      name: req.body.name,
      fname: req.body.name,
      riderAddedById:req.user._id,
      phoneNo:"0000000000"
    });
   return userObj.saveAsync();
}

function getTerminalsDetails(req) {
  return new Promise((resolve,reject)=>{
    let sourceDestIds = [req.body.sourceLoc, req.body.destLoc]
      Promise.all(sourceDestIds.map(function(id) {
        return tripSchema.aggregateAsync([
          {$match: {'activeStatus': true}},
          {$unwind: '$driver.route.terminals'},
          {$match: {'driver.route.terminals._id': mongoose.Types.ObjectId(id)}},
          {$project: {'terminal': '$driver.route.terminals'}}
        ]).then(function(result) {
          if(result && result.length) {
            return result || {};
          } else {
            return {};
          }
        });
      }))
      .then(function(sourceDestterminals) {
        return resolve(sourceDestterminals);
      }).catch(e=>{
        console.log("getTerminalsDetails Promise", e);
        return reject(e);
      })
  });

}

function createTripRequestByDriver(req,result,responseGetTerminals,tripSeatCount) {
  var sourceLoc = responseGetTerminals[0];
  var destLoc = responseGetTerminals[1];
  var  tripRequestObj = new tripRequestSchema({
        riderId: result._id,
        driverId: req.user._id,
        tripId: tripSeatCount._id,
        adminId: req.user.adminId,
        seatBooked:req.body.noOfseats,
        srcLoc:sourceLoc[0].terminal,
        destLoc:destLoc[0].terminal,
        tripRequestStatus:TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE
      });

     return tripRequestObj.saveAsync();
}

function getShuttleListByAdmin(returnObj) {
  return new Promise((resolve, reject) => {
    Promise.all(returnObj.map((objVehicle, index) =>
    AdminVehicleSchema.findOneAsync({ userIdAdmin:mongoose.Types.ObjectId(objVehicle._id),isDeleted:false,activeStatus:true,isAvailable:true,
    },{userIdAdmin:1}).then((result) => {
        returnObj[index] = Object.assign({}, returnObj[index], { shuttelStatus: result?true:false });
        return Promise.resolve(returnObj[index]);
      })))
      .then((adminList) => {
        if (adminList) {
          adminList.map((vehicle, i)=>{
            vehicle.shuttelStatus=vehicle.shuttelStatus;
            returnObj[i]=vehicle;
          });
        }
        return resolve(returnObj);
      })
      .catch((err) => {
        if (err) {
          console.log('err', err); // eslint-disable-line no-console
        }
        return reject(returnObj);
      });
  });
}


/*
  END
  Task : Add passangers at driver section (BY DRIVER ON BEHALF OF RIDER)
*/
