import axios from 'axios';
import httpStatus from 'http-status';
import async from "async";
import APIError from '../../helpers/APIError';
import Utilities from '../../helpers/util';
import config from '../../../config/env';
import UserSchema from '../../models/user';
import RouteSchema from '../../models/route';
import AdminDriverSchema from '../../models/adminDriver';
import AdminRouteSchema from '../../models/route';
import TripSchema from '../../models/trip';
import AdminLocationSchema from '../../models/adminLocation';
import TripRequestSchema from '../../models/tripRequest';
import { sendSms } from '../../service/smsApi';
import * as Shared from '../../service/shared';
import * as PushNotification from '../../service/pushNotification';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER, USER_TYPE_ADMIN } from '../../constants/user-types';
import CountryCode from '../../models/countryCode';
import sendEmail from '../../service/emailApi';
import SocketStore from '../../service/socket-store';
import mongoose from 'mongoose';
import { TRIP_REQUEST_ACCEPTED,TRIP_REQUEST_ENROUTE,TRIP_REQUEST_INIT,TRIP_REQUEST_COMPLETED,TRIP_REQUEST_REJECTED} from '../../constants/trip-request-statuses';
import * as TRIP_REQUEST_STATUS from '../../constants/trip-request-statuses';
import {TRIP_DYNAMIC} from '../../constants/trip-type'
import { GOOGLE_API_KEY } from '../../constants/global';
import adminVehicle from '../../models/adminVehicle';
var ObjectId = require('mongoose').Types.ObjectId;
var randomstring = require("randomstring");
//const curl = new (require( 'curl-request' ))();
const debug = require('debug')('MGD-API: admin-user');
var querystring = require('querystring');


// var easyimg = require('easyimage');
 const fs = require('fs');
 var formidable = require('formidable');


function getDriverRoute(req, res, next) {
  UserSchema.findOneAsync({
      _id: req.query.driverId
    })
    .then((userDoc) => {
      const returnObj = {
        success: false,
        message: 'Unable to find the driver route',
        data: null,
        meta: null,
      };
      if (userDoc) {
        returnObj.success = true;
        returnObj.message = 'Driver route found';
        returnObj.data = userDoc.route.terminals;
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

function getRouteById(req, res, next) {
  console.log("getRouteById", req.query)
  RouteSchema.findOneAsync({
      _id: req.query.Id
    })
    .then((RouteDoc) => {
      const returnObj = {
        success: false,
        message: 'Unable to find route',
        data: null,
        meta: null,
      };
      if (RouteDoc) {
        returnObj.success = true;
        returnObj.message = 'Admin route found';
        returnObj.data = RouteDoc;
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

function getSelectedTripRoute(req, res, next) {
  const {
    tripID
  } = { ...req.query
  };
  console.log("tripID?????????????????????????????????????????????", tripID);
  let returnObj = {
    success: false,
    message: '',
    data: {
      driverRoute: []
    },
  };
  TripSchema.findOneAsync({
      _id: tripID,
      activeStatus: true
    })
    .then(result => {
      if (result) {
        // get trip driver's route and terminals
        returnObj.success = true;
        returnObj.data = {
          driverRoute: result.driver.route.terminals
        };
        return res.send(returnObj);
      } else {
        returnObj.message = 'No active trip found';
        return res.send(returnObj);
      }
    })
    .catch(e => next(e));
}

/* start: manage drivers by admin */

function createNewUser(req, res, next) {
  const userData = Object.assign({}, req.body);
  const host = req.get('host');
  const url = `${req.protocol}://${req.get('host')}`;
  UserSchema.findOneAsync({
      $or: [{
          email: req.body.email.toLowerCase(),
          userType: req.body.userType,
          isDeleted:false
        },
        {
          userType: req.body.userType,
          phoneNo: req.body.phoneNo,
          isDeleted:false
        }
      ]
    })
    // eslint-disable-next-line consistent-return
    .then((foundUser) => {
      const returnObj = {
        success: false,
        message: '',
        data: null,
      };
      if (foundUser !== null) {
        const err = new APIError('Email Id/phone No Already Exist', httpStatus.CONFLICT, true);
        return next(err);
      }
      CountryCode.findOneAsync({
        dial_code: req.body.isdCode
      }).then((CountryCodeDetails) => {
        const accessCode = Utilities.generateAccessCode();
        const newPassword = randomstring.generate({
          length: 6,
          charset: 'alphanumeric'
        });
        // get location details and set default gpsLoc for driver
        AdminLocationSchema.findOneAsync({_id: req.body.locationId}).then(locDetails=>{
          if(locDetails) {
            const userObj = new UserSchema({
              zone: userData.zone ? userData.zone : '',
              email: userData.email.toLowerCase(),
              phoneNo: userData.phoneNo,
              profileUrl:userData.profileUrl?Utilities.getUploadsAvtarsUrl(req)+"/"+userData.profileUrl:Utilities.getUploadsAvtarsUrl(req)+"/default_user.png",
              password: newPassword,
              accessCode: accessCode,
              userType: userData.userType,
              tripType: userData.tripType,
              fname: userData.fname,
              lname: userData.lname,
              name: userData.fname && userData.lname && `${userData.fname} ${userData.lname}` || userData.fname,
              dob: userData.dob,
              bloodGroup: userData.bloodGroup ? userData.bloodGroup : null,
              gpsLoc: locDetails.zone.location,
              isdCode: req.body.isdCode,
              locationId: req.body.locationId,
              adminId: req.user._id,

              countryCode: (CountryCodeDetails && CountryCodeDetails.code) ? CountryCodeDetails.code : '',
              emergencyDetails: userData.userType === USER_TYPE_RIDER ? {
                phone: userData.emergencyDetails.phone ? userData.emergencyDetails.phone : '',
                name: userData.emergencyDetails.name ? userData.emergencyDetails.name : '',
                imgUrl: null,
              } : {
                phone: '',
                name: '',
                imgUrl: null,
              },
              mapCoordinates: [0, 0]
            });
            if (userData.routeId && userData.tripType !=TRIP_DYNAMIC) {
              RouteSchema.findOneAsync({
                  _id: userData.routeId
                }).then(route => {
                  userObj["route"] = route;
                  userObj
                    .saveAsync()
                    .then((savedUser) => {
                      returnObj.success = true;
                      returnObj.message = 'User created successfully';
                      returnObj["accessCode"] = accessCode;
                      // console.log("saved user", savedUser);
                      returnObj.data = savedUser;
                      // create new admin driver accesscode
                      const userObj = Object.assign(savedUser, {
                        newpass: newPassword,
                        accessCode: accessCode
                      });
                      sendEmail(savedUser._id, userObj, 'createDriver');
                      return res.send(returnObj);
                    })
                    .error((e) => {
                      console.log("ERROR", e);
                      const err = new APIError(`Error while Creating new User ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                      returnObj.success = false;
                      returnObj.message = 'user not created';
                      //console.log(err); // eslint-disable-line no-console
                      return next(returnObj);
                    });
                })
                .catch(error => {
                  const err = new APIError(`Error while Creating new User ${error}`, httpStatus.INTERNAL_SERVER_ERROR);
                  returnObj.success = false;
                  returnObj.message = 'user not created';
                  //console.log(err); // eslint-disable-line no-console
                  return next(returnObj);
                })
            } else {
              var Obj={
                locationId: req.body.locationId,
                adminId: req.user._id,
                terminals : []
              }
              userObj["route"] = Obj;
                  userObj
                    .saveAsync()
                    .then((savedUser) => {
                      returnObj.success = true;
                      returnObj.message = 'User created successfully';
                      returnObj["accessCode"] = accessCode;
                      // console.log("saved user", savedUser);
                      returnObj.data = savedUser;
                      // create new admin driver accesscode
                      const userObj = Object.assign(savedUser, {
                        newpass: newPassword,
                        accessCode: accessCode
                      });
                      sendEmail(savedUser._id, userObj, 'createDriver');
                      res.send(returnObj);
                    })
                    .error((e) => {
                      console.log("                                     ");
                      console.log("I Ma HEREE");
                      console.log("******************************END*****************************");
                      const err = new APIError(`Error while Creating new User ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                      returnObj.success = false;
                      returnObj.message = 'user not created';
                      //console.log(err); // eslint-disable-line no-console
                      return next(returnObj);
                    });
            }
          } else {
            let error = new APIError(`Location not found`, httpStatus.INTERNAL_SERVER_ERROR, true);
            next(error);
          }
        }).catch(err=>{
          let error = new APIError(`Something went wrong`, httpStatus.INTERNAL_SERVER_ERROR, true);
          next(error);
        })
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
  var obj = {
    isDeleted: false,
    adminId: req.user._id,
    userType: USER_TYPE_DRIVER
  };

  andCondition.push(obj);

  if (req.query && req.query.locationId != '') {
    obj = {
      locationId: req.query.locationId
    }
    andCondition.push(obj);
  }
  const {
    pageNo,
    userType,
    limit = config.limit
  } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  debug(`skip value: ${req.query.pageNo}`);
  console.log("and condition", andCondition);
  UserSchema.countAsync({
      $and: andCondition
    })
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
      UserSchema.find({
          $and: andCondition
        }, {
          "adminId": 1,
          "email": 1,
          "activeStatus": 1,
          "profileUrl": 1,
          "name": 1,
          "fname": 1,
          "lname": 1,
          "updatedAt": 1,
          "createdAt": 1,
          "isDeleted": 1,
          "accessCode": 1
        })
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
  var obj = {
    isDeleted: false,
    adminId: req.user._id,
    userType: USER_TYPE_DRIVER
  };
  andCondition.push(obj);

  if (req.query && req.query.locationId && req.query.locationId != '') {
    obj = {
      locationId: req.query.locationId
    }
    andCondition.push(obj);
  }
  const {
    pageNo,
    limit = config.limit
  } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  debug(`skip value: ${req.query.pageNo}`);
  UserSchema.countAsync({
      $and: andCondition
    })
    // eslint-disable-next-line
    .then(totalDriversRecord => {
      const returnObj = {
        success: true,
        message: `no of drivers are zero`, // `no of active vehicles are ${returnObj.data.length}`;
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
      UserSchema.find({
          $and: andCondition
        }, {
          "adminId": 1,
          "email": 1,
          "activeStatus": 1,
          "profileUrl": 1,
          "name": 1,
          "updatedAt": 1,
          "createdAt": 1,
          "isDeleted": 1
        })
        .limit(parseInt(limit))
        .skip(skip)
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
    let returnObj = {
      activeDrivers: 0
    };
    // get all shuttleIds
    var andCondition = [];
    var obj = {
      activeStatus: true,
      "driver.adminId": mongoose.Types.ObjectId(req.user._id)
    };
    andCondition.push(obj);

    if (req.query && req.query.locationId && req.query.locationId != '') {
      obj = {
        "driver.locationId": req.query.locationId
      }
      andCondition.push(obj);
    }
    TripSchema.countAsync({
        $and: andCondition
      })
      .then(activeTripsCount => {
        returnObj.activeDrivers = activeTripsCount;
        return resolve(returnObj);
      })
      .catch(error => {
        return reject(error);
      })
    // get all active shuttles
  })
}

function getAllActiveTrips(req, res, next) {
  const {
    pageNo,
    limit = config.limit
  } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  UserSchema.aggregate([{
        $match: {
          adminId: mongoose.Types.ObjectId(req.user._id)
        }
      },
      {
        $group: {
          _id: 'adminId',
          ids: {
            $addToSet: "$_id"
          }
        }
      }
    ])
    .then(result => {
      console.log('result getAllActiveTrips', result);
      let returnObj = {
        success: false,
        message: 'No drivers found',
        data: []
      }
      if (result && result.length) {
        if (result[0].ids && result[0].ids.length) {
          let tripQuery = {
            "driver._id": {
              $in: result[0].ids
            },
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
                visitedTerminal: 1,
                'driver.email': 1,
                'driver.activeStatus': 1,
                'driver.profileUrl': 1,
                'driver.name': 1,
                'driver._id': 1
              }

              TripSchema.find(tripQuery, projectedFields)
                .limit(parseInt(limit))
                .skip(skip)
                .populate([{
                  path: 'shuttleId',
                  select: 'name imageUrl activeStatus'
                }])
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

function updateDriverDetails(req, res, next) {
  const updateUserObj = Object.assign({}, req.body);
  TripSchema.findOneAsync({
    "driver._id": updateUserObj.driverId,
    "activeStatus" : true,
  })
  .then((TripDoc) => {
    if(TripDoc){
      const returnObj = {
        success: false,
        message: 'Drive is active on trip, So you cant update his details now.',
        data: null,
        meta: null,
      };
     return res.send(returnObj);
    }
  UserSchema.findOneAsync({
      _id: req.body.driverId
    })
    .then((userDoc) => {
      const returnObj = {
        success: false,
        message: 'unable to find the object',
        data: null,
        meta: null,
      };
      if (userDoc) {
        CountryCode.findOneAsync({
          dial_code: req.body.isdCode
        }).then((CountryCodeDetails) => {
          AdminLocationSchema.findOneAsync({_id: updateUserObj.locationId}).then(locDetails=>{
            if(locDetails) {
              userDoc.gpsLoc = locDetails.zone.location;
              userDoc.tripType = updateUserObj.tripType;
              userDoc.route = updateUserObj.route;
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
              userDoc.profileUrl=updateUserObj.profileUrl?Utilities.getUploadsAvtarsUrl(req)+"/"+updateUserObj.profileUrl:userDoc.profileUrl;
              if (updateUserObj.routeId && updateUserObj.tripType !=TRIP_DYNAMIC) {
                RouteSchema.findOneAsync({
                  _id: updateUserObj.routeId
                }).then(route => {
                  userDoc["route"] = route;
                  userDoc
                    .saveAsync()
                    .then((savedDoc) => {
                      if (savedDoc.password) {
                        debug('inside password delete function');
                        savedDoc = savedDoc.toObject();
                        delete savedDoc.password;
                      }
                      returnObj.success = true;
                      returnObj.message = 'user document updated successfully';
                      returnObj.data = savedDoc;
                      res.send(returnObj);
                    })
                    .error((e) => {
                      const err = new APIError(`Error occured while updating the user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                      next(err);
                    });
                })
                .catch(error => {
                  const err = new APIError(`Error while Creating new User ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                  returnObj.success = false;
                  returnObj.message = 'user document not updated,Please try again later.';
                  console.log(err); // eslint-disable-line no-console
                  return next(returnObj);
                })
              }else{
                var Obj={
                  locationId: req.body.locationId,
                  adminId: req.user._id,
                  terminals : []
                }
                userDoc["route"] = Obj;
                userDoc.saveAsync()
                    .then((savedDoc) => {
                      if (savedDoc.password) {
                        debug('inside password delete function');
                        savedDoc = savedDoc.toObject();
                        delete savedDoc.password;
                      }
                      returnObj.success = true;
                      returnObj.message = 'user document updated successfully';
                      returnObj.data = savedDoc;
                      res.send(returnObj);
                    })
                    .error((e) => {
                      const err = new APIError(`Error occured while updating the user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                      next(err);
                    });
              }
            } else {
              let error = new APIError(`Location not found`, httpStatus.INTERNAL_SERVER_ERROR, true);
              next(error);
            }
          }).catch(err=>{
            let error = new APIError(`Something went wrong`, httpStatus.INTERNAL_SERVER_ERROR, true);
            next(error);
          })


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
  })
  .error((e) => {
    const err = new APIError(`Error occured while searching for the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function removeDriver(req, res, next) {
  UserSchema.findOneAndUpdateAsync({
      _id: req.query.driverId
    }, {
      isDeleted: true
    }, {
      new: true
    })
    .then((deletedUser) => {
      const returnObj = {
        success: true,
        message: 'user deleted successfully',
        data: deletedUser,
      };
      res.send(returnObj);
    })
    .error(e => next(e))
};

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

function viewDrivers(req, res, next) {
  const {
    pageNo,
    admin_id,
    limit = config.limit
  } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  var condition = {
    adminId: admin_id,
    userType: USER_TYPE_DRIVER,
    isDeleted: false
  };
  UserSchema.countAsync(condition)
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
      UserSchema.find(condition, {
          name: 1,
          fname: 1,
          lname: 1,
          email: 1,
          isdCode: 1,
          phoneNo: 1,
          address: 1,
          city: 1,
          state: 1,
          country: 1
        })
        .limit(limit)
        .skip(skip)
        .sort({
          _id: -1
        })
        .then((userData) => {
          returnObj.data = userData;
          returnObj.message = `Drivers found`;
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

/**********************************************************
 * manage routes
 **********************************************************/

function addRoute(req, res, next) {
  const routeData = Object.assign({}, req.body);
  const returnObj = {
    success: false,
    message: '',
    data: {}
  };

  let terminals = [];
  if (routeData.terminals && routeData.terminals.length) {
    Shared.fromTerminalToTerminalTimeAsync(routeData.terminals)
    .then((terminalsWithTime)=>{
      console.log(">>>>>>>>>>>>>>>", terminalsWithTime);
      terminals = terminalsWithTime.map((terminal, index)=>{
        return {
          timeToNextTerminal: terminal.timeToNextTerminal,
          sequenceNo: index+1,
          _id: new mongoose.Types.ObjectId(),
          loc: terminal.loc,
          address: terminal.address,
          name: terminal.name,
          type: terminal.type,
          adminId: terminal.adminId
        }
      })

      AdminRouteSchema.findOneAsync({name: routeData.name})
      .then(result=>{
        if(result) {
          returnObj.message = "Name already taken";
          return res.send(returnObj);
        } else {
          const routeObj = new AdminRouteSchema({
            locationId: routeData.locationId,
            name: routeData.name,
            address: routeData.address,
            terminals: terminals || [],
            adminId: req.user._id,
          });
          routeObj
          .saveAsync()
          .then((savedRoute) => {
            returnObj.success = true;
            returnObj.message = 'Route created successfully';
            returnObj.data = savedRoute;
            res.send(returnObj);
          })
          .error((e) => {
            const err = new APIError(`Error while Creating route`, httpStatus.INTERNAL_SERVER_ERROR, true);
            returnObj.success = false;
            returnObj.message = 'Something went wrong';
            console.log(err); // eslint-disable-line no-console
            return next(returnObj);
          });
        }
      })
      .catch(error=>{
        const err = new APIError(`Error while Creating route`, httpStatus.INTERNAL_SERVER_ERROR, true);
        returnObj.success = false;
        returnObj.message = 'Something went wrong';
        console.log(err); // eslint-disable-line no-console
        return next(returnObj);
      })
    })
    .catch(err=>{
      next(err);
    })
  } else {
    returnObj.message = "Invalid route terminals"
    res.send(returnObj)
  }

}

function updateRoute(req, res, next) {
  const {
    adminId
  } = req.user._id;
  const {
    locationId,
    address
  } = req.body;

  /**
   * 1. check if terminal exists
   * 2. update terminal
   */
  let updateObj = {
    locationId: locationId,
    address: address,
    updatedAt: new Date().toISOString()
  }
  AdminRouteSchema.findOneAndUpdateAsync({
      adminId: adminId,
      isDeleted: false
    }, {
      $set: updateObj
    }, {
      new: true
    })
    .then((routeUpdateData) => {
      const returnObj = {
        success: false,
        message: ' Route not found ',
        data: {},
      };
      returnObj.data = routeUpdateData;
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

function removeRoute(req, res, next) {
  console.log("removeRoute ", req.query);
  const {
    routeId
  } = req.query;

  const returnObj = {
    success: false,
    message: '',
    data: {},
  };

  let query = {
    _id: ObjectId(routeId)
  }

  let updateObj = {
    $set: {
      isDeleted: true
    }
  }
  RouteSchema.findOneAndUpdateAsync(query, updateObj, {
      new: true
    })
    .then((routeUpdateData) => {
      console.log("routeUpdateData ", routeUpdateData);
      returnObj.data = routeUpdateData;
      if (returnObj.data) {
        returnObj.success = true;
        returnObj.message = 'Route deleted successfully';
        return res.send(returnObj);
      } else {
        return res.send(returnObj);
      }
    })
    .catch((err) => {
      next(err);
    });
}

function addTerminal(req, res, next) {
  const {
    routeId
  } = req.query;
  const {
    terminal
  } = req.body;

  let terminalObj = {
    _id: new mongoose.Types.ObjectId(),
    loc: terminal.loc,
    address: terminal.address,
    name: terminal.name,
    type: terminal.type
  }

  const returnObj = {
    success: false,
    message: '',
    data: {},
  };

  let updateObj = {
    $addToSet: {
      terminals: terminalObj
    }
  }

  AdminRouteSchema.findOneAndUpdateAsync({
      _id: routeId,
      adminId: adminId,
      isDeleted: false
    }, {
      updateObj
    }, {
      new: true
    })
    .then((routeUpdateData) => {
      returnObj.data = routeUpdateData;
      if (returnObj.data) {
        returnObj.success = true;
        returnObj.message = 'Terminal added successfully';
        res.send(returnObj);
      } else {
        res.send(returnObj);
      }
    })
    .catch((err) => {
      next(err);
    });
}

function updateTerminal(req, res, next) {
  const {
    routeId
  } = req.query;
  const {
    terminal
  } = req.body;

  let terminalObj = {
    _id: terminal._id,
    loc: terminal.loc,
    address: terminal.address,
    name: terminal.name,
    type: terminal.type
  }

  const returnObj = {
    success: false,
    message: '',
    data: {},
  };

  let query = {
    _id: routeId,
    adminId: adminId,
    isDeleted: false,
    'terminal._id': terminal._id
  }

  let updateObj = {
    $set: {
      'terminals.$': terminalObj
    }
  }

  AdminRouteSchema.findOneAndUpdateAsync({
      query
    }, {
      updateObj
    }, {
      new: true
    })
    .then((routeUpdateData) => {
      returnObj.data = routeUpdateData;
      if (returnObj.data) {
        returnObj.success = true;
        returnObj.message = 'Terminal updated successfully';
        res.send(returnObj);
      } else {
        res.send(returnObj);
      }
    })
    .catch((err) => {
      next(err);
    });
}

function removeTerminal(req, res, next) {
  const {
    routeId
  } = req.query;
  const {
    terminal
  } = req.body;

  let terminalObj = {
    _id: terminal._id
  }

  const returnObj = {
    success: false,
    message: '',
    data: {},
  };

  let query = {
    _id: routeId,
    adminId: adminId,
    isDeleted: false,
    'terminal._id': terminal._id
  }

  let updateObj = {
    $set: {
      'terminals.$.isDeleted': true
    }
  }

  AdminRouteSchema.findOneAndUpdateAsync({
      query
    }, {
      updateObj
    }, {
      new: true
    })
    .then((routeUpdateData) => {
      returnObj.data = routeUpdateData;
      if (returnObj.data) {
        returnObj.success = true;
        returnObj.message = 'Terminal deleted successfully';
        res.send(returnObj);
      } else {
        res.send(returnObj);
      }
    })
    .catch((err) => {
      next(err);
    });
}

function getAllRoutes(req, res, next) {
  var andCondition = [];
  var obj = {
    isDeleted: false,
    adminId: req.user._id
  };

  andCondition.push(obj);
  console.log(req.query);
  console.log(req.params);

  if (req.query && req.query.locationId && req.query.locationId != '') {
    obj = {
      locationId: req.query.locationId
    }
    andCondition.push(obj);
  }
  const {
    pageNo,
    limit = config.limit
  } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  debug(`skip value: ${req.query.pageNo}`);
  AdminRouteSchema.countAsync({
      $and: andCondition
    })
    // eslint-disable-next-line
    .then(totalUserRecord => {
      const returnObj = {
        success: true,
        message: `no of routes are zero`, // `no of active drivers are ${returnObj.data.length}`;
        data: null,
        meta: {
          totalNoOfPages: Math.ceil(totalUserRecord / limit),
          limit,
          currPageNo: pageNo,
          currNoOfRecord: 0,
        },
      };
      if (totalUserRecord < 1) {
        return res.send(returnObj);
      }
      if (skip > totalUserRecord) {
        const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
        return next(err);
      }
      AdminRouteSchema.find({
          $and: andCondition
        })
        .populate({
          path: 'locationId'
        })
        .limit(parseInt(limit))
        .skip(skip)
        .then((routeData) => {
          returnObj.data = routeData;
          returnObj.message = `routes found`;
          returnObj.meta.currNoOfRecord = returnObj.data.length;
          debug(`no of records are ${returnObj.meta.currNoOfRecord}`);
          return res.send(returnObj);
        })
        .catch((err) => {
          res.send('Error', err);
        });
    })
    .error((e) => {
      const err = new APIError(`error occured while counting the no of routes ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      debug('error inside getAllDrivers records');
      next(err);
    });
}

function getRouteDetails(req, res, next) {
  var query = {
    isDeleted: false,
    adminId: req.user._id,
    _id: req.query.routeId
  };

  const returnObj = {
    success: true,
    message: ``, // `no of active drivers are ${returnObj.data.length}`;
    data: {}
  };
  AdminRouteSchema.find({
      query
    })
    .then((routeData) => {
      if (routeData) {
        returnObj.success = true
        returnObj.data = routeData;
        returnObj.message = `route found`;
      } else {
        returnObj.success = false;
        returnObj.message = 'not found'
      }
      return res.send(returnObj);
    })
    .catch((err) => {
      res.send('Error', err);
    });
}

function getAllRidesMobile(req, res, next) {
console.log("                        ");
console.log("ReQ -----> ", req.body);
console.log("                        ");

  var andCondition = [{
    adminId: mongoose.Types.ObjectId(req.user._id)
  }];

  // Filters

  // Checking Status
  if (req.body && req.body.status && req.body.status != '') {
    let obj = {
      tripRequestStatus: {
        $in: req.body.status
      }
    }
    andCondition.push(obj);
  }
  // Checking driver Ids
  if (req.body && req.body.driverIds && req.body.driverIds != '') {
    var objIds = req.body.driverIds.map(id => mongoose.Types.ObjectId(id));
    let obj = {
      driverId: {
        $in: objIds
      }
    }
    andCondition.push(obj);
  }

  // Checking Start Terminal
  if (req.body && req.body.startTerminalID && req.body.startTerminalID != '') {
    let obj = {
      "srcLoc._id": req.body.startTerminalID
    }
    andCondition.push(obj);
  }
  // Checking End Terminal
  if (req.body && req.body.toTerminalID && req.body.toTerminalID != '') {
    let obj = {
      "destLoc._id": req.body.toTerminalID
    }
    andCondition.push(obj);
  }

  console.log("andcondition", JSON.stringify(andCondition));

  const {
    pageNo,
    limit = config.limit
  } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;

  debug(`skip value: ${req.query.pageNo}`);

  let aggregatePipeline = [{
      $match: {
        $and: andCondition
      }
    },
    {
      $lookup: {
        from: "trips",
        localField: "tripId",
        foreignField: "_id",
        as: "trip"
      }
    }, {
      $unwind: {
        path: "$trip",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $match: {
        "trip.activeStatus": true
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "riderId",
        foreignField: "_id",
        as: "riderDetails"
      }
    }, {
      $unwind: {
        path: "$riderDetails",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        vehicleId: "$trip.shuttleId",
        driverId: "$trip.driver._id",
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
        vehicleId: {
          $first: '$vehicleId'
        },
        driverId: {
          $first: '$driverId'
        },
        rides: {
          $push: '$$ROOT'
        }
      }
    },

    {
      $lookup: {
        from: "users",
        localField: "driverId",
        foreignField: "_id",
        as: "driver"
      }
    }, {
      $unwind: {
        path: "$driver",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "adminvehicles",
        localField: "vehicleId",
        foreignField: "_id",
        as: "shuttle"
      }
    }, {
      $unwind: {
        path: "$shuttle",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        rides: "$rides",
        "driver._id": 1,
        "driver.name": 1,
        "shuttle._id": 1,
        "shuttle.vechileNo": 1,
        "shuttle.name": 1
      }
    }, {
      $skip: parseInt(skip)
    }, {
      $limit: parseInt(limit)
    }
  ]

  if (req.body && req.body.timeSort == true) {
    aggregatePipeline.splice(1, 0, {
      $sort: {
        requestTime: 1
      }
    })
  }else{
    aggregatePipeline.splice(1, 0, {
      $sort: {
        _id: -1
      }
    })

  }
  console.log('totalriderecord', JSON.stringify(aggregatePipeline));
  TripRequestSchema.aggregateAsync(aggregatePipeline)
    // eslint-disable-next-line
    .then(totalRidesRecord => {
      console.log('totalriderecord', JSON.stringify(totalRidesRecord));
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
      console.log('andcondition', JSON.stringify(andCondition));
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
    var andCondition = [{
      adminId: mongoose.Types.ObjectId(req.user._id),
      tripRequestStatus: TRIP_REQUEST_ACCEPTED
    }];

    // if(req.query && req.query.locationId != ''){
    //   query.locationId = req.query.locationId
    // }

    let aggregatePipeline = [{
        $match: {
          $and: andCondition
        }
      },
      {
        $lookup: {
          from: "trips",
          localField: "tripId",
          foreignField: "_id",
          as: "trip"
        }
      },
      {
        $unwind: "$trip"
      },
      {
        $lookup: {
          from: "users",
          localField: "riderId",
          foreignField: "_id",
          as: "riderDetails"
        }
      },
      {
        $unwind: "$riderDetails"
      },
      {
        $project: {
          vehicleId: "$trip.shuttleId",
          driverId: "$trip.driver._id",
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
          vehicleId: {
            $first: '$vehicleId'
          },
          driverId: {
            $first: '$driverId'
          },
          rides: {
            $push: '$$ROOT'
          }
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
      {
        $unwind: "$driver"
      },
      {
        $lookup: {
          from: "adminvehicles",
          localField: "vehicleId",
          foreignField: "_id",
          as: "vehicle"
        }
      },
      {
        $unwind: "$vehicle"
      },
      {
        $project: {
          rides: "$rides",
          "driver._id": 1,
          "driver.name": 1,
          "vehicle._id": 1,
          "vehicle.vechileNo": 1,
          "vehicle.name": 1,
          "totalRides": {
            $size: "$rides"
          }
        }
      },
      {
        $unwind: "$rides"
      },
      {
        $group: {
          _id: "",
          totalRidesDone: {
            $sum: "$totalRides"
          },
          totalPassengers: {
            $sum: "$rides.seatBooked"
          }
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

async function getDistanceByOriginDestination(req, res, next) {
  var src= req.query.src.split(' ').join('%20');
  var des= req.query.des.split(' ').join('%20');
  const returnObj = {success: false, message: '', data: {}};

  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json`, {
      params: {
        origins: src,
        destinations: des,
        units: 'imperial',
        mode: 'driving',
        key: GOOGLE_API_KEY
      }
    });

    returnObj.success = true;
    returnObj.message = 'Route created successfully';
    returnObj.data = response.data;
    res.send(returnObj);
  } catch (error) {
    res.send(returnObj);
    console.log(error);
  }
}


function uploadImage(req, res, next) {
  var src = __dirname + '/../../../uploads/avtars/' ;
  var outputJson = new Object();
  var vaidImage = false;
  var form = new formidable.IncomingForm();
  form.keepExtensions = true; //keep file extension
  form.uploadDir = src;
  form.type=true;
  form.onPart = function (part) {
      if (!part.filename || part.filename.match(/\.(jpg|jpeg|png)$/i)) {
          vaidImage = true;
          this.handlePart(part);
      }
      else {
          vaidImage = false;
          return res.json({ status: 500, msg: 'Invaid image' });
      }
  }
  form.parse(req, function (err, fields, files) {
      if (form.bytesReceived > 1000000) {
          return res.json({ status: "Failure", code: 500, msg: "Image size exceeds the allowable limit(1 MB)." });
      }
      if (vaidImage) {
          var extension = files.file.type.split("/")[1];
          // var image = (files.file.path.split("/")[9] && files.file.path.split("/")[9]!="undefined")?files.file.path.split("/")[9]:files.file.path.split("/")[8];
          var fullpathFileName = files.file.path;
          var image = files.file.path.replace(/^.*[\\\/]/, '');
          outputJson = { status: "Success", code: 200, msg: "Image Upload Successfully", filename: image, pathFileName: fullpathFileName };
          setTimeout(function () {
              res.json(outputJson);
          }, 2000);
      }

  });

}



function onlineOffline(req, res, next) {

  // need to add validations

  UserSchema.findOneAsync({_id: req.body.adminId}).then((adminDetails)=>{
    const returnObj = {
      success:true,
      message:'Driver status has been updated succussfully',
      data:[],
      };
    if(!adminDetails){
      returnObj.success=false,
      returnObj.message='Admin details not found',
      returnObj.data=[]
      return res.send(returnObj);
    }else{
        TripSchema.findOneAsync({
          "driver._id": req.body.driverId,
          "activeStatus" : true,
        })
        .then((TripDoc) => {
          if(!TripDoc){
            notifyDriverStatus(req, adminDetails)
            returnObj.data=[]
            return res.send(returnObj);
          }else{
            let tripRequestStatuses = [TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE,TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED];
            TripRequestSchema.findAsync({tripId: TripDoc._id,tripRequestStatus: {$in: tripRequestStatuses}}).then((TripRequesrDocs)=>{
              if(TripRequesrDocs && TripRequesrDocs.length) {
                async.eachOf(TripRequesrDocs,
                  function(request, key, cb){
                    let newTripReqObj = {
                      requestUpdatedTime: (new Date()).toISOString(),
                      tripRequestStatus:TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED
                    };
                    // Updating Triprequest Schema with new driver and new TripId
                    TripRequestSchema.findOneAndUpdateAsync({_id: request._id},{$set: newTripReqObj},{new: true})
                    .then(savedTripRequest=>{
                      // notifyRideTransferRider(savedTripRequest, toTrip);
                      let toTripUpdates = {
                        $addToSet: { tripRequests: savedTripRequest }
                      }
                      if(savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
                        toTripUpdates["$inc"] = {seatBooked: request.seatBooked, seatsAvailable: -request.seatBooked}
                      }
                      // Updating To trip with updated Triprequest Start
                      TripSchema.findOneAndUpdateAsync(
                        {_id: TripDoc._id, activeStatus: true},
                        toTripUpdates,
                        {new: true}
                      )
                      .then(updatedTrip=>{
                        notifyRiderTripChangeStatus(savedTripRequest, adminDetails);
                        cb();
                      }).error((e)=>{
                        cb(e);
                      })
                      /****** END:- Updating To trip with updated Triprequest END ************/
                    }).error((e)=>{
                      cb(e);
                    })
                     /******* END:- Updating To trip with updated Triprequest END ***************/
                  },
                  function(e){
                    if(e) {
                      const err = new APIError(`Error occured while searching for the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                      next(err);
                    } else {
                      // Updating To trip with updated Triprequest Start
                      deactivateTripAsync(TripDoc._id).then(updatedTrip=>{
                        notifyDriverStatus(req, adminDetails);
                        returnObj.data=updatedTrip
                        return res.send(returnObj)
                      }).catch(err=>{
                        return next(error);
                      })
                    }
                  }
                )
              } else {
                deactivateTripAsync(TripDoc._id).then(updatedTrip=>{
                  notifyDriverStatus(req, adminDetails);
                  returnObj.data=updatedTrip
                  return res.send(returnObj)
                }).catch(err=>{
                  return next(err);
                })
              }
            }).error((e)=>{
              const err = new APIError(`Error occured while searching for the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            })
          }

        })
        .error((e) => {
          const err = new APIError(`Error occured while searching for the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(err);
        });

    }


  }).error((e)=>{
    const err = new APIError(`Error occured while searching for the Admin ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    next(err);
  })

};

function deactivateTripAsync(tripId) {
  return new Promise((resolve, reject)=>{
    TripSchema.findOneAndUpdateAsync(
      {_id: tripId}, {$set: {activeStatus: false}},{new: true}
    )
    .then(updatedTrip=>{
      console.log('updatedTrip>>>>>>>>>>>>>>', JSON.stringify(updatedTrip));
      adminVehicle.findOneAndUpdateAsync(
        {_id: updatedTrip.shuttleId}, {$set: {activeStatus: false}}, {new: true}
      )
      .then(updatedTrip=>{
        resolve(updatedTrip);
        /******* END :- Updating from trip with Old Triprequest Start ************/
      }).catch(err=>{
        console.log("Error occured while searching for the trip1", err);
        let error = new APIError(`Error occured while searching for the trip`, httpStatus.INTERNAL_SERVER_ERROR);
        reject(error);
      })
    }).catch(err=>{
      console.log("Error occured while searching for the trip2", err);
      let error = new APIError(`Error occured while searching for the trip`, httpStatus.INTERNAL_SERVER_ERROR);
      reject(error);
    })
  })
}


function notifyDriverStatus(req, adminDetails){
  UserSchema.updateAsync({ _id:  req.body.driverId }, { $set: { loginStatus: false,jwtAccessToken:null}}) // eslint-disable-line no-underscore-dangle
        .then((savedDoc) => {
          let res={
            ride:{
              riderDetails:savedDoc,
            },
            driverRoute:  [],
          };
          let message = `Admin canceled your session , please contact shuttle operator +${adminDetails.isdCode}${adminDetails.phoneNo}`;
          SocketStore.emitByUserId(req.body.driverId,`driverDeactivate`,{success:true, message: message,data: res}
          );

        }).error((e) => {
          const err = new APIError(`Error occured while Updating User Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(err);
        });
}

function notifyRiderTripChangeStatus(savedTripRequest, adminDetails){
    let message = `Admin cancel the trip, please contact shuttle operator +${adminDetails.isdCode}${adminDetails.phoneNo}`;
    SocketStore.emitByUserId(savedTripRequest.riderId,`requestRejectedRider`,{success:true, message: message,data: savedTripRequest });

    let pushData = {
    success:true, message: `Request Rejected`,
    data: savedTripRequest
    }
    return pushNotificationToRider(savedTripRequest.riderId,savedTripRequest.tripRequestStatus, pushData)
    /******* END :- Updating from trip with Old Triprequest Start ************/

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
  return PushNotification.sendNotificationByUserIdAsync(riderId, pushData);
}





export default {
  getDriverRoute,
  getRouteById,
  getSelectedTripRoute,
  createNewUser,
  getAllDrivers,
  getAllDriversMobile,
  getAllRidesMobile,
  getAllActiveTrips,
  updateDriverDetails,
  uploadImage,
  removeDriver,
  requestNewAccessCode,
  viewDrivers,
  // manage routes
  addRoute,
  getDistanceByOriginDestination,
  updateRoute,
  getAllRoutes,
  getRouteDetails,
  removeRoute,
  addTerminal,
  updateTerminal,
  removeTerminal,
// Manage driver by mobile admin make driver online OffLine
  onlineOffline
};
