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
import { TRIP_DYNAMIC } from '../../constants/trip-type';
import APIError from '../../helpers/APIError';
import httpStatus from 'http-status';
import { throws } from 'assert';

const requestUpdateMessageToRider = {
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED]: "Request Accepted",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED]: "Request Rejected",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED]: "Request Cancelled",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_COMPLETED]: "Ride Completed",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE]: "Ride Onboard",
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
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED]: "requestCancelledDriver"
}

const requestUpdateEventToAdmin = {
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED]: "requestAcceptedAdmin",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED]: "requestRejectedAdmin",
  [TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED]: "requestCancelledAdmin"
}

function updateTripRequestHandler(socket) {
  socket.on('driverAcceptTripRequest', (tripReqObj) => {
    const tripRequestID = tripReqObj.tripRequestID;
    const tripID = tripReqObj.tripID;
    const driverID = tripReqObj.driverID;
    const queryTripSchema = {
      "_id":  tripReqObj.tripID,
      activeStatus:true
    }

    TripSchema.findOneAsync(queryTripSchema).then((tripSeatCount) => {
      if(tripSeatCount) {
        // check if request was cancelled or rejected
        if(tripSeatCount.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED) {
          return SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Trip request was cancelled`, data: null });
        }

        TripRequestSchema.findOneAsync({_id: tripReqObj.tripRequestID}).then(triprequest=>{
          if(triprequest) {
            // check if the trip request already accepted and notify the driver
            if(triprequest.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
              return SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Trip request was already accepted`, data: null });
            }
            // if(tripSeatCount.driver.tripType && tripSeatCount.driver.tripType==TRIP_DYNAMIC){
            //   updateDriverRouter(tripID,driverID,triprequest)
            // }
            // return;
            if(tripSeatCount && tripSeatCount.seatsAvailable && (tripSeatCount.seatsAvailable >= triprequest.seatBooked)){
              /**
               * 1. find the trip request
               * 2. update the trip request with trip id provided by driver
               * 3. add the trip request to the driver's current trip requests array with the status changed by driver
               * 3. notify status to the driver
               * 4. notify the rider with the trip driver(current location) and shuttle details and approx arrival time (preffered)
               */
              // Average waiting
              let presentTime= (new Date()).toISOString();
              TripRequestSchema.findOneAsync({_id:tripRequestID})
              .then((findTrip)=>{
                if(findTrip){
                 let requestTime=findTrip.requestTime;

                 let requestTimeMili=new Date(requestTime).getTime();
                 let presentTimeMili=new Date(presentTime).getTime();

                 let watingTimeMilli=presentTimeMili-requestTimeMili;
                 console.log("WatingTime",watingTimeMilli)


              let updateTripRequestData = {
                tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED,
                driverId: tripReqObj.driverID,
                tripId: tripReqObj.tripID,
                requestUpdatedTime: presentTime,  //(new Date()).toISOString()
                watingTime:watingTimeMilli
              }


              let query = {
                _id: tripRequestID
              }

              TripRequestSchema.findOneAndUpdateAsync(query, {$set: updateTripRequestData}, {new: true})
              .then(tripRequestData => {
                if(tripRequestData) {

                  TripSchema
                  .findOneAndUpdateAsync({_id: tripID, activeStatus: true},{ $addToSet: { tripRequests: tripRequestData } }, {new: true})
                  .then((updatedTrip)=>{
                    if(updatedTrip) {
                      // Updating number of Seats
                      var availableSeats=updatedTrip.seatsAvailable-tripRequestData.seatBooked;
                      var bookedSeat=updatedTrip.seatBooked+tripRequestData.seatBooked;
                      const tripQuery= {"_id": tripID,activeStatus:true};
                        TripSchema.updateSeats(tripQuery,availableSeats,bookedSeat)
                        .then((totalTripRecords) => {

                         if(tripSeatCount.driver && tripSeatCount.driver.tripType && tripSeatCount.driver.tripType==TRIP_DYNAMIC){
                            updateDriverRouter(tripID,driverID,tripRequestData).then((resultUpdateDriver)=>{
                              TripSchema.findOneAsync({_id:tripID}).then((updatetrip) => {
                                // notify the driver with trip request data
                                updateTripRequestNotifyDriver(driverID, tripRequestData,updatetrip);

                                // notify the rider with driver and shuttle details
                                udpateTripRequestNotifyRider(updatetrip, tripRequestData);
                              })
                            })
                          }else{
                            // notify the driver with trip request data
                            updateTripRequestNotifyDriver(driverID, tripRequestData)

                            // notify the rider with driver and shuttle details
                            udpateTripRequestNotifyRider(updatedTrip, tripRequestData);
                          }

                          if(tripSeatCount && tripSeatCount.driver && tripSeatCount.driver.adminId){
                            sendCustomMessageToRider(tripSeatCount.driver.adminId,tripRequestData);
                          }

                        })
                        .error((e) => {
                          const err = new APIError(`Error occured while counting trip object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                          next(err);
                        });
                      } else {
                        SocketStore.emitByUserId(driverID, 'socketError', {success: false, message: 'Trip request could not be added successfully', data: null });
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
                SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
              })
              // Average waiting
            }else{
                    res.send("Trip not found");
                }
              })
              .catch((e) => {
                const err = new APIError(`Error occured while counting trip object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                next(err);
              })
              // Average waiting
            }else{
              SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Total seats are greater than available seats: ${tripSeatCount.seatsAvailable}, please select manually.`, data: null });
              return false;
            }
          } else {
            SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Trip request not found`, data: null });
          }
        })
        .catch(e=>{
          SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Trip request not found`, data: null });
          console.log('error searching trip on accept all request', e);
          return false;
        })
      } else {
        SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Trip request not found`, data: null });
      }
    })
    .error((e) => {
      SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Something went wrong, while searching trip`, data: null });
      console.log('error searching trip on accept all request', e);
      return false;
    });


  });

  socket.on('acceptAllTripRequests', (reqPayload) => {
    let driverID = reqPayload.driverID;
    getTripTerminalRequestsAsync(reqPayload.tripID, reqPayload.terminalID)
    .then((result)=>{
      if(result && result.length>0){
        var noOfseats=(result && result.length>0 && result[0].count && result[0].count>0)?result[0].count:0
        const queryTripSchema = {
          "_id":  reqPayload.tripID,
          activeStatus:true
          // "seatsAvailable": {$gte: noOfseats}
        }

        TripSchema.findOneAsync(queryTripSchema,"seatsAvailable seatBooked driver").then((tripSeatCount) => {
          if(tripSeatCount && tripSeatCount.seatsAvailable && (tripSeatCount.seatsAvailable >= noOfseats)){
            let requestedRides = [];
            if(result && result.length && Array.isArray(result)){
              requestedRides = result.map(request=>{
                let newRequest = {...request.rides};
                newRequest.riderDetails && newRequest.riderDetails.password && (delete newRequest.riderDetails.password)
                return newRequest;
              })
            }

            // get all requests to be update as async update query for each request
            let updateRequestRides = requestedRides.map((ride, index)=>{
              let tripReqObj = {
                tripRequestID: ride._id,
                tripID: reqPayload.tripID,
                driverID: ride.driverId
              }
              let tripRequestID = tripReqObj.tripRequestID;
              let tripID = tripReqObj.tripID;
              let driverID = tripReqObj.driverID;

              /**
               * 1. find the trip request
               * 2. update the trip request with trip id provided by driver
               * 3. add the trip request to the driver's current trip requests array with the status changed by driver
               * 3. notify status to the driver
               * 4. notify the rider with the trip driver(current location) and shuttle details and approx arrival time (preffered)
               */
              let updateTripRequestData = {
                tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED,
                driverId: tripReqObj.driverID,
                tripId: tripReqObj.tripID,
                requestUpdatedTime: (new Date()).toISOString()
              }

              let query = {
                _id: tripRequestID,
                tripRequestStatus: {$nin: [TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED]}
              }
              return (callback) => {
                TripRequestSchema.findOneAndUpdateAsync(query, {$set: updateTripRequestData}, {new: true})
                .then(tripRequestData => {
                  if(tripRequestData) {
                    TripSchema
                    .findOneAndUpdateAsync({_id: tripID, activeStatus: true},{ $addToSet: { tripRequests: tripRequestData } }, {new: true})
                    .then((updatedTrip)=>{
                      if(updatedTrip) {
                      // Updating number of Seats
                        var availableSeats=updatedTrip.seatsAvailable-tripRequestData.seatBooked;
                        var bookedSeat=updatedTrip.seatBooked+tripRequestData.seatBooked;
                        const tripQuery= {"_id": tripID,activeStatus:true};
                      TripSchema.updateSeats(tripQuery,availableSeats,bookedSeat)
                  .then((totalTripRecords) => {

                        // // notify the driver with trip request data
                        // updateTripRequestNotifyDriver(driverID, tripRequestData)

                        // notify the rider with driver and shuttle details

                        if(tripSeatCount.driver && tripSeatCount.driver.tripType && tripSeatCount.driver.tripType==TRIP_DYNAMIC){
                          updateDriverRouter(tripID,driverID,tripRequestData).then((resultUpdateDriver)=>{
                            TripSchema.findOneAsync({_id:tripID}).then((updatetrip) => {
                              udpateTripRequestNotifyRider(updatetrip, tripRequestData);
                              return callback(null, updatetrip);
                            }).catch(err=>{
                              console.log("error updating driver router1", err);
                              return callback(err,null);
                            })
                          }).catch(err=>{
                            return callback(err,null);
                          })
                        }else{
                          udpateTripRequestNotifyRider(updatedTrip, tripRequestData);
                          return callback(null,updatedTrip);
                        }
                        if(tripSeatCount && tripSeatCount.driver && tripSeatCount.driver.adminId){
                          sendCustomMessageToRider(tripSeatCount.driver.adminId,tripRequestData);
                        }

                      }).error((e) => {
                      const err = new APIError(`Error occured while counting trip object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                      next(err);
                    });
                      } else {
                        // SocketStore.emitByUserId(driverID, 'socketError', {success: false, message: 'Trip request could not be added successfully', data: null });
                        return callback(new Error("No trip request data found"), null);
                      }
                    })
                    .catch((err)=>{
                      console.log("error on updating all trip request on terminal", err);
                      // SocketStore.emitByUserId(driverID, 'socketError', {success: false, message: 'Something went wrong while adding trip request', data: null });
                      return callback(err,null);
                    })
                  } else {
                    // SocketStore.emitByUserId(tripReqObj.driverID, 'socketError', {success: false, message: 'Trip request not found', data: null });
                    return callback(null,tripSeatCount);
                  }
                })
                .catch(error => {
                  console.log('error while find trip request', error);
                  SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
                  return callback(error,null)
                })
              };
            //   return new Promise((resolve, reject) => {
            //     TripRequestSchema.findOneAndUpdateAsync(query, {$set: updateTripRequestData}, {new: true})
            //     .then(tripRequestData => {
            //       if(tripRequestData) {
            //         TripSchema
            //         .findOneAndUpdateAsync({_id: tripID, activeStatus: true},{ $addToSet: { tripRequests: tripRequestData } }, {new: true})
            //         .then((updatedTrip)=>{
            //           if(updatedTrip) {
            //           // Updating number of Seats
            //             var availableSeats=updatedTrip.seatsAvailable-noOfseats;
            //             var bookedSeat=updatedTrip.seatBooked+noOfseats;
            //             const tripQuery= {"_id": tripID,activeStatus:true};
            //           TripSchema.updateSeats(tripQuery,availableSeats,bookedSeat)
            //       .then((totalTripRecords) => {

            //             // // notify the driver with trip request data
            //             // updateTripRequestNotifyDriver(driverID, tripRequestData)

            //             // notify the rider with driver and shuttle details

            //             if(tripSeatCount.driver && tripSeatCount.driver.tripType && tripSeatCount.driver.tripType==TRIP_DYNAMIC){
            //               updateDriverRouter(tripID,driverID,tripRequestData).then((resultUpdateDriver)=>{
            //                 TripSchema.findOneAsync({_id:tripID}).then((updatetrip) => {
            //                   udpateTripRequestNotifyRider(updatetrip, tripRequestData);
            //                   return resolve(updatetrip);
            //                 }).catch(err=>{
            //                   console.log("error updating driver router1", err);
            //                   return reject(err);
            //                 })
            //               }).catch(err=>{
            //                 return reject(err);
            //               })
            //             }else{
            //               udpateTripRequestNotifyRider(updatedTrip, tripRequestData);
            //               return resolve(updatedTrip);
            //             }
            //             if(tripSeatCount && tripSeatCount.driver && tripSeatCount.driver.adminId){
            //               sendCustomMessageToRider(tripSeatCount.driver.adminId,tripRequestData);
            //             }

            //           }).error((e) => {
            //           const err = new APIError(`Error occured while counting trip object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
            //           next(err);
            //         });
            //           } else {
            //             // SocketStore.emitByUserId(driverID, 'socketError', {success: false, message: 'Trip request could not be added successfully', data: null });
            //             return reject(new Error("No trip request data found"));
            //           }
            //         })
            //         .catch((err)=>{
            //           console.log("error on updating all trip request on terminal", err);
            //           // SocketStore.emitByUserId(driverID, 'socketError', {success: false, message: 'Something went wrong while adding trip request', data: null });
            //           return reject(err);
            //         })
            //       } else {
            //         // SocketStore.emitByUserId(tripReqObj.driverID, 'socketError', {success: false, message: 'Trip request not found', data: null });
            //         return resolve(tripSeatCount);
            //       }
            //     })
            //     .catch(error => {
            //       console.log('error while find trip request', error);
            //       SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
            //       return reject(error)
            //     })
            //   }
            // );

            })
            // update each request in series
            async.series(updateRequestRides, (error, tripObj)=>{
              if(error) {
                  console.log('error while find trip request', error);
                  SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong, while accepting all requests', data: null });
              }
              if (tripObj && tripObj[0] && tripObj[0].driver && tripObj[0].driver.tripType && tripObj[0].driver.tripType == TRIP_DYNAMIC) {
                  getDynamicRouteOrderAsync(tripObj[0])
                  .then(terminals=>{
                    let res = {
                      driverRoute: terminals || []
                    };
                    SocketStore.emitByUserId(driverID, `acceptedAllTripRequests`, { success: true, message: 'All requests accepted', data: res });
                    notifyDriverAdminTripStatus(
                      driverID,
                      "acceptedAllTripRequestsAdmin",
                      {success: true, message: 'All requests accepted', data: res }
                    )
                  }).catch(err=>{
                    console.log('error while find trip request', error);
                    SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong, getting route info', data: null });
                  })
                } else {
                  SocketStore.emitByUserId(driverID, `acceptedAllTripRequests`, { success: true, message: 'All requests accepted', data: null });
                  notifyDriverAdminTripStatus(
                    driverID,
                    "acceptedAllTripRequestsAdmin",
                    {success: true, message: 'All requests accepted', data: null }
                  )
                }
            })
            // update each request in parallel
            // Promise.all(updateRequestRides)
            // .then(tripObj=>{
            //    if (tripObj && tripObj[0] && tripObj[0].driver && tripObj[0].driver.tripType && tripObj[0].driver.tripType == TRIP_DYNAMIC) {
            //     getDynamicRouteOrderAsync(tripObj[0])
            //     .then(terminals=>{
            //       let res = {
            //         driverRoute: terminals || []
            //       };
            //       SocketStore.emitByUserId(driverID, `acceptedAllTripRequests`, { success: true, message: 'All requests accepted', data: res });
            //       notifyDriverAdminTripStatus(
            //         driverID,
            //         "acceptedAllTripRequestsAdmin",
            //         {success: true, message: 'All requests accepted', data: res }
            //       )
            //     }).catch(err=>{
            //       console.log('error while find trip request', error);
            //       SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong, getting route info', data: null });
            //     })
            //   } else {
            //     SocketStore.emitByUserId(driverID, `acceptedAllTripRequests`, { success: true, message: 'All requests accepted', data: null });
            //     notifyDriverAdminTripStatus(
            //       driverID,
            //       "acceptedAllTripRequestsAdmin",
            //       {success: true, message: 'All requests accepted', data: null }
            //     )
            //   }

            //   // updateTripRequestNotifyDriver(driverID, updatedRides)
            // }).catch(error=>{
            //   console.log('error while find trip request', error);
            //   SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong, while accepting all requests', data: null });
            // })
          }else{
            SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Total seats are greater than available seats: ${tripSeatCount.seatsAvailable}, please select manually.`, data: null });
            return false;
          }
        })
        .error((e) => {
          SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Something went wrong, while searching trip`, data: null });
          console.log('error searching trip on accept all request', e);
          return false;
        });
      }else{
        console.log('error while find trip request');
        SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'No trip request Found', data: null });
      }

    }).catch(error=>{
      console.log('error while find trip request', error);
      SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong, while searching trip requests', data: null });
    })
  });

  socket.on('driverRejectTripRequest', (tripReqObj) => {
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

    TripRequestSchema.findOneAsync({ _id: tripRequestID }).then((tripRequest) => {
      if(tripRequest) {
        if(tripRequest.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED) {
          return SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Trip request already rejected`, data: null });
        }

        TripRequestSchema.findOneAndUpdateAsync({ _id: tripRequestID }, {$set: updateTripRequestData}, {new: true})
        .then(tripRequestData => {
          if(tripRequestData) {
            console.log('tripReqestdata', tripRequestData);
            const newTripRequest = tripRequestData;
            TripSchema
            .findOneAndUpdateAsync({_id: tripID, activeStatus: true},{ $push: { tripRequests: newTripRequest } }, {new: true})
            .then((updatedTrip)=>{
              if(updatedTrip) {
                // notify the driver with trip request data
                updateTripRequestNotifyDriver(driverID, newTripRequest)

                // notify the rider with driver and shuttle details
                udpateTripRequestNotifyRider(updatedTrip, newTripRequest);

              } else {
                SocketStore.emitByUserId(driverID, 'socketError', {success: false, message: 'Trip request could not be added successfully', data: null });
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
      } else {
        SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: `Trip request not found`, data: null });
      }
    }).catch(err=>{
      SocketStore.emitByUserId(driverID, `socketError`, {success:false, message: 'Something went wrong: searching trip request', data: null });
    })
  });

  socket.on('riderCancelTripRequest', (tripReqObj) => {
    const tripRequestID = tripReqObj.tripRequestID;
    const riderID = tripReqObj.riderID;
    /**
     * 1. find the trip request
     * 2. update the trip request status
     * 3. add the trip request to the driver's current trip requests array with the status changed by rider
     * 3. notify status to the rider
     * 4. notify the driver
     */
    let updateTripRequestData = {
      tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED,
      requestUpdatedTime: (new Date()).toISOString()
    }

    TripRequestSchema.findOneAsync({ _id: tripRequestID})
    .then(tripRequestPreviousData => {
      // check if request was already cancelled
      if(tripRequestPreviousData.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED) {
        return SocketStore.emitByUserId(riderID, `socketError`, {success: false, message: 'Request already cancelled', data: null });
      } else if (tripRequestPreviousData.tripRequestStatus === TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE) {
        return SocketStore.emitByUserId(riderID, `socketError`, {success: false, message: 'Sorry,Request Enrouted', data: null });
      }
      TripRequestSchema.findOneAndUpdateAsync({ _id: tripRequestID }, {$set: updateTripRequestData}, {new: true})
      .then(tripRequestData => {
        if(tripRequestData) {
          const newTripRequest = tripRequestData;
          TripSchema
          .findOneAndUpdateAsync({'driver._id': tripRequestData.driverId, activeStatus: true},{ $push: { tripRequests: tripRequestData } }, {new: true})
          .then((updatedTrip)=>{
            if(updatedTrip) {
              // const newDriverTerminal=updatedTrip.driver.route.terminals;
              // var srcIndex = newDriverTerminal.findIndex(x =>JSON.stringify(x._id)===JSON.stringify(tripRequestData.srcLoc._id));
              // newDriverTerminal.splice(srcIndex, 1)
              // var destIndex = newDriverTerminal.findIndex(x => JSON.stringify(x._id)===JSON.stringify(tripRequestData.destLoc._id));
              // newDriverTerminal.splice(destIndex, 1);
              // updatedTrip.driver.route.terminals=newDriverTerminal;

              if(tripRequestPreviousData.tripRequestStatus==TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED){
                // Updating number of Seats
                var availableSeats=updatedTrip.seatsAvailable+tripRequestData.seatBooked;
                var bookedSeat=updatedTrip.seatBooked-tripRequestData.seatBooked;
                const tripQuery= {"_id": tripRequestData.tripId,activeStatus:true};
                  TripSchema.updateSeats(tripQuery,availableSeats,bookedSeat)
                  .then((totalTripRecords) => {
                    if(updatedTrip && updatedTrip.driver && updatedTrip.driver.tripType && updatedTrip.driver.tripType==TRIP_DYNAMIC){
                      // TripSchema.findOneAndUpdateAsync({ _id: tripRequestData.tripId }, {$set: {
                      //   "driver.route.terminals":newDriverTerminal
                      // }}, {new: true})

                      removeTerminalsDynamicRequestsAsync(tripRequestData,updatedTrip).then((updatdTypeAfterRemoveRoutes)=>{
                        // notify the driver with trip request data
                        TripSchema.findOneAsync({ _id: tripRequestData.tripId })
                        .then(tripObj => {
                          updateTripRequestNotifyDriver(tripRequestData.driverId, newTripRequest,tripObj)
                        })
                        .catch((e) => {
                          const err = new APIError(`Error occured while counting trip object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                          next(err);
                        });
                      })
                      .catch((e) => {
                        const err = new APIError(`Error occured while counting trip object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                        next(err);
                      });

                    }else{
                        // notify the driver with trip request data
                          TripSchema.findOneAsync({ _id: tripRequestData.tripId })
                          .then(tripObj => {
                            updateTripRequestNotifyDriver(tripRequestData.driverId, newTripRequest,tripObj)
                          })
                          .error((e) => {
                            const err = new APIError(`Error occured while counting trip object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                            next(err);
                          });
                    }
                    })
                    .error((e) => {
                      const err = new APIError(`Error occured while counting trip object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                      next(err);
                    });
              }else if(tripRequestPreviousData.tripRequestStatus==TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT){
                    // notify the driver with trip request data
                TripSchema.findOneAsync({ _id: tripRequestData.tripId })
                .then(tripObj => {
                  updateTripRequestNotifyDriver(tripRequestData.driverId, newTripRequest,tripObj)
                })
                .error((e) => {
                  const err = new APIError(`Error occured while counting trip object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                  next(err);
                });
          }

              // notify the rider with driver and shuttle details
              SocketStore.emitByUserId(
                tripRequestData.riderId,
                requestUpdateEventToRider[tripRequestData.tripRequestStatus],
                {success: true, message: `${requestUpdateMessageToRider[tripRequestData.tripRequestStatus]}`,
                data: null }
              );
              let pushData = {
                success: true, message: `${requestUpdateMessageToRider[tripRequestData.tripRequestStatus]}`,
                data: null
              }
              pushNotificationToRider(tripRequestData.riderId,tripRequestData.tripRequestStatus, pushData)

            } else {
              // notify rider
              SocketStore.emitByUserId(
                tripRequestData.riderId,
                requestUpdateEventToRider[tripRequestData.tripRequestStatus],
                {success: true, message: `${requestUpdateMessageToRider[tripRequestData.tripRequestStatus]}`,
                data: null }
              );
              let pushData = {
                success: true, message: `${requestUpdateMessageToRider[tripRequestData.tripRequestStatus]}`,
                data: null
              }
              pushNotificationToRider(tripRequestData.riderId,tripRequestData.tripRequestStatus, pushData)
              // notify driver
              SocketStore.emitByUserId(tripRequestData.driverId, 'socketError', {success: false, message: 'Trip request was cancelled, could not be added on trip', data: null });
            }
          })
          .catch((err)=>{
            console.log('error finding trip', err);
            SocketStore.emitByUserId(tripRequestData.riderId, 'socketError', {success: false, message: 'Something went wrong while updating trip request', data: null });
          })
        } else {
          SocketStore.emitByUserId(riderID, 'socketError', {success: false, message: 'Trip request not found', data: null });
        }
      })
      .catch(error => {
        console.log('error while find trip request', error);
        SocketStore.emitByUserId(riderID, `socketError`, {success: false, message: 'Something went wrong', data: null });
      })
    })
    .catch(error => {
      console.log('error while find trip request', error);
      SocketStore.emitByUserId(riderID, `socketError`, {success: false, message: 'Something went wrong', data: null });
    });
  });

  socket.on('completeTripRequestsTerm', (reqPayload)=>{
    let driverID = reqPayload.driverID;
    getTripRequestsToCompleteTerminal(reqPayload.tripID, reqPayload.terminalID)
    .then((result)=>{
      if(result && result.length>0){
        var noOfseats=(result && result.length>0 && result[0].count && result[0].count>0)?result[0].count:0;
      // return;
      let requestedRides = [];
      if(result && Array.isArray(result)){
        requestedRides = result.map(request=>{
          let newRequest = {...request.rides};
          newRequest.riderDetails && newRequest.riderDetails.password && (delete newRequest.riderDetails.password)
          return newRequest;
        })
      }
      // get all requests to be update as async update query for each request
      let updateRequestRides = requestedRides.map((ride, index)=>{
        let tripReqObj = {
          tripRequestID: ride._id,
          tripID: reqPayload.tripID,
          driverID: ride.driverId
        }
        let tripRequestID = tripReqObj.tripRequestID;
        let tripID = tripReqObj.tripID;
        let driverID = tripReqObj.driverID;

        /**
         * 1. find the trip request
         * 2. update the trip request with trip id provided by driver
         * 3. add the trip request to the driver's current trip requests array with the status changed by driver
         * 3. notify status to the driver with event completedTerminalRequests
         * 4. notify the rider with the updated trip request data
         */
        let updateTripRequestData = {
          tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_COMPLETED,
          driverId: tripReqObj.driverID,
          tripId: tripReqObj.tripID,
          requestUpdatedTime: (new Date()).toISOString()
        }

        let query = {
          _id: tripRequestID
        }
        return new Promise((resolve, reject) => {
          TripRequestSchema.findOneAndUpdateAsync(query, {$set: updateTripRequestData}, {new: true})
          .then(tripRequestData => {
            if(tripRequestData) {
              TripSchema
              .findOneAndUpdateAsync({_id: tripID, activeStatus: true},{ $addToSet: { tripRequests: tripRequestData } }, {new: true})
              .then((updatedTrip)=>{
                if(updatedTrip) {
                  console.log("------------------");
                  console.log("   TESTSTSTSST   ")
                  console.log("------------------");
                  console.log("------------------");
                  var availableSeats=updatedTrip.seatsAvailable+tripRequestData.seatBooked;
                  var bookedSeat=updatedTrip.seatBooked-tripRequestData.seatBooked;
                  const tripQuery= {"_id": reqPayload.tripID,activeStatus:true};
                  TripSchema.updateSeats(tripQuery,availableSeats,bookedSeat)
                  .then((totalTripRecords) => {
                    // notify the rider with driver and shuttle details
                    SocketStore.emitByUserId(
                      tripRequestData.riderId,
                      requestUpdateEventToRider[tripRequestData.tripRequestStatus],
                      {success:true, message: `${requestUpdateMessageToRider[tripRequestData.tripRequestStatus]}`,
                      data: tripRequestData }
                    );
                    let pushData = {
                      success:true, message: `${requestUpdateMessageToRider[tripRequestData.tripRequestStatus]}`,
                      data: tripRequestData
                    }
                    pushNotificationToRider(tripRequestData.riderId,tripRequestData.tripRequestStatus, pushData)

                    // Removed route id rider complete their ride
                    if(updatedTrip && updatedTrip.driver && updatedTrip.driver.tripType==TRIP_DYNAMIC){
                      removeTerminalsDynamicRequestsAsync(tripRequestData,updatedTrip).then((updatdTypeAfterRemoveRoutes)=>{
                        return resolve(updatdTypeAfterRemoveRoutes);
                      }).catch((err)=>{
                        return reject(err);
                      })
                    }else{
                      return resolve(updatedTrip);
                    }


                  })
                  .error((e) => {
                    return reject(new Error("Seats could not be updated."));
                  });
                } else {
                  return reject(new Error("No trip request data found"));
                }
              })
              .catch((err)=>{
                return reject(err);
              })
            } else {
              return reject(new Error("No trip request data found"));
            }
          })
          .catch(error => {
            console.log('error while find trip request', error);
            SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
            return reject(error)
          })
        });

      })
      // update each request in parallel
      Promise.all(updateRequestRides)
      .then(updatedRides=>{
        // console.log('rides updated',updatedRides);
        // 1. emit success event to the driver
        // 2. emit event with data set newRequestsOnTerminal flag to true if the same terminal have remaining accepted new requests as source
        console.log("                                 ");
        console.log(" Update TRIp REQUEST", JSON.stringify(updatedRides));
        console.log("                                 ");
        let searchEndRequestsOnTerminal = {
          tripId: reqPayload.tripID,
          tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED,
          'srcLoc._id': reqPayload.terminalID
        }
        var index=updatedRides.length-1;
        let lastUpdatedTripRoute=updatedRides[index];
        console.log("                                 ");
        console.log(" lastUpdatedTripRoute", JSON.stringify(lastUpdatedTripRoute));
        console.log("                                 ");
        TripRequestSchema.findAsync(searchEndRequestsOnTerminal)
        .then(foundRequests=>{
          let driverNotificcationRes = {
            success: updatedRides && updatedRides.length && true || false,
            message: updatedRides && updatedRides.length && "All terminal rides completed" || "No terminal rides found to complete",
            data: {newRequestsToEnroute: false, terminal: reqPayload.terminalID, driverRoute: lastUpdatedTripRoute && lastUpdatedTripRoute.driver && lastUpdatedTripRoute.driver.route && lastUpdatedTripRoute.driver.route.terminals || []}
          }
          if(foundRequests && Array.isArray(foundRequests) && foundRequests.length > 0) {
            // if requests fire event to completerides
            driverNotificcationRes.data.newRequestsToEnroute = true;
          }
          SocketStore.emitByUserId(driverID, `completedTerminalRequests`, driverNotificcationRes);
          notifyDriverAdminTripStatus(driverID, 'completedTerminalRequestsAdmin', driverNotificcationRes);
        })
        .catch(error=>{
          console.log('error while find trip request', error);
          SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong, while searching new requests to board', data: null });
        })
      }).catch(error=>{
        console.log('error while find trip request', error);
        SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong, while completing all requests', data: null });
      })
    }else{
      console.log('error while find trip request');
      SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'No trip request Found', data: null });
    }

    }).catch(error=>{
      console.log('error while find trip request', error);
      SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
    })
  })

  socket.on('enrouteTripRequestsTerm', (reqPayload)=>{
    let driverID = reqPayload.driverID;
    getTripRequestsToEnrouteTerminal(reqPayload.tripID, reqPayload.terminalID)
    .then((result)=>{
      let requestedRides = [];
      if(result && Array.isArray(result)){
        requestedRides = result.map(request=>{
          let newRequest = {...request};
          newRequest.riderDetails && newRequest.riderDetails.password && (delete newRequest.riderDetails.password)
          return newRequest;
        })
      }
      // get all requests to be update as async update query for each request
      let updateRequestRides = requestedRides.map((ride, index)=>{
        let tripReqObj = {
          tripRequestID: ride._id,
          tripID: reqPayload.tripID,
          driverID: ride.driverId
        }
        let tripID = tripReqObj.tripID;
        let driverID = tripReqObj.driverID;

        /**
         * 1. find the trip request
         * 2. update the trip request with trip id provided by driver
         * 3. add the trip request to the driver's current trip requests array with the status changed by driver
         * 3. notify status to the driver with event enroutedTerminalRequests
         * 4. notify the rider with the updated trip request data
         */
        let updateTripRequestData = {
          tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE,
          driverId: tripReqObj.driverID,
          tripId: tripReqObj.tripID,
          requestUpdatedTime: (new Date()).toISOString()
        }

        let query = {
          _id: tripReqObj.tripRequestID
        }

        return new Promise((resolve, reject) => {
          TripRequestSchema.findOneAndUpdateAsync(query, {$set: updateTripRequestData}, {new: true})
          .then(tripRequestData => {
            if(tripRequestData) {
              TripSchema
              .findOneAndUpdateAsync({_id: tripID, activeStatus: true},{ $addToSet: { tripRequests: tripRequestData } }, {new: true})
              .then((updatedTrip)=>{
                if(updatedTrip) {
                  // notify the rider with driver and shuttle details
                  SocketStore.emitByUserId(
                    tripRequestData.riderId,
                    requestUpdateEventToRider[tripRequestData.tripRequestStatus],
                    {success:true, message: `${requestUpdateMessageToRider[tripRequestData.tripRequestStatus]}`,
                    data: tripRequestData }
                  );
                  let pushData = {
                    success:true, message: `${requestUpdateMessageToRider[tripRequestData.tripRequestStatus]}`,
                    data: tripRequestData
                  }
                  pushNotificationToRider(tripRequestData.riderId,tripRequestData.tripRequestStatus, pushData)
                  return resolve(tripRequestData);
                } else {
                  console.log("No trip data found of the requested trip with active status, could not add to trip request history")
                  return resolve(tripRequestData);
                }
              })
              .catch((err)=>{
                return reject(err);
              })
            } else {
              return reject(new Error("No trip request data found"));
            }
          })
          .catch(error => {
            console.log('error while find trip request', error);
            SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
            notifyDriverAdminTripStatus(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
            return reject(error)
          })
        });

      })
      // update each request in parallel
      Promise.all(updateRequestRides)
      .then(updatedRides=>{
        // console.log('rides updated',updatedRides);
        SocketStore.emitByUserId(driverID, `enroutedTerminalRequests`, {success: true, message: 'All terminal rides enrouted', data: null });
        notifyDriverAdminTripStatus(driverID, 'enroutedTerminalRequestsAdmin', {success: true, message: 'All terminal rides enrouted', data: {} });
        // updateTripRequestNotifyDriver(driverID, updatedRides)
      }).catch(error=>{
        console.log('error while updating trip request and trip with enroute status', error);
        SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong, while enrouting all requests', data: null });
        notifyDriverAdminTripStatus(driverID, 'socketError', {success: false, message: 'Something went wrong, while enrouting all requests', data: null });
      })

    }).catch(error=>{
      console.log('error while find trip request', error);
      SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
    })
  })

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
      }
    ])
    .then((updatedTrip)=>{
      if(updatedTrip && updatedTrip.length > 0) {
        let resToRider = {
          driver: updatedTrip[0].driver[0],
          shuttle: updatedTrip[0].vehicle[0]
        }
        delete resToRider.driver.password;

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
              console.log("ETA ERROR>>>>>>>>>>", err);
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
          // notify the riders witout ETA
          SocketStore.emitByUserId(
            tripReqObj.riderId,
            requestUpdateEventToRider[tripReqObj.tripRequestStatus],
            {success:true, message: `${requestUpdateMessageToRider[tripReqObj.tripRequestStatus]}`,
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
    console.log("                                              ");
    console.log("tripObj",JSON.stringify(tripObj));
    console.log("                                              ");
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

  function getTripRequestsToEnrouteTerminal(tripId, terminalId) {
    let aggregateStages = [
      {
        $match: {
          tripId: mongoose.Types.ObjectId(tripId),
          "tripRequestStatus": TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED,
          "srcLoc._id": mongoose.Types.ObjectId(terminalId)
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

    return TripRequestSchema.aggregateAsync(aggregateStages)
  }

  function getTripRequestsToCompleteTerminal(tripId, terminalId) {
    let aggregateStages = [
      {
        $match: {
          tripId: mongoose.Types.ObjectId(tripId),
          "tripRequestStatus": TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE,
          "destLoc._id": mongoose.Types.ObjectId(terminalId)
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
      },
      {
          $group: {
            _id: '$tripId',
            count: { $sum: "$seatBooked" },
            rides: {$push :"$$ROOT"}
            }
      },
      { '$unwind': '$rides' }
    ];
    return TripRequestSchema.aggregateAsync(aggregateStages)
  }

  function getTripTerminalRequestsAsync(tripId, terminalId) {
    let aggregateStages = [
      {
        $match: {
          tripId: mongoose.Types.ObjectId(tripId),
          "tripRequestStatus": TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT
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
      },
      {
          $group: {
            _id: '$tripId',
            count: { $sum: "$seatBooked" },
            rides: {$push :"$$ROOT"}
            }
      },
      { '$unwind': '$rides' }
    ];

    // removes terminalid filter from query if no terminal provided
    if(terminalId) {
      aggregateStages[0].$match["srcLoc._id"] = mongoose.Types.ObjectId(terminalId)
    }
    console.log("aggregateStages", JSON.stringify(aggregateStages));
    return TripRequestSchema.aggregateAsync(aggregateStages)
  }

  function updateDriverRouter(tripID,driverID,tripRequestData){
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

                  // UserSchema.findOneAndUpdateAsync({_id: driverID}, {$push:{"route.terminals":terminal}}, {new: true,projection:{email:1,gpsLoc:1, locationId:1, adminId:1, isAvailable:1, route:1, tripType:1, activeStatus:1, profileUrl:1, longitudeDelta:1, latitudeDelta:1, lname:1, fname:1, name:1}})
                  // .then(driverDataUpdate => {
                  //   SharedService.addReorderDynamicTerminal(terminal, tripData, null)
                  //   .then(tripDataUpdate=>{
                  //     return callback(null, tripDataUpdate);
                  //   })
                  //   .catch(err=>{
                  //     console.log('error while find trip request', err);
                  //     SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
                  //     return callback(err, null);
                  //   })
                  //   // TripSchema.findOneAndUpdateAsync({_id: tripID}, {$push:{"driver.route.terminals":terminal}},{new: true})
                  //   // .then(tripDataUpdate => {
                  //   //   return callback(null, tripDataUpdate);
                  //   // })
                  //   // .catch(error => {
                  //   //   console.log('error while find trip request', error);
                  //   //   SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
                  //   //   return callback(error, null);
                  //   // })
                  // })
                  // .catch(error => {
                  //   console.log('error while find trip request', error);
                  //   SocketStore.emitByUserId(driverID, `socketError`, {success: false, message: 'Something went wrong', data: null });
                  //   return callback(error, null);
                  // })
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

  function checkIfToRemoveRequestSrcDest(request, tripID){
    console.log("checkIfToRemoveRequestSrcDest request ", request);
    let srcDest = [request.srcLoc, request.destLoc];
    const tripRequestStatus = [TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE];
    let resObj = {src:false, dest: false};
    return new Promise((resolve, reject)=>{

      let srcDestPromises = srcDest.map((terminal, index)=>{
        // if terminal is source, check for source terminal to remove
        if(index == 0 ) {
          return new Promise((resolve, reject)=>{
            TripRequestSchema.findAsync({
              tripRequestStatus: {$in: tripRequestStatus},
              "srcLoc.loc": { $geoWithin: { $centerSphere: [ terminal.loc, 0 ]}}
            }).then(requestsAsSrc=>{
              if(requestsAsSrc && requestsAsSrc.length) {
                return resolve(resObj.src=false);
              } else {
                TripRequestSchema.findAsync({
                  tripRequestStatus: {$in: tripRequestStatus},
                  "destLoc.loc": { $geoWithin: { $centerSphere: [ terminal.loc, 0 ]}}
                }).then(requestsAsDest=>{
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
          // if terminal is dest, check for dest terminal to remove
          return new Promise((resolve, reject)=>{
            TripRequestSchema.findAsync({
              tripRequestStatus: {$in: tripRequestStatus},
              "srcLoc.loc": { $geoWithin: { $centerSphere: [ terminal.loc, 0 ]}}
            }).then(requestsAsSrc=>{
              if(requestsAsSrc && requestsAsSrc.length) {
                return resolve(resObj.dest=false);
              } else {
                TripRequestSchema.findAsync({
                  tripRequestStatus: {$in: tripRequestStatus},
                  "destLoc.loc": { $geoWithin: { $centerSphere: [ terminal.loc, 0 ]}}
                }).then(requestsAsDest=>{
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
    return new Promise((resolve, reject)=>{
      checkIfToRemoveRequestSrcDest(tripRequestData)
      .then(srcDestToRemove=>{
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

        /**
         * if src/dest has pending requests either to enroute/complete remove it's id from visitedterminalids of the trip
         */

        let tripUpdateData = {
          $set: {
            "driver.route.terminals":newDriverTerminal
          }
        }

        if(!srcDestToRemove.src) {
          tripUpdateData['$pull'] = {
            visitedTerminalIds: tripRequestData.srcLoc._id
          }
        } else if (!srcDestToRemove.dest) {
          tripUpdateData['$pull'] = {
            visitedTerminalIds: tripRequestData.destLoc._id
          }
        } else if (!srcDestToRemove.src && !srcDestToRemove.dest) {
          tripUpdateData['$pull'] = {
            visitedTerminalIds: {$in: [tripRequestData.srcLoc._id, tripRequestData.destLoc._id]}
          }
        }

        TripSchema.findOneAndUpdateAsync({ _id: tripRequestData.tripId }, tripUpdateData, {new: true})
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

  function sendCustomMessageToRider(adminId,tripRequest) {
    UserSchema.findOneAsync({_id: adminId},{custom_message:1}).then(adminCustomMessage=>{
      if(adminCustomMessage && adminCustomMessage.custom_message){
        UserSchema.findOneAsync({_id: tripRequest.riderId},{isdCode:1,phoneNo:1}).then(riderDetailsMsg=>{
          var phoneDetails={
            isdCode:riderDetailsMsg.isdCode,
            phoneNo:riderDetailsMsg.phoneNo
          }
          var smsText=adminCustomMessage.custom_message;
          sendSmsUpdateMobile(phoneDetails, smsText, (err /* , data */) => {
            if (!err) {

            }
          });
        }).catch((e) => {
          const err = new APIError(`Error occured while sending custom message ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          throw err;
        });
      }
    }).catch((e) => {
      const err = new APIError(`Error occured while sending custom message ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
     throw err;
    });
  }
}

export default updateTripRequestHandler;
