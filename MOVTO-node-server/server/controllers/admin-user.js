import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Utilities from '../helpers/util';
import config from '../../config/env';
import UserSchema from '../models/user';
import AdminNotifyMessage from '../models/adminNotifyMessage'
import DriverRouteTerminalSchema from '../models/driverRouteTerminal';
import AdminDriverSchema from '../models/adminDriver';
import AdminLocationSchema from '../models/adminLocation';
import TripSchema from '../models/trip';
import { sendSms, sendSmsUpdateMobile } from '../service/smsApi';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER, USER_TYPE_ADMIN } from '../constants/user-types';
import CountryCode from '../models/countryCode';
import sendEmail from '../service/emailApi';
import * as templateService from '../service/template';
import TripRequestSchema from '../models/tripRequest';
import RatingSchema from '../models/review';
import AdminVehicleSchema from '../models/adminVehicle';
import ReservationCodeSchema from '../models/reservationCode';
import * as PushNotification from '../service/pushNotification';
import mongoose from 'mongoose';
import { TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_COMPLETED } from '../constants/trip-request-statuses';
import { json } from 'body-parser';
import _ from 'underscore';
import { MASTER_PASSWORD } from '../constants/global'

var randomstring = require("randomstring");

const async = require('async');
const moment = require('moment');

const debug = require('debug')('MGD-API: admin-user');

function getAllUsers(req, res, next) {
  const { pageNo, userType, limit = config.limit } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  const name = req.query.keyword ? req.query.keyword : '';
  let query = {
    userType: req.query.userType,
    isDeleted: false,
    $or: [
      { "name": { $regex: name, $options: 'i' } },
      { "fname": { $regex: name, $options: 'i' } },
      { "email": { $regex: name, $options: 'i' } },
      { "lname": { $regex: name, $options: 'i' } }
    ]
  }
  UserSchema.countAsync(query)
    // eslint-disable-next-line
    .then(totalUserRecord => {
      const returnObj = {
        success: true,
        message: `no of ${userType}s are zero`, // `no of active drivers are ${returnObj.data.length}`;
        data: null,
        meta: {
          totalNoOfPages: Math.ceil(totalUserRecord / limit),
          limit,
          currPageNo: pageNo,
          currNoOfRecord: 20,
        },
      };
      if (totalUserRecord < 1) {
        return res.send(returnObj);
      }
      if (skip > totalUserRecord) {
        const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
        return next(err);
      }
      UserSchema.find(query, 'name fname lname email isdCode phoneNo address city state country isActive isDeleted adminTripTypes tripType countryCode accessCode')
        // .limit(limit)
        // .skip(skip)
        .then((userData) => {
          returnObj.data = userData;
          returnObj.message = `${userType}s found`;
          returnObj.meta.currNoOfRecord = returnObj.data.length;
          return res.send(returnObj);
        })
        .catch((err) => {
          res.send('Error', err);
        });
    })
    .error((e) => {
      const err = new APIError(`error occured while counting the no of users ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      debug('error inside getAllUsers records');
      next(err);
    });
}

function getTotalUsers(req, res) {
  // new users list
  UserSchema.find()
    .then((foundUser) => {
      res.send(foundUser);
    })
    .catch((err) => {
      res.send('Error', err);
    });
}

function getApprovePendingUsers(req, res, next) {
  const { userType } = req.query;
  UserSchema.find({ $and: [{ userType }, { isApproved: 'false' }] })
    .then((foundPendingUsers) => {
      const returnObj = {
        success: false,
        message: `no of pending ${userType}s are zero`,
        data: null,
        meta: {
          totalRecords: 0,
        },
      };
      returnObj.data = foundPendingUsers;
      if (returnObj.data.length > 0) {
        returnObj.success = true;
        returnObj.message = `no of pending users are ${returnObj.data.length}`;
        returnObj.meta.totalRecords = `${returnObj.data.length}`;
        console.log(returnObj, 'Pending users list'); //eslint-disable-line
        res.send(returnObj);
      } else {
        console.log(returnObj, returnObj.data, 'No pending users in DB'); //eslint-disable-line
        res.send(returnObj);
      }
    })
    .catch((err) => {
      console.log('NO pending users data in db'); //eslint-disable-line
      next(err);
    });
}

function approveUser(req, res, next) {
  const { id } = req.query;
  UserSchema.findOneAndUpdateAsync({ _id: id }, { $set: { isApproved: true } })
    .then((userUpdateData) => {
      const returnObj = {
        success: false,
        message: 'unable to update  user , user id provided didnt match ',
        data: null,
      };
      returnObj.data = userUpdateData;
      if (returnObj.data) {
        returnObj.success = 'true';
        returnObj.message = 'user updated';
        res.send(returnObj);
        const smsText = 'Congratulations, your Merry Go Drive profile has been approved.';
        sendSms(id, smsText, (err, data) => {
          if (err) {
            console.log(err); // eslint-disable-line no-console
          } else {
            console.log(data); // eslint-disable-line no-console
          }
        });
      }
    })
    .catch((err) => {
      next(err);
    });
}

function rejectUser(req, res, next) {
  // findOneAndRemove
  const { id } = req.query;
  UserSchema.findOneAndRemoveAsync({ _id: id })
    .then((rejectUserData) => {
      const returnObj = {
        success: false,
        message: 'unable to delete  user , user id provided didnt match ',
        data: null,
      };
      returnObj.data = rejectUserData;
      if (returnObj.data) {
        returnObj.success = 'true';
        returnObj.message = 'user deleted';
        res.send(returnObj);
      }
    })
    .catch((err) => {
      next(err);
    });
}

function getActiveDriverDetails(req, res, next) {
  UserSchema.find({ $and: [{ userType: USER_TYPE_DRIVER }, { loginStatus: 'true' }, { isAvailable: 'true' }] })
    .then((foundActiveDrivers) => {
      const returnObj = {
        success: false,
        message: 'no of active drivers are zero',
        data: null,
        meta: {
          totalRecords: 0,
        },
      };
      returnObj.data = foundActiveDrivers;
      if (returnObj.data.length > 0) {
        returnObj.success = 'true';
        returnObj.message = `no of active drivers are ${returnObj.data.length}`;
        returnObj.meta.totalRecords = `${returnObj.data.length}`;
        res.send(returnObj);
      } else {
        returnObj.success = 'false';
        returnObj.message = `no of active drivers are ${returnObj.data.length}`;
        returnObj.meta.totalRecords = `${returnObj.data.length}`;
        res.send(returnObj);
      }
    })
    .catch((err) => {
      next(err);
    });
}

function getActiveCustomerDetails(req, res, next) {
  UserSchema.find({ $and: [{ userType: USER_TYPE_RIDER }, { loginStatus: 'true' }] })
    .then((foundActiveCustomers) => {
      const returnObj = {
        success: false,
        message: 'no of active customers are zero',
        data: null,
        meta: {
          totalRecords: 0,
        },
      };
      returnObj.data = foundActiveCustomers;
      if (returnObj.data.length > 0) {
        returnObj.success = 'true';
        returnObj.message = `no of active customers are ${returnObj.data.length}`;
        returnObj.meta.totalRecords = `${returnObj.data.length}`;
        console.log(returnObj.data, 'Active customers list'); //eslint-disable-line
        res.send(returnObj);
      }
    })
    .catch((err) => {
      next(err);
    });
}

function getUsersDetails(req, res, next) {
  const { userId } = req.params;
  const returnObj = {
    success: false,
    message: 'user Id is not defined',
    data: null,
  };
  if (userId) {
    UserSchema.findByIdAsync(userId)
      .then((userData) => {
        if (userData) {
          returnObj.success = true;
          returnObj.message = 'user found and its corresponding details';
          returnObj.data = userData;
        } else {
          returnObj.success = false;
          returnObj.message = 'user not found with the given id';
          returnObj.data = null;
        }
        res.send(returnObj);
      })
      .error((e) => {
        const err = new APIError(`Error occured while findind the user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        next(err);
      });
  } else {
    res.send(returnObj);
  }
}

function updateUserDetails(req, res, next) {
  const userId = req.body._id; //eslint-disable-line
  const updateUserObj = Object.assign({}, req.body);
  UserSchema.findOneAsync({ _id: userId })
    .then((userDoc) => {
      if (userDoc) {
        userDoc.fname = updateUserObj.fname ? updateUserObj.fname : userDoc.fname;
        userDoc.lname = updateUserObj.lname ? updateUserObj.lname : userDoc.lname;
        userDoc.phoneNo = updateUserObj.phoneNo ? updateUserObj.phoneNo : userDoc.phoneNo;
        userDoc.address = updateUserObj.address ? updateUserObj.address : userDoc.address;
        userDoc.city = updateUserObj.city ? updateUserObj.city : userDoc.city;
        userDoc.state = updateUserObj.state ? updateUserObj.state : userDoc.state;
        userDoc.country = updateUserObj.country ? updateUserObj.country : userDoc.country;
        const returnObj = {
          success: false,
          message: 'unable to find the object',
          data: null,
          meta: null,
        };

        userDoc
          .saveAsync()
          .then((savedDoc) => {
            if (savedDoc.password) {
              debug('inside password delete function');
              savedDoc = savedDoc.toObject();
              delete savedDoc.password;
            }
            returnObj.success = true;
            returnObj.message = 'user document saved';
            returnObj.data = savedDoc;
            res.send(returnObj);
          })
          .error((e) => {
            const err = new APIError(`Error occured while updating the user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
            next(err);
          });
      }
    })
    .error((e) => {
      const err = new APIError(`Error occured while searching for the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

function userStats(req, res, next) {
  const returnObj = {
    success: false,
    message: 'no data available',
    data: null,
  };
  UserSchema.aggregateAsync([
    { $match: { $or: [{ userType: USER_TYPE_DRIVER }, { userType: USER_TYPE_RIDER }] } },
    {
      $group: {
        _id: 'riderDriverRatio',
        rider: { $sum: { $cond: [{ $eq: ['$userType', USER_TYPE_RIDER] }, 1, 0] } },
        driver: { $sum: { $cond: [{ $eq: ['$userType', USER_TYPE_DRIVER] }, 1, 0] } },
        totalUser: { $sum: 1 },
      },
    },
  ])
    .then((userStatsData) => {
      returnObj.success = true;
      returnObj.message = 'user chart data';
      returnObj.data = userStatsData;
      return res.send(returnObj);
    })
    .error((e) => {
      const err = new APIError(`Error occurred while computing statistic for user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

/**
 * Removes carDetails from rider objects
 */
function removeCarDetailsFromNonDriverUsers(userData = []) {
  return userData.map((user) => {
    const { carDetails, ...rest } = user;
    return {
      ...rest,
      ...(user.userType === USER_TYPE_DRIVER ? user.carDetails : {}),
    };
  });
}

function changePassword(req, res, next) {
  const userObj = {
    email: req.body.email.toLowerCase(),
    userType: req.body.userType,
  };
  UserSchema.findOneAsync(userObj, '+password')
    // eslint-disable-next-line consistent-return
    .then((user) => {
      const returnObj = {
        success: false,
        message: '',
        data: null,
      };
      if (!user) {
        const err = new APIError('User not found with the given email id', httpStatus.NOT_FOUND);
        return next(err);
      } else {
        // eslint-disable-next-line
        user.comparePassword(req.body.oldpassword, (passwordError, isMatch) => {
          if (passwordError || !isMatch) {
            const err = new APIError('Incorrect old password', httpStatus.UNAUTHORIZED);
            return next(err);
          }
          user.password = req.body.password;
          user
            .saveAsync()
            .then((savedUser) => {
              returnObj.success = true;
              returnObj.message = 'Password changed successfully';
              returnObj.data = savedUser;
              return res.send(returnObj);
            })
            .error((e) => {
              const err = new APIError(`Error while changing password ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              returnObj.success = false;
              returnObj.message = 'Password not changed';
              console.log(err); // eslint-disable-line no-console
              return next(returnObj);
            });
        });
      }
    })
    .error((e) => {
      const err = new APIError(`error while finding user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

/* start: manage drivers by admin */

function createNewUser(req, res, next) {
  const userData = Object.assign({}, req.body);
  UserSchema.findOneAsync({
    $or: [{ email: req.body.email.toLowerCase(), userType: req.body.userType },
    { userType: req.body.userType, phoneNo: req.body.phoneNo }]
  })
    // eslint-disable-next-line consistent-return
    .then((foundUser) => {
      const returnObj = {
        success: false,
        message: '',
        data: null,
      };
      console.log("found create adminuser ", foundUser);
      if (foundUser !== null) {
        console.log("I m here");
        const err = new APIError('Email Id/phone No Already Exist', httpStatus.CONFLICT, true);
        return next(err);
      }
      CountryCode.findOneAsync({ dial_code: req.body.isdCode }).then((CountryCodeDetails) => {
        const accessCode = Utilities.generateAccessCode();
        const newPassword = randomstring.generate({
          length: 8,
          // charset: 'alphanumeric'
        });
        const userObj = new UserSchema({
          zone: userData.zone ? userData.zone : '',
          email: userData.email.toLowerCase(),
          phoneNo: userData.phoneNo,
          password: newPassword,
          accessCode: accessCode,
          userType: userData.userType,
          fname: userData.fname,
          lname: userData.lname,
          name: userData.fname && userData.lname && `${userData.fname} ${userData.lname}` || userData.fname,
          dob: userData.dob,
          bloodGroup: userData.bloodGroup ? userData.bloodGroup : null,
          gpsLoc: [72.85368273308545, 19.02172902354515],
          // country: userData.country,
          // state: userData.state,
          // city: userData.city,
          // postalCode: userData.postalCode,
          // address: userData.address,
          isdCode: req.body.isdCode,
          locationId: req.body.locationId,
          countryCode: (CountryCodeDetails && CountryCodeDetails.code) ? CountryCodeDetails.code : '',
          emergencyDetails:
            userData.userType === USER_TYPE_RIDER
              ? {
                phone: userData.emergencyDetails.phone ? userData.emergencyDetails.phone : '',
                name: userData.emergencyDetails.name ? userData.emergencyDetails.name : '',
                imgUrl: null,
              }
              : {
                phone: '',
                name: '',
                imgUrl: null,
              },
          // carDetails:
          //   userData.userType === USER_TYPE_DRIVER
          //     ? {
          //       type: userData.carDetails.type ? userData.carDetails.type : 'Sedan',
          //       company: userData.carDetails.company ? userData.carDetails.company : 'Maruti',
          //       regNo: userData.carDetails.regNo ? userData.carDetails.regNo : '',
          //       RC_ownerName: userData.carDetails.RC_ownerName ? userData.carDetails.RC_ownerName : '',
          //       vehicleNo: userData.carDetails.vehicleNo ? userData.carDetails.vehicleNo : '',
          //       carModel: userData.carDetails.carModel ? userData.carDetails.carModel : '',
          //       regDate: userData.carDetails.regDate ? userData.carDetails.regDate : '',
          //     }
          //     : {},
          // insuranceUrl: userData.userType === USER_TYPE_DRIVER ? userData.vehicleDocuments.insuranceUrl : null,
          // rcBookUrl: userData.userType === USER_TYPE_DRIVER ? userData.vehicleDocuments.rcBookUrl : null,
          // licenceUrl: userData.userType === USER_TYPE_DRIVER ? userData.licenceDocuments.licenceUrl : null,
          // vechilePaperUrl: userData.userType === USER_TYPE_DRIVER ? userData.licenceDocuments.vechilePaperUrl : null,
          // licenceDetails:
          //   userData.userType === USER_TYPE_DRIVER
          //     ? {
          //       licenceNo: userData.licenceDetails.licenceNo ? userData.licenceDetails.licenceNo : null,
          //       issueDate: userData.licenceDetails.issueDate ? userData.licenceDetails.issueDate : null,
          //       expDate: userData.licenceDetails.expDate ? userData.licenceDetails.expDate : null,
          //     }
          //     : {},
          // bankDetails:
          //   userData.userType === USER_TYPE_DRIVER
          //     ? {
          //       accountNo: userData.bankDetails.accountNo ? userData.bankDetails.accountNo : null,
          //       holderName: userData.bankDetails.holderName ? userData.bankDetails.holderName : '',
          //       IFSC: userData.bankDetails.IFSC ? userData.bankDetails.IFSC : '',
          //     }
          //     : {},
          mapCoordinates: [0, 0],
          loginStatus: true,
        });
        userObj
          .saveAsync()
          .then((savedUser) => {
            returnObj.success = true;
            returnObj.message = 'User created successfully';
            returnObj["accessCode"] = accessCode;
            // console.log("saved user", savedUser);
            returnObj.data = savedUser;
            // create new admin driver accesscode
            const newAdminDriver = new AdminDriverSchema({
              userIdAdmin: req.user._id,
              userIdDriver: savedUser._id,
              accessCode: savedUser.accessCode,
              locationId: req.body.locationId
            })
            newAdminDriver.saveAsync()
              .then((savedDoc) => {
                const userObj = Object.assign(savedUser, { newpass: newPassword, accessCode: accessCode });
                sendEmail(savedUser._id, userObj, 'createDriver'); //eslint-disable-line
                return console.log("admindriver saved", savedDoc);
              })
              .error(() => {
                return console.log("error saving admindriver");
              })
            res.send(returnObj);
          })
          .error((e) => {
            const err = new APIError(`Error while Creating new User ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
            returnObj.success = false;
            returnObj.message = 'user not created';
            console.log(err); // eslint-disable-line no-console
            return next(returnObj);
          });
      }).catch(e => {
        const err = new APIError(`Error in creating user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        next(err);
      });
    })
    .error((e) => {
      const err = new APIError(`Error while Searching the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      return next(err);
    });
}

function getAllDrivers(req, res, next) {
  var andCondition = [];
  var obj = {};
  obj = {
    userIdAdmin: req.user._id
  }
  andCondition.push(obj);

  if (req.query && req.query.locationId != '') {
    obj = { locationId: req.query.locationId }
    andCondition.push(obj);
  }
  const { pageNo, userType, limit = config.limit } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  debug(`skip value: ${req.query.pageNo}`);
  AdminDriverSchema.countAsync({ $and: andCondition })
    // eslint-disable-next-line
    .then(totalUserRecord => {
      const returnObj = {
        success: true,
        message: `no of drivers are zero`, // `no of active drivers are ${returnObj.data.length}`;
        data: null,
        meta: {
          totalNoOfPages: Math.ceil(totalUserRecord / limit),
          limit,
          currPageNo: pageNo,
          currNoOfRecord: 20,
        },
      };
      if (totalUserRecord < 1) {
        return res.send(returnObj);
      }
      if (skip > totalUserRecord) {
        const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
        return next(err);
      }
      AdminDriverSchema.find({ $and: andCondition })
        .populate('userIdDriver')
        .limit(parseInt(limit))
        .skip(skip)
        .then((userData) => {
          returnObj.data = userData;
          returnObj.message = `drivers found`;
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

function getAllDriversMobile(req, res, next) {
  var andCondition = [];
  var obj = { isDeleted: false };
  obj = {
    userIdAdmin: req.user._id
  }
  andCondition.push(obj);

  if (req.query && req.query.locationId != '') {
    obj = { locationId: req.query.locationId }
    andCondition.push(obj);
  }
  const { pageNo, limit = config.limit } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  debug(`skip value: ${req.query.pageNo}`);
  AdminDriverSchema.countAsync({ $and: andCondition })
    // eslint-disable-next-line
    .then(totalDriversRecord => {
      const returnObj = {
        success: true,
        message: `no of vehicles are zero`, // `no of active vehicles are ${returnObj.data.length}`;
        data: {
          meta: {
            totalNoOfPages: Math.ceil(totalDriversRecord / limit),
            limit,
            currPageNo: pageNo,
            currNoOfRecord: 0,
            activeDrivers: 0,
            totalDrivers: 0
          },
          drivers: []
        }
      };
      if (totalDriversRecord < 1) {
        return res.send(returnObj);
      }
      if (skip > totalDriversRecord) {
        const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
        return next(err);
      }
      console.log('andcondition', andCondition);
      AdminDriverSchema.find({ $and: andCondition })
        .limit(parseInt(limit))
        .skip(skip)
        .populate('userIdDriver', { name: 1, profileUrl: 1, email: 1, activeStatus: 1 })
        .then((driversData) => {
          returnObj.data.drivers = driversData;
          returnObj.message = `drivers found`;
          returnObj.data.meta.currNoOfRecord = driversData.length;
          returnObj.data.meta.totalDrivers = totalDriversRecord;
          // debug(`no of records are ${returnObj.meta.currNoOfRecord}`);
          getDriverListMetaAsync(req)
            .then(listMetaData => {
              returnObj.data.meta.activeDrivers = listMetaData.activeDrivers
              return res.send(returnObj);
            })
            .catch(error => {
              let errorCustom = new APIError(`error occured while counting the active drivers ${error}`, httpStatus.INTERNAL_SERVER_ERROR);
              return next(errorCustom);
            })
        })
        .catch((error) => {
          let errorCustom = new APIError(`error occured while searching the admin drivers ${error}`, httpStatus.INTERNAL_SERVER_ERROR);
          return next(errorCustom);
        });
    })
    .error((e) => {
      const err = new APIError(`error occured while counting the no of users ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      debug('error inside getAllDrivers records');
      return next(err);
    });
}

function getDriverListMetaAsync(req) {
  return new Promise((resolve, reject) => {
    // get all shuttleIds
    var query = { isDeleted: false };
    query = {
      userIdAdmin: mongoose.Types.ObjectId(req.user._id)
    }

    if (req.query && req.query.locationId != '') {
      query.locationId = req.query.locationId
    }

    AdminDriverSchema.aggregate([
      { $match: query },
      {
        $group: {
          _id: '',
          ids: { $addToSet: "$_id" }
        }
      }
    ])
      // eslint-disable-next-line
      .then(results => {
        let result = results[0];
        console.log('aggregate result', result);
        let returnObj = { activeDrivers: null };
        let totalDriversRecord = result.ids;
        if (totalDriversRecord && Array.isArray(totalDriversRecord) && totalDriversRecord.length) {
          let tripQuery = {
            driverId: { $in: totalDriversRecord },
            activeStatus: true
          }
          TripSchema.countAsync(tripQuery)
            .then(activeTripsCount => {
              returnObj.activeDrivers = activeTripsCount;
              return resolve(returnObj);
            })
            .catch(error => {
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

function getAllRidesMobile(req, res, next) {
  var andCondition = [{
    adminId: mongoose.Types.ObjectId(req.user._id)
  }];



  if (req.query && req.query.status && req.query.status != '') {
    let obj = { tripRequestStatus: req.query.status }
    andCondition.push(obj);
  }

  // if(req.query && req.query.driverId != ''){
  //   let obj={driverId:req.query.driverId}
  //   andCondition.push(obj);
  // }
  console.log("andcondition", andCondition);

  const { pageNo, limit = config.limit } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;

  debug(`skip value: ${req.query.pageNo}`);

  let aggregatePipeline = [
    { $match: { $and: andCondition } },
    {
      $lookup: {
        from: "trips",
        localField: "tripId",
        foreignField: "_id",
        as: "trip"
      }
    },
    { $unwind: "$trip" },
    {
      $lookup: {
        from: "users",
        localField: "riderId",
        foreignField: "_id",
        as: "riderDetails"
      }
    },
    { $unwind: "$riderDetails" },
    {
      $project: {
        vehicleId: "$trip.shuttleId",
        driverId: "$trip.driverId",
        tripId: 1,
        trip: 1,
        requestTime: 1,
        tripRequestStatus: 1,
        srcLoc: 1,
        destLoc: 1,
        seatBooked: 1,
        "riderDetails._id": 1,
        "riderDetails.name": 1
      }
    },
    // not supported on staging server mongo error only _id can be excluded
    // {
    //   $project: {
    //     trip: 0
    //   }
    // },
    {
      $group: {
        _id: "$tripId",
        vehicleId: { $first: '$vehicleId' },
        driverId: { $first: '$driverId' },
        rides: { $push: '$$ROOT' }
      }
    },

    {
      $lookup: {
        from: "users",
        localField: "driverId",
        foreignField: "_id",
        as: "driver"
      }
    },
    { $unwind: "$driver" },
    {
      $lookup: {
        from: "adminvehicles",
        localField: "vehicleId",
        foreignField: "_id",
        as: "shuttle"
      }
    },
    { $unwind: "$shuttle" },
    {
      $project: {
        rides: "$rides",
        "driver._id": 1,
        "driver.name": 1,
        "shuttle._id": 1,
        "shuttle.vechileNo": 1,
        "shuttle.name": 1
      }
    }, { $skip: parseInt(skip) }, { $limit: parseInt(limit) }
  ]
  TripRequestSchema.aggregateAsync(aggregatePipeline)
    // eslint-disable-next-line
    .then(totalRidesRecord => {
      console.log('totalriderecord', totalRidesRecord);
      const returnObj = {
        success: true,
        message: `no of rides are zero`, // `no of active vehicles are ${returnObj.data.length}`;
        data: {
          meta: {
            totalNoOfPages: Math.ceil(totalRidesRecord.length / limit),
            limit,
            currPageNo: pageNo,
            currNoOfRecord: totalRidesRecord && totalRidesRecord.length || 0,
            totalRides: 0,
            totalPassengers: 0
          },
          trips: totalRidesRecord || []
        }
      };
      if (totalRidesRecord < 1) {
        return res.send(returnObj);
      }
      if (skip > totalRidesRecord) {
        const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
        return next(err);
      }
      console.log('andcondition', andCondition);
      getAllRidesMobileMeta(req)
        .then((metaData) => {
          returnObj.data.meta.totalRides = metaData && metaData.totalRidesDone;
          returnObj.data.meta.totalPassengers = metaData && metaData.totalPassengers;
          debug(`no of records are ${returnObj.data.meta.currNoOfRecord}`);
          return res.send(returnObj);
        })
        .catch((err) => {
          let errorCustom = new APIError(`error occured while getting rides ${err}`, httpStatus.INTERNAL_SERVER_ERROR);
          debug('error inside getAllDrivers records');
          return next(err);
        });
    })
    .error((e) => {
      const err = new APIError(`error occured while counting the no of users ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      debug('error inside getAllDrivers records');
      return next(err);
    });
}

function getAllRidesMobileMeta(req) {
  return new Promise((resolve, reject) => {
    var andCondition = [{ adminId: mongoose.Types.ObjectId(req.user._id), tripRequestStatus: TRIP_REQUEST_ACCEPTED }];

    // if(req.query && req.query.locationId != ''){
    //   query.locationId = req.query.locationId
    // }

    let aggregatePipeline = [
      { $match: { $and: andCondition } },
      {
        $lookup: {
          from: "trips",
          localField: "tripId",
          foreignField: "_id",
          as: "trip"
        }
      },
      { $unwind: "$trip" },
      {
        $lookup: {
          from: "users",
          localField: "riderId",
          foreignField: "_id",
          as: "riderDetails"
        }
      },
      { $unwind: "$riderDetails" },
      {
        $project: {
          vehicleId: "$trip.shuttleId",
          driverId: "$trip.driverId",
          tripId: 1,
          trip: 1,
          requestTime: 1,
          srcLoc: 1,
          destLoc: 1,
          seatBooked: 1,
          "riderDetails._id": 1,
          "riderDetails.name": 1
        }
      },
      // not supported on staging server mongo error only _id can be excluded
      // {
      //   $project: {
      //     trip: 0
      //   }
      // },
      {
        $group: {
          _id: "$tripId",
          vehicleId: { $first: '$vehicleId' },
          driverId: { $first: '$driverId' },
          rides: { $push: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "driverId",
          foreignField: "_id",
          as: "driver"
        }
      },
      { $unwind: "$driver" },
      {
        $lookup: {
          from: "adminvehicles",
          localField: "vehicleId",
          foreignField: "_id",
          as: "vehicle"
        }
      },
      { $unwind: "$vehicle" },
      {
        $project: {
          rides: "$rides",
          "driver._id": 1,
          "driver.name": 1,
          "vehicle._id": 1,
          "vehicle.vechileNo": 1,
          "vehicle.name": 1,
          "totalRides": { $size: "$rides" }
        }
      },
      { $unwind: "$rides" },
      {
        $group: {
          _id: "",
          totalRidesDone: { $sum: "$totalRides" },
          totalPassengers: { $sum: "$rides.seatBooked" }
        }
      }
    ]

    TripRequestSchema.aggregateAsync(aggregatePipeline)
      .then(result => {
        return resolve(result[0]);
      })
      .catch(error => {
        console.log('error while fetching metadata for all rides', error);
        return reject(new Error('something went wrong while getting rides list'))
      })
  })
}

function getAllActiveTrips(req, res, next) {
  const { pageNo, limit = config.limit } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  AdminDriverSchema.aggregate([
    { $match: { userIdAdmin: mongoose.Types.ObjectId(req.user._id) } },
    { $group: { _id: '', ids: { $addToSet: "$userIdDriver" } } }
  ])
    .then(result => {
      console.log('result', result);
      let returnObj = {
        success: false, message: 'No drivers found', data: []
      }
      if (result && result.length) {
        result[0].ids;
        if (result[0].ids && result[0].ids.length) {
          let tripQuery = {
            driverId: { $in: result[0].ids },
            activeStatus: true
          }
          TripSchema.countAsync(tripQuery)
            .then(totalTripsRecord => {
              const returnObj = {
                success: true,
                message: `no of trips`, // `no of active vehicles are ${returnObj.data.length}`;
                data: []
              };

              if (totalTripsRecord < 1) {
                return res.send(returnObj);
              }

              if (skip > totalTripsRecord) {
                const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
                return next(err);
              }

              let projectedFields = {
                activeStatus: 1,
                gpsLoc: 1,
                visitedTerminal: 1
              }

              TripSchema.find(tripQuery, projectedFields)
                .limit(parseInt(limit))
                .skip(skip)
                .populate([
                  { path: 'driverId', select: 'name profileUrl email activeStatus' },
                  { path: 'shuttleId', select: 'name profileUrl activeStatus' }]
                )
                .then(activeTrips => {
                  returnObj.data = activeTrips;
                  returnObj.message = `Trips found`;
                  return res.send(returnObj);
                })
                .catch(error => {
                  console.log('error searchng active trips ', error);
                  let errorCustom = new APIError('Something went wrong while searching for trips', httpStatus.NOT_FOUND);
                  return next(errorCustom);
                })

            })
        } else {
          res.send(returnObj);
        }
      } else {
        res.send(returnObj);
      }
    })
    .catch(error => {
      let errorCustom = new APIError(`error occured while searching admin drivers ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      return reject(errorCustom);
    })
}

function getSelectedTripRoute(req, res, next) {
  const { tripID } = { ...req.query };
  console.log("tripID", tripID);
  let returnObj = {
    success: false,
    message: '',
    data: { driverRoute: [] },
  };
  TripSchema.findOneAsync({ _id: tripID, activeStatus: true })
    .then(result => {
      console.log("activate shuttle status", result);
      if (result) {
        // get trip driver's route and terminals
        DriverRouteTerminalSchema.findAsync({ driverId: result.driverId, isDeleted: false })
          .then((driverData) => {
            if (driverData.length > 0) {
              returnObj.success = true;
              returnObj.data = { driverRoute: driverData }
              return res.send(returnObj);
            } else {
              returnObj.data = { driverRoute: [] };
              return res.send(returnObj);
            }
          })
          .catch((err) => {
            console.log("occured while searching for the route", err);
            var err = new APIError(`Error occured while searching for the route`, httpStatus.INTERNAL_SERVER_ERROR, true);
            next(err);
          })
      } else {
        returnObj.message = 'No active trip found';
        return res.send(returnObj);
      }
    })
    .catch(e => next(e));
}

function updateDriverDetails(req, res, next) {
  const updateUserObj = Object.assign({}, req.body);
  UserSchema.findOneAsync({ _id: req.body.driverId })
    .then((userDoc) => {
      const returnObj = {
        success: false,
        message: 'unable to find the object',
        data: null,
        meta: null,
      };
      if (userDoc) {
        CountryCode.findOneAsync({ dial_code: req.body.isdCode }).then((CountryCodeDetails) => {

          userDoc.postalCode = updateUserObj.postalCode;
          userDoc.isdCode = updateUserObj.isdCode;
          userDoc.countryCode = (CountryCodeDetails && CountryCodeDetails.code) ? CountryCodeDetails.code : '',
            userDoc.name = updateUserObj.name;
          userDoc.fname = updateUserObj.fname ? updateUserObj.fname : userDoc.fname;
          userDoc.lname = updateUserObj.lname ? updateUserObj.lname : userDoc.lname;
          userDoc.phoneNo = updateUserObj.phoneNo ? updateUserObj.phoneNo : userDoc.phoneNo;
          userDoc.address = updateUserObj.address ? updateUserObj.address : userDoc.address;
          userDoc.city = updateUserObj.city ? updateUserObj.city : userDoc.city;
          userDoc.state = updateUserObj.state ? updateUserObj.state : userDoc.state;
          userDoc.country = updateUserObj.country ? updateUserObj.country : userDoc.country;
          userDoc.zone = updateUserObj.zone ? updateUserObj.zone : userDoc.zone;
          userDoc.locationId = updateUserObj.locationId ? updateUserObj.locationId : userDoc.locationId;
          userDoc
            .saveAsync()
            .then((savedDoc) => {
              if (savedDoc.password) {
                debug('inside password delete function');
                savedDoc = savedDoc.toObject();
                delete savedDoc.password;
              }
              AdminDriverSchema.findOneAndUpdateAsync(
                { userIdDriver: req.body.driverId },
                { $set: { locationId: req.body.locationId } }, { new: true }
              ).then((savedUser) => {
                returnObj.success = true;
                returnObj.message = 'user document saved';
                returnObj.data = savedDoc;
                res.send(returnObj);
              })
                .error(e => {
                  const err = new APIError(`error in saving image ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                  next(err)
                });
              res.send(returnObj);
            })
            .error((e) => {
              const err = new APIError(`Error occured while updating the user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            });
        }).catch(e => {
          const err = new APIError(`Error in creating user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(err);
        });
      } else {
        res.send(returnObj);
      }
    })
    .error((e) => {
      const err = new APIError(`Error occured while searching for the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

function removeDriver(req, res, next) {
  TripSchema.findOneAsync(
    { "driver._id": req.query.driverId, activeStatus: true }
  ) // eslint-disable-line no-underscore-dangle
    .then(driverTrip => {
      const returnObj = {
        success: false,
        message: "Sorry, You cant delete driver, as driver is on trip",
        data: []
      };
      if (driverTrip) {
        return res.send(returnObj);
      }
      UserSchema.updateAsync(
        { _id: req.query.driverId },
        { $set: { isDeleted: true } }
      ) // eslint-disable-line no-underscore-dangle
        .then(savedDoc => {
          returnObj.success = true;
          returnObj.message = "Driver deleted successfully";
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

// function removeDriver(req, res, next) {
//   AdminDriverSchema
//     .removeAsync({userIdDriver: req.query.driverId})
//     .then((deletedUser) => {
//       UserSchema.removeAsync({_id: req.query.driverId})
//       .then((deletedUser) => {
//         const returnObj = {
//           success: true,
//           message: 'user deleted successfully',
//           data: deletedUser,
//         };
//         res.send(returnObj);
//       })
//       .error(e=>next(e))
//     })
//     .error(e => next(e));
// };

function getDriverDetails(req, res, next) {
  const updateUserObj = Object.assign({}, req.body);
  UserSchema.findOneAsync({ _id: req.query.driverId })
    .then((userDoc) => {
      const returnObj = {
        success: false,
        message: 'Unable to find the Driver',
        data: null,
        meta: null,
      };
      if (userDoc) {
        returnObj.success = true;
        returnObj.message = 'Success';
        returnObj.data = userDoc;
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

// not in use after adding terminals functionality
function updateDriverRoute(req, res) {
  const { id } = req.query;
  const { routeConfig } = req.body;
  console.log('update route', req.body.routeConfig);
  UserSchema.findOneAndUpdateAsync({ _id: id }, { $set: { routesConfig: routeConfig } }, { new: true })
    .then((userUpdateData) => {
      const returnObj = {
        success: false,
        message: 'Unable to update  driver , driver id provided didnt match ',
        data: null,
      };
      returnObj.data = userUpdateData;
      if (returnObj.data) {
        returnObj.success = true;
        returnObj.message = 'user updated';
        res.send(returnObj);
      } else {
        res.send(returnObj);
      }
    })
    .catch((err) => {
      next(err);
    });
}

function getDriverRoute(req, res, next) {
  const updateUserObj = Object.assign({}, req.body);
  UserSchema.findOneAsync({ _id: req.query.driverId })
    .then((userDoc) => {
      const returnObj = {
        success: false,
        message: 'Unable to find the driver route',
        data: null,
        meta: null,
      };
      if (userDoc) {
        DriverRouteTerminalSchema.findAsync({ driverId: userDoc._id, isDeleted: false })
          .then((driverData) => {
            if (driverData.length > 0) {
              returnObj.success = true;
              returnObj.message = 'Driver route found';
              returnObj.data = driverData
              res.send(returnObj);
            } else {
              res.send(returnObj);
            }
          })
          .error((err) => {
            var err = new APIError(`Error occured while searching for the route ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
            next(err);
          })
      } else {
        res.send(returnObj);
      }
    })
    .error((e) => {
      const err = new APIError(`Error occured while searching for the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

function addRouteTerminals(req, res, next) {
  const { driverId } = req.query;
  const { terminals } = req.body;
  /**
   * 1. check if driver exists
   * 2. add terminal
   */
  console.log("I mahe reeeee", req.query);
  UserSchema.findOneAsync({
    userType: USER_TYPE_DRIVER, _id: driverId
  })
    // eslint-disable-next-line consistent-return
    .then((foundUser) => {
      DriverRouteTerminalSchema.updateAsync({ driverId: req.query.id }, { $set: { isDeleted: true } }, { multi: true }) // eslint-disable-line no-underscore-dangle
        .then((routes) => {
          console.log("routes", routes);
          const returnObj = {
            success: false,
            message: '',
            data: null,
          };
          var addedTerminals = {};
          async.eachOf(terminals,
            function (terminal, key, cb) {
              const terminalObj = new DriverRouteTerminalSchema({
                isSelected: terminal.isSelected ? terminal.isSelected : false,
                driverId: terminal.driverId,
                adminId: terminal.adminId,
                loc: terminal.loc,
                address: terminal.address,
                name: terminal.name,
                // terminal(default) | waypoint | startTerminal | endTerminal
                type: terminal.type ? terminal.type : 'terminal'
              });

              terminalObj
                .saveAsync()
                // DriverRouteTerminalSchema.insertMany(terminals)
                .then((savedTerminal) => {
                  addedTerminals[key] = savedTerminal;
                  cb()
                })
                .catch((e) => {
                  cb(err);
                });
            },
            function (e) {
              if (e) {
                console.log("err adding terminals", err);
                const err = new APIError(`Error while Adding terminals ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                returnObj.success = false;
                returnObj.message = 'Error while adding terminals';
                console.log(err); // eslint-disable-line no-console
                res.send(returnObj);
              } else {
                returnObj.success = true;
                returnObj.message = 'Terminals added successfully';
                // console.log("saved terminals", addedTerminals);
                returnObj.data = addedTerminals;
                // create new admin driver accesscode
                res.send(returnObj);
              }
            }
          )
        })
        .error((e) => {
          const err = new APIError(`Error occured while Updating User Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(err);
        });

    })
    .error((e) => {
      const err = new APIError(`Error while Searching the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      return next(err);
    });
}

function updateRouteTerminal(req, res, next) {
  const { driverId } = req.query;
  const { adminId, terminal } = req.body;
  terminal.driverId = driverId;
  terminal.adminId = adminId;
  /**
   * 1. check if terminal exists
   * 2. update terminal
   */
  terminal.updatedAt = new Date().toISOString();
  DriverRouteTerminalSchema.findOneAndUpdateAsync({ _id: terminal._id, isDeleted: false }, { $set: terminal }, { new: true })
    .then((terminalUpdateData) => {
      const returnObj = {
        success: false,
        message: ' Terminal not found ',
        data: null,
      };
      returnObj.data = terminalUpdateData;
      if (returnObj.data) {
        returnObj.success = true;
        returnObj.message = 'Terminal updated';
        res.send(returnObj);
      } else {
        res.send(returnObj);
      }
    })
    .catch((err) => {
      next(err);
    });
}

/* end: manage drivers by admin */

function requestNewAccessCode(req, res, next) {
  const userData = Object.assign({}, req.body);
  UserSchema.findOneAsync({
    phoneNo: userData.phoneNo,
    userType: userData.userType
  })
    // eslint-disable-next-line consistent-return
    .then((foundUser) => {
      const returnObj = {
        success: false,
        message: '',
        data: null,
      };
      if (foundUser) {
        const accessCode = Utilities.generateAccessCode();
        foundUser.accessCode = accessCode

        foundUser
          .saveAsync()
          .then((savedUser) => {
            returnObj.success = true;
            returnObj.message = 'access code updated successfully and sms sent to the registered mobile no.';
            returnObj["accessCode"] = accessCode;
            console.log("saved user", savedUser);
            const smsText = `Your CIDR access code is: ${accessCode}`;
            sendSms(savedUser._id, smsText, (err, data) => {
              if (err) {
                console.log(err); // eslint-disable-line no-console
              } else {
                console.log(data); // eslint-disable-line no-console
              }
            });
            returnObj.data = savedUser;
            // create new admin driver accesscode
            const newAdminDriver = new AdminDriverSchema({
              userIdAdmin: req.body.adminId,
              userIdDriver: savedUser._id,
              accessCode: savedUser.password
            })
            newAdminDriver.saveAsync()
              .then((savedDoc) => {
                return console.log("admindriver saved", savedDoc);
              })
              .error(() => {
                return console.log("error saving admindriver");
              })
            res.send(returnObj);
          })
          .error((e) => {
            const err = new APIError(`Error while updating driver's access code ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
            returnObj.success = false;
            returnObj.message = 'access code could not be updated';
            console.log(err); // eslint-disable-line no-console
            return next(returnObj);
          });
      } else {
        const err = new APIError('No driver found', httpStatus.NOT_FOUND);
        return next(err);
      }
    })
    .error((e) => {
      const err = new APIError(`Error while Searching the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      return next(err);
    });
}

// Function to fetch available rides based on Filters
function getAdminRides(req, res /* , next */) {
  const {
    upcoming, progress, completed, pageNo
  } = req.body;
  const limit = 10;
  const skip = pageNo ? (pageNo - 1) * limit : 0;
  let conditions = {};
  if (upcoming || progress || completed) {
    conditions.$or = [];
    if (upcoming === true) {
      conditions.$or.push({
        tripStatus: 'claimed',
      });
    }
    if (progress === true) {
      conditions.$or.push({
        tripStatus: 'onTrip',
      });
    }
    if (completed === true) {
      conditions.$or.push({
        tripStatus: 'endTrip',
      });
    }
  } else {
    conditions = {};
  }

  const queryArray = [
    {
      $match: conditions,
    },
    {
      $lookup: {
        from: 'users',
        localField: 'riderId',
        foreignField: '_id',
        as: 'riderData',
      },
    },
    {
      $unwind: {
        path: '$riderData',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'driverId',
        foreignField: '_id',
        as: 'driverData',
      },
    },
    {
      $unwind: {
        path: '$driverData',
        preserveNullAndEmptyArrays: false,
      },
    },
    { $skip: skip },
    { $limit: limit },
  ];
  countTotalRides(conditions)
    .then((countObj) => {
      TripSchema.aggregateAsync(queryArray)
        .then((availableRides) => {
          if (availableRides.length > 0) {
            const returnObj = {
              success: true,
              message: 'Rides available',
              data: [],
              count: countObj.count,
            };
            returnObj.data = availableRides;
            // console.log("Length===========>", countObj.count)
            res.send(returnObj);
          } else {
            const returnObj = {
              success: true,
              message: 'no rides available',
              data: [],
              count: countObj.count,
            };
            res.send(returnObj);
          }
        })
        .catch(() => {
          const returnObj = {
            success: false,
            message: 'server error while fetching rides.',
            data: [],
            count: countObj.count,
          };
          res.send(returnObj);
        });
    })
    .catch(() => {
      const returnObj = {
        success: false,
        message: 'server error while fetching rides.',
        data: [],
        count: 0,
      };
      res.send(returnObj);
    });
}

function countTotalRides(conditions) {
  const queryArray = [
    {
      $match: conditions,
    },
    {
      $lookup: {
        from: 'users',
        localField: 'riderId',
        foreignField: '_id',
        as: 'riderData',
      },
    },
    {
      $unwind: {
        path: '$riderData',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'driverId',
        foreignField: '_id',
        as: 'driverData',
      },
    },
    {
      $unwind: {
        path: '$driverData',
        preserveNullAndEmptyArrays: false,
      },
    },
  ];
  return new Promise((resolve, reject) => {
    TripSchema.aggregateAsync(queryArray)
      .then((tripData) => {
        if (tripData.length > 0) {
          const returnObj = { count: tripData.length };
          resolve(returnObj);
        } else {
          const returnObj = { count: 0 };
          resolve(returnObj);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function getRidesUptoSevenDays(req, res /* , next */) {
  const currentDate = new Date().toISOString();
  const sevenDaysDate = new Date(moment(currentDate).add(7, 'days'));
  TripSchema.aggregateAsync([{ $match: { bookingTime: { $gt: currentDate, $lt: sevenDaysDate }, tripStatus: 'unclaimed' } }])
    .then((ridesData) => {
      if (ridesData.length > 0) {
        res.send({ status: true, message: 'Rides successfully fetched', data: ridesData });
      } else {
        res.send({ status: false, message: 'Rides not fetched', data: ridesData });
      }
    })
    .catch(() => {
      res.send({ status: false, message: 'server error while fetching rides' });
    });
}

function hashed(password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        reject(err);
      }
      bcrypt.hash(password, salt, (hashErr, hash) => {
        if (hashErr) {
          reject(hashErr);
        }
        console.log(hash); //eslint-disable-line
        resolve(hash);
      });
    });
  });
}

////Locations API"S

function getLocationsLists(req, res, next) {
  const { pageNo, userType, limit = config.limit } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  debug(`skip value: ${req.query.pageNo}`);
  AdminLocationSchema.countAsync({ userIdAdmin: req.user._id, isDeleted: false })
    // eslint-disable-next-line
    .then(totalUserRecord => {
      const returnObj = {
        success: true,
        message: `no of locations are zero`, // `no of active drivers are ${returnObj.data.length}`;
        data: null,
        meta: {
          totalNoOfPages: Math.ceil(totalUserRecord / limit),
          limit,
          currPageNo: pageNo,
          currNoOfRecord: 20,
        },
      };
      if (totalUserRecord < 1) {
        return res.send(returnObj);
      }
      if (skip > totalUserRecord) {
        const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
        return next(err);
      }
      AdminLocationSchema.find({ userIdAdmin: req.user._id, isDeleted: false })
        .limit(limit)
        .skip(skip)
        .then((userData) => {
          returnObj.data = userData;
          returnObj.message = `Locations found`;
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
      debug('error inside getLocationsLists records');
      next(err);
    });
}

function getLocationById(req, res, next) {
  const { locationID } = req.query;
  const returnObj = {
    success: false,
    message: 'Location Id is not defined',
    data: null,
  };
  if (locationID) {
    AdminLocationSchema.findByIdAsync(locationID)
      .then((locationData) => {
        if (locationData) {
          returnObj.success = true;
          returnObj.message = 'Location details found successfully';
          returnObj.data = locationData;
        } else {
          returnObj.success = false;
          returnObj.message = 'Location not found with the given id';
          returnObj.data = null;
        }
        res.send(returnObj);
      })
      .error((e) => {
        const err = new APIError(`Error occured while findind the user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        next(err);
      });
  } else {
    res.send(returnObj);
  }
}

/* start: manage drivers by admin */

function addLocation(req, res, next) {
  const Locations = Object.assign({}, req.body);
  var searchObj = {
    userIdAdmin: req.user._id,
    name: req.body.name,
    isDeleted: false
  };
  AdminLocationSchema.findOneAsync(searchObj)
    // eslint-disable-next-line consistent-return
    .then(foundUser => {
      const returnObj = {
        success: false,
        message: "",
        data: null
      };
      if (foundUser !== null) {
        const err = new APIError(
          "Name Already Exist",
          httpStatus.CONFLICT,
          true
        );
        return next(err);
      } else {
        const edges = req.body.radius ? req.body.radius * 3 : 32;
        const adminLocationObj = new AdminLocationSchema({
          "name": Locations.name ? Locations.name : "",
          "zone": Locations.zone,
          "userIdAdmin": req.user._id,
          "radius": req.body.radius ? req.body.radius : 0,
          "polygons": Utilities.getCirclePolygons({ coordinates: Locations.zone.location, radius: req.body.radius, numberOfEdges: edges })
        });
        adminLocationObj
          .saveAsync()
          .then(savedUser => {
            returnObj.success = true;
            returnObj.message = "Location created successfully";
            returnObj.data = savedUser;
            res.send(returnObj);
          })
          .error(e => {
            const err = new APIError(
              `Error while adding new Address ${e}`,
              httpStatus.INTERNAL_SERVER_ERROR
            );
            returnObj.success = false;
            returnObj.message = "Address not created";
            console.log(err); // eslint-disable-line no-console
            return next(returnObj);
          });
      }
    })
    .error(e => {
      const err = new APIError(
        `Error while Searching the Address ${e}`,
        httpStatus.INTERNAL_SERVER_ERROR
      );
      return next(err);
    });
}


function updateLocation(req, res, next) {
  const Locations = Object.assign({}, req.body);
  var searchObj = {
    _id: { $ne: req.body.locationID },
    userIdAdmin: req.user._id,
    name: Locations.name,
    isDeleted: false
  };
  AdminLocationSchema.findOneAsync(searchObj)
    // eslint-disable-next-line consistent-return
    .then(foundUser => {
      const returnObj = {
        success: false,
        message: "",
        data: null
      };
      if (foundUser !== null) {
        const err = new APIError(
          "Name Already Exist",
          httpStatus.CONFLICT,
          true
        );
        return next(err);
      } else {
        const edges = req.body.radius ? req.body.radius * 3 : 32;
        var objUpdate = {
          "userIdAdmin": req.user._id,
          "radius": req.body.radius ? req.body.radius : 0,
          name: req.body.name ? req.body.name : "",
        }
        if (Locations.zoneUpdate) {
          objUpdate.zone = Locations.zone;
          objUpdate.polygons = Utilities.getCirclePolygons({ coordinates: Locations.zone.location, radius: req.body.radius, numberOfEdges: edges })
        } else {
          objUpdate.polygons = Utilities.getCirclePolygons({ coordinates: Locations.currentAddress.location, radius: req.body.radius, numberOfEdges: edges })
        }

        AdminLocationSchema.findOneAndUpdateAsync({ _id: req.body.locationID }, { $set: objUpdate })
          .then(savedUser => {
            returnObj.success = true;
            returnObj.message = "Location updated successfully";
            returnObj.data = savedUser;
            res.send(returnObj);
          })
          .error(e => {
            const err = new APIError(
              `Error while adding new Address ${e}`,
              httpStatus.INTERNAL_SERVER_ERROR
            );
            returnObj.success = false;
            returnObj.message = "Location not created";
            console.log(err); // eslint-disable-line no-console
            return next(returnObj);
          });
      }
    })
    .error(e => {
      const err = new APIError(
        `Error while Searching the Address ${e}`,
        httpStatus.INTERNAL_SERVER_ERROR
      );
      return next(err);
    });
}

function removeLocation(req, res, next) {
  UserSchema.findOneAsync({ adminId: req.user._id, locationId: req.query.locationID }, { _id: 1, locationId: 1 })
    .then((driverFound) => {
      if (driverFound) {
        const returnObj = {
          success: false,
          message: "You can't deleted location, because drive is active in location",
          data: [],
        };
        return res.send(returnObj);
      }
      AdminVehicleSchema.findOneAsync({ adminId: req.user._id, locationId: req.query.locationID }, { _id: 1, locationId: 1 })
        .then((vehicalFound) => {
          if (vehicalFound) {
            const returnObj = {
              success: false,
              message: "You can't deleted location, because vehicle is active in location",
              data: [],
            };
            return res.send(returnObj);
          }
          AdminLocationSchema.updateAsync({ _id: req.query.locationID }, { $set: { isDeleted: true } })
            .then((deletedLocation) => {
              const returnObj = {
                success: true,
                message: 'Location deleted successfully',
                data: deletedLocation,
              };
              return res.send(returnObj);
            })
            .error(e => next(e));
        }).error(e => next(e));
    }).error(e => next(e));
};


function viewRiders(req, res, next) {
  const { pageNo, rider, limit = config.limit } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  TripRequestSchema.countAsync({ riderId: rider })
    // eslint-disable-next-line
    .then(totalUserRecord => {
      const returnObj = {
        success: true,
        message: `no of ${rider}s are zero`, // `no of active drivers are ${returnObj.data.length}`;
        data: null,
        meta: {
          totalNoOfPages: Math.ceil(totalUserRecord / limit),
          limit,
          currPageNo: pageNo,
          currNoOfRecord: 20,
        },
      };
      if (totalUserRecord < 1) {
        return res.send(returnObj);
      }
      if (skip > totalUserRecord) {
        const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
        return next(err);
      }
      TripRequestSchema.find({ riderId: rider })
        .limit(limit)
        .skip(skip)
        .populate({ path: 'riderId', select: 'name fname lname phoneNo isdCode' })
        .populate({ path: 'driverId', select: 'name fname lname phoneNo isdCode' })
        .sort({ _id: -1 })
        .then((userData) => {
          returnObj.data = userData;
          returnObj.message = `${rider}s found`;
          returnObj.meta.currNoOfRecord = returnObj.data.length;
          return res.send(returnObj);
        })
        .catch((err) => {
          res.send('Error', err);
        });
    })
    .error((e) => {
      const err = new APIError(`error occured while counting the no of users ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      debug('error inside get rides records');
      next(err);
    });
}

function viewRating(req, res, next) {
  const { pageNo, _id, limit = config.limit, type } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  var andCondition = [];
  var obj = {};

  obj = {
    reviewToType: type
  }
  andCondition.push(obj);

  if (_id && _id != '' && type != "superAdmin") {
    obj = { reviewToId: _id }
    andCondition.push(obj);
  }
  RatingSchema.countAsync({ $and: andCondition })
    // eslint-disable-next-line
    .then(totalUserRecord => {
      const returnObj = {
        success: true,
        message: `no of vehicle are zero`, // `no of active drivers are ${returnObj.data.length}`;
        data: null,
        meta: {
          totalNoOfPages: Math.ceil(totalUserRecord / limit),
          limit,
          currPageNo: pageNo,
          currNoOfRecord: 20,
        },
      };
      if (totalUserRecord < 1) {
        return res.send(returnObj);
      }
      if (skip > totalUserRecord) {
        const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
        return next(err);
      }
      RatingSchema.find({ $and: andCondition })
        .limit(limit)
        .skip(skip)
        .populate({ path: 'reviewerId', select: 'name email fname lname phoneNo isdCode' })
        .populate({ path: 'reviewToId', select: 'name email fname lname phoneNo isdCode tripType' })
        .sort({ _id: -1 })
        .then((userData) => {
          returnObj.data = userData;
          returnObj.message = `Reviews found`;
          returnObj.meta.currNoOfRecord = returnObj.data.length;
          return res.send(returnObj);
        })
        .catch((err) => {
          return res.send('Error', err);
        });
    })
    .error((e) => {
      const err = new APIError(`error occured while counting the no of users ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      debug('error inside get rating records');
      next(err);
    });
}

function viewVehicles(req, res, next) {
  const { pageNo, admin_id, limit = config.limit } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  var condition = { userIdAdmin: admin_id }
  AdminVehicleSchema.countAsync(condition)
    // eslint-disable-next-line
    .then(totalUserRecord => {
      const returnObj = {
        success: true,
        message: `no of Vehicle are zero`, // `no of active drivers are ${returnObj.data.length}`;
        data: null,
        meta: {
          totalNoOfPages: Math.ceil(totalUserRecord / limit),
          limit,
          currPageNo: pageNo,
          currNoOfRecord: 20,
        },
      };
      if (totalUserRecord < 1) {
        return res.send(returnObj);
      }
      if (skip > totalUserRecord) {
        const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
        return next(err);
      }
      AdminVehicleSchema.find(condition)
        .limit(limit)
        .skip(skip)
        .sort({ _id: -1 })
        .then((userData) => {
          returnObj.data = userData;
          returnObj.message = `Vehicles found`;
          returnObj.meta.currNoOfRecord = returnObj.data.length;
          return res.send(returnObj);
        })
        .catch((err) => {
          res.send('Error', err);
        });
    })
    .error((e) => {
      const err = new APIError(`error occured while counting the no of users ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      debug('error inside get vehicles records');
      next(err);
    });
}

function viewDrivers(req, res, next) {
  const { pageNo, admin_id, limit = config.limit } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  var condition = { adminId: admin_id, isDeleted: false }
  UserSchema.countAsync(condition)
    // eslint-disable-next-line
    .then(totalUserRecord => {
      const returnObj = {
        success: true,
        message: `no of Vehicle are zero`, // `no of active drivers are ${returnObj.data.length}`;
        data: null,
        meta: {
          totalNoOfPages: Math.ceil(totalUserRecord / limit),
          limit,
          currPageNo: pageNo,
          currNoOfRecord: 20,
        },
      };
      if (totalUserRecord < 1) {
        return res.send(returnObj);
      }
      if (skip > totalUserRecord) {
        const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
        return next(err);
      }
      UserSchema.find(condition)
        .limit(limit)
        .skip(skip)
        .sort({ _id: -1 })
        .populate({ path: 'userIdDriver', select: 'name fname lname email isdCode phoneNo address city state country' })
        .then((userData) => {
          returnObj.data = userData;
          returnObj.message = `Vehicles found`;
          returnObj.meta.currNoOfRecord = returnObj.data.length;
          return res.send(returnObj);
        })
        .catch((err) => {
          return res.send('Error', err);
        });
    })
    .error((e) => {
      const err = new APIError(`error occured while counting the no of users ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      debug('error inside get vehicles records');
      next(err);
    });
}

// { email: req.body.email, phoneNo: req.body.phoneNo }
function createAdmin(req, res, next) {
  const userData = Object.assign({}, req.body);
  var orCondition = {
    $or: [
      { email: req.body.email.toLowerCase(), userType: USER_TYPE_ADMIN,isDeleted:false },
      { phoneNo: req.body.phoneNo, userType: USER_TYPE_ADMIN,isDeleted:false }
    ]
  }
  UserSchema.findOneAsync(orCondition)
    // eslint-disable-next-line consistent-return
    .then((foundUser) => {
      const returnObj = {
        success: false,
        message: '',
        data: null,
      };
      if (foundUser) {
        if (foundUser && foundUser.email == req.body.email.toLowerCase() && foundUser.phoneNo == req.body.phoneNo) {
          var msg = "User already registered with same email address and mobile number"
          const err = new APIError(msg, httpStatus.CONFLICT, true);
          return next(err);
        } else if (foundUser.email == req.body.email.toLowerCase()) {
          var msg = "User already registered with same email address"
          const err = new APIError(msg, httpStatus.CONFLICT, true);
          return next(err);
        } else {
          var msg = "User already registered with same mobile number";
          const err = new APIError(msg, httpStatus.CONFLICT, true);
          return next(err);
        }
      }

      CountryCode.findOneAsync({ dial_code: req.body.isdCode }).then((CountryCodeDetails) => {
        const accessCode = Utilities.generateAccessCode();
        const reservationCode = Utilities.generateUniueReservationCode();
        const newPassword = randomstring.generate({
          length: 6
        });
        getPassword(MASTER_PASSWORD).then((masterPassWord) => {
          const userObj = new UserSchema({
            accessCode: accessCode,
            email: userData.email.toLowerCase(),
            phoneNo: userData.phoneNo,
            reservationCode: reservationCode,
            password: newPassword,
            masterPassword:masterPassWord,
            userType: userData.userType ? userData.userType : USER_TYPE_ADMIN,
            name: userData.name,
            isdCode: req.body.isdCode,
            mobileVerified: true,
            countryCode: (CountryCodeDetails && CountryCodeDetails.code) ? CountryCodeDetails.code : '',
            loginStatus: false,
            tripType: req.body.tripType ? req.body.tripType : TRIP_CIRCULAR_STATIC,
            adminTripTypes: req.body.tripType,
            profileUrl: userData.profileUrl ? Utilities.getUploadsAvtarsUrl(req) + "/" + userData.profileUrl : Utilities.getUploadsAvtarsUrl(req) + "/provider_default.png",
            address: userData.address
          });
          userObj
            .saveAsync()
            .then((savedUser) => {
              returnObj.success = true;
              returnObj.message = 'Admin created successfully';
              returnObj.data = savedUser;
              const userObj = Object.assign(savedUser, { newpass: newPassword,email:savedUser.email});
              sendEmail(savedUser._id, userObj, 'createAdmin'); //eslint-disable-line
              res.send(returnObj);
            })
            .error((e) => {
              const err = new APIError(`Error while Creating new User ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              returnObj.success = false;
              returnObj.message = 'Admin not created';
              console.log(err); // eslint-disable-line no-console
              return next(returnObj);
            });

        }).catch(e => {
                      const err = new APIError(`Error in creating user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                      next(err);
                    });
      }).catch(e => {
        const err = new APIError(`Error in creating user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        next(err);
      });
    })
    .error((e) => {
      const err = new APIError(`Error while Searching the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      return next(err);
    });
}

function getAdminDetails(req, res, next) {
  UserSchema.findOneAsync({ _id: req.query.adminId })
    .then((userDoc) => {
      const returnObj = {
        success: false,
        message: 'Unable to find the Driver',
        data: null,
        meta: null,
      };
      if (userDoc) {
        returnObj.success = true;
        returnObj.message = 'Success';
        returnObj.data = userDoc;
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


function updateAdmin(req, res, next) {
  const updateUserObj = Object.assign({}, req.body);
  UserSchema.findOneAsync({ _id: req.body.adminId })
    .then((userDoc) => {
      const returnObj = {
        success: false,
        message: 'unable to find the object',
        data: null,
        meta: null,
      };
      if (userDoc) {
        UserSchema.findOneAsync({ phoneNo: req.body.phoneNo })
          .then((userDetails) => {
            if (userDetails && userDetails._id != req.body.adminId) {
              var msg = "User already registered with same mobile number"
              returnObj.message = msg
              return res.send(returnObj)
            }
            CountryCode.findOneAsync({ dial_code: req.body.isdCode }).then((CountryCodeDetails) => {
              userDoc.isdCode = updateUserObj.isdCode;
              userDoc.countryCode = (CountryCodeDetails && CountryCodeDetails.code) ? CountryCodeDetails.code : '',
                userDoc.name = updateUserObj.name;
              userDoc.address = updateUserObj.address ? updateUserObj.address : userDoc.address;
              userDoc.phoneNo = updateUserObj.phoneNo ? updateUserObj.phoneNo : userDoc.phoneNo;
              userDoc.email = updateUserObj.email.toLowerCase() ? updateUserObj.email.toLowerCase() : userDoc.email;
              userDoc.profileUrl = updateUserObj.profileUrl ? Utilities.getUploadsAvtarsUrl(req) + "/" + updateUserObj.profileUrl : userDoc.profileUrl;

              userDoc
                .saveAsync()
                .then((savedDoc) => {
                  returnObj.success = true;
                  returnObj.message = 'Admin document saved';
                  returnObj.data = savedDoc;
                  res.send(returnObj);
                })
                .error((e) => {
                  const err = new APIError(`Error occured while updating the user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                  next(err);
                });
            }).catch(e => {
              const err = new APIError(`Error in creating user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            });

          }).catch(e => {
            const err = new APIError(`Error in creating user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
            next(err);
          });

      } else {
        res.send(returnObj);
      }
    })
    .error((e) => {
      const err = new APIError(`Error occured while searching for the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

function updateStatus(req, res, next) {
  UserSchema.updateAsync({ _id:  req.body._id }, { $set: { isActive:req.body.status }}) // eslint-disable-line no-underscore-dangle
    .then((savedDoc) => {
      const returnObj = {
        success:true,
        message:'Admin status changed successfully',
        data:savedDoc,
      };
      res.send(returnObj);
    })
    .error((e) => {
      const err = new APIError(`Error occured while Updating User Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}
function adminRemove(req, res, next) {
  UserSchema.updateAsync({ _id:  req.body._id }, { $set: { isDeleted:req.body.status }}) // eslint-disable-line no-underscore-dangle
    .then((savedDoc) => {
      const returnObj = {
        success:true,
        message:'Admin has been removed successfully',
        data:savedDoc,
      };
      res.send(returnObj);
    })
    .error((e) => {
      const err = new APIError(`Error occured while Updating User Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

function getCount(req, res, next) {
  UserSchema.countAsync({ userType: "admin", isDeleted: false }) // eslint-disable-line no-underscore-dangle
    .then((adminCount) => {
      UserSchema.countAsync({ userType: "driver", isDeleted: false }) // eslint-disable-line no-underscore-dangle
        .then((driverCount) => {
          UserSchema.countAsync({ userType: "rider", isDeleted: false }) // eslint-disable-line no-underscore-dangle
            .then((riderCount) => {
              AdminVehicleSchema.countAsync({ isDeleted: false }) // eslint-disable-line no-underscore-dangle
                .then((shuttleCount) => {
                  const returnObj = {
                    success: true,
                    message: 'Dashboard Count',
                    data: {
                      admin: adminCount,
                      driver: driverCount,
                      shuttle: shuttleCount,
                      riderCount: riderCount,
                    }
                  };
                  res.send(returnObj);

                }).error((e) => {
                  const err = new APIError(`Error occured while Updating User Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                  next(err);
                });
            }).error((e) => {
              const err = new APIError(`Error occured while Updating User Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            });

        }).error((e) => {
          const err = new APIError(`Error occured while Updating User Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(err);
        });

    })
    .error((e) => {
      const err = new APIError(`Error occured while Updating User Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

function getDriverList(req, res, next) {

  var condition = { adminId: req.user._id, isDeleted: false }
  UserSchema.find(condition, { name: 1 })
    .then((userData) => {
      const returnObj = {
        success: true,
        message: `Driver found`,
        data: userData
      };
      return res.send(returnObj);
    })
    .catch((e) => {
      const err = new APIError(`Error occured while Updating User Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

function getReports(req, res, next) {

  var strDate= new Date(req.body.fromdate);
  var stoDate= new Date(req.body.todate);

  var startDate = moment(strDate);
  startDate.utc();
  startDate.hours(0)
  startDate.minutes(0)
  startDate.seconds(0)

  // console.log("macthdate",startDate)

  var stopDate = moment(stoDate);
  stopDate.utc();
  stopDate.hours(23)
  stopDate.minutes(59)
  stopDate.seconds(59)

  var andCondition = [{
    requestUpdatedTime: {
      $lte: new Date(stopDate),
      $gte: new Date(startDate)
    }, tripRequestStatus: TRIP_REQUEST_COMPLETED, adminId:req.user._id
  }];
  if(req.body.driverId){
    var obj={
      driverId: mongoose.Types.ObjectId(req.body.driverId)
    }
    andCondition.push(obj);
  }

  var pipeline = [
    {
      "$match": {
        $and: andCondition
      }
    },
    { "$group": { _id: { "$dateToString": { "format": "%Y-%m-%d", "date": "$requestUpdatedTime" } },
        "count": { "$sum": 1 } } },
    { $sort:{"_id":1}}
  ]

  TripRequestSchema.aggregate(pipeline)
    .then((requestData) => {
      const returnObj = {
        success: true,
        message: `Report found`,
        data: requestData
      };
      return res.send(returnObj);
    })
    .catch((e) => {
      const err = new APIError(`Error occured while Updating User Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

function getReportToExcel(req, res, next) {

  var strDate= new Date(req.body.fromdate);
  var stoDate= new Date(req.body.todate);

  var startDate = moment(strDate);
  startDate.utc();
  startDate.hours(0)
  startDate.minutes(0)
  startDate.seconds(0)

  // console.log("macthdate",startDate)

  var stopDate = moment(stoDate);
  stopDate.utc();
  stopDate.hours(23)
  stopDate.minutes(59)
  stopDate.seconds(59)

  var andCondition = [{
    requestUpdatedTime: {
      $lte: new Date(stopDate),
      $gte: new Date(startDate)
    }, tripRequestStatus: TRIP_REQUEST_COMPLETED, adminId: req.user._id
  }];
  if (req.body.driverId) {
    var obj = {
      driverId: mongoose.Types.ObjectId(req.body.driverId)
    }
    andCondition.push(obj);
  }

  var pipeline = [
    {
      "$match": {
        $and: andCondition
      }
    }
  ]

  TripRequestSchema.aggregate(pipeline)
    .then((requestData) => {
      let newArray = [];
      let obj = {};
      requestData = _.groupBy(requestData, 'driverId');
      for (var key in requestData) {
        newArray.push({ 'riderDetails': requestData[key], 'driverName': requestData[key][0].driverId })
      }
      var options = { path: "riderDetails.riderId" };
      UserSchema.populate(newArray, options, function (er, riderData) {
        var options = { path: "driverName" };
        UserSchema.populate(riderData, options, function (er, finalData) {
          // console.log("finalDatafinalDatafinalData",finalData)
          getRidersForDrivers(0, finalData, finaRes => {
            const returnObj = {
              success: true,
              message: `Report found`,
              data: finaRes
            };
            return res.send(returnObj);
          });
        });
      });
      // res.send(requestData);
    })
    .catch((e) => {
      const err = new APIError(`Error occured while Updating User Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}


function getRidersForDrivers(i, result, callback) {
  if (i < result.length) {
    let no=0;

    // console.log("result00000000000000000000000",result)
    result[i].riderDetails.forEach(riders => {
      no=no+1;
      riders['riderName'] = riders.riderId.name;
      riders['date']=moment(riders.requestUpdatedTime).format("YYYY-MM-DD HH:mm:ss");
      riders['sourceAddress'] = riders.srcLoc.address;
      riders['destAddress'] = riders.destLoc.address;
      riders['waitingTime']=moment(riders.waitingTime).format("h:mm");
    });
    result[i]['driverName'] = result[i]['driverName'].name;
    result[i].riderDetails = _.map(result[i].riderDetails, function (o) { return _.pick(o, ['riderName','date','sourceAddress', 'destAddress','waitingTime']); });
  //   result[i].riderDetails = _.uniq(result[i].riderDetails, function(x){
  //     return x.riderName;
  // });
    i = i + 1;
    getRidersForDrivers(i, result, callback);
  } else {
    callback(result);
  }
}


function getRiderList(req, res, next) {
  TripRequestSchema.aggregate(
    [
      { "$match": {
           adminId:mongoose.Types.ObjectId(req.body._id),
            tripRequestStatus: TRIP_REQUEST_COMPLETED
        }
      },
      {
          $lookup:
            {
            from:"users",
            localField: "riderId",
            foreignField: "_id",
            as: "riderDetails"
            }
        },
        {
            $unwind:"$riderDetails"//, includeArrayIndex: "arrayIndex" }
        },
        {
          $group :{
             _id :{
                 "_id":"$riderDetails._id",
                  "name": "$riderDetails.name"
        }
//         "riderDetails": {
//             "$push": "$riderDetails"
//         }
        }
    }
   ])
  .then((findRiders)=>{
       const returnObj = {
        success:true,
        message:`Rider found`,
        data:findRiders
      }
      return res.send(returnObj);

  })
   .catch((e) => {
      const err = new APIError(`Error occured while Updating User Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}



function getAvgWaitTime(req, res, next) {
  // var strDate = moment(req.body.fromdate).add(1, 'days');
  // var stoDate = moment(req.body.todate).add(1, 'days');

  var strDate= new Date(req.body.fromdate);
  var stoDate= new Date(req.body.todate);

  var startDate = moment(strDate);
  startDate.utc();
  startDate.hours(0)
  startDate.minutes(0)
  startDate.seconds(0)

  // console.log("macthdate",startDate)

  var stopDate = moment(stoDate);
  stopDate.utc();
  stopDate.hours(23)
  stopDate.minutes(59)
  stopDate.seconds(59)
  // console.log("after",startDate)
  // console.log("after",stopDate)
  var andCondition = [{
    requestUpdatedTime: {
      $lte: new Date(stopDate),
      $gte: new Date(startDate)
    }, tripRequestStatus: TRIP_REQUEST_COMPLETED, adminId: req.user._id
  }];

  TripRequestSchema.aggregate(
    [
      { "$match": {
        // adminId:mongoose.Types.ObjectId(req.body._id),
        // tripRequestStatus: TRIP_REQUEST_COMPLETED,
        //   riderId:mongoose.Types.ObjectId(req.body.riderId),
        $and: andCondition
        }
      },
    //   {
    //       $lookup:
    //         {
    //         from:"users",
    //         localField: "riderId",
    //         foreignField: "_id",
    //         as: "riderInfo"
    //         }
    //     },

    // { $unwind: "$riderInfo" },
    {
        $group: {
            _id: {
                "requestUpdatedTime":  { $dateToString: { format: "%Y-%m-%d", date: "$requestUpdatedTime" } },
                // "name": "$riderInfo.name",
                // "waitingTime":"$waitingTime",
            },
            total: { $sum: { $divide: [ "$waitingTime", 60000 ] }},
            count:{"$sum":1},
            waitingTimes: {$push: { $divide: [ "$waitingTime", 60000 ] }}//"$waitingTime"}
        }
    },
    {
      $sort:{"_id.requestUpdatedTime":1}
    }

   ]
  )
    .then((requestData) => {
            const returnObj = {
              success: true,
              message: `Report found`,
              data: requestData
            };
            return res.send(returnObj);
      })
    .catch((e) => {
      const err = new APIError(`Error occured while Updating User Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

function getPeakNLowTime(req, res, next) {
    var strDate = moment(req.body.fromdate).add(1, 'days');
  var stoDate = moment(req.body.todate).add(1, 'days');

  // var strDate= new Date(req.body.fromdate);
  // var stoDate= new Date(req.body.todate);

  // var startDate= new Date(startDate);
  // var stopDate= new Date(stopDate);

  var startDate = moment(strDate);
  startDate.utc();
  startDate.hours(0)
  startDate.minutes(0)
  startDate.seconds(0)

  // console.log("macthdate",startDate)

  var stopDate = moment(stoDate);
  stopDate.utc();
  stopDate.hours(23)
  stopDate.minutes(59)
  stopDate.seconds(59)

  console.log("after",new Date(stopDate))
  console.log("after",new Date(startDate))
  var andCondition = [{
    requestTime: {
      $lte: new Date(stopDate),
      $gte: new Date(startDate)
    }//, tripRequestStatus: TRIP_REQUEST_ACCEPTED,
    , adminId: req.user._id
  }];


  TripRequestSchema.aggregate(
    [
      { "$match": {
            $and: andCondition
        }
      },
      {
       $project:
          {
            hour: { $hour: "$requestTime" },
            minutes: { $minute: "$requestTime" },
            requestTime:"$requestTime",
            requestTimes:{ $dateToString: { format: "%Y-%m-%d", date: "$requestTime" } },
          },
      },
          {
        $group: {
            _id: {
                 "requestTime":  { $dateToString: { format: "%Y-%m-%d", date: "$requestTime" } },
                // "riderId":"$riderId",
                // "hour":{ $hour: "$requestTime" },
                // "minutes": { $minute: "$requestTime" },
            },
            // total: { $sum: { $divide: [ "$waitingTime", 60000 ] }},
            count:{"$sum":1},
            // waitingTimes: {$push: { $divide: [ "$waitingTime", 60000 ] }}
            "hour":{$push:{ $hour: "$requestTime" }},
        },
    },
    {
      $sort:{
     "_id.requestTime":1,
     "_id.hour":1
     }
   }
   ]
  )
    .then((requestData) => {
     // let newArray = [];
     // let obj = {};
     // requestData = _.groupBy(requestData, 'hour');
     // for (var key in requestData) {
     //   newArray.push({ 'riderDetails': requestData[key] })
     // }
            const returnObj = {
              success: true,
              message: `Report found`,
              data: requestData
            };
            return res.send(returnObj);
      })
    .catch((e) => {
      const err = new APIError(`Error occured while Updating User Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
 }


function updatePartner(req, res, next) {
  const updateUserObj = Object.assign({}, req.body);
  UserSchema.findOneAsync({ _id: req.body.adminId })
    .then((userDoc) => {
      const returnObj = {
        success: false,
        message: 'unable to find the object',
        data: null,
        meta: null,
      };
      if (userDoc) {
        var orCondition = {
          $or: [
            { email: req.body.email.toLowerCase(), userType: USER_TYPE_ADMIN, isDeleted:false },
            { email: req.body.email.toLowerCase(), userType: USER_TYPE_RIDER, isDeleted:false },
            { phoneNo: req.body.phoneNo, userType: USER_TYPE_ADMIN, isDeleted:false },
            { phoneNo: req.body.phoneNo, userType: USER_TYPE_RIDER, isDeleted:false }
          ]
        }
        UserSchema.findOneAsync(orCondition)
          .then((userDetails) => {
            if(userDetails && userDetails._id!=req.body.adminId){
              var msg="User already registered with same email and phone number.";

              if (userDetails.phoneNo === req.body.phoneNo) {
                var msg = "User already registered with same mobile number";
              }
              if (userDetails.email === req.body.email) {
                var msg = "User already registered with same email";
              }
              returnObj.message = msg
              return res.send(returnObj)
            }
            CountryCode.findOneAsync({ dial_code: req.body.isdCode }).then((CountryCodeDetails) => {
              var newPhone = false;
              userDoc.name = updateUserObj.name;
              userDoc.adminTripTypes=[req.body.tripType],
              userDoc.tripType=req.body.tripType,
              userDoc.address = updateUserObj.address;
              userDoc.profileUrl = updateUserObj.profileUrl ? Utilities.getUploadsAvtarsUrl(req) + "/" + updateUserObj.profileUrl : userDoc.profileUrl;
              userDoc.email = updateUserObj.email.toLowerCase() ? updateUserObj.email.toLowerCase() : userDoc.email;
              if (userDoc.phoneNo != req.body.phoneNo || userDoc.isdCode != req.body.isdCode) {
                const otpValue = Utilities.generateVerificationCode();
                let phoneDetails = {
                  isdCode: req.body.isdCode,
                  countryCode: (CountryCodeDetails && CountryCodeDetails.code) ? CountryCodeDetails.code : '',
                  phoneNo: req.body.phoneNo,
                  country: (CountryCodeDetails && CountryCodeDetails.name) ? CountryCodeDetails.name : '',
                }
                userDoc.updatePhoneDetails = phoneDetails;
                userDoc.otp = otpValue;
                newPhone = true
              }

              userDoc
                .saveAsync()
                .then((savedDoc) => {
                UserSchema.findAsync({ adminId: savedDoc._id,userType:USER_TYPE_DRIVER },{locationId:1,adminId:1})
                  .then(driverObj => {
                    driverObj.map((driverDet) => {
                      let driverupdate={
                        tripType:req.body.tripType,
                        adminTripTypes:[req.body.tripType],
                        route:{
                          locationId:driverDet.locationId,
                          adminId:driverDet.adminId,
                          terminals:[]
                        }
                      }
                      console.log("                    ");
                      console.log(" driverupdate ",driverupdate)
                      console.log("                    ");
                      UserSchema.findOneAndUpdateAsync({ _id: driverDet._id}, { $set:driverupdate})
                        .then(updateUserObj => {
                        }).error((e) => {
                          const err = new APIError(`Something went wrong while updating driver routes ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                          next(err);
                        });
                    });
                }).error((e) => {
                  const err = new APIError(`Something went wrong while updating driver routes ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                  next(err);
                });

                if(!newPhone){
                  returnObj.code = 200;
                  returnObj.success = true;
                  returnObj.message = 'Account information has been updated';
                  returnObj.data = savedDoc;
                  return res.send(returnObj);
                }else{
                  sendSmsUpdateMobile(savedDoc.updatePhoneDetails, `Your verification code is ${savedDoc.otp}`, (err /* , data */) => {
                    if (err) {
                      returnObj.code = 202;
                      returnObj.success = false;
                      returnObj.message = `Something went wrong while updating mobile number, Rest information has been updated.`;
                      return res.send(returnObj);
                    } else {
                      returnObj.code = 201;
                      returnObj.success = true;
                      returnObj.message = 'Phone no is updated, a verification code has been sent to the mobile number provided. Rest information has been updated';
                      returnObj.data = savedDoc;
                      return res.send(returnObj);
                    }
                  });
                }

                })
                .error((e) => {
                  const err = new APIError(`Error occured while updating the user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                  next(err);
                });
            }).catch(e => {
              const err = new APIError(`Error in creating user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            });

          }).catch(e => {
            const err = new APIError(`Error in creating user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
            next(err);
          });

      } else {
        res.send(returnObj);
      }
    })
    .error((e) => {
      const err = new APIError(`Error occured while searching for the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}


// Generate Reservation Code
function generateReservationCode(req, res, next) {
  var adminId = req.user._id;
  var newReservationCode = Utilities.generateUniueReservationCode();
  const returnObj = {
    success: false,
    message: 'unable to update reservation code , user id provided did not match ',
    data: null,
  };
  returnObj.data = [];
  UserSchema.findOneAsync({ _id: adminId,reservationCode:newReservationCode},{_id:1,reservationCode:1})
    .then((code) => {
    if(code){
      returnObj.success = false;
      returnObj.message = 'Reservation Code already exist with this code, Please regenerate again.';
      return res.send(returnObj);
    }
    UserSchema.findOneAndUpdateAsync({ _id: adminId }, { $set: { reservationCode: newReservationCode } })
    .then((userUpdateData) => {
      if (returnObj.data) {
        returnObj.success = 'true';
        returnObj.message = 'Reservation Code updated';
        returnObj.data = userUpdateData
      }
      return res.send(returnObj);
    })
    .catch((err) => {
      res.send('Error', err);
    });
  }).catch((err) => {
    res.send('Error', err);
  });
}

// Get Reservation Code
function getReservationCode(req, res, next) {
  var condition = { _id: req.user._id, isDeleted: false }

  UserSchema.findOneAsync(condition, { reservationCode: 1 })
    .then((userData) => {
      const returnObj = {
        success: true,
        message: `Reservation Code found`,
        data: userData
      };
      return res.send(returnObj);
    })
    .catch((e) => {
      const err = new APIError(`Error occured while get Reservation Code ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

// Share Reservation Code/Add entry in reservationSchema
function shareReservationCode(req, res, next) {
  console.log("req.user", JSON.stringify(req.user));
  var adminId = req.user._id;
  var saveObj = {
    'userIdAdmin': adminId,
    'reservationCode': req.body.data.reservationCode,
    'name': req.body.data.name,
    'email': req.body.data.email,
    'company_name': req.user.name,
  }
  let codeSchemaObj = new ReservationCodeSchema(saveObj);
  codeSchemaObj.save()
    .then((codeData) => {
      const returnObj = {
        success: false,
        message: 'Unable to share reservation code, please try after sometime',
        data: null,
      };

      returnObj.data = codeData;
      if (returnObj.data) {
        sendEmail(codeData._id, codeData, 'reservationCode');
        returnObj.success = 'true';
        returnObj.message = 'Reservation code shared';
        return res.send(returnObj);
      }
    })
    .catch((err) => {
      res.send('Error', err);
    });
}

// send On Demand Message
function sendOnDemandMessage(req, res, next) {
  var twoDays = new Date(moment().subtract(2, 'day'));
  var condition = {
    adminId: req.user._id,
    requestUpdatedTime: { $gte: twoDays }
  }
  TripRequestSchema.distinct("riderId", condition)
    .then((codeData) => {
      UserSchema.find({ isDeleted: false, isActive: true, '_id': { $in: codeData } }, { loggedInDevices: 1 })
        .then((userData) => {
          let pushData = {
            payload: { success: true, message: req.body.message, data: [] },
            body: req.body.message,
            title: 'Circullar Drive'
          }
          userData.map(userDetails => {
            if (userDetails && userDetails.loggedInDevices && Array.isArray(userDetails.loggedInDevices) && userDetails.loggedInDevices.length) {
              PushNotification.sendNotificationByUserIdAsync(userDetails._id, pushData);
            }
          });
          const returnObj = {
            success: false,
            message: 'Unable to send message, please try after sometime',
            data: null,
          };
          returnObj.data = codeData;
          if (returnObj.data) {
            // sendEmail(codeData._id, codeData, 'reservationCode');
            returnObj.success = 'true';
            returnObj.message = 'Message has been send successfully';
            return res.send(returnObj);
          }
        })
        .catch((err) => {
          return res.send('Error', err);
        });
    }).catch((err) => {
      return res.send('Error', err);
    });

}

// Share Reservation Code/Add entry in reservationSchema
// function sendToCustomerMessage(req, res, next) {
//   var phoneDetails = {
//     isdCode: req.body.isdCode,
//     phoneNo: req.body.phoneNo
//   }
//   var smsText=req.body.message;
//   smsText = smsText.replace(/(\r\n|\n|\r)/gm, "");
//   sendSmsUpdateMobile(phoneDetails, smsText, (err /* , data */) => {
//     const returnObj = {
//       success: false,
//       message: err,
//       data: null,
//     };
//     if (!err) {
//       returnObj.success=true;
//       returnObj.message='Message has been send successfully.';
//     }
//     return res.send(returnObj);
//   })
// }

function sendToCustomerMessage(req, res, next) {
  // console.log("req.body", req.body);
  sendSmsToMultipleMobile(req).then(result=>{
    var succMsg=[]
    var failMsg=[]
    var msgTosend = 'Message has been';
    result.map(async (msgTo, index) => {
      if(msgTo.sent==1){
        succMsg.push(msgTo.phonNo)
      }else{
        failMsg.push(msgTo.phonNo)
      }
    });
    var successExpload=succMsg.toString();
    var failExpload=failMsg.toString();
    console.log("MSDD SENDD", successExpload);
    console.log("failMsg SENDD", failExpload);
    if(successExpload && failExpload){
      var msgTosend = 'Message has been send successfully to '+successExpload +' failed to send '+ failExpload;
    }else if(successExpload && !failExpload){
      var msgTosend = 'Message has been send successfully to '+successExpload;
    }else{
      var msgTosend = 'Message has been failed to send '+ failExpload;
    }

    const returnObj = {
      success: true,
      message:msgTosend,
      data: null,
    };
    console.log("returnObj", returnObj);
    return res.send(returnObj);
  });
}

const sendSmsToMultipleMobile = (req) => {
  return new Promise(async (resolve,reject)=>{
    try {

     const driver = await Promise.all(req.body.itemRows.map(async (smsTo, index) => {
      var phoneDetails = {
        isdCode: smsTo.isdCode,
        phoneNo: smsTo.phoneNo
      }
      var smsText = req.body.message;
      smsText = smsText.replace(/(\r\n|\n|\r)/gm, "");

     const result = await sendSmsToMultipleMobileNumbers(phoneDetails, smsText)
     return Promise.resolve(result);
    }))
    return resolve(driver);
    }catch (error) {
      return reject(error);
    }
  })
};

const sendSmsToMultipleMobileNumbers = (phoneDetails, smsText) => {
  return new Promise(async (resolve,reject)=>{
    try {
      await sendSmsUpdateMobile(phoneDetails, smsText, (err , data ) => {
        if (!err) {
          var sccs={
            sent:1,
            phonNo:'+'+phoneDetails.isdCode+phoneDetails.phoneNo
          }
          return resolve(sccs);
        }else{
          var fils={
            sent:0,
            phonNo:'+'+phoneDetails.isdCode+phoneDetails.phoneNo
          }
          return resolve(fils);
        }
          })
    }catch (error) {
      return reject(error);
    }
  })
};

// Get Reservation Code
function getCustomMessage(req, res, next) {
  var condition = { _id: req.user._id, isDeleted: false }

  UserSchema.findOneAsync(condition, { custom_message: 1 })
    .then((userData) => {
      const returnObj = {
        success: true,
        message: `Custom Message Code found`,
        data: userData
      };
      return res.send(returnObj);
    })
    .catch((e) => {
      const err = new APIError(`Error occured while get Reservation Code ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}


// Get sendCustomMessage Code
function updateCustomMessage(req, res, next) {
  var adminId = req.user._id;
  const custom_message = (req.body.message && req.body.message != '') ? req.body.message : "";
  UserSchema.findOneAndUpdateAsync({ _id: adminId }, { $set: { custom_message: custom_message } })
    .then((userUpdateData) => {
      const returnObj = {
        success: true,
        message:'Custom message has been updated successfully',
        data:userUpdateData
      }
      res.send(returnObj);
    })
    .catch((err) => {
      res.send('Error', err);
    });
}

function getAdminCustomTemplate(req, res, next) {
  let responseObj = { success: false, message: "", data: null };
  templateService.getCustomEmailTemplate(req.user._id).then(renderedHtml => {
    console.log("renderedhtml", renderedHtml);
    responseObj.data = renderedHtml;
    responseObj.success = true;
    res.send(responseObj);
  }).catch(err => {
    return next(err);
  })
}


function checkCurrentPassword(req, res, next) {
  UserSchema.findOneAsync({ _id: req.user._id }, '+password')
    // eslint-disable-next-line consistent-return
    .then((user) => {
      if (!user) {
        const err = new APIError('User not found with this email', httpStatus.NOT_FOUND, true);
        return next(err);
      } else {
        user.comparePassword(req.body.password, (passwordError, isMatch) => {
          const returnObj = {};
          if (passwordError || !isMatch) {
            returnObj.success = false;
            returnObj.message = 'Password not matched';
          } else {
            returnObj.success = true;
            returnObj.message = 'Password matched';
          }
          return res.send(returnObj);
        })
      }
    }).catch((err123) => {
      const err = new APIError(`error in getting current user details ${err123}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });

}

function changePasswordAdmin(req, res, next) {

  UserSchema.findOneAsync({_id:req.user._id}, '+password')
    // eslint-disable-next-line consistent-return
    .then((user) => {
      const returnObj = {
        success: false,
        message: '',
        data: null,
      };
      if (!user) {
        const err = new APIError('User not found with the given email id', httpStatus.NOT_FOUND);
        return next(err);
      } else {
        // eslint-disable-next-line
          user.password = req.body.password;
          user
            .saveAsync()
            .then((savedUser) => {
              returnObj.success = true;
              returnObj.message = 'Password changed successfully';
              returnObj.data = savedUser;
              return res.send(returnObj);
            })
            .error((e) => {
              const err = new APIError(`Error while changing password ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              returnObj.success = false;
              returnObj.message = 'Password not changed';
              console.log(err); // eslint-disable-line no-console
              return next(returnObj);
            });
      }
    })
    .error((e) => {
      const err = new APIError(`error while finding user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}


// drivers list
function available_drivers(req,res){
  const adminId= mongoose.Types.ObjectId(req.body._id).toString();
  UserSchema.find({ adminId: adminId,userType:'driver', isDeleted: false })
  .then((foundDrives)=>{
    console.log(foundDrives)
    res.send({success:true ,message:'Drivers list',data:foundDrives});
  }).catch((err)=>{
    res.send({success:false ,message:'Something went wrong'});
  });
}

function getSettings(req, res, next) {
  UserSchema.findOneAsync({ _id: req.user._id }, { settings: 1 })
    // eslint-disable-next-line consistent-return
    .then((user) => {
      const returnObj = {
        success: false,
        message: '',
        data: null,
      };
      if (!user) {
        const err = new APIError('User not found with the given email id', httpStatus.NOT_FOUND);
        return next(err);
      } else {
        returnObj.success = true;
        returnObj.message = 'Settings found';
        returnObj.data = user.settings;
        return res.send(returnObj);
      }
    })
    .catch((e) => {
      const err = new APIError(`error while finding user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

function updateSettings(req, res, next) {

  const newTime = req.body.slots;
  UserSchema.findOneAsync({ _id: req.user._id }, '+password')
    // eslint-disable-next-line consistent-return
    .then((user) => {
      const returnObj = {
        success: false,
        message: '',
        data: null,
      };
      if (!user) {
        const err = new APIError('User not found with the given email id', httpStatus.NOT_FOUND);
        return next(err);
      } else {
        // eslint-disable-next-line
        user.settings.isOperatorAssigned = req.body.isOperatorAssigned;
        user.settings.allowScheduleTrips = req.body.allowScheduleTrips;
        // user.settings.dayTimings.monday.slots=newTime;
        // // user.settings.dayTimings.monday.slots.endTime = newEndTime;
        // user.settings.dayTimings.tuesday.slots.startTime = newTime;
        // // user.settings.dayTimings.tuesday.slots.endTime = newEndTime;
        // user.settings.dayTimings.wednesday.slots.startTime = newTime;
        // // user.settings.dayTimings.wednesday.slots.endTime = newEndTime;
        // user.settings.dayTimings.thursday.slots.startTime = newTime;
        // // user.settings.dayTimings.thursday.slots.endTime = newEndTime;
        // user.settings.dayTimings.friday.slots.startTime = newTime;
        // // user.settings.dayTimings.friday.slots.endTime = newEndTime;
        // user.settings.dayTimings.saturday.slots.startTime = newTime;
        // // user.settings.dayTimings.saturday.slots.endTime = newEndTime;
        // user.settings.dayTimings.sunday.slots.startTime = newTime;
        // // user.settings.dayTimings.sunday.slots.endTime = newEndTime;

        // console.log(user.settings.dayTimings);
        user
          .saveAsync()
          .then((savedUser) => {
            // const newDayTime = savedUser.settings.dayTimings.monday.slots;
            const newDayTime = [];
            newDayTime.push(newTime);
            // console.log(newDayTime);
            // console.log(savedUser);
            UserSchema.findOneAndUpdateAsync({ _id: req.user._id }, { $set: { "settings.dayTimings.monday.slots": newDayTime } }, { new: true }) //eslint-disable-line
              .then((updateUser) => {
                returnObj.success = true;
                returnObj.message = 'Updated  successfully';
                returnObj.data = updateUser;
                return res.send(returnObj);
              }).catch((e) => {
                const err = new APIError(`Error while updating settings`, httpStatus.INTERNAL_SERVER_ERROR, true);
                returnObj.success = false;
                returnObj.message = 'Something went wrong';
                console.log(err); // eslint-disable-line no-console
                return next(returnObj);
              })
          })
          .error((e) => {
            const err = new APIError(`Error while updating settings`, httpStatus.INTERNAL_SERVER_ERROR, true);
            returnObj.success = false;
            returnObj.message = 'Something went wrong';
            console.log(err); // eslint-disable-line no-console
            return next(returnObj);
          });
      }
    })
    .error((e) => {
      const err = new APIError(`error while finding user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}
function addUpdateHoliday(req, res, next) {
  const holidayId = mongoose.Types.ObjectId(req.body.holidays._id).toString();
  if (req.body.holidays._id) {
    UserSchema.findOneAsync({ _id: req.user._id, "settings.holidays._id": { $eq: holidayId } })
      .then((user) => {
        console.log(user);
        const { holidays } = user.settings;
        let checkdate = false;
        let indexOfHoliday = -1;
        if (holidays.length !== 0) {
          // eslint-disable-next-line
          holidays.map((obj, index) => {
            //eslint-disable-line
            if (obj._id == holidayId) {
              obj.date = req.body.holidays.date,
                obj.title = req.body.holidays.title
              // console.log("id match",obj._id)
            }

          });
          // console.log("final holidays", holidays)
        }
        UserSchema.findOneAndUpdateAsync({ _id: req.user._id }, { $set: { "settings.holidays": holidays } }, { new: true }) //eslint-disable-line
          .then((updateUser) => {
            // const holidayDetails = updateUser.settings.holidays;
            res.send({ data: updateUser, message: 'Holiday Successfully update' });
          })
          .catch((err) => {
            res.send({ data: err, message: 'Unable to update Holiday' });
          });

      }).error((e) => {
        const err = new APIError(`error while finding user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        next(err);
      });
    //New Hoiliday creatiton
  } else if (!req.body.holidays._id) {

    UserSchema.findOneAsync({ _id: req.user._id, "settings.holidays.date": { $ne: req.body.holidays.date } })
      // eslint-disable-next-line consistent-return
      .then((user) => {
        console.log(user);
        const returnObj = {
          success: false,
          message: 'Holiday Already Present',
          data: null,
        };
        if (!user) {
          res.send(returnObj);
        } else {
          // eslint-disable-next-line

          // user.settings.holidays=push(req.body.holiday);
          const newHoliday = req.body.holidays;
          const newHolidayDetails = user.settings.holidays;
          newHolidayDetails.push(newHoliday);
          UserSchema
            .findOneAndUpdateAsync({ _id: req.user._id }, { $set: { "settings.holidays": newHolidayDetails ,"$sort": { "settings.holidays.date": 1 } }}, { new: true }) //eslint-disable-line
            .then((updateUser) => {
              //console.log("===========after update=======================",updateUser)
              returnObj.success = true;
              returnObj.message = 'Updated  successfully';
              returnObj.data = updateUser;
              res.send(returnObj);
            })
            .error((e) => {
              const err = new APIError(`Error while updating settings`, httpStatus.INTERNAL_SERVER_ERROR, true);
              returnObj.success = false;
              returnObj.message = 'Something went wrong';
              console.log(err); // eslint-disable-line no-console
              res.send(returnObj);
            });
        }
      })
      .error((e) => {
        const err = new APIError(`error while finding user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        next(err);
      });
  }
}

function removeHoliday(req, res) {
  // UserSchema.findOneAsync({ _id: req.user._id }, { 'settings': { 'holidays': { $eq: { _id: req.body.holidays._id } } } })
  UserSchema.findOneAsync({ _id: req.body.adminId, isDeleted: false })
    .then((user) => {
      const removeHolidayId = mongoose.Types.ObjectId(req.body.holidays._id).toString();
      const { holidays } = user.settings;
      console.log("holidays     >:", holidays)
      let indexOfHoliday = -1;
      if (holidays.length !== 0) {
        // eslint-disable-next-line
        console.log("length", holidays.length)
        holidays.map((obj, index) => {
          //eslint-disable-line
          console.log("dbId", obj._id)
          console.log("req-Id", removeHolidayId)
          if (obj._id == removeHolidayId) {

            indexOfHoliday = index;
            console.log("match:", indexOfHoliday)
          }
        });
      }
      if (indexOfHoliday === -1) {
        console.log("indexOfHoliday", indexOfHoliday)
        res.send({ message: 'Holiday Not Found' });
      } else {
        holidays.splice(indexOfHoliday, 1);
        console.log("final list", holidays)
        UserSchema.findOneAndUpdateAsync({ _id: req.body.adminId }, { $set: { "settings.holidays": holidays } }, { new: true }) //eslint-disable-line
          .then((updateUser) => {
            const holidayDetails = updateUser.settings.holidays;
            res.send({ data: holidayDetails, message: 'Holiday Successfully Removed' });
          })
          .catch((err) => {
            res.send({ data: err, message: 'Unable to delete Holiday' });
          });
      }
    }).catch((err) => {
      console.log("ERROR 2>", err)
      res.send({ success: false, message: '', data: null });
    });


}



// Get Reservation Code
function getNotifyMessage(req, res, next) {
  var condition={userIdAdmin:req.user._id}

  AdminNotifyMessage.findOneAsync(condition,{message:1})
    .then((userData) => {
      const returnObj = {
        success:true,
        message:`Notify message found`,
        data:userData
    };
      return res.send(returnObj);
    })
    .catch((e) => {
      const err = new APIError(`Error occured while get Reservation Code ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}
function saveToNotifyMessage(req, res, next) {
  console.log("req adding saveToNotifyMessage", req.body);
  const AdminNotifyMessageObj = new AdminNotifyMessage({
    userIdAdmin: req.user._id,
    message: req.body.message
  });
  AdminNotifyMessageObj
    .saveAsync()
    .then(adminNotifyMessage => {
      console.log("req adding saveToNotifyMessage", adminNotifyMessage);
      const returnObj = {
        success: true,
        message: "Notify message has been added successfully.",
        data: adminNotifyMessage
      };
      return res.send(returnObj);

    })
     .error(e => {
      console.log("error adding saveToNotifyMessage", e);
      const err = new APIError(
        `Error occured while saving Notify Message ${e}`,
        httpStatus.INTERNAL_SERVER_ERROR
      );
      next(err);
    });
}

function updateToNotifyMessage(req, res, next) {
  AdminNotifyMessage.updateAsync({ _id:  req.body._id }, { $set: { message:req.body.message }}) // eslint-disable-line no-underscore-dangle
  .then((savedDoc) => {
    const returnObj = {
    success:true,
    message:'Notify message updated successfully',
    data:savedDoc,
    };
    return res.send(returnObj);
  })
  .error((e) => {
    const err = new APIError(`Error occured while Updating Notify message ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function getPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        reject(err);
      }
      // eslint-disable-next-line
      bcrypt.hash(password, salt, (hashErr, hash) => {
        //eslint-disable-line
        if (hashErr) {
          reject(hashErr);
        }
        resolve(hash);
      });
    });
  });
}


export default {
  rejectUser,
  approveUser,
  getApprovePendingUsers,
  getAllUsers,
  getUsersDetails,
  updateUserDetails,
  userStats,
  createNewUser,
  getTotalUsers,
  getActiveDriverDetails,
  getActiveCustomerDetails,
  changePassword,
  getAdminRides,
  getRidesUptoSevenDays,
  requestNewAccessCode,
  getAllDrivers,
  updateDriverDetails,
  removeDriver,
  getDriverDetails,
  updateDriverRoute,
  //addRouteTerminals AND updateRouteTerminal not IN USE after restructure of route as separarte entity
  updateRouteTerminal,
  addRouteTerminals,
  getDriverRoute,
  getLocationsLists,
  getLocationById,
  addLocation,
  updateLocation,
  removeLocation,
  viewRiders,
  viewRating,
  viewVehicles,
  viewDrivers,
  getAdminCustomTemplate,
  createAdmin, getAdminDetails, updateAdmin, updateStatus, adminRemove, updatePartner,//Admin Functions
  generateReservationCode, getReservationCode, shareReservationCode, //Reservation Code  Function Functions
  getAllDriversMobile,
  getAllRidesMobile,
  getAllActiveTrips,
  getSelectedTripRoute,
  getCount,
  getDriverList,
  getReports,
  sendOnDemandMessage,sendToCustomerMessage,saveToNotifyMessage,updateToNotifyMessage,getNotifyMessage,getCustomMessage,updateCustomMessage, //Reservation Code  Function Functions
  checkCurrentPassword,changePasswordAdmin, // Chnage password Partner
  available_drivers,
  getSettings,
  updateSettings,
  addUpdateHoliday,
  removeHoliday,
  getReportToExcel,
  getRiderList,
  getAvgWaitTime,
  getPeakNLowTime,
};
