import moment from 'moment';
import TripSchema from '../models/trip';
import * as TRIP_REQUEST_STATUS from '../constants/trip-request-statuses';
import ScheduledTripRequestSchema from '../models/scheduledTripRequest';
import TripRequestSchema from '../models/tripRequest';
import UserSchema from '../models/user';
import * as ScheduledRequestStatus from '../constants/schedule-request-statuses';
import SOCKET_EVENTS from '../constants/socket-events';
import * as PushNotification from '../service/pushNotification';
import SocketStore from '../service/socket-store';

const getAcceptedRequestsNextHourAsync = () => {
  return new Promise(async (resolve,reject)=>{
    try {
      let currentDate = moment();
      // convert current date into utc to compare with db stored utc scheduled time
      currentDate.utc();

      let nextOneHourDate = currentDate.add(1, 'hours');

      const dateToMatch = nextOneHourDate.format("YYYY-MM-DD HH:mm");

      let queryFilters = [{
        isDeleted: false,
        status: ScheduledRequestStatus.TRIP_REQUEST_ACCEPTED,
        scheduledTimePart: dateToMatch
      }]

      let query = {$and: queryFilters};

      let pipelineStages = [
        {
          $lookup: {
            from: "users",
            localField: "assignedTo",
            foreignField: "_id",
            as: "driverInfo"
          }
        },
        {
          $unwind: {
            path: "$driverInfo",
            preserveNullAndEmptyArrays: true
          }
        },{
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByInfo"
          }
        },
        {
          $unwind: {
            path: "$createdByInfo",
            preserveNullAndEmptyArrays: true
          }
        },{
          $lookup: {
            from: "users",
            localField: "riderId",
            foreignField: "_id",
            as: "riderInfo"
          }
        },
        {
          $unwind: {
            path: "$riderInfo",
            preserveNullAndEmptyArrays: true
          }
        },{
          $project: {
            scheduledTimePart: {$dateToString: { format: "%Y-%m-%d %H:%M", date: "$scheduledTime"}},
            riderId: "$riderId",
            createdBy: "$createdBy",
            srcLoc: "$srcLoc",
            destLoc: "$destLoc",
            requestTime: "$requestTime",
            requestUpdatedTime: "$requestUpdatedTime",
            scheduledTime: "$scheduledTime",
            seatBooked: "$seatBooked",
            assignedTo: "$assignedTo",
            status: "$status",
            isDeleted: "$isDeleted",
            driverDetails:{
              _id: "$driverInfo._id",
              name:"$driverInfo.name",
              profileUrl:"$driverInfo.profileUrl"
            },
            riderDetails:{
              _id: "$riderInfo._id",
              name:"$riderInfo.name",
              profileUrl:"$riderInfo.profileUrl"
            },
            createBYDetails:{
              _id: "$createdByInfo._id",
              name:"$createdByInfo.name",
              isdCode: "$createdByInfo.isdCode",
              phoneNo: "$createdByInfo.phoneNo"
            }
          }
        }
      ]

      pipelineStages.push({$match: query});
      const requestsFound = await ScheduledTripRequestSchema.aggregateAsync(pipelineStages);
      return resolve(requestsFound);

    } catch (error) {
      return reject(error);
    }
  })
};

const getRequestsToNotifyIfNoActiveTrip = () => {
  return new Promise(async (resolve,reject)=>{
    try {
      let currentDate = moment();
      // convert current date into utc to compare with db stored utc scheduled time
      currentDate.utc();

      let nextOneHourDate = currentDate.add(30, 'minutes');

      const dateToMatch = nextOneHourDate.format("YYYY-MM-DD HH:mm");

      let queryFilters = [{
        isDeleted: false,
        status: ScheduledRequestStatus.TRIP_REQUEST_ACCEPTED,
        scheduledTimePart: dateToMatch
      }]

      let query = {$and: queryFilters};

      let pipelineStages = [
        {
          $lookup: {
            from: "users",
            localField: "assignedTo",
            foreignField: "_id",
            as: "driverInfo"
          }
        },
        {
          $unwind: {
            path: "$driverInfo",
            preserveNullAndEmptyArrays: true
          }
        },{
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByInfo"
          }
        },
        {
          $unwind: {
            path: "$createdByInfo",
            preserveNullAndEmptyArrays: true
          }
        },{
          $lookup: {
            from: "users",
            localField: "riderId",
            foreignField: "_id",
            as: "riderInfo"
          }
        },
        {
          $unwind: {
            path: "$riderInfo",
            preserveNullAndEmptyArrays: true
          }
        },{
          $project: {
            scheduledTimePart: {$dateToString: { format: "%Y-%m-%d %H:%M", date: "$scheduledTime"}},
            riderId: "$riderId",
            adminId: "$adminId",
            createdBy: "$createdBy",
            srcLoc: "$srcLoc",
            destLoc: "$destLoc",
            requestTime: "$requestTime",
            requestUpdatedTime: "$requestUpdatedTime",
            scheduledTime: "$scheduledTime",
            seatBooked: "$seatBooked",
            assignedTo: "$assignedTo",
            status: "$status",
            isDeleted: "$isDeleted",
            driverDetails:{
              _id: "$driverInfo._id",
              name:"$driverInfo.name",
              profileUrl:"$driverInfo.profileUrl"
            },
            riderDetails:{
              _id: "$riderInfo._id",
              name:"$riderInfo.name",
              profileUrl:"$riderInfo.profileUrl"
            },
            createBYDetails:{
              _id: "$createdByInfo._id",
              name:"$createdByInfo.name",
              isdCode: "$createdByInfo.isdCode",
              phoneNo: "$createdByInfo.phoneNo"
            }
          }
        }
      ]

      pipelineStages.push({$match: query});
      const requestsFound = await ScheduledTripRequestSchema.aggregateAsync(pipelineStages);
      return resolve(requestsFound);

    } catch (error) {
      return reject(error);
    }
  })
};

const getRequestsToProcessAsync = () => {
  return new Promise(async (resolve,reject)=>{
    try {
      let currentDate = moment();
      // convert current date into utc to compare with db stored utc scheduled time
      currentDate.utc();

      const dateToMatch = currentDate.format("YYYY-MM-DD HH:mm");

      let queryFilters = [{
        isDeleted: false,
        status: ScheduledRequestStatus.TRIP_REQUEST_ACCEPTED,
        scheduledTimePart: dateToMatch
      }]

      let query = {$and: queryFilters};

      let pipelineStages = [
        {
          $lookup: {
            from: "users",
            localField: "assignedTo",
            foreignField: "_id",
            as: "driverInfo"
          }
        },
        {
          $unwind: {
            path: "$driverInfo",
            preserveNullAndEmptyArrays: true
          }
        },{
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByInfo"
          }
        },
        {
          $unwind: {
            path: "$createdByInfo",
            preserveNullAndEmptyArrays: true
          }
        },{
          $lookup: {
            from: "users",
            localField: "riderId",
            foreignField: "_id",
            as: "riderInfo"
          }
        },{
          $unwind: {
            path: "$riderInfo",
            preserveNullAndEmptyArrays: true
          }
        },{
          $project: {
            scheduledTimePart: {$dateToString: { format: "%Y-%m-%d %H:%M", date: "$scheduledTime"}},
            riderId: "$riderId",
            createdBy: "$createdBy",
            srcLoc: "$srcLoc",
            destLoc: "$destLoc",
            requestTime: "$requestTime",
            requestUpdatedTime: "$requestUpdatedTime",
            scheduledTime: "$scheduledTime",
            seatBooked: "$seatBooked",
            assignedTo: "$assignedTo",
            status: "$status",
            isDeleted: "$isDeleted",
            driverDetails:{
              _id: "$driverInfo._id",
              name:"$driverInfo.name",
              profileUrl:"$driverInfo.profileUrl"
            },
            riderDetails:{
              _id: "$riderInfo._id",
              name:"$riderInfo.name",
              profileUrl:"$riderInfo.profileUrl"
            },
            createBYDetails:{
              _id: "$createdByInfo._id",
              name:"$createdByInfo.name",
              isdCode: "$createdByInfo.isdCode",
              phoneNo: "$createdByInfo.phoneNo"
            }
          }
        }
      ]

      pipelineStages.push({$match: query});
      const requestsFound = await ScheduledTripRequestSchema.aggregateAsync(pipelineStages);
      return resolve(requestsFound);

    } catch (error) {
      return reject(error);
    }
  })
};

const creatNewTripRequestAsync = (scheduledTripRequest, trip) => {
  var  tripRequestObj = new TripRequestSchema({
    riderId: scheduledTripRequest.riderId,
    driverId: scheduledTripRequest.driverId,
    tripId: trip._id,
    adminId: scheduledTripRequest.adminId,
    seatBooked:scheduledTripRequest.seatBooked,
    srcLoc:scheduledTripRequest.srcLoc,
    destLoc:scheduledTripRequest.destLoc,
    isScheduled: true,
    scheduledRequestId: scheduledTripRequest._id,
    tripRequestStatus:TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT
  });

  return tripRequestObj.saveAsync();
}

const notifyDriverAdminTripStatus = (driverId, event, payload) => {
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

const  sendRequestToDriverAsync = (tripRequestObj, driver)=>{

  return new Promise(async (resolve, reject)=>{
    try {
      if(tripRequestObj) {
        // eslint-disable-next-line
        let resToDriver = {...tripRequestObj._doc};
        let riderDetailsToDriver = {
          name: 1, email: 1, profileUrl:1, phoneNo:1, isdCode:1
        }
        let riderDetails = await UserSchema.findOneAsync(tripRequestObj.riderId, riderDetailsToDriver);
        console.log("riderDetails to driver", JSON.stringify(riderDetails));
        resToDriver.riderDetails = riderDetails;
        SocketStore.emitByUserId(driver._id, 'requestDriver', {success: true, message: "Request received", data: resToDriver});
        notifyDriverAdminTripStatus(driver._id, 'requestAdmin', {success: true, message: "Request received", data: resToDriver});
        let pushData = {
          payload: { success: true, message: 'Request Sent to the driver', data: resToDriver },
          body: `New request received from the rider: ${resToDriver.riderDetails.name}`,
          title: 'New Request received'
        }
        PushNotification.sendNotificationByUserIdAsync(driver._id, pushData);
        let udpatedTrip = await TripSchema.findOneAndUpdateAsync({'driver._id': tripRequestObj.driverId, activeStatus: true},{ $addToSet: { tripRequests: tripRequestObj } }, {new: true})
        let resData = {
          tripRequest: tripRequestObj,
          driver: driver
        }
        return resolve(resData)
      } else {
        return resolve(null);
      }
    } catch (error) {
      return reject(error);
    }
  })
}

export const notifyNextHourAcceptedRequest = async () => {
  try {
    let requestsFound = await getAcceptedRequestsNextHourAsync();
    if(requestsFound && requestsFound.length) {
      requestsFound.forEach((request, index)=>{
        // notify rider via socket event
        let eventPayload = { success: true, message: `You have scheduled trip after 1 hour`, data: request };
        SocketStore.emitByUserId(
          request.riderId,
          SOCKET_EVENTS.scheduled_trip_notification,
          eventPayload
        );
        console.log(`request found>>>>${index}`, JSON.stringify(request));
        let pushData = {
          payload: { success: true, message: 'You have scheduled trip after 1 hour', data: null },
          body: `Scheduled request - scheduled trip after 1 hour`,
          title: 'Scheduled request - scheduled trip after 1 hour'
        }

        PushNotification.sendNotificationByUserIdAsync(request.riderId, pushData);

        // notify driver via socket event
        eventPayload = { success: true, message: `You have scheduled trip after 1 hour`, data: request };
        SocketStore.emitByUserId(
          request.assignedTo,
          SOCKET_EVENTS.scheduled_trip_notification,
          eventPayload
        );
        console.log(`request found>>>>${index}`, JSON.stringify(request));
        pushData = {
          payload: { success: true, message: 'You have scheduled trip after 1 hour', data: null },
          body: `Scheduled request - You have scheduled trip after 1 hour`,
          title: 'Scheduled request - You have scheduled trip after 1 hour'
        }
        PushNotification.sendNotificationByUserIdAsync(request.assignedTo, pushData);
      })
    } else {
      console.log("getAcceptedRequestsNextHour result >>>>>>> ", requestsFound);
    }
  } catch (error) {
    console.log('getAcceptedRequestsNextHour error>>>>', error);
  }
};

export const notifyIfDriverNotActive = async () => {
  try {
    let requestsFound = await getRequestsToNotifyIfNoActiveTrip();

    if(requestsFound && requestsFound.length) {
      requestsFound.forEach(async (request, index)=>{
        // check driver trip if active
        let activeTripQuery = {
          activeStatus: true, "driver._id": request.assignedTo
        }
        const driverActiveTrip = await TripSchema.findOneAsync(activeTripQuery);
        console.log("check driver trip if active-trip", JSON.stringify(driverActiveTrip));
        if(driverActiveTrip) {
          return true;
        }

        const assignedDriver = await UserSchema.findOneAsync({_id: request.assignedTo});
        console.log("check driver trip if active-driver assigned", JSON.stringify(assignedDriver));
        if(!assignedDriver) {
          // need to discuss what should be done
          return true;
        } else if (assignedDriver.isDeleted) {
          // need to discuss what should be done
          return true;
        }
        // notify admin via socket event
        let eventPayload = {
          success: true,
          message: `Driver has scheduled trip after 30 min, but no active trip. Please contact +${assignedDriver.isdCode}${assignedDriver.phoneNo}`,
          data: request
        };

        SocketStore.emitByUserId(
          request.adminId,
          SOCKET_EVENTS.no_active_trip,
          eventPayload
        );
        console.log(`request found>>>>${index}`, JSON.stringify(request));
        let pushData = {
          payload: { success: true, message: 'Driver has no active trip', data: null },
          body: `Scheduled request - Driver has no active trip`,
          title: 'Scheduled request - Driver has no active trip'
        }
        PushNotification.sendNotificationByUserIdAsync(request.adminId, pushData);

        // notify driver via socket event
        eventPayload = { success: true, message: `You have scheduled trip in 30 min, please activate trip`, data: request };
        SocketStore.emitByUserId(
          request.assignedTo,
          SOCKET_EVENTS.no_active_trip,
          eventPayload
        );
        console.log(`request found>>>>${index}`, JSON.stringify(request));
        pushData = {
          payload: { success: true, message: 'You have scheduled trip after 30 min, please activate trip', data: null },
          body: `Scheduled request - scheduled trip after 30 min`,
          title: 'Scheduled request - scheduled trip after 30 min'
        }
        PushNotification.sendNotificationByUserIdAsync(request.assignedTo, pushData);
      })
    } else {
      console.log("getAcceptedRequestsNextHour result >>>>>>> ", requestsFound);
    }
  } catch (error) {
    console.log('getAcceptedRequestsNextHour error>>>>', error);
  }
};

export const processScheduledRequests = async () => {
  try {
    let requestsFound = await getRequestsToProcessAsync();
    if(requestsFound && requestsFound.length) {

      let processRequestsAsync = requestsFound.map((request, index)=>{
        /**
         * 1. check if the assigned driver has active trip
         * 2. create new trip request
         * 3. update scheduled request with trip id
         * 2. send new request to the driver assigned
         */
        return new Promise(async (resolve, reject)=>{
          try {
            let promiseResult = {success:false, message: '', data: {scheduledTripRequest: request, activeTrip: null, newTripRequest: null} };
            let queryTripSchema = {"driver._id":  request.assignedTo, activeStatus:true};
            let activeTrip = await TripSchema.findOneAsync(queryTripSchema);

            if(!activeTrip) {
              promiseResult.success = false;
              promiseResult.message = "Assigned driver has no active trip";
              // notify admin about driver did not active trip
              SocketStore.emitByUserId(request.adminId, 'noDriverActiveScheduleTrip', { success: false, message: 'No active trip for the driver', data: null });
              return resolve(promiseResult);
            }

            let newTripRequest = await creatNewTripRequestAsync(request, activeTrip);
            // update scheduled request with trip id
            let scheduleRequestUpdate = {
              tripId: activeTrip._id,
              tripRequestId: newTripRequest._id
            };

            let updatedScheduleRequest = await ScheduledTripRequestSchema.findOneAndUpdate({_id: request._id}, scheduleRequestUpdate, {new: true});

            console.log("updatedScheduleRequest", JSON.stringify(updatedScheduleRequest))
            // send request to the driver

            let requestSentResponse = await sendRequestToDriverAsync(newTripRequest, activeTrip.driver)
            if(requestSentResponse) {
              SocketStore.emitByUserId(requestSentResponse.tripRequest && requestSentResponse.tripRequest.riderId && requestSentResponse.tripRequest.riderId,
                'rideRequestSentToDriver', { success: true,
                  message: 'Request Sent to the driver', data: requestSentResponse.tripRequest });
              let pushData = {
                payload: { success: true, message: 'Request Sent to the driver', data: requestSentResponse.tripRequest },
                body: `Request has been sent to the driver: ${requestSentResponse.driver.name}`,
                title: 'New Request'
              }
              PushNotification.sendNotificationByUserIdAsync(requestSentResponse.tripRequest.riderId, pushData);
            }

          } catch (error) {
            return reject (error)
          }
        })
      })

      let processedAllRequests = Promise.all(processRequestsAsync);
      console.log("auto processedAllRequests", JSON.stringify(processedAllRequests));
    } else {
      console.log("getAcceptedRequestsNextHour result >>>>>>> ", requestsFound);
    }

  } catch (error) {
    console.log('getAcceptedRequestsNextHour error>>>>', error);
  }
};
