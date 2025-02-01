import moment from 'moment';
import mongoose from 'mongoose';
import async from "async";
import _ from 'lodash';

import * as TRIP_REQUEST_STATUS from '../../constants/trip-request-statuses';
import { sendSms,sendSmsUpdateMobile } from '../../service/smsApi';
import TripSchema from '../../models/trip';
import TripRequestSchema from '../../models/tripRequest';
import SocketStore from '../../service/socket-store';
import UserSchema from '../../models/user.js';
import AdminVehicleUserSchema from '../../models/adminVehicle';
import * as PushNotification from '../../service/pushNotification';
import * as SharedService from '../../service/shared';
import { TRIP_DYNAMIC, TRIP_CIRCULAR_STATIC } from '../../constants/trip-type';
import config from '../../../config/env';
import APIError from '../../helpers/APIError';
import httpStatus from 'http-status';
import { throws } from 'assert';

const requestUpdateMessageToRider = {
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED]: "Request Accepted",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED]: "Request Rejected",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED]: "Request Cancelled",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_COMPLETED]: "Ride Completed",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE]: "Ride Onboard",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED]: "Ride Transferred",
}

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

const requestUpdateEventToAdmin = {
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED]: "requestAcceptedAdmin",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED]: "requestRejectedAdmin",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED]: "requestCancelledAdmin",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED]: "requestTransferredAdmin"
}

function updateTripRequestHandler(socket) {

  socket.on('driverRejectTripRequest_v1', (tripReqObj) => {

    // var tripReqObj={ tripRequestID: '5c7f98d51d899957e87b1f8b',
    //                   tripID: '5c7f98b71d899957e87b1f8a',
    //                   driverID: '5c7e68e209f9025ffae10c06'
    //                 }

    // console.log("driverRejectTripRequest_v1 ---> ", tripReqObj) ;
    // console.log(typeof(tripReqObj));
    const tripRequestID = tripReqObj.tripRequestID;
    const tripID = tripReqObj.tripID;
    const driverID = tripReqObj.driverID;

    /**
     * 1. find the trip request
     * 2. update the trip request with trip id provided by driver
     * 3. add the trip request to the driver's current trip requests array with the status changed by driver
     * 3. notify status to the driver
     * 4. notify the rider with the trip driver(current location) and shuttle details and approx arrival time (preffered)
     */


    let updateTripRequestData = {
      tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED,
      driverId: tripReqObj.driverID,
      tripId: tripReqObj.tripID,
      requestUpdatedTime: (new Date()).toISOString()
    }

    console.log("                   ");
    console.log("  tripReqObj.tripRequestID    ", tripRequestID);
    console.log("                   ");

    var query={ _id: tripRequestID,tripId:tripID}

    console.log("                   ");
    console.log("  query    ", query);
    console.log("                   ");

    TripRequestSchema.findOneAsync(query).then((tripRequest) => {
      if(tripRequest) {
        if(tripRequest.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED) {
          return SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Trip request already rejected`, data: null });
        }else if((tripRequest.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT) || (tripRequest.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) ) {
          nearByShuttleAsync(tripID, {seats: tripRequest.seatBooked})
          .then(response=>{
            console.log("                   ");
            console.log("  response    ", response);
            console.log("                   ");


            if(!response.success) {
              sendCancelNotification(tripRequestID, updateTripRequestData, tripID, driverID, tripRequest);
            } else {
              // notify the driver on other trip, to request to transfer of all pending requests
              let transferToShuttle = response && response.data && response.data[0];
              if(transferToShuttle) {
                // send request to the other trip driver
                let eventPayload = {success: true, message: "New transfer request", data: {tripId: tripID}};
                SocketStore.emitByUserId(transferToShuttle.driver._id, 'transferRequest', eventPayload);

                transferRequestsAsync(tripID, transferToShuttle._id, tripRequestID)
                .then(result=>{
                  TripSchema.findOneAndUpdateAsync(
                    { _id: tripID, activeStatus: true },
                    { $set: {tripEndTime: (new Date()).toISOString()
                    } },
                    { new: true }
                  )
                  .then(updatedTrip=>{
                  })
                  .catch(err=>{
                    console.log("ROORE - > ", err)
                    SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Error while transfering requests`, data: null });
                  })
                })
                .catch(err=>{
                  console.log("ROORE 2- > ", err)
                  SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Error while transfering requests`, data: null });
                })
              } else {
                sendCancelNotification(tripRequestID, updateTripRequestData, tripID, driverID, tripRequest)
                // SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Trip has pending requests but no other trip found to transfer requests`, data: null });
              }
            }
          })
          .catch(error=>{
            console.log(error);
            SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Something went wrong: While Transfer Trip `, data: null });
          })

        } else {
          SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Trip request can not be processed`, data: null });
        }
      } else {
        SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Trip request not found`, data: null });
      }
    }).catch(err=>{
      SocketStore.emitByUserId(driverID, `socketError`, {success:false, message: 'Something went wrong: searching trip request', data: null });
    })
  });


  function sendCancelNotification(tripRequestID, updateTripRequestData, tripID, driverID, tripRequest){
    TripRequestSchema.findOneAndUpdateAsync({ _id: tripRequestID }, {$set: updateTripRequestData}, {new: true})
    .then(tripRequestData => {
      if(tripRequestData) {
        const newTripRequest = tripRequestData;
        let updateTripData = {
          $push: { tripRequests: newTripRequest }
        }
        if(tripRequest.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
          updateTripData["$inc"] = {seatsAvailable: tripRequest.seatBooked,seatBooked: -tripRequest.seatBooked};
        }
        TripSchema
        .findOneAndUpdateAsync({_id: tripID, activeStatus: true}, updateTripData, {new: true})
        .then((updatedTrip)=>{
          if(updatedTrip) {
            // notify the driver with trip request data if prev status was accepted or init
            if(updatedTrip.driver.tripType!==TRIP_DYNAMIC) {
              updateTripRequestNotifyDriver(driverID,newTripRequest,updatedTrip);
            }
            if((tripRequest.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) && (updatedTrip.driver.tripType===TRIP_DYNAMIC)) {
              /**
               * 1. driver route should be updated for driver rejecting the accepted ride
               * 2. notify the same to the driver
               */
              removeTerminalsDynamicRequestsAsync(tripRequestData,updatedTrip).then(res=>{
                notifyDynamicUpdatedRoute(updatedTrip.driver._id, tripRequestData, updatedTrip);
              }).catch(err=>{
                SocketStore.emitByUserId(driverID, "socketError", {success: false, message: 'Something went wrong updating route', data: null })
              })
            }else if((tripRequest.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT) && (updatedTrip.driver.tripType===TRIP_DYNAMIC)) {
              notifyDynamicUpdatedRoute(updatedTrip.driver._id, tripRequestData, updatedTrip);
            }





            // notify the rider with driver and shuttle details
            udpateTripRequestNotifyRider(updatedTrip, newTripRequest);

          } else {
            SocketStore.emitByUserId(driverID, 'socketError', {success: false, message: 'Trip request could not be updated', data: null });
          }
        })
        .catch((err)=>{
          SocketStore.emitByUserId(driverID, 'socketError', {success: false, message: 'Something went wrong while adding trip request', data: null });
        })
      } else {
        SocketStore.emitByUserId(tripReqObj.driverID, 'socketError', {success: false, message: 'Trip request not found', data: null });
      }
    })
    .catch(error => {
      console.log('error while find trip request', error);
      SocketStore.emitByUserId(driverID, `socketError`, {success:false, message: 'Something went wrong', data: null });
    })
  }

  function udpateTripRequestNotifyRider(tripObj, tripReqObj) {

    /**
     * 1. driver details
     * 2. shuttle details
     */
    TripSchema.aggregateAsync([
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
         console.log("emitting trip request", JSON.stringify(tripReqObj));

        if(tripReqObj.tripRequestStatus && (tripReqObj.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED)) {
          // notify the riders with ETA
          if(tripObj && (tripObj.driver.tripType === TRIP_DYNAMIC)) {
            // if driver is on dynamic route
            SharedService.dynamicRouteAsyncETA(tripReqObj,tripObj).then(eta=>{
              // add eta to response
              resToRider["ETA"] = eta;
              SocketStore.emitByUserId(
                tripReqObj.riderId,
                requestUpdateEventToRider[tripReqObj.tripRequestStatus],
                {success:true, message: `${requestUpdateMessageToRider[tripReqObj.tripRequestStatus]}`,
                data: resToRider }
              );
            }).catch(err=>{
              resToRider["ETA"] = null;
              SocketStore.emitByUserId(
                tripReqObj.riderId,
                requestUpdateEventToRider[tripReqObj.tripRequestStatus],
                { success:true, message: `${requestUpdateMessageToRider[tripReqObj.tripRequestStatus]}`,
                data: resToRider }
              );
            })
          } else {
            // if driver is on static route
            SharedService.staticRouteAsyncETA(tripReqObj,tripObj).then(eta=>{
              // add eta to response
              resToRider["ETA"] = eta;
              console.log("requestUpdateEventToRider  2", requestUpdateEventToRider[tripReqObj.tripRequestStatus]);
              SocketStore.emitByUserId(
                tripReqObj.riderId,
                requestUpdateEventToRider[tripReqObj.tripRequestStatus],
                {success:true, message: `${requestUpdateMessageToRider[tripReqObj.tripRequestStatus]}`,
                data: resToRider }
              );
            }).catch(err=>{
              console.log("ETA error on accept request", err);
              resToRider["ETA"] = null;
              SocketStore.emitByUserId(
                tripReqObj.riderId,
                requestUpdateEventToRider[tripReqObj.tripRequestStatus],
                {success:true, message: `${requestUpdateMessageToRider[tripReqObj.tripRequestStatus]}`,
                data: resToRider }
              );
            })
          }
        } else {
          console.log("requestUpdateEventToRider  3", requestUpdateEventToRider[tripReqObj.tripRequestStatus]);
          // notify the riders witout ETA
          let message = `${requestUpdateMessageToRider[tripReqObj.tripRequestStatus]}`;
          if(tripReqObj.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED) {
            message = `Driver cancelled your trip request, please contact shuttle operator +${adminDetails.isdCode}${adminDetails.phoneNo}`;
          }
          SocketStore.emitByUserId(
            tripReqObj.riderId,
            requestUpdateEventToRider[tripReqObj.tripRequestStatus],
            {success:true, message: message,
            data: resToRider }
          );
        }

        let pushData = {
          success:true, message: `${requestUpdateMessageToRider[tripReqObj.tripRequestStatus]}`,
          data: resToRider
        }
        pushNotificationToRider(tripReqObj.riderId,tripReqObj.tripRequestStatus, pushData)
      }
    })
    .catch((err)=>{
      console.log("error1 notifying rider>>>>", err);
      SocketStore.emitByUserId(tripObj.driver._id, `socketError`, {success: false, message: 'Something went wrong, while notifying the rider', data: null });
    })
  }

  function notifyDriverAdminTripStatus(driverId, event, payload) {
    let resPayload = {...payload};
    let query = {
      "driver._id": driverId,
      activeStatus: true
    }

    TripSchema.findOne(query, {"activeStatus":1, "visitedTerminal":1, "gpsLoc":1})
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

  function updateTripRequestNotifyDriver(driverId, tripReqObj, tripObj=null) {
    /**
     * 1. rider details
     */
    UserSchema.findOneAsync({ _id: tripReqObj.riderId }, '-password')
    // eslint-disable-next-line consistent-return
    .then((user) => {
      let res={
        ride:{
          ...tripReqObj._doc,
          riderDetails:user,
        },
        driverRoute: tripObj && tripObj.driver && tripObj.driver.route && tripObj.driver.route.terminals || [],
      };
      if(tripObj && (tripObj.driver.tripType === TRIP_DYNAMIC)) {
        getDynamicRouteOrderAsync(tripObj).then(terminals=>{
          res.driverRoute = terminals || [];
          if (user) {
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
            notifyDriverAdminTripStatus(
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
      } else {
        if (user) {
          console.log("                                              ");
          console.log("res   ------ >",JSON.stringify(tripReqObj));
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
          notifyDriverAdminTripStatus(
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
      }

    })
    .error((e) => {
      console.log("error3 notifying rider>>>>", e);
      SocketStore.emitByUserId(tripObj.driver._id || driverId, `socketError`, {success: false, message: 'Something went wrong, while notifying the rider', data: null });
    });
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
      TripSchema.aggregateAsync(pipelineStages).then(results=>{
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

  function nearByShuttleAsync(currentShuttleId, options=null) {
    return new Promise((resolve, reject) => {
      let result = {
        success: false,
        message: '',
        data: null
      };
      TripSchema.findOneAsync({_id: currentShuttleId, activeStatus: true})
      .then(currentShuttle=>{
        if(currentShuttle) {
          var pipelineStages = [
            { $project: { 'driver': 1, "seatsAvailable": 1, "activeStatus":1, "gpsLoc": 1 } },
            {
              $match: {
                "_id": {$ne: mongoose.Types.ObjectId(currentShuttleId)},
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
          TripSchema.aggregateAsync(pipelineStages)
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


  function transferRequestsAsync(fromTripId, toTripId,tripRequestID){
    let result = {
      success: false,
      message: '',
      data: null
    }
    return new Promise((resolve, reject)=>{
      if(!fromTripId && !toTripId) {
        return resolve(result.message = 'Misssing from trip id or to Trip Id');
      }

      Promise.all([TripSchema.findOneAsync({_id: fromTripId}), TripSchema.findOneAsync({_id: toTripId})])
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
        TripRequestSchema.find({tripId: fromTrip._id, _id: tripRequestID})
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
                TripRequestSchema.findOneAndUpdateAsync({_id: request._id},newTripReqObj,{new: true})
                .then(savedTripRequest=>{
                  notifyRideTransferRider(savedTripRequest, toTrip);
                  let toTripUpdates = {
                    $addToSet: { tripRequests: savedTripRequest }
                  }

                  if(savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
                    toTripUpdates["$inc"] = {seatBooked: request.seatBooked, seatsAvailable: -request.seatBooked}
                  }

                  // Updating To trip with updated Triprequest Start
                  TripSchema.findOneAndUpdateAsync(
                    {_id: toTrip._id, activeStatus: true},
                    toTripUpdates,
                    {new: true}
                  )
                  .then(updatedTrip=>{
                    // Updating from trip with Old Triprequest Start
                    TripSchema
                    .findOneAndUpdateAsync({_id: fromTrip._id, activeStatus: true}, { $pull: { tripRequests: { _id: tripRequestID,tripId:fromTrip._id } } }, {new: true})
                    .then(updatedfromTripRequest=>{
                      let requestPrevStatus = request.tripRequestStatus;
                      request.tripRequestStatus= TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED,
                      request.requestUpdatedTime= (new Date()).toISOString()
                      TripSchema
                      .findOneAndUpdateAsync({_id: fromTrip._id, activeStatus: true},{ $addToSet: { tripRequests: request } }, {new: true})
                      .then(updatedfromTrip=>{
                        if(savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
                          var availableSeats=fromTrip.seatsAvailable+request.seatBooked;
                          var bookedSeat=fromTrip.seatBooked-request.seatBooked;
                          const tripQuery= {"_id": fromTrip._id,activeStatus:true};
                          console.log("???????????");
                          console.log("updating from trip seats availableseats, bookedseats", availableSeats, bookedSeat);
                          console.log("???????????");
                          TripSchema.updateSeats(tripQuery,availableSeats,bookedSeat)
                          .then((totalTripRecords) => {
                            // if trip request status is accepted and trip type is dynamic
                            // update driver's route for both from trip and to trip
                            if(fromTrip && (fromTrip.driver.tripType === TRIP_DYNAMIC)) {
                              request.tripRequestStatus = requestPrevStatus;
                              Promise.all([removeTerminalsDynamicRequestsAsync(request, fromTrip),
                                updateDriverRouter(toTrip._id, toTrip.driver._id, request)])
                              .then(updatedTripRoutes=>{
                                const fromTripRouteUpdated = updatedTripRoutes[0];
                                const toTripRouteUpdated = updatedTripRoutes[1];
                                if(!fromTripRouteUpdated || !toTripRouteUpdated) {
                                  if(!fromTripRouteUpdated) {
                                    return cb(new Error("trip route not updated for source trip "));
                                  } else {
                                    return cb(new Error("trip route not updated for destination trip  "));
                                  }
                                }
                                savedTripRequest.tripRequestStatus= TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED,
                                notifyDynamicUpdatedRoute(fromTrip.driver._id, savedTripRequest, fromTrip);
                                request.tripRequestStatus= TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED,
                                notifyDynamicUpdatedRoute(toTrip.driver._id, request, toTrip);
                                cb();
                              }).catch(err=>{
                                 cb(err);
                              })

                            } else {
                              savedTripRequest.tripRequestStatus= TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED,
                              notifyStaticUpdatedRoute(fromTrip.driver._id, savedTripRequest, fromTrip);
                              request.tripRequestStatus= TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED,
                              notifyStaticUpdatedRoute(toTrip.driver._id, request, toTrip);
                              cb();
                            }
                          }).catch(error=>{
                            cb(error);
                          })
                        }else{
                          if(fromTrip && (fromTrip.driver.tripType === TRIP_DYNAMIC) && savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT) {
                            savedTripRequest.tripRequestStatus= TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED
                            notifyDynamicUpdatedRoute(fromTrip.driver._id, savedTripRequest, fromTrip);
                            request.tripRequestStatus= TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED;;
                            notifyDynamicUpdatedRoute(toTrip.driver._id, request, toTrip);
                            cb();
                          }else  if(fromTrip && (fromTrip.driver.tripType === TRIP_CIRCULAR_STATIC) && savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT) {
                            //  Need to add evenet for Static Driver request transfer
                            savedTripRequest.tripRequestStatus= TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED,
                            notifyStaticUpdatedRoute(fromTrip.driver._id, savedTripRequest, fromTrip);
                            request.tripRequestStatus= TRIP_REQUEST_STATUS.TRIP_REQUEST_TRANSFERRED,
                            notifyStaticUpdatedRoute(toTrip.driver._id, request, toTrip);
                            cb();
                            cb();
                          }

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

  function notifyStaticUpdatedRoute(driverId, tripReqObj, tripObj=null){
    UserSchema.findOneAsync({ _id: tripReqObj.riderId }, '-password')
    // eslint-disable-next-line consistent-return
    .then((user) => {
      let res={
        ride:{
          ...tripReqObj._doc,
          riderDetails:user,
        },
        driverRoute: tripObj && tripObj.driver && tripObj.driver.route && tripObj.driver.route.terminals || [],
      };
        if (user) {
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
          notifyDriverAdminTripStatus(
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
    })
    .catch(e=>{
      console.log("error3 notifying rider>>>>", e);
      SocketStore.emitByUserId(tripObj.driver._id || driverId, `socketError`, {success: false, message: 'Something went wrong, while notifying the rider', data: null });
    })

  }

  function notifyDynamicUpdatedRoute(driverId, tripReqObj, tripObj=null){
    UserSchema.findOneAsync({ _id: tripReqObj.riderId }, '-password')
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
          notifyDriverAdminTripStatus(
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
      TripSchema.aggregateAsync(pipelineStages).then(results=>{
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

  function updateDriverRouter(tripID,driverID,tripRequestData){
    console.log("updating adding terminal on route driver > ", driverID);
    return new Promise((resolve,reject)=>{
      TripSchema.findOneAsync({_id: tripID}).then(tripData=>{

        if(tripData && tripData.driver.route.terminals.length >0) {
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
              TripSchema.aggregateAsync(pipelineStages)
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
                  TripRequestSchema.findOneAndUpdate(query, updateData, {new: true}).then(updateTripRequest=>{
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
              TripSchema.findOneAsync({_id: tripID})
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

  function checkIfToRemoveRequestSrcDest(request){
    console.log("checkIfToRemoveRequestSrcDest request ", request);
    let srcDest = [request.srcLoc, request.destLoc];
    const tripRequestStatus = [TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE];
    let resObj = {src:false, dest: false};
    return new Promise((resolve, reject)=>{

      let srcDestPromises = srcDest.map((terminal, index)=>{
        // if terminal is source for any other requests, check for source terminal to remove
        if(index == 0 ) {
          return new Promise((resolve, reject)=>{
            let query = {
              _id: {$ne: request._id},
              tripRequestStatus: {$in: tripRequestStatus},
              "srcLoc.loc": { $geoWithin: { $centerSphere: [ terminal.loc, 0 ]}}
            }
            TripRequestSchema.findAsync(query).then(requestsAsSrc=>{
              if(requestsAsSrc && requestsAsSrc.length) {
                return resolve(resObj.src=false);
              } else {
                query["destLoc.loc"] = { $geoWithin: { $centerSphere: [ terminal.loc, 0 ]}};
                TripRequestSchema.findAsync(query).then(requestsAsDest=>{
                  if(requestsAsDest && requestsAsDest.length) {
                    return resolve(resObj.src = false);
                  } else {
                    return resolve(resObj.src = true);
                  }
                }).catch(err=>{
                  return reject(err);
                })
              }
            }).catch(err=>{
              return reject(err);
            })
          })
        } else {
          // if terminal is dest for any other requests, check for dest terminal to remove
          return new Promise((resolve, reject)=>{
            let query = {
              _id: {$ne: request._id},
              tripRequestStatus: {$in: tripRequestStatus},
              "srcLoc.loc": { $geoWithin: { $centerSphere: [ terminal.loc, 0 ]}}
            }
            TripRequestSchema.findAsync(query).then(requestsAsSrc=>{
              if(requestsAsSrc && requestsAsSrc.length) {
                return resolve(resObj.dest=false);
              } else {
                query["destLoc.loc"] = { $geoWithin: { $centerSphere: [ terminal.loc, 0 ]}};
                TripRequestSchema.findAsync(query).then(requestsAsDest=>{
                  if(requestsAsDest && requestsAsDest.length) {
                    return resolve(resObj.dest = false);
                  } else {
                    return resolve(resObj.dest = true);
                  }
                }).catch(err=>{
                  return reject(err);
                })
              }
            }).catch(err=>{
              return reject(err);
            })
          })
        }
      })

      Promise.all(srcDestPromises).then((results)=>{
        resolve(resObj)
      }).catch(err=>{
        reject(err);
      })
    })
  }

  function removeTerminalsDynamicRequestsAsync(tripRequestData, updatedTrip){
    console.log("removing terminal from dynamic-driver", updatedTrip.driver)
    return new Promise((resolve, reject)=>{
      checkIfToRemoveRequestSrcDest(tripRequestData)
      .then(srcDestToRemove=>{
        console.log("srcDestToRemove>>>>>>>>>>", srcDestToRemove);
        const newDriverTerminal=updatedTrip.driver.route.terminals;
        if (!srcDestToRemove.src && !srcDestToRemove.dest) {
          return resolve(false);
        }
        if(srcDestToRemove.src) {
          var srcIndex = newDriverTerminal.findIndex(x =>JSON.stringify(x._id)===JSON.stringify(tripRequestData.srcLoc._id));
          newDriverTerminal.splice(srcIndex, 1)
        }
        if(srcDestToRemove.dest) {
          var destIndex = newDriverTerminal.findIndex(x => JSON.stringify(x._id)===JSON.stringify(tripRequestData.destLoc._id));
          newDriverTerminal.splice(destIndex, 1);
        }
        updatedTrip.driver.route.terminals=newDriverTerminal;

        TripSchema.findOneAndUpdateAsync({ _id: tripRequestData.tripId }, {$set: {
          "driver.route.terminals":newDriverTerminal
        }}, {new: true})
        .then(tripRequestedData => {
            // notify the driver with trip request data
          TripSchema.findOneAsync({ _id: tripRequestData.tripId })
          .then(tripObj => {
            return resolve(tripObj);
          })
          .error((e) => {
            return reject(e);
          });
        })
        .error((e) => {
          return reject(e);
        });
      }).catch(err=>{
        console.log('error finding trip', err);
        return reject(err);
      })
    })
  }


}

export default updateTripRequestHandler;
