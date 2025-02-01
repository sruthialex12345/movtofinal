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
import { TRIP_DYNAMIC, TRIP_DIRECT_STATIC, TRIP_CIRCULAR_STATIC } from '../../constants/trip-type';

import { USER_TYPE_RIDER, USER_TYPE_DRIVER, USER_TYPE_ADMIN,USER_TYPE_ANONYMOUS } from '../../constants/user-types';
import AdminVehicleSchema from '../../models/adminVehicle';

import tripSchema from '../../models/trip';
import SocketStore from '../../service/socket-store';
var randomstring = require("randomstring");
const async = require('async');
const debug = require('debug')('MGD-API: admin-user');

import * as Shared from '../../../server/service/shared';
import * as PushNotification from '../../service/pushNotification';
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
                      console.log("       I am here", result);
                      returnObj.success=  false;
                      returnObj.message = 'Driver already activated another shuttle';
                      returnObj.data = { response: result, driverRoute: [] };
                      if (mongoose.Types.ObjectId(shuttleId).equals(result.shuttleId._id)) {
                        returnObj.success = true;
                        returnObj.message = 'Shuttle is already activated';
                        returnObj.data = { response: result, driverRoute: result.driver && result.driver.route && result.driver.route.terminals || [] };
                        return res.send(returnObj);
                      } else {
                        res.send(returnObj);
                        return notifyDriverAdminTripStatus(driverId, result._id);
                      }
                    } else {
                      console.log("       I am ELSE", result);
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
                          return notifyDriverAdminTripStatus(driverId, response._id);
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
            let tripRequestStatuses = [TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE];

            tripRequestSchema.find({ tripId: id, tripRequestStatus: {$in: tripRequestStatuses} })
            .then(enRoutedRequests=>{
              if(enRoutedRequests && enRoutedRequests.length) {
                returnObj.success = false;
                returnObj.message = "Can not deactivate. Trip has pending requests";
                return res.send(returnObj);
              } else {
                 // check for pending request || accepted requests
                let tripRequestStatuses = [TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED];
                tripRequestSchema.aggregateAsync([
                  {
                    $match: {
                      tripId: mongoose.Types.ObjectId(id),
                      tripRequestStatus: {$in: tripRequestStatuses}
                    }
                  }, {
                    $group: {
                      _id: "$tripId",
                      tripId : { $first: '$tripId' },
                      "seats": {$sum: "$seatBooked"}
                    }
                  }
                ])
                .then(acceptedRequests=>{

                  tripSchema.findOneAsync({_id:id})
                  .then(trip=>{
                    if(trip) {
                      if(((acceptedRequests && acceptedRequests.length) || (enRoutedRequests && enRoutedRequests.length)) && trip.driver.tripType == TRIP_DYNAMIC) {
                        returnObj.success = false;
                        returnObj.message = "Can not deactivate. Trip has pending requests";
                        return res.send(returnObj);

                      } else if(trip.driver.tripType == TRIP_DYNAMIC) {
                        tripSchema.findOneAndUpdateAsync({ _id: id, activeStatus: true },
                          { $set: { activeStatus: false, tripEndTime: (new Date()).toISOString(), visitedTerminalIds: [], visitedTerminalsCount:0 } }, { new: true })
                          // eslint-disable-next-line
                        .then(updatedTripObj => {
                          returnObj.success = true;
                          returnObj.message = '';
                          returnObj.data = {};
                          if (updatedTripObj) {
                            returnObj.message = 'Shuttle Deactived';
                            updateDriverVehicleStatusAsync(updatedTripObj, updatedTripObj.shuttleId, false)
                            .then(results => {
                                User.findOneAndUpdateAsync({ _id: updatedTripObj.driver._id }, {$set: {
                                  "route.terminals":[]
                                }}, {new: true})
                                .then(tripRequestData => {
                                  res.send(returnObj);
                                  return notifyDriverAdminTripStatus(updatedTripObj.driver._id, updatedTripObj._doc._id);    });

                            })
                            .catch(error => {
                              next(e);
                            })
                          } else {
                            returnObj.success = false;
                            returnObj.message = 'No Active Shuttle';
                            return res.send(returnObj);
                          }
                        }).error((e) => {
                          var err = new APIError(`Something went wrong`, httpStatus.INTERNAL_SERVER_ERROR, true);
                          next(err);
                        });

                      } else {
                        if(acceptedRequests && acceptedRequests.length) {
                          nearByShuttleAsync(id, {seats: acceptedRequests[0].seats})
                          .then(response=>{
                            if(!response.success) {
                              returnObj.success = false;
                              returnObj.message = "Trip has pending requests but no other trip found to transfer requests";
                              return res.send(returnObj);
                            } else {
                              // notify the driver on other trip, to request to transfer of all pending requests
                              let transferToShuttle = response && response.data && response.data[0];
                              if(transferToShuttle) {
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
                              } else {
                                returnObj.success = false;
                                returnObj.message = "Trip has pending requests but no other trip found to transfer requests";
                                return res.send(returnObj);
                              }
                            }
                          })
                          .catch(error=>{
                            return next(error);
                          })
                        } else {
                          tripSchema.findOneAndUpdateAsync({ _id: id, activeStatus: true },
                            { $set: { activeStatus: false, tripEndTime: (new Date()).toISOString(), visitedTerminalIds: [], visitedTerminalsCount:0 } }, { new: true })
                            // eslint-disable-next-line
                          .then(updatedTripObj => {
                            returnObj.success = true;
                            returnObj.message = '';
                            returnObj.data = {};
                            if (updatedTripObj) {
                              returnObj.message = 'Shuttle Deactived';
                              updateDriverVehicleStatusAsync(updatedTripObj, updatedTripObj.shuttleId, false)
                              .then(results => {
                                res.send(returnObj);
                              return notifyDriverAdminTripStatus(updatedTripObj.driver._id, updatedTripObj._doc._id);
                              })
                              .catch(error => {
                                next(e);
                              })
                            } else {
                              returnObj.success = false;
                              returnObj.message = 'No Active Shuttle';
                              return res.send(returnObj);
                            }
                          }).error((e) => {
                            var err = new APIError(`Something went wrong`, httpStatus.INTERNAL_SERVER_ERROR, true);
                            next(err);
                          });
                        }
                      }
                    }
                  })
                  .catch(err=>{
                    console.log('error searching accepted requests', error);
                    var err = new APIError(`Something went wrong, while searching accepted requests`, httpStatus.INTERNAL_SERVER_ERROR, true);
                    return next(err);
                  })
                })
                .catch(error=>{
                  console.log('error searching accepted requests', error);
                  var err = new APIError(`Something went wrong, while searching accepted requests`, httpStatus.INTERNAL_SERVER_ERROR, true);
                  return next(err);
                })

              }
            })
            .catch(error=>{
              console.log('error searching current trip to deactivate', error);
              var err = new APIError(`Something went wrong`, httpStatus.INTERNAL_SERVER_ERROR, true);
              return next(err);
            })

          }
        } else {

          // needs to be implemented as dynamic route /shared rides
          var err = new APIError(`Something went wrong`, httpStatus.INTERNAL_SERVER_ERROR, true);
          return next(err);
        }
      }
    } else {
      var err = new APIError(`Something went wrong`, httpStatus.INTERNAL_SERVER_ERROR, true);
      return next(err);
    }
  })
  .catch(err => {
    var err = new APIError(`Something went wrong`, httpStatus.INTERNAL_SERVER_ERROR, true);
    return next(err);
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

function notifyDriverAdminTripStatus(driverId, tripId) {
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
        } else if (results && results[0] && results[1]) {
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

          if (foundShuttles) {
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

function transferRequestsAsync(fromTripId, toTripId){
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
  console.log("req == > ", req.body);
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
              console.log("tripSeatCount == > ", JSON.stringify(tripSeatCount));
              var availableSeats=tripSeatCount.seatsAvailable-parseInt(req.body.noOfseats);
              var bookedSeat=tripSeatCount.seatBooked+parseInt(req.body.noOfseats);
              console.log("availableSeats == > ", availableSeats ,bookedSeat );
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
  console.log("test");
  console.log("pipelineStages provider list>>>>>>>", JSON.stringify(pipelineStages));

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
          console.log("filter provider list returned>>>>>>>", JSON.stringify(returnObj));
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


export const driverAddDynamicRider = (req, res, next)=>{
console.log("----------------------Start driverAddDynamicRider-------------------------------");
console.log(req.body);
console.log(req.user._id);
console.log("----------------------END driverAddDynamicRider-------------------------------");
   const driverId  = req.user._id;
  const query = {"driver._id": ObjectId(driverId),activeStatus:true};
  tripSchema.findOneAsync(query,"seatsAvailable seatBooked").then((tripSeatCount) => {
    const returnObj = {
      success: true,
      message: 'No Trip Found',
      data: null,
      meta: null,
    };
    if(req.body.seats<=0){
      const returnObj = {
        success: false,
        message: `Please select valid number of seats`
      }
      return res.send(returnObj);
    }
    if (tripSeatCount) {
      // a) Checking seats availibility in trip schema
      if (tripSeatCount.seatsAvailable>=req.body.seats) {
        const returnObj = {
          success: true,
        };

        saveRiderDetails(req)
         .then((saveRiderDetailsResult) => {

          nearByDynamicRouteDriver(req).then((result)=>{
            if(result){
              let nearByDriversDoc = result.foundDrivers;
              // add rider details to the payload on request to attach the riderdetails to the payload sent to the driver with event

              if(nearByDriversDoc && nearByDriversDoc.length) {
                // send notification event to the driver
                sendRequestToDriver(req, saveRiderDetailsResult, nearByDriversDoc[0].driver[0],tripSeatCount)
                .then(responsed=>{
                  if(responsed) {
                    returnObj.success= true,
                    returnObj.message= `Passenger added`
                    returnObj.data= responsed
                    return res.send(returnObj);
                  }else{
                    returnObj.success= false,
                    returnObj.message= `Something went wronmg while adding passenger`
                    returnObj.data= responsed
                    return res.send(returnObj);
                  }
                })
                .catch((err)=>{
                  console.log('request to driver err', err);
                  returnObj.success= false,
                  returnObj.message= `Something went wronmg while adding passenger`
                  SocketStore.emitByUserId(saveRiderDetailsResult._id, 'socketError', { success: false, message: 'Error while notifying driver', data: null });

                })
              } else {
                returnObj.success= false,
                returnObj.message= `Something went wrong while finding driver`
                // SendNotification(riderID, 'No nearby drivers');
                SocketStore.emitByUserId(saveRiderDetailsResult._id, 'noDriverOnRequestRide', { success: false, message: 'No drivers around', data: null });
                return res.send(returnObj);
              }
            } else {
              returnObj.success= false,
              returnObj.message= `Something went wrong while finding near by driver`
              // SendNotification(riderID, 'No nearby drivers');
              SocketStore.emitByUserId(riderID, 'noDriverOnRequestRide', { success: false, message: 'No drivers around', data: null });
              return res.send(returnObj);
            }
        }).catch(e=>{
          console.log("nearByDynamicRouteDriver", e);
          returnObj.success= false,
          returnObj.message= `Something went wrong while finding near by driver`
          return res.send(returnObj);
          })
        }).catch(e=>{
          returnObj.success= false,
          returnObj.message= `Something went wrong while save Rider Details`
          return res.send(returnObj);
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

function sendRequestToDriver(payload, riderDetails,  driver,tripSeatCount){
  console.log("                                     ");
  console.log("                                     ");
  console.log("driver  ----  11111>sendRequestToDriver", JSON.stringify(driver));
  console.log("                                     ");
  return new Promise((resolve, reject)=>{
    createDynamicTripRequestByDriver(payload,riderDetails,tripSeatCount)
    .then((tripRequestObj) => {
      if(tripRequestObj) {
        console.log("                                     ");
        console.log("tripRequestObj  ----  > sendRequestToDriver", JSON.stringify(tripRequestObj));
        console.log("                                     ");
        // eslint-disable-next-line
        let resToDriver = {...tripRequestObj._doc};
        resToDriver.riderDetails = riderDetails;
        SocketStore.emitByUserId(driver._id, 'requestDriver', {success: true, message: "Request received", data: resToDriver});
        notifyDriverAdminTripStatus(driver._id, 'requestAdmin', {success: true, message: "Request received", data: resToDriver});
        let pushData = {
          payload: { success: true, message: 'Request Sent to the driver', data: resToDriver },
          body: `New request received from the rider: ${resToDriver.riderDetails}`,
          title: 'New Request received'
        }
        PushNotification.sendNotificationByUserIdAsync(driver._id, pushData);
        tripSchema
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
    })
    .catch(err => {
      console.log('error', err);
      return reject(err);
    });
  })
}


function createDynamicTripRequestByDriver(req,result,tripSeatCount) {
  console.log("createDynamicTripRequestByDriver", JSON.stringify(tripSeatCount));
  let timeStampvalue = (new Date()).toISOString();
  const srcLocation = req.body.sourceLoc;
  const destLocation = req.body.destLoc;
  const startAddress = req.body.startAddress;
  const endAddress = req.body.endAddress;
  srcLocation._id = mongoose.Types.ObjectId();
  destLocation._id = mongoose.Types.ObjectId();
  var  tripRequestObj = new tripRequestSchema({
        riderId: result._id,
        driverId: req.user._id,
        tripId: tripSeatCount._id,
        adminId: req.user.adminId,
        seatBooked:req.body.seats,
        srcLoc: srcLocation,
        destLoc: destLocation,
        endAddress:endAddress,
        startAddress:startAddress,
        tripRequestStatus:TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT,
        requestTime: timeStampvalue
      });
     return tripRequestObj.saveAsync();
}

function nearByDynamicRouteDriver(req) {
  const sourceLoc = req.body.sourceLoc;
  const destLoc = req.body.destLoc;
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
    AdminLocationSchema.aggregate(locationPipelineStages)
    .then((foundLocations)=>{
      if(foundLocations && foundLocations.length) {
        // const foundLocation = foundLocations[0];
        let foundLocationIds = foundLocations.map(location=>{
          return mongoose.Types.ObjectId(location._id);
        })
          let result = {
            foundDrivers: []
          }
            /**
             * matches driver that contains the trip request source and destination
             * as their route waypoints
             */

            var pipelineStages = [
              {$project: {"gpsLoc":1, 'driver': 1,"seatsAvailable": 1, "activeStatus":1, "gpsLoc": 1}},
              {
                $match: {
                  "activeStatus": true,
                  "driver.tripType": TRIP_DYNAMIC,
                  "driver.adminId": mongoose.Types.ObjectId(req.user.adminId),
                  "seatsAvailable": {$gte: parseInt(req.body.seats)},
                   "driver._id": mongoose.Types.ObjectId(req.user._id),
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
            console.log("pipelineStages  -- >", JSON.stringify(pipelineStages));

            return tripSchema.aggregateAsync(pipelineStages)
            .then((foundDrivers) => {
               console.log("founddrivers   ----  >", JSON.stringify(foundDrivers));
              if (foundDrivers && foundDrivers.length) {
                Shared.sortDynamicDriversAsync(req.body, foundDrivers)
                .then(sortedDrivers=>{
                  console.log("sorteddrivers", JSON.stringify(sortedDrivers));
                  result.foundDrivers = sortedDrivers;
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
        let err = new APIError('no service at this location', httpStatus.INTERNAL_SERVER_ERROR, true);
        return resolve(null);
      }
    })

  });
}


/*
  END
  Task : Add passangers at driver section (BY DRIVER ON BEHALF OF RIDER)
*/
