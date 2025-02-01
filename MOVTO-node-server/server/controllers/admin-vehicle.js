import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Utilities from '../helpers/util';
import config from '../../config/env';
import UserSchema from '../models/user';
import TripSchema from '../models/trip';
import mongoose from 'mongoose';
import AdminVehicleSchema from '../models/adminVehicle';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER } from '../constants/user-types';
import { Mongoose } from 'mongoose';

const debug = require('debug')('MGD-API: admin-user');

/* start: manage vehicles by admin */

function createNewVehicle(req, res, next) {
  const vehicleData = Object.assign({}, req.body);
  AdminVehicleSchema.findOneAsync({
    userIdAdmin: req.user._id, vehicleNo: req.body.vehicleNo
  })
    // eslint-disable-next-line consistent-return
    .then((foundVehicle) => {
      const returnObj = {
        success: false,
        message: '',
        data: null,
      };
      if (foundVehicle !== null) {
        const err = new APIError('Vehicle No Already Exist', httpStatus.CONFLICT);
        return next(err);
      }
      const accessCode = Utilities.generateAccessCode();
      const vehicleObj = new AdminVehicleSchema({
        accessCode: accessCode,
        userIdAdmin: req.user._id,
        name: vehicleData.name,
        seats: vehicleData.seats,
        company: vehicleData.company,
        carModel: vehicleData.carModel,
        vehicleNo: vehicleData.vehicleNo,
        type: vehicleData.type,
        regNo: vehicleData.regNo,
        RC_ownerName: vehicleData.rcOwnerName,
        color: vehicleData.color,
        regDate: vehicleData.regDate,
        imageUrl:vehicleData.imageUrl?Utilities.getUploadsAvtarsUrl(req)+"/"+vehicleData.imageUrl:`${Utilities.getUploadsShuttlesUrl(req)}/inactive_Shuttle@3x.png`,
        state: vehicleData.state,
        country: vehicleData.country,
        zone: vehicleData.zone?vehicleData.zone:'',
        locationId:vehicleData.locationId,        
      });

      vehicleObj
        .saveAsync()
        .then((savedVehicle) => {
          returnObj.success = true;
          returnObj.message = 'Vehicle created successfully';
          returnObj.data = savedVehicle;
          // create new admin vehicle
          // const newAdminVehicle = new AdminVehicleSchema({
          //   userIdAdmin: req.body.adminId,
          //   userIdDriver: savedUser._id,
          //   accessCode: savedUser.password
          // })
          // newAdminVehicle.saveAsync()
          // .then((savedDoc)=>{
          //   return console.log("adminVehicle saved", savedDoc);
          // })
          // .error(()=>{
          //   return console.log("error saving adminVehicle");
          // })
          res.send(returnObj);
        })
        .error((e) => {
          const err = new APIError(`Error while Creating new vehicle ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          returnObj.success = false;
          returnObj.message = 'Vehicle not created';
          console.log(err); // eslint-disable-line no-console
          return next(returnObj);
        });
    })
    .error((e) => {
      const err = new APIError(`Error while Searching the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      return next(err);
    });
}

function getAllVehicles(req, res, next) {
  var andCondition=[];
    var obj={isDeleted: false,userIdAdmin: req.user._id};
    andCondition.push(obj);

    if(req.query && req.query.locationId != ''){
        obj={locationId:req.query.locationId}
        andCondition.push(obj);
    }
  const { pageNo, limit = config.limit } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  debug(`skip value: ${req.query.pageNo}`);
  AdminVehicleSchema.countAsync({ $and: andCondition })
    // eslint-disable-next-line
    .then(totalVehicleRecord => {
      const returnObj = {
        success: true,
        message: `no of vehicles are zero`, // `no of active vehicles are ${returnObj.data.length}`;
        data: null,
        meta: {
          totalNoOfPages: Math.ceil(totalVehicleRecord / limit),
          limit,
          currPageNo: pageNo,
          currNoOfRecord: 20,
        },
      };
      if (totalVehicleRecord < 1) {
        return res.send(returnObj);
      }
      if (skip > totalVehicleRecord) {
        const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
        return next(err);
      }
      AdminVehicleSchema.find({ $and: andCondition })
        .limit(parseInt(limit))
        .skip(skip)
        .then((vehicleData) => {
          returnObj.data = vehicleData;
          returnObj.message = `Vehicles found`;
          returnObj.meta.currNoOfRecord = returnObj.data.length;
          debug(`no of records are ${returnObj.meta.currNoOfRecord}`);
          return res.send(returnObj);
        })
        .catch((err) => {
          res.send('Error', err);
        });
    })
    .error((e) => {
      const err = new APIError(`error occured while counting the no of users ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      debug('error inside getAllDrivers records');
      next(err);
    });
}

function getAllVehiclesMobile(req, res, next) {
  var andCondition=[];
  var obj={isDeleted: false};
  obj={
    userIdAdmin: req.user._id
  }
  andCondition.push(obj);

  if(req.query && req.query.locationId != ''){
      obj={locationId:req.query.locationId}
      andCondition.push(obj);
  }
  const { pageNo, limit = config.limit } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  debug(`skip value: ${req.query.pageNo}`);
  AdminVehicleSchema.countAsync({ $and: andCondition })
    // eslint-disable-next-line
  .then(totalVehicleRecord => {
    const returnObj = {
      success: true,
      message: `no of vehicles are zero`, // `no of active vehicles are ${returnObj.data.length}`;
      data: {
        meta: {
          totalNoOfPages: Math.ceil(totalVehicleRecord / limit),
          limit,
          currPageNo: pageNo,
          currNoOfRecord: 0,
          totalShuttles: 0
        },
        shuttles: []
      },
    };
    if (totalVehicleRecord < 1) {
      return res.send(returnObj);
    }
    if (skip > totalVehicleRecord) {
      const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
      return next(err);
    }
    console.log('andcondition', andCondition);
    AdminVehicleSchema.find({ $and: andCondition })
    .limit(parseInt(limit))
    .skip(skip)
    .then((vehicleData) => {
      returnObj.data.shuttles = vehicleData || [];
      returnObj.message = `Vehicles found`;
      returnObj.data.meta.currNoOfRecord = returnObj.data.length;
      // debug(`no of records are ${returnObj.meta.currNoOfRecord}`);
      getVehileListMetaAsync(req)
      .then(listMetaData=>{
        returnObj.data.shuttles = vehicleData || [];
        returnObj.data.meta.totalShuttles = totalVehicleRecord || 0;
        returnObj.data.meta.activeShuttles = listMetaData.activeShuttles;
        return res.send(returnObj);
      })
      .catch(error=>{
        let errorCustom = new APIError(`error occured while counting the active shuttles ${error}`, httpStatus.INTERNAL_SERVER_ERROR);
        return next(errorCustom);
      })
    })
    .catch((error) => {
      let errorCustom = new APIError(`error occured while counting the active shuttles ${error}`, httpStatus.INTERNAL_SERVER_ERROR);
      return next(errorCustom);
    });
  })
  .error((e) => {
    const err = new APIError(`error occured while counting the no of users ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    return next(err);
  });
}

function updateVehicleDetails(req, res, next) {
  const updateVehicleObj = Object.assign({}, req.body);
  TripSchema.findOneAsync({
    "shuttleId": updateVehicleObj.vehicleId,
    "activeStatus" : true,
  })
  .then((TripDoc) => {
    if(TripDoc){
      const returnObj = {
        success: false,
        message: 'Vehicle is active on trip, So you cant update his details now.',
        data: null,
        meta: null,
      };
     return res.send(returnObj);
    }   

  AdminVehicleSchema.findOneAsync({ _id: req.body.vehicleId })
    .then((vehicleDoc) => {
      const returnObj = {
        success: false,
        message: 'unable to find the object',
        data: null,
        meta: null,
      };
      if (vehicleDoc) {
        vehicleDoc.name = updateVehicleObj.name;
        vehicleDoc.company = updateVehicleObj.company ? updateVehicleObj.company : vehicleDoc.company;
        vehicleDoc.seats= updateVehicleObj.seats?updateVehicleObj.seats:4,
        vehicleDoc.vehicleNo = updateVehicleObj.vehicleNo ? updateVehicleObj.vehicleNo : vehicleDoc.vehicleNo;
        vehicleDoc.carModel = updateVehicleObj.carModel ? updateVehicleObj.carModel : vehicleDoc.carModel;
        vehicleDoc.type = updateVehicleObj.type ? updateVehicleObj.type : vehicleDoc.type;
        vehicleDoc.regNo = updateVehicleObj.regNo ? updateVehicleObj.regNo : vehicleDoc.regNo;
        vehicleDoc.RC_ownerName = updateVehicleObj.rcOwnerName ? updateVehicleObj.rcOwnerName : vehicleDoc.rcOwnerName;
        vehicleDoc.color = updateVehicleObj.color ? updateVehicleObj.color : vehicleDoc.color,
        vehicleDoc.regDate = updateVehicleObj.regDate ? updateVehicleObj.regDate : vehicleDoc.regDate,
        vehicleDoc.imageUrl = updateVehicleObj.imageUrl ? updateVehicleObj.imageUrl: vehicleDoc.imageUrl
        vehicleDoc.state = updateVehicleObj.state ? updateVehicleObj.state : vehicleDoc.state,
        vehicleDoc.country= updateVehicleObj.country ? updateVehicleObj.country : vehicleDoc.country
        vehicleDoc.zone = updateVehicleObj.zone ? updateVehicleObj.zone : vehicleDoc.zone,
        vehicleDoc.locationId = updateVehicleObj.locationId ? updateVehicleObj.locationId : vehicleDoc.locationId,
        vehicleDoc.imageUrl=updateVehicleObj.imageUrl?Utilities.getUploadsAvtarsUrl(req)+"/"+updateVehicleObj.imageUrl:vehicleDoc.imageUrl;
        vehicleDoc
          .saveAsync()
          .then((savedDoc) => {
            returnObj.success = true;
            returnObj.message = 'Vehicle document updated';
            returnObj.data = savedDoc;
            res.send(returnObj);
          })
          .error((e) => {
            const err = new APIError(`Error occured while updating the vehicle details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
            next(err);
          });
      } else {
        res.send(returnObj);
      }
    })
    .error((e) => {
      const err = new APIError(`Error occured while searching for the vehicles ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
  })
  .error((e) => {
    const err = new APIError(`Error occured while checking vehicles status ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    next(err);
  });  
}

function removeVehicle(req, res, next) {
  AdminVehicleSchema.findOneAsync(
    { _id: req.query.vehicleId, activeStatus:true }
  ) // eslint-disable-line no-underscore-dangle
    .then(shuttleTrip => {
      const returnObj = {
        success: false,
        message: "Sorry, You cant delete shuttle, as shuttle is on trip",
        data: []
      };
      if(shuttleTrip){
        return res.send(returnObj);
      }
      AdminVehicleSchema.updateAsync(
        {_id: req.query.vehicleId },
        { $set: { isDeleted: true } }
      ) // eslint-disable-line no-underscore-dangle
        .then(savedDoc => {
          returnObj.success=true;          
          returnObj.message="Shuttle deleted successfully";          
          return res.send(returnObj);
        })
        .error(e => {
          const err = new APIError(
            `Error occured while Updating User Object ${e}`,
            httpStatus.INTERNAL_SERVER_ERROR
          );
          next(err);
        });
    })
    .error(e => {
      const err = new APIError(
        `Error occured while Updating User Object ${e}`,
        httpStatus.INTERNAL_SERVER_ERROR
      );
      next(err);
    });
}


function getVehicleDetails(req, res, next) {
  const updateUserObj = Object.assign({}, req.body);
  AdminVehicleSchema.findOneAsync({ _id: req.query.vehicleId })
  .then((vehicleDoc) => {
    const returnObj = {
      success: false,
      message: 'Unable to find the Vehicle',
      data: null,
      meta: null,
    };
    if (vehicleDoc) {
      returnObj.success = true;
      returnObj.message = 'Success';
      returnObj.data = vehicleDoc;
      res.send(returnObj);
    } else {
      res.send(returnObj);
    }
  })
  .error((e) => {
    const err = new APIError(`Error occured while searching for the vehicle ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function getVehileListMetaAsync(req){
  return new Promise((resolve, reject)=>{
    // get all shuttleIds
    var query={isDeleted: false};
    query={
      userIdAdmin:  mongoose.Types.ObjectId(req.user._id)
    }

    if(req.query && req.query.locationId != ''){
      query.locationId = req.query.locationId
    }

    AdminVehicleSchema.aggregate([
      {$match: query},
      {
        $group: {
          _id: '',
          ids: {$addToSet: "$_id" }
        }
      }
    ])
      // eslint-disable-next-line
    .then(results => {
      let result = results[0];
      let returnObj = {activeShuttles: null};
      let totalVehicleRecord = result.ids;
      totalVehicleRecord = totalVehicleRecord.map(id=>mongoose.Types.ObjectId(id));
      if (totalVehicleRecord && Array.isArray(totalVehicleRecord) && totalVehicleRecord.length) {
        let tripQuery = {
          shuttleId: {$in: totalVehicleRecord},
          activeStatus: true
        }
        TripSchema.countAsync(tripQuery)
        .then(activeTripsCount=>{
          returnObj.activeShuttles = activeTripsCount;
          return resolve(returnObj);
        })
        .catch(error=>{
          return reject(error);
        })
      } else {
        return resolve(returnObj)
      }
    })
    .catch((e) => {
      const err = new APIError(`error occured while counting the no of users ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      return reject(err);
    });
    // get all active shuttles
  })
}

/* end: manage vehicles by admin */

export default {
  createNewVehicle,
  getAllVehicles,
  updateVehicleDetails,
  removeVehicle,
  getVehicleDetails,
  getAllVehiclesMobile
};
