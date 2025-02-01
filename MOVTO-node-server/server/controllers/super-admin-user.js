import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Utilities from '../helpers/util';
import config from '../../config/env';
import UserSchema from '../models/user';
import TripSchema from '../models/trip';
import { sendSms } from '../service/smsApi';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER } from '../constants/user-types';

const moment = require('moment');

const debug = require('debug')('MGD-API: admin-user');


function getAllUsers(req, res, next) {
  const { pageNo, userType, limit = config.limit } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  debug(`skip value: ${req.query.pageNo}`);
  UserSchema.countAsync({ userType })
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
      UserSchema.find({ userType })
        .limit(limit)
        .skip(skip)
        .then((userData) => {
          returnObj.data = removeCarDetailsFromNonDriverUsers(userData);
          returnObj.message = `${userType}s found`;
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
    email: req.body.email,
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
              returnObj.message = 'password changed  successfully';
              returnObj.data = savedUser;
              return res.send(returnObj);
            })
            .error((e) => {
              const err = new APIError(`Error while changing password ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              returnObj.success = false;
              returnObj.message = 'password not changed';
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

function createNewUser(req, res, next) {
  const userData = Object.assign({}, req.body);
  UserSchema.findOneAsync({ email: userData.email, userType: userData.userType })
    // eslint-disable-next-line consistent-return
    .then((foundUser) => {
      const returnObj = {
        success: false,
        message: '',
        data: null,
      };
      if (foundUser !== null) {
        const err = new APIError('Email Id Already Exist', httpStatus.CONFLICT);
        return next(err);
      }
      try {
        const userObj = new UserSchema({
          email: userData.email,
          phoneNo: userData.phoneNo,
          // password is the access code if usertype is driver/admin
          password: Utilities.generateAccessCode(),
          userType: userData.userType,
          fname: userData.fname,
          lname: userData.lname,
          dob: userData.dob,
          bloodGroup: userData.bloodGroup ? userData.bloodGroup : null,
          gpsLoc: [19.02172902354515, 72.85368273308545],
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
          carDetails:
            userData.userType === USER_TYPE_DRIVER
              ? {
                type: userData.carDetails.type ? userData.carDetails.type : 'Sedan',
                company: userData.carDetails.company ? userData.carDetails.company : 'Maruti',
                regNo: userData.carDetails.regNo ? userData.carDetails.regNo : '',
                RC_ownerName: userData.carDetails.RC_ownerName ? userData.carDetails.RC_ownerName : '',
                vehicleNo: userData.carDetails.vehicleNo ? userData.carDetails.vehicleNo : '',
                carModel: userData.carDetails.carModel ? userData.carDetails.carModel : '',
                regDate: userData.carDetails.regDate ? userData.carDetails.regDate : '',
              }
              : {},
          insuranceUrl: userData.userType === USER_TYPE_DRIVER ? userData.vehicleDocuments.insuranceUrl : null,
          rcBookUrl: userData.userType === USER_TYPE_DRIVER ? userData.vehicleDocuments.rcBookUrl : null,
          licenceUrl: userData.userType === USER_TYPE_DRIVER ? userData.licenceDocuments.licenceUrl : null,
          vechilePaperUrl: userData.userType === USER_TYPE_DRIVER ? userData.licenceDocuments.vechilePaperUrl : null,
          licenceDetails:
            userData.userType === USER_TYPE_DRIVER
              ? {
                licenceNo: userData.licenceDetails.licenceNo ? userData.licenceDetails.licenceNo : null,
                issueDate: userData.licenceDetails.issueDate ? userData.licenceDetails.issueDate : null,
                expDate: userData.licenceDetails.expDate ? userData.licenceDetails.expDate : null,
              }
              : {},
          bankDetails:
            userData.userType === USER_TYPE_DRIVER
              ? {
                accountNo: userData.bankDetails.accountNo ? userData.bankDetails.accountNo : null,
                holderName: userData.bankDetails.holderName ? userData.bankDetails.holderName : '',
                IFSC: userData.bankDetails.IFSC ? userData.bankDetails.IFSC : '',
              }
              : {},
          mapCoordinates: [0, 0],
          loginStatus: true,
        });
      } catch (error) {
        return next(error)
      }
      userObj
        .saveAsync()
        .then((savedUser) => {
          returnObj.success = true;
          returnObj.message = 'user created successfully';
          returnObj.data = savedUser;
          return res.send(returnObj);
        })
        .error((e) => {
          const err = new APIError(`Error while Creating new User ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          returnObj.success = false;
          returnObj.message = 'user not created';
          console.log(err); // eslint-disable-line no-console
          return next(returnObj);
        });
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
};
