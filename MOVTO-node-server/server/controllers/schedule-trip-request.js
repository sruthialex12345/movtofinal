import httpStatus from 'http-status';
import _ from 'underscore';
import mongoose, { Query } from 'mongoose';
var randomstring = require("randomstring");
import APIError from '../helpers/APIError';
import Util from '../helpers/util';
import config from '../../config/env';
import * as USER_TYPES from '../constants/user-types';
import * as  SCHEDULE_TRIP_REQUEST_STATUS from '../constants/schedule-request-statuses';
import SOCKET_EVENTS from '../constants/socket-events';
import SocketStore from '../service/socket-store';
import * as PushNotification from '../service/pushNotification';
import { sendSms } from '../service/smsApi';
import ScheduleTripRequestSchema from '../models/scheduledTripRequest';
import UserSchema from '../models/user';
import AdminLocation from '../models/adminLocation';

import moment from 'moment';

/**
 * Return the trip details of the user.
 * @param req
 * @param res
 * @param next
 * @returns { trip: historyObjArray[{ tripObj }]  }
 */

export const getScheduledTripRequests = (req, res, next) => {
  const {
    pageNo,
    limit = req.query.limit && parseInt(req.query.limit) || config.limit,
    status, fromDate, toDate, fromTime, toTime
  } = req.query;

  const skip = pageNo ? (parseInt(pageNo) - 1) * limit : config.skip;

  let queryFilters = [{
    isDeleted: false
  }]

  if(req.user.userType == USER_TYPES.USER_TYPE_RIDER) {
    let riderQuery = {
      $or: [{createdBy: mongoose.Types.ObjectId(req.user._id)}, {riderId: mongoose.Types.ObjectId(req.user._id)}]
    }
    queryFilters.push(riderQuery);
  }

  if(req.user.userType == USER_TYPES.USER_TYPE_ADMIN) {
    let adminQuery = {
      $or: [{createdBy: mongoose.Types.ObjectId(req.user._id)}, {adminId: mongoose.Types.ObjectId(req.user._id)}]
    }
    queryFilters.push(adminQuery);
  }

  if(req.user.userType == USER_TYPES.USER_TYPE_DRIVER) {
    let driverQuery = {
      assignedTo: mongoose.Types.ObjectId(req.user._id)
    }
    queryFilters.push(driverQuery);
  }

  if(status && status.length) {
    queryFilters.push({status: {$in: status.split(',')}})
  }

  if(fromDate && fromDate!="") {
    queryFilters.push({scheduledTime: {$gte: new Date(fromDate)}})
  }

  if(toDate && toDate!="") {
    queryFilters.push({scheduledTime: {$lte: new Date(toDate)}})
  }

  if(fromTime && fromTime!="") {
    queryFilters.push({scheduledTimePart: {$gte: fromTime}})
  }

  if(toTime && toTime!="") {
    queryFilters.push({scheduledTimePart: {$lte: toTime}})
  }

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
        scheduledTimePart: {$dateToString: { format: "%H:%M:%S:%L", date: "$scheduledTime"}},
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
          profileUrl:"$riderInfo.profileUrl",
          isdCode: "$riderInfo.isdCode",
          phoneNo: "$riderInfo.phoneNo"
        },
        createBYDetails:{
          _id: "$createdByInfo._id",
          name:"$createdByInfo.name",
          isdCode: "$createdByInfo.isdCode",
          phoneNo: "$createdByInfo.phoneNo"
        }
      },
    }
  ]

  pipelineStages.push({$match: query});


  ScheduleTripRequestSchema.aggregateAsync(pipelineStages)
  .then(totalRecord => {
    console.log("totalRecord", totalRecord.length)
    const returnObj = {
      success: true,
      message: `no of trips are zero`, // `no of active drivers are ${returnObj.data.length}`;
      data: null,
      meta: {
        totalNoOfPages: Math.ceil(totalRecord.length / limit),
        limit,
        currPageNo: pageNo,
        currNoOfRecord: 0,
      },
    };
    if (totalRecord.length < 1) {
      return res.send(returnObj);
    }
    if(limit && skip) {
      pipelineStages.push({ "$limit": parseInt(skip) + parseInt(limit) });
    } else if (limit) {
      pipelineStages.push({ "$limit": parseInt(limit) });
    }

    if(skip) {
      pipelineStages.push({ "$skip": parseInt(skip) });
    }
    ScheduleTripRequestSchema.aggregateAsync(pipelineStages)
    .then((userData) => {
      returnObj.data = userData;
      returnObj.message = `Trips found`;
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      return res.send(returnObj);
    })
    .catch((err) => {
      console.log("Error occured while counting the no of trips>>>>>>", err);
      let error = new APIError(`Error occured while counting the no of trips`, httpStatus.INTERNAL_SERVER_ERROR, true);
      next(error);
    });
  })
  .catch((e) => {
    console.log("Error occured while counting the no of trips>>>>>>222222222", e);
    let error = new APIError(`Error occured while counting the no of trips11111>>>`, httpStatus.INTERNAL_SERVER_ERROR, true);
    next(error);
  });
};

export const saveScheduleTripRequest = async (req, res, next) => {
  const reqData = req.body;
  reqData.createdBy = req.user._id;
  const returnObj = { success: false, message: '', data: null };
  console.log("reqData>>>>>>>>", reqData);
  let riderId = null;
  let adminId = req.body.adminId || null;
  if((req.user.userType == USER_TYPES.USER_TYPE_ADMIN)) {
    adminId = req.user._id;
    reqData.adminId = adminId;
  }
  if((req.user.userType== USER_TYPES.USER_TYPE_RIDER) && (!adminId || (adminId=="")) ) {
    returnObj.message = 'Service Provider invalid';
    return res.send(returnObj);
  }
  // validate schedule request data

  /**
   * 1. holiday
   * 2. working hours daywise
   * 3. in between next seven days
   * 4. if admin allow scheduling
   * 5. if src and dest location exist within admin added locations
   */

   /**
    * check service provider settings isOperatorAssigned
    * 1. if operator assigned notify admin to assign driver (currently required feature)
    * 2. else at scheduled time look for available drivers at scheduled (need to confirm, on hold)
    */

  try {
    const result = await validateReqAdminSettingsAsync(reqData);

    if(!result.success) {
      returnObj.message = result.message;
      return res.send(returnObj);
    }

    if(req.user.userType === USER_TYPES.USER_TYPE_ADMIN) {
      adminId = req.user._id;
      // check if user exist with phone No and rider type
      let query = {
        phoneNo: reqData.phoneNo,
        isdCode: reqData.isdCode,
        userType: {$in: [USER_TYPES.USER_TYPE_RIDER, USER_TYPES.USER_TYPE_ANONYMOUS]}
      }

      console.log("checking user/rider query", query);
      UserSchema.findOneAsync(query)
      .then(async (userFound) => {
        console.log("checking user query found user", userFound);
        if (userFound) {
          riderId = userFound._id;
          reqData.riderId = riderId;
          reqData.adminId = adminId;
          if(reqData.requestId && (reqData.requestId != "")) {
            updateScheduleRequestAsync(reqData, req).then(result=>{
              return res.send(result);
            }).catch(err=>{
              next(err);
            })
          } else {
            addScheduleRequestAsync(reqData, req).then(result=>{
              return res.send(result);
            }).catch(err=>{
              next(err);
            })
          }

        } else {
          reqData.adminId = adminId;

          // validate source and dest

          try {
            let isValid = await validateSrcDestLocationsAsync(reqData);
            if(!isValid) {
              returnObj.message = "No service at this location";
              return res.send(returnObj);
            }
          } catch (err) {
            returnObj.success= false;
            returnObj.message= `Something went wrong while checking locations`;
            console.log("saveRiderDetails", err);
            return res.send(returnObj);
          }

          saveAnonymousRider(reqData)
          .then((saveRiderDetailsResult) => {
            riderId = saveRiderDetailsResult._id;
            reqData.riderId = riderId;
            // send sms with app link to sign up and update same anonymous user on signup
            if(reqData.requestId && (reqData.requestId != "")) {
              updateScheduleRequestAsync(reqData, req).then(result=>{
                return res.send(result);
              }).catch(err=>{
                next(err);
              })
            } else {
              addScheduleRequestAsync(reqData, req).then(result=>{
                return res.send(result);
              }).catch(err=>{
                next(err);
              })
            }
          }).catch(e=>{
            returnObj.success= false;
            returnObj.message= `Something went wrong while save Rider Details`;
            console.log("saveRiderDetails", e);
            return res.send(returnObj);
          })
        }
      })
      .catch((err) => {
        console.log("Error while checking if user exist", err);
        let error = new APIError(`Something went wrong`, httpStatus.INTERNAL_SERVER_ERROR, true);
        return next(error);
      });

    } else if (req.user.userType === USER_TYPES.USER_TYPE_DRIVER) {

      if(!reqData.phoneNo ||(reqData.phoneNo == "")) {
        returnObj.message = "Phone No is required";
        return res.send(returnObj);
      }

      if(!reqData.isdCode ||(reqData.isdCode == "")) {
        returnObj.message = "ISD code is required";
        return res.send(returnObj);
      }

      adminId = req.user.adminId;
      // check if user exist with phone No and rider type
      let query = {
        phoneNo: reqData.phoneNo,
        isdCode: reqData.isdCode,
        userType: {$in: [USER_TYPES.USER_TYPE_RIDER, USER_TYPES.USER_TYPE_ANONYMOUS]}
      }
      UserSchema.findOneAsync(query)
      .then(async (userFound) => {
        if (userFound) {
          riderId = userFound._id;

          reqData.riderId = riderId;
          reqData.adminId = adminId;

          if(reqData.requestId && (reqData.requestId != "")) {
            updateScheduleRequestAsync(reqData, req).then(result=>{
              return res.send(result);
            }).catch(err=>{
              next(err);
            })
          } else {
            addScheduleRequestAsync(reqData, req).then(result=>{
              return res.send(result);
            }).catch(err=>{
              next(err);
            })
          }

        } else {
          reqData.adminId = adminId;

          try {
            let isValid = await validateSrcDestLocationsAsync(reqData);
            if(!isValid) {
              returnObj.message = "No service at this location";
              return res.send(returnObj);
            }
          } catch (err) {
            returnObj.success= false;
            returnObj.message= `Something went wrong while checking locations`;
            console.log("saveRiderDetails", err);
            return res.send(returnObj);
          }

          saveAnonymousRider(reqData)
          .then((saveRiderDetailsResult) => {
            riderId = saveRiderDetailsResult._id;
            reqData.riderId = riderId;

            if(reqData.requestId && (reqData.requestId != "")) {
              updateScheduleRequestAsync(reqData, req).then(result=>{
                return res.send(result);
              }).catch(err=>{
                next(err);
              })
            } else {
              addScheduleRequestAsync(reqData,req).then(result=>{
                return res.send(result);
              }).catch(err=>{
                next(err);
              })
            }
          }).catch(e=>{
            returnObj.success= false;
            returnObj.message= `Something went wrong while save Rider Details`;
            console.log("saveRiderDetails", e);
            return res.send(returnObj);
          })
        }
      })
      .catch((err) => {
        console.log("Error while checking if user exist", err);
        let error = new APIError(`Something went wrong`, httpStatus.INTERNAL_SERVER_ERROR, true);
        return reject(error);
      });
    } else {
      reqData.riderId = req.user._id;
      reqData.adminId = adminId;

      if(reqData.requestId && (reqData.requestId != "")) {
        updateScheduleRequestAsync(reqData,req).then(result=>{
          return res.send(result);
        }).catch(err=>{
          next(err);
        })
      } else {
        addScheduleRequestAsync(reqData, req).then(result=>{
          return res.send(result);
        }).catch(err=>{
          next(err);
        })
      }
    }
  } catch (err) {
    console.log("Error while validating request", err);
    let error = new APIError(`Error while validating request`, httpStatus.INTERNAL_SERVER_ERROR, true);
    return next(error);
  }

};

export const updateCancelRide = (req, res, next) => {
  const newStatus=SCHEDULE_TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED;
  const returnObj = {
    data: null,
    message: ``,
    success: false
  };

  if(req.body.requestId == "") {
    returnObj.message = "Invalid trip request id";
    return res.send(returnObj);
  }

  ScheduleTripRequestSchema.findOneAndUpdateAsync({ _id: req.body.requestId ,isDeleted:false}, { $set: { status: newStatus} }, { new: true })
  .then((updatedData)=>{
    if(!updatedData) {
      returnObj.message = "Request not found";
      return res.send(returnObj);
    }
    returnObj.success = true;
    returnObj.message = "Request Cancelled";
    returnObj.data = updatedData;

    /**
     * 1. notify rider and driver(if assigned) if admin cancel the request
     * 2. notify admin and driver (if assigned) if rider cancel the request
     */

    // 1. notify rider and driver(if assigned) if admin cancel the request
    if(req.user.userType == USER_TYPES.USER_TYPE_ADMIN) {
      let pushData = {
        payload: { success: true, message: 'Driver assigned', data: null },
        body: `Scheduled request - Admin cancelled request`,
        title: 'Scheduled request - Admin cancelled request'
      }
      let socketPayload = {success: true, message: `Request cancelled`, data:  updatedData};

      SocketStore.emitByUserId(updatedData.riderId, SOCKET_EVENTS.schedule_request_updated_rider, socketPayload);
      PushNotification.sendNotificationByUserIdAsync(updatedData.riderId, pushData);
      if(updatedData.assignedTo) {
        SocketStore.emitByUserId(updatedData.assignedTo, SOCKET_EVENTS.schedule_request_updated_driver, socketPayload);
        PushNotification.sendNotificationByUserIdAsync(updatedData.assignedTo, pushData);
      }
    }
    // 2. notify admin and driver (if assigned) if rider cancel the request
    if(req.user.userType == USER_TYPES.USER_TYPE_RIDER) {
      let pushData = {
        payload: { success: true, message: 'Request cancelled', data: null },
        body: `Scheduled request - Admin cancelled request`,
        title: 'Scheduled request - Admin cancelled request'
      }

      let socketPayload = {success: true, message: `Request cancelled`, data:  updatedData};
      // notify admin
      SocketStore.emitByUserId(updatedData.adminId, SOCKET_EVENTS.schedule_request_updated_admin, socketPayload);
      PushNotification.sendNotificationByUserIdAsync(updatedData.adminId, pushData);
      // notify driver
      if(updatedData.assignedTo) {
        SocketStore.emitByUserId(updatedData.assignedTo, SOCKET_EVENTS.schedule_request_updated_driver, socketPayload);
        PushNotification.sendNotificationByUserIdAsync(updatedData.assignedTo, pushData);
      }
    }
    res.send(returnObj);
  }).catch((err)=>{
    next(err);
  })
};

export const adminDriversList = (req, res, next) => {

  var filter = {userType: 'driver',isActive:true,isDeleted:false, adminId: req.user._id};
  if(req.query.name) {
    let text = req.query.name;
    // var regex = new RegExp('[\\?&]' + text + '=([^&#]*)', 'i');
    filter.name = { $regex: text, $options: 'i' }
  }

  const { pageNo, limit = config.limit } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  // find all driver under the same admin
  UserSchema.countAsync(filter)
  // eslint-disable-next-line
  .then(totalDriversRecord => {
    const returnObj = {
      success: true,
      message: `Drivers found`,
      data: null,
      meta: {
        totalNoOfPages: Math.ceil(totalDriversRecord / limit),
        limit,
        currPageNo: pageNo,
        currNoOfRecord: 0,
      },
    };
    if (totalDriversRecord < 1) {
      return res.send(returnObj);
    }
    if (skip > totalDriversRecord) {
      const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
      return next(err);
    }
    UserSchema.find(filter, {name: 1, email:1, phoneNo:1, profileUrl:1})
    .limit(limit)
    .skip(skip)
    .then((driversRecord) => {
      returnObj.data = driversRecord;
      returnObj.message = `drivers found`;
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      return res.send(returnObj);
    })
    .catch((err) => {
      var err = new APIError(`Error finding vehicles`, httpStatus.INTERNAL_SERVER_ERROR, true);
      res.send('Error', err);
    });
  })
  .error((e) => {
    const err = new APIError(`error occured while counting the no of users ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    debug('error inside getAllDrivers records');
    next(err);
  })
}

export const assignDriver = async (req, res, next) => {

  console.log("                ");
console.log("                ");
console.log("                ");
console.log("    PushNotification.sendNotificationByUserIdAsync    req",req.body);
console.log("                ");
console.log("                ");
  const {driverId, requestId, isAssign} = req.body;
  let returnObj = {success:false, message:'', data:null};
  if(req.user.userType !== USER_TYPES.USER_TYPE_ADMIN) {
    returnObj.message = "Unauthorized";
    return res.send(returnObj);
  }

  let queryDriver={
    _id: driverId
  }

  try {
    const foundDriver = await UserSchema.findOneAsync(queryDriver, {isDeleted:1, email:1, profileUrl:1, isdCode: 1, phoneNo:1});
    console.log("foundDriver>>>>>", JSON.stringify(foundDriver));
    if(!foundDriver){
      returnObj.message = "Driver not found";
      return res.send(returnObj)
    } else {
      if(foundDriver.isDeleted) {
        returnObj.message = "Driver was deleted";
        return res.send(returnObj);
      }
      let updateAssign={
        assignedTo:foundDriver._id,
        status:SCHEDULE_TRIP_REQUEST_STATUS.TRIP_REQUEST_ASSIGNED,
        requestUpdatedTime:(new Date()).toISOString()
      }
      if(isAssign == false) {
        updateAssign.assignedTo = null;
        updateAssign.status = SCHEDULE_TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT
      }
      let scheduleTripToUpdate = await ScheduleTripRequestSchema.findOneAsync({_id:requestId});
      let prevDriverId = scheduleTripToUpdate.assignedTo;
      let finalResult = await ScheduleTripRequestSchema.findOneAndUpdate({_id:requestId},{$set:updateAssign}, {new: true})
      console.log("finalResult", JSON.stringify(finalResult));
      returnObj.data = finalResult;
      returnObj.success = true;
      returnObj.message = `Schedule trip requset updated`;
      /**
       * notify rider with driver detail
       */
      let eventData = {success: true, message: `Driver assigned`, data:  foundDriver};
      if(isAssign == false) {
        eventData.message = "Driver unassigned, you will have other driver assigned by admin";
      }
      SocketStore.emitByUserId(scheduleTripToUpdate.riderId, SOCKET_EVENTS.driver_assigned_request_rider, eventData);

      var pushData = {
        payload: { success: true, message: 'Driver assigned', data: null },
        body: `Scheduled request - Driver assigned`,
        title: 'Scheduled request - Driver assigned'
      }
      console.log("                ");
      console.log("                ");
      console.log("                ");
      console.log("    PushNotification.sendNotificationByUserIdAsync    foundDriver._id)        ",foundDriver._id);
      console.log("                ");
      console.log("    PushNotification.sendNotificationByUserIdAsync            ",pushData);
      console.log("                ");
      if(isAssign == true) {
        PushNotification.sendNotificationByUserIdAsync(foundDriver._id, pushData);
      }else{
        if(prevDriverId){
          pushData.payload.message = "Driver unassigned";
          pushData.body = "Scheduled request - Driver unassigned";
          pushData.title = "Scheduled request - Driver unassigned";
          PushNotification.sendNotificationByUserIdAsync(prevDriverId, pushData);
        }
        pushData.payload.message = "Driver unassigned, you will have other driver assigned by admin";
      }
      PushNotification.sendNotificationByUserIdAsync(scheduleTripToUpdate.riderId, pushData);
      /**
       * notify driver with socket event
       */
      let socketPayload = {success: true, message: `New request assigned`, data:  finalResult};
      socketPayload.data.isAssign = true;
      if(isAssign == false) {
        socketPayload.message = "Request unassigned";
        socketPayload.data.isAssign = false;
      }

      SocketStore.emitByUserId(foundDriver._id, SOCKET_EVENTS.schedule_request_assign_driver, socketPayload);
      /**
       * notify previous driver
       */
      if(prevDriverId && (!mongoose.Types.ObjectId(prevDriverId).equals(mongoose.Types.ObjectId(foundDriver._id))) && (isAssign == true)) {
        console.log("                ");
        console.log("  mongoose.Types.ObjectId(prevDriverId          ");

        let pushData = {
          payload: { success: true, message: 'Driver unassigned', data: null },
          body: `Scheduled request - Driver unassigned`,
          title: 'Scheduled request - Driver unassigned'
        }
        PushNotification.sendNotificationByUserIdAsync(prevDriverId, pushData);

        socketPayload.message = "Request unassigned";
        socketPayload.data.isAssign = false;
        SocketStore.emitByUserId(prevDriverId, SOCKET_EVENTS.schedule_request_assign_driver, socketPayload);
      }


      return res.send(returnObj)
    }
  } catch (error) {
    next(error);
  }
}

export const acceptRequest = async (req, res, next) => {
  const newStatus = SCHEDULE_TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED;
  const returnObj = {
    data: null,
    message: ``,
    success: false
  };

  if(req.user.userType != USER_TYPES.USER_TYPE_DRIVER) {
    returnObj.message = "Unauthorized";
    res.send(returnObj);
  }

  if(req.body.requestId == "") {
    returnObj.message = "Invalid trip request id";
    return res.send(returnObj);
  }

  try {

    let requestToUpdate = await ScheduleTripRequestSchema.findOneAsync({ _id: req.body.requestId});

    if(!requestToUpdate) {
      returnObj.message = "Request not found";
      return res.send(returnObj);
    }

    if(requestToUpdate.isDeleted) {
      returnObj.message = "Request was deleted";
      return res.send(returnObj);
    }

    if(requestToUpdate.status == SCHEDULE_TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
      returnObj.message = "Request was already accepted";
      return res.send(returnObj);
    }

    if(!requestToUpdate.assignedTo || (requestToUpdate.assignedTo == "")) {
      returnObj.message = "No driver assigned on the request";
      return res.send(returnObj);
    }

    if(!mongoose.Types.ObjectId(req.user._id).equals(mongoose.Types.ObjectId(requestToUpdate.assignedTo))) {
      returnObj.message = "Request may have assigned another driver";
      return res.send(returnObj);
    }

    let updatedData = await ScheduleTripRequestSchema.findOneAndUpdateAsync({ _id: req.body.requestId ,isDeleted:false}, { $set: { status: newStatus} }, { new: true })
    returnObj.success = true;
    returnObj.message = "Request Accepted";
    returnObj.data = updatedData;

    let socketPayload = {success: true, message: `Request accepted`, data:  updatedData};
    SocketStore.emitByUserId(requestToUpdate.adminId, SOCKET_EVENTS.schedule_request_updated_admin, socketPayload);

    SocketStore.emitByUserId(requestToUpdate.riderId, SOCKET_EVENTS.schedule_request_updated_rider, socketPayload);
    return res.send(returnObj);
  } catch (err) {
    next(err);
  }

};

export const rejectRequest = async (req, res, next) => {
  const newStatus = SCHEDULE_TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED;
  const returnObj = {
    data: null,
    message: ``,
    success: false
  };

  if(req.user.userType != USER_TYPES.USER_TYPE_DRIVER) {
    returnObj.message = "Unauthorized";
    res.send(returnObj);
  }

  if(req.body.requestId == "") {
    returnObj.message = "Invalid trip request id";
    return res.send(returnObj);
  }

  try {
    let requestToUpdate = await ScheduleTripRequestSchema.findOneAsync({ _id: req.body.requestId});
    if(!requestToUpdate) {
      returnObj.message = "Request not found";
      return res.send(returnObj);
    }

    if(requestToUpdate.status == SCHEDULE_TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED) {
      returnObj.message = "Request was already rejected";
      return res.send(returnObj);
    }

    if(requestToUpdate.isDeleted) {
      returnObj.message = "Request was deleted";
      return res.send(returnObj);
    }

    if(!requestToUpdate.assignedTo || (requestToUpdate.assignedTo == "")) {
      returnObj.message = "No driver assigned on the request";
      return res.send(returnObj);
    }

    if(!mongoose.Types.ObjectId(req.user._id).equals(mongoose.Types.ObjectId(requestToUpdate.assignedTo))) {
      returnObj.message = "Request may have assigned another driver";
      return res.send(returnObj);
    }

    let updatedData = await ScheduleTripRequestSchema.findOneAndUpdateAsync({ _id: req.body.requestId ,isDeleted:false}, { $set: { status: newStatus} }, { new: true })
    returnObj.success = true;
    returnObj.message = "Request rejected";
    returnObj.data = updatedData;
    // notify admin via socket event
    let socketPayload = {success: true, message: `Request rejected`, data:  updatedData};
    SocketStore.emitByUserId(requestToUpdate.adminId, SOCKET_EVENTS.schedule_request_updated_admin, socketPayload);
    SocketStore.emitByUserId(requestToUpdate.riderId, SOCKET_EVENTS.schedule_request_updated_rider, socketPayload);
    return res.send(returnObj);
  } catch (err) {
    next(err);
  }

};

function addScheduleRequestAsync(reqData, req) {
  let returnObj = {success:false, message:'', data:null};
  return new Promise(async (resolve, reject)=>{

    if((req.user.userType === USER_TYPES.USER_TYPE_ADMIN) || (req.user.userType === USER_TYPES.USER_TYPE_DRIVER)) {
      if(!reqData.phoneNo ||(reqData.phoneNo == "")) {
        returnObj.message = "Phone No is required";
        return res.send(returnObj);
      }

      if(!reqData.isdCode ||(reqData.isdCode == "")) {
        returnObj.message = "ISD code is required";
        return res.send(returnObj);
      }
    }

    if(!reqData.sourceLoc) {
      returnObj.message = "source is required";
      return resolve(returnObj);
    } else if (!reqData.destLoc) {
      returnObj.message = "destination is required";
      return resolve(returnObj);
    } else if (!reqData.seatBooked) {
      returnObj.message = "seats required";
      return resolve(returnObj);
    } else if (!reqData.scheduledTime) {
      returnObj.message = "schedule time is required";
      return resolve(returnObj);
    }

    let isValid = await validateSrcDestLocationsAsync(reqData);
    if(!isValid) {
      returnObj.message = "No service at this location";
      return resolve(returnObj);
    }


    // check if same request existing

    const result = checkIfSameRequestExistAsync({riderId: reqData.riderId, scheduledTime: reqData.scheduledTime, adminId: reqData.adminId});

    if(result.success) {
      returnObj.message = result.message;
      return resolve(returnObj);
    }

    const newScheduleTripRequest = new ScheduleTripRequestSchema({
      createdBy: reqData.createdBy,
      status: SCHEDULE_TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT,
      riderId: reqData.riderId,
      adminId: reqData.adminId,
      srcLoc: reqData.sourceLoc ,
      destLoc: reqData.destLoc ,
      seatBooked: parseInt(reqData.seatBooked),
      scheduledTime: reqData.scheduledTime ? (new Date(reqData.scheduledTime)).toISOString() : scheduleTripData.scheduledTime
    });
    newScheduleTripRequest.saveAsync()
    .then((savedScheduleTripRequest) => {
      returnObj.success = true;
      returnObj.message = 'request submitted successfully';
      returnObj.data = savedScheduleTripRequest;
      /**
       * notify admin about new scheduled request if created by rider
       */

      if(req.user.userType === USER_TYPES.USER_TYPE_RIDER) {
        let socketPayload = {success: true, message: `New request scheduled`, data:  savedScheduleTripRequest};
        SocketStore.emitByUserId(reqData.adminId, SOCKET_EVENTS.schedule_request_added_admin, socketPayload);
      }

      /**
       * notify rider about new scheduled request if created by admin/driver
       */
      if((req.user.userType === USER_TYPES.USER_TYPE_ADMIN) || (req.user.userType === USER_TYPES.USER_TYPE_DRIVER)) {
        let scheduledTime = reqData.scheduledTime && moment(reqData.scheduledTime).format("YYYY-MM-DD HH:mm") || "";
        let smsText = `Your trip has been scheduled at ${scheduledTime} `;
        let fromToText = reqData.sourceLoc && reqData.sourceLoc.name && reqData.destLoc && reqData.destLoc.name && `from ${reqData.sourceLoc.name} to ${reqData.destLoc.name}` || '';
        smsText += fromToText;
        sendSms(reqData.riderId, smsText, (err, data) => {
          if (err) {
            console.log(err); // eslint-disable-line no-console
          } else {
            console.log("sms sent -", smsText);
            console.log(data); // eslint-disable-line no-console
          }
        });
      }
      return resolve(returnObj);
    })
    .catch((e) => {
      console.log("Error while Creating request", e);
      let error = new APIError(`Error while Creating request`, httpStatus.INTERNAL_SERVER_ERROR, true);
      reject(error);
    });
  })
}

function updateScheduleRequestAsync(reqData, req) {
  let returnObj = {success:false, message:'', data:null};
  return new Promise(async (resolve, reject)=>{
    try {
      let scheduleTripData = await ScheduleTripRequestSchema.findOneAsync({ _id: reqData.requestId })
      if (scheduleTripData) {
        const updateData = {
          requestUpdatedTime:(new Date()).toISOString(),
          adminId: reqData.adminId,
          seatBooked: reqData.seatBooked ? parseInt(reqData.seatBooked) : scheduleTripData.seatBooked,
          srcLoc: reqData.sourceLoc ? reqData.sourceLoc : scheduleTripData.srcLoc,
          destLoc: reqData.destLoc ? reqData.destLoc : scheduleTripData.destLoc,
          scheduledTime: reqData.scheduledTime ? (new Date(reqData.scheduledTime)).toISOString() : scheduleTripData.scheduledTime
        }

        // check if same request existing

        const result = checkIfSameRequestExistAsync({riderId: scheduleTripData.riderId, scheduledTime: reqData.scheduledTime, requestId:reqData.requestId });

        if(result.success) {
          returnObj.message = result.message;
          return returnObj;
        }

        if(reqData.sourceLoc || reqData.destLoc) {
          reqData.sourceLoc = updateData.srcLoc;
          reqData.destLoc = updateData.destLoc;

          let isValid = await validateSrcDestLocationsAsync(reqData);
          if(!isValid) {
            returnObj.message = "No service at this location";
            return resolve(returnObj);
          }
        }

        const query = { _id: reqData.requestId };
        let updatedData = await ScheduleTripRequestSchema.findOneAndUpdateAsync(query, updateData, { new: true })
        if (updatedData) {
          returnObj.success = true;
          returnObj.message = "Updated successfully";
          returnObj.data = updateData;

          if(req.user.userType == USER_TYPES.USER_TYPE_RIDER) {
            let socketPayload = {success: true, message: `Request updated`, data:  updatedData};
            SocketStore.emitByUserId(updatedData.adminId, SOCKET_EVENTS.schedule_request_updated_admin, socketPayload);
            return resolve(returnObj);
          }

          /**
           * if admin/driver edit the request rider name, isdCode, phoneNo can be edited only if rider is anonymous
           * update rider info
           */

          let riderDetail = await UserSchema.findOneAsync({_id: updatedData.riderId});

          if(riderDetail.userType == USER_TYPES.USER_TYPE_RIDER) {
            // rider details can not be updated by the admin/driver if it is not anonymous
            returnObj.success = true;
            returnObj.message = "Updated successfully";
            return returnObj;
          }

          let riderUpdateInfo = {};

          console.log("req props>>>>>>>>", req.name, req.phoneNo, req.isdCode);
          if((reqData.name && reqData.name != "")) {
            riderUpdateInfo.name = reqData.name;
          }

          if(reqData.isdCode && reqData.isdCode != "") {
            riderUpdateInfo.isdCode = reqData.isdCode;
          }

          if(reqData.phoneNo && reqData.phoneNo != "") {
            riderUpdateInfo.phoneNo = reqData.phoneNo;
          }

          console.log("_.isEmpty(riderUpdateInfo", _.isEmpty(riderUpdateInfo), JSON.stringify(riderUpdateInfo));

          if(!_.isEmpty(riderUpdateInfo)) {
            let riderQuery = {_id: riderDetail._id};
            let riderInfoToUpdate = {$set: riderUpdateInfo};
            let userUpdatedInfo = await UserSchema.findOneAndUpdateAsync(riderQuery, riderInfoToUpdate, { new: true });
            returnObj.success = true;
            returnObj.message = "Updated successfully";
            returnObj.data = updatedData;
          }

          return resolve(returnObj);

        } else {
          returnObj.success = false;
          returnObj.message = 'Something went wrong';
          return resolve(returnObj);
        }
      } else {
        returnObj.success = false;
        returnObj.message = 'No request found';
        return resolve(returnObj);
      }

    } catch (err) {
      console.log("Error while checking request", err);
      let error = new APIError(`Error while checking request`, httpStatus.INTERNAL_SERVER_ERROR, true);
      reject(error);
    }

  })
}

function saveAnonymousRider(reqData) {
  const newPassword=  randomstring.generate({
    length: 8
  });
  var  userObj = new UserSchema({
    email: "anonymous@abcxyz.com",
    password: newPassword,
    userType: USER_TYPES.USER_TYPE_ANONYMOUS,
    name: reqData.name,
    fname: reqData.name,
    riderAddedById:reqData.createdBy,
    phoneNo:reqData.phoneNo,
    isdCode:reqData.isdCode,
    countryCode: reqData.countryCode,
    countryName: reqData.countryName
  });
  return userObj.saveAsync();
}

function validateReqAdminSettingsAsync(reqData) {
  let returnObj = {success:false, message: '', data: null};
  /**
   * 1. holiday
   * 2. working hours daywise
   * 3. in between next seven days
   * 4. if admin allow scheduling
   */
  let today = new Date();
  let dateAfterSevenDays = moment(today).add(7, 'days');

  let dateAfterThirtyMins = moment(today).add(30, 'minutes');

  return new Promise((resolve, reject)=>{
    console.log("moment(reqData.scheduledTime)", moment(reqData.scheduledTime));
    console.log("moment(dateAfterThirtyMins)", dateAfterThirtyMins);
    console.log("moment(dateAfterThirtyMins)", moment(dateAfterThirtyMins ).diff(reqData.scheduledTime));

    if(((new Date(reqData.scheduledTime)).getTime()-today.getTime()) < 1800000) {
      returnObj.message = "Schedule trip can be booked in minimum 30 minutes advance";
      return resolve(returnObj);
    }

    // check if advance booking is not more than seven days
    if(!moment(reqData.scheduledTime).isBetween(today, dateAfterSevenDays)) {
      returnObj.message = "Schedule trip can be booked in 7 days advance";
      return resolve(returnObj);
    }


    UserSchema.findOneAsync({_id:reqData.adminId}).then(admin=>{
      if(!admin) {
        returnObj.message = "Service provider not found";
        return resolve(returnObj);
      }

      // if admin allow scheduling
      if(!admin.settings.allowScheduleTrips) {
        returnObj.message = "Service provider does not allow schedule trip service";
        return resolve(returnObj);
      }

      const adminSettings = admin.settings;
      let holidayIndex = adminSettings.holidays.findIndex((holiday, index)=>{
        return checkIfHoliday(holiday.date, reqData.scheduledTime);
      })

      if(holidayIndex>=0) {
        returnObj.message = "It's holiday";
        return resolve(returnObj);
      }

      // check if not in time slot of the requested day
      // need to fix time setting on web while setting time slots

      if(!isWorkingTime(reqData.scheduledTime, admin.settings)) {
        returnObj.message = "No service on requested time";
        return resolve(returnObj);
      }

      returnObj.success = true;
      return resolve(returnObj);

    })
  })
}

function checkIfHoliday(holiday, requestedDate) {
  console.log("comparing holiday requestedDate", holiday, requestedDate);
  let requestedDateMoment = moment(requestedDate);
  let holidayMoment = moment(holiday);

  requestedDateMoment.utc();
  holidayMoment.utc();
  console.log("formatted holiday requestDate", holidayMoment.format(), requestedDateMoment.format())
  console.log("result of comparison", requestedDateMoment.isSame(holidayMoment, 'date'));
  return requestedDateMoment.isSame(moment(holiday), 'date');
}

function isWorkingTime(dateTime, adminSettings){
  let workingStartTimeMs = adminSettings.dayTimings.monday.slots[0].startTime;
  let workingEndTimeMs = adminSettings.dayTimings.monday.slots[0].endTime;
  let reqScheduledTimeMilisec = Util.hmsToms(dateTime);
  console.log("time slot checking workingStartTimeMs workingEndTimeMs reqScheduledTimeMilisec", workingStartTimeMs, workingEndTimeMs, reqScheduledTimeMilisec);
  if((reqScheduledTimeMilisec>=workingStartTimeMs)&&(reqScheduledTimeMilisec<=workingEndTimeMs)) {
    return true;
  } else {
    return false;
  };
}

function checkIfSameRequestExistAsync(data) {
  const returnObj = { success: false, message: '', data: null };

  return new Promise((resolve, reject)=>{
    if(data.requestId && data.requestId != "") {
      // return if editing request
      returnObj.message = 'No pending scheduled trip';
      return resolve(returnObj)
    }

    let query = {
      $and: [
        {riderId: data.riderId},
        {scheduledTime: (new Date(data.scheduledTime)).toISOString()},
        {scheduledTime: {"$gt": (new Date()).toISOString()}}
      ]
    }
    console.log("checkIfSameRequestExistAsync", JSON.stringify(query));
    ScheduleTripRequestSchema.findOneAsync(query)
    .then((scheduleTripData) => {
      console.log("checkIfSameRequestExistAsync", JSON.stringify(scheduleTripData));
      if (scheduleTripData) {
        returnObj.success = true;
        returnObj.message = 'Already pending scheduled trip';
        return resolve(returnObj)
      } else {
        returnObj.message = 'No pending scheduled trip';
        return resolve(returnObj);
      }
    })
    .catch((err) => {
      console.log("Error while checking request", err);
      let error = new APIError(`Error while checking request`, httpStatus.INTERNAL_SERVER_ERROR, true);
      return reject(error);
    });
  })
}

function validateSrcDestLocationsAsync(reqData){
  const sourceLoc = reqData.sourceLoc;
  const destLoc = reqData.destLoc;
  return new Promise((resolve, reject) => {
    // check if the source and destination exists in admin locations
    let locationPipelineStages = [
      {$match: {
        userIdAdmin: mongoose.Types.ObjectId(reqData.adminId),
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

    console.log("locationPipelineStages>>>>>>>>>>", JSON.stringify(locationPipelineStages) );

    AdminLocation.aggregate(locationPipelineStages)
    .then((foundLocations)=>{
      console.log("foundLocations", foundLocations);
      if(foundLocations && foundLocations.length) {
        return resolve(true);
      } else {
        return resolve(false);
      }
    }).catch(err=>{
      let error = new APIError('no service at this location', httpStatus.INTERNAL_SERVER_ERROR, true);
      return reject(error);
    })

  });


}




