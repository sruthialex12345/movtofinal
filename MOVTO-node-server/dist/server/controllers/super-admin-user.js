'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _util = require('../helpers/util');

var _util2 = _interopRequireDefault(_util);

var _env = require('../../config/env');

var _env2 = _interopRequireDefault(_env);

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

var _trip = require('../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _smsApi = require('../service/smsApi');

var _userTypes = require('../constants/user-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var moment = require('moment');

var debug = require('debug')('MGD-API: admin-user');

function getAllUsers(req, res, next) {
  var _req$query = req.query,
      pageNo = _req$query.pageNo,
      userType = _req$query.userType,
      _req$query$limit = _req$query.limit,
      limit = _req$query$limit === undefined ? _env2.default.limit : _req$query$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  debug('skip value: ' + req.query.pageNo);
  _user2.default.countAsync({ userType: userType })
  // eslint-disable-next-line
  .then(function (totalUserRecord) {
    var returnObj = {
      success: true,
      message: 'no of ' + userType + 's are zero', // `no of active drivers are ${returnObj.data.length}`;
      data: null,
      meta: {
        totalNoOfPages: Math.ceil(totalUserRecord / limit),
        limit: limit,
        currPageNo: pageNo,
        currNoOfRecord: 20
      }
    };
    if (totalUserRecord < 1) {
      return res.send(returnObj);
    }
    if (skip > totalUserRecord) {
      var err = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(err);
    }
    _user2.default.find({ userType: userType }).limit(limit).skip(skip).then(function (userData) {
      returnObj.data = removeCarDetailsFromNonDriverUsers(userData);
      returnObj.message = userType + 's found';
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      debug('no of records are ' + returnObj.meta.currNoOfRecord);
      return res.send(returnObj);
    }).catch(function (err) {
      res.send('Error', err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of users ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside getAllUsers records');
    next(err);
  });
}

function getTotalUsers(req, res) {
  // new users list
  _user2.default.find().then(function (foundUser) {
    res.send(foundUser);
  }).catch(function (err) {
    res.send('Error', err);
  });
}

function getApprovePendingUsers(req, res, next) {
  var userType = req.query.userType;

  _user2.default.find({ $and: [{ userType: userType }, { isApproved: 'false' }] }).then(function (foundPendingUsers) {
    var returnObj = {
      success: false,
      message: 'no of pending ' + userType + 's are zero',
      data: null,
      meta: {
        totalRecords: 0
      }
    };
    returnObj.data = foundPendingUsers;
    if (returnObj.data.length > 0) {
      returnObj.success = true;
      returnObj.message = 'no of pending users are ' + returnObj.data.length;
      returnObj.meta.totalRecords = '' + returnObj.data.length;
      console.log(returnObj, 'Pending users list'); //eslint-disable-line
      res.send(returnObj);
    } else {
      console.log(returnObj, returnObj.data, 'No pending users in DB'); //eslint-disable-line
      res.send(returnObj);
    }
  }).catch(function (err) {
    console.log('NO pending users data in db'); //eslint-disable-line
    next(err);
  });
}

function approveUser(req, res, next) {
  var id = req.query.id;

  _user2.default.findOneAndUpdateAsync({ _id: id }, { $set: { isApproved: true } }).then(function (userUpdateData) {
    var returnObj = {
      success: false,
      message: 'unable to update  user , user id provided didnt match ',
      data: null
    };
    returnObj.data = userUpdateData;
    if (returnObj.data) {
      returnObj.success = 'true';
      returnObj.message = 'user updated';
      res.send(returnObj);
      var smsText = 'Congratulations, your Merry Go Drive profile has been approved.';
      (0, _smsApi.sendSms)(id, smsText, function (err, data) {
        if (err) {
          console.log(err); // eslint-disable-line no-console
        } else {
          console.log(data); // eslint-disable-line no-console
        }
      });
    }
  }).catch(function (err) {
    next(err);
  });
}

function rejectUser(req, res, next) {
  // findOneAndRemove
  var id = req.query.id;

  _user2.default.findOneAndRemoveAsync({ _id: id }).then(function (rejectUserData) {
    var returnObj = {
      success: false,
      message: 'unable to delete  user , user id provided didnt match ',
      data: null
    };
    returnObj.data = rejectUserData;
    if (returnObj.data) {
      returnObj.success = 'true';
      returnObj.message = 'user deleted';
      res.send(returnObj);
    }
  }).catch(function (err) {
    next(err);
  });
}

function getActiveDriverDetails(req, res, next) {
  _user2.default.find({ $and: [{ userType: _userTypes.USER_TYPE_DRIVER }, { loginStatus: 'true' }, { isAvailable: 'true' }] }).then(function (foundActiveDrivers) {
    var returnObj = {
      success: false,
      message: 'no of active drivers are zero',
      data: null,
      meta: {
        totalRecords: 0
      }
    };
    returnObj.data = foundActiveDrivers;
    if (returnObj.data.length > 0) {
      returnObj.success = 'true';
      returnObj.message = 'no of active drivers are ' + returnObj.data.length;
      returnObj.meta.totalRecords = '' + returnObj.data.length;
      res.send(returnObj);
    } else {
      returnObj.success = 'false';
      returnObj.message = 'no of active drivers are ' + returnObj.data.length;
      returnObj.meta.totalRecords = '' + returnObj.data.length;
      res.send(returnObj);
    }
  }).catch(function (err) {
    next(err);
  });
}

function getActiveCustomerDetails(req, res, next) {
  _user2.default.find({ $and: [{ userType: _userTypes.USER_TYPE_RIDER }, { loginStatus: 'true' }] }).then(function (foundActiveCustomers) {
    var returnObj = {
      success: false,
      message: 'no of active customers are zero',
      data: null,
      meta: {
        totalRecords: 0
      }
    };
    returnObj.data = foundActiveCustomers;
    if (returnObj.data.length > 0) {
      returnObj.success = 'true';
      returnObj.message = 'no of active customers are ' + returnObj.data.length;
      returnObj.meta.totalRecords = '' + returnObj.data.length;
      console.log(returnObj.data, 'Active customers list'); //eslint-disable-line
      res.send(returnObj);
    }
  }).catch(function (err) {
    next(err);
  });
}

function getUsersDetails(req, res, next) {
  var userId = req.params.userId;

  var returnObj = {
    success: false,
    message: 'user Id is not defined',
    data: null
  };
  if (userId) {
    _user2.default.findByIdAsync(userId).then(function (userData) {
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
    }).error(function (e) {
      var err = new _APIError2.default('Error occured while findind the user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      next(err);
    });
  } else {
    res.send(returnObj);
  }
}

function updateUserDetails(req, res, next) {
  var userId = req.body._id; //eslint-disable-line
  var updateUserObj = (0, _assign2.default)({}, req.body);
  _user2.default.findOneAsync({ _id: userId }).then(function (userDoc) {
    if (userDoc) {
      userDoc.fname = updateUserObj.fname ? updateUserObj.fname : userDoc.fname;
      userDoc.lname = updateUserObj.lname ? updateUserObj.lname : userDoc.lname;
      userDoc.phoneNo = updateUserObj.phoneNo ? updateUserObj.phoneNo : userDoc.phoneNo;
      userDoc.address = updateUserObj.address ? updateUserObj.address : userDoc.address;
      userDoc.city = updateUserObj.city ? updateUserObj.city : userDoc.city;
      userDoc.state = updateUserObj.state ? updateUserObj.state : userDoc.state;
      userDoc.country = updateUserObj.country ? updateUserObj.country : userDoc.country;
      var returnObj = {
        success: false,
        message: 'unable to find the object',
        data: null,
        meta: null
      };

      userDoc.saveAsync().then(function (savedDoc) {
        if (savedDoc.password) {
          debug('inside password delete function');
          savedDoc = savedDoc.toObject();
          delete savedDoc.password;
        }
        returnObj.success = true;
        returnObj.message = 'user document saved';
        returnObj.data = savedDoc;
        res.send(returnObj);
      }).error(function (e) {
        var err = new _APIError2.default('Error occured while updating the user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function userStats(req, res, next) {
  var returnObj = {
    success: false,
    message: 'no data available',
    data: null
  };
  _user2.default.aggregateAsync([{ $match: { $or: [{ userType: _userTypes.USER_TYPE_DRIVER }, { userType: _userTypes.USER_TYPE_RIDER }] } }, {
    $group: {
      _id: 'riderDriverRatio',
      rider: { $sum: { $cond: [{ $eq: ['$userType', _userTypes.USER_TYPE_RIDER] }, 1, 0] } },
      driver: { $sum: { $cond: [{ $eq: ['$userType', _userTypes.USER_TYPE_DRIVER] }, 1, 0] } },
      totalUser: { $sum: 1 }
    }
  }]).then(function (userStatsData) {
    returnObj.success = true;
    returnObj.message = 'user chart data';
    returnObj.data = userStatsData;
    return res.send(returnObj);
  }).error(function (e) {
    var err = new _APIError2.default('Error occurred while computing statistic for user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

/**
 * Removes carDetails from rider objects
 */
function removeCarDetailsFromNonDriverUsers() {
  var userData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

  return userData.map(function (user) {
    var carDetails = user.carDetails,
        rest = (0, _objectWithoutProperties3.default)(user, ['carDetails']);

    return (0, _extends3.default)({}, rest, user.userType === _userTypes.USER_TYPE_DRIVER ? user.carDetails : {});
  });
}

function changePassword(req, res, next) {
  var userObj = {
    email: req.body.email,
    userType: req.body.userType
  };
  _user2.default.findOneAsync(userObj, '+password')
  // eslint-disable-next-line consistent-return
  .then(function (user) {
    var returnObj = {
      success: false,
      message: '',
      data: null
    };
    if (!user) {
      var err = new _APIError2.default('User not found with the given email id', _httpStatus2.default.NOT_FOUND);
      return next(err);
    } else {
      // eslint-disable-next-line
      user.comparePassword(req.body.oldpassword, function (passwordError, isMatch) {
        if (passwordError || !isMatch) {
          var _err = new _APIError2.default('Incorrect old password', _httpStatus2.default.UNAUTHORIZED);
          return next(_err);
        }
        user.password = req.body.password;
        user.saveAsync().then(function (savedUser) {
          returnObj.success = true;
          returnObj.message = 'password changed  successfully';
          returnObj.data = savedUser;
          return res.send(returnObj);
        }).error(function (e) {
          var err = new _APIError2.default('Error while changing password ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          returnObj.success = false;
          returnObj.message = 'password not changed';
          console.log(err); // eslint-disable-line no-console
          return next(returnObj);
        });
      });
    }
  }).error(function (e) {
    var err = new _APIError2.default('error while finding user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function createNewUser(req, res, next) {
  var userData = (0, _assign2.default)({}, req.body);
  _user2.default.findOneAsync({ email: userData.email, userType: userData.userType })
  // eslint-disable-next-line consistent-return
  .then(function (foundUser) {
    var returnObj = {
      success: false,
      message: '',
      data: null
    };
    if (foundUser !== null) {
      var err = new _APIError2.default('Email Id Already Exist', _httpStatus2.default.CONFLICT);
      return next(err);
    }
    try {
      var _userObj = new _user2.default({
        email: userData.email,
        phoneNo: userData.phoneNo,
        // password is the access code if usertype is driver/admin
        password: _util2.default.generateAccessCode(),
        userType: userData.userType,
        fname: userData.fname,
        lname: userData.lname,
        dob: userData.dob,
        bloodGroup: userData.bloodGroup ? userData.bloodGroup : null,
        gpsLoc: [19.02172902354515, 72.85368273308545],
        emergencyDetails: userData.userType === _userTypes.USER_TYPE_RIDER ? {
          phone: userData.emergencyDetails.phone ? userData.emergencyDetails.phone : '',
          name: userData.emergencyDetails.name ? userData.emergencyDetails.name : '',
          imgUrl: null
        } : {
          phone: '',
          name: '',
          imgUrl: null
        },
        carDetails: userData.userType === _userTypes.USER_TYPE_DRIVER ? {
          type: userData.carDetails.type ? userData.carDetails.type : 'Sedan',
          company: userData.carDetails.company ? userData.carDetails.company : 'Maruti',
          regNo: userData.carDetails.regNo ? userData.carDetails.regNo : '',
          RC_ownerName: userData.carDetails.RC_ownerName ? userData.carDetails.RC_ownerName : '',
          vehicleNo: userData.carDetails.vehicleNo ? userData.carDetails.vehicleNo : '',
          carModel: userData.carDetails.carModel ? userData.carDetails.carModel : '',
          regDate: userData.carDetails.regDate ? userData.carDetails.regDate : ''
        } : {},
        insuranceUrl: userData.userType === _userTypes.USER_TYPE_DRIVER ? userData.vehicleDocuments.insuranceUrl : null,
        rcBookUrl: userData.userType === _userTypes.USER_TYPE_DRIVER ? userData.vehicleDocuments.rcBookUrl : null,
        licenceUrl: userData.userType === _userTypes.USER_TYPE_DRIVER ? userData.licenceDocuments.licenceUrl : null,
        vechilePaperUrl: userData.userType === _userTypes.USER_TYPE_DRIVER ? userData.licenceDocuments.vechilePaperUrl : null,
        licenceDetails: userData.userType === _userTypes.USER_TYPE_DRIVER ? {
          licenceNo: userData.licenceDetails.licenceNo ? userData.licenceDetails.licenceNo : null,
          issueDate: userData.licenceDetails.issueDate ? userData.licenceDetails.issueDate : null,
          expDate: userData.licenceDetails.expDate ? userData.licenceDetails.expDate : null
        } : {},
        bankDetails: userData.userType === _userTypes.USER_TYPE_DRIVER ? {
          accountNo: userData.bankDetails.accountNo ? userData.bankDetails.accountNo : null,
          holderName: userData.bankDetails.holderName ? userData.bankDetails.holderName : '',
          IFSC: userData.bankDetails.IFSC ? userData.bankDetails.IFSC : ''
        } : {},
        mapCoordinates: [0, 0],
        loginStatus: true
      });
    } catch (error) {
      return next(error);
    }
    userObj.saveAsync().then(function (savedUser) {
      returnObj.success = true;
      returnObj.message = 'user created successfully';
      returnObj.data = savedUser;
      return res.send(returnObj);
    }).error(function (e) {
      var err = new _APIError2.default('Error while Creating new User ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      returnObj.success = false;
      returnObj.message = 'user not created';
      console.log(err); // eslint-disable-line no-console
      return next(returnObj);
    });
  }).error(function (e) {
    var err = new _APIError2.default('Error while Searching the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    return next(err);
  });
}

// Function to fetch available rides based on Filters
function getAdminRides(req, res /* , next */) {
  var _req$body = req.body,
      upcoming = _req$body.upcoming,
      progress = _req$body.progress,
      completed = _req$body.completed,
      pageNo = _req$body.pageNo;

  var limit = 10;
  var skip = pageNo ? (pageNo - 1) * limit : 0;
  var conditions = {};
  if (upcoming || progress || completed) {
    conditions.$or = [];
    if (upcoming === true) {
      conditions.$or.push({
        tripStatus: 'claimed'
      });
    }
    if (progress === true) {
      conditions.$or.push({
        tripStatus: 'onTrip'
      });
    }
    if (completed === true) {
      conditions.$or.push({
        tripStatus: 'endTrip'
      });
    }
  } else {
    conditions = {};
  }

  var queryArray = [{
    $match: conditions
  }, {
    $lookup: {
      from: 'users',
      localField: 'riderId',
      foreignField: '_id',
      as: 'riderData'
    }
  }, {
    $unwind: {
      path: '$riderData',
      preserveNullAndEmptyArrays: false
    }
  }, {
    $lookup: {
      from: 'users',
      localField: 'driverId',
      foreignField: '_id',
      as: 'driverData'
    }
  }, {
    $unwind: {
      path: '$driverData',
      preserveNullAndEmptyArrays: false
    }
  }, { $skip: skip }, { $limit: limit }];
  countTotalRides(conditions).then(function (countObj) {
    _trip2.default.aggregateAsync(queryArray).then(function (availableRides) {
      if (availableRides.length > 0) {
        var returnObj = {
          success: true,
          message: 'Rides available',
          data: [],
          count: countObj.count
        };
        returnObj.data = availableRides;
        // console.log("Length===========>", countObj.count)
        res.send(returnObj);
      } else {
        var _returnObj = {
          success: true,
          message: 'no rides available',
          data: [],
          count: countObj.count
        };
        res.send(_returnObj);
      }
    }).catch(function () {
      var returnObj = {
        success: false,
        message: 'server error while fetching rides.',
        data: [],
        count: countObj.count
      };
      res.send(returnObj);
    });
  }).catch(function () {
    var returnObj = {
      success: false,
      message: 'server error while fetching rides.',
      data: [],
      count: 0
    };
    res.send(returnObj);
  });
}

function countTotalRides(conditions) {
  var queryArray = [{
    $match: conditions
  }, {
    $lookup: {
      from: 'users',
      localField: 'riderId',
      foreignField: '_id',
      as: 'riderData'
    }
  }, {
    $unwind: {
      path: '$riderData',
      preserveNullAndEmptyArrays: false
    }
  }, {
    $lookup: {
      from: 'users',
      localField: 'driverId',
      foreignField: '_id',
      as: 'driverData'
    }
  }, {
    $unwind: {
      path: '$driverData',
      preserveNullAndEmptyArrays: false
    }
  }];
  return new _promise2.default(function (resolve, reject) {
    _trip2.default.aggregateAsync(queryArray).then(function (tripData) {
      if (tripData.length > 0) {
        var returnObj = { count: tripData.length };
        resolve(returnObj);
      } else {
        var _returnObj2 = { count: 0 };
        resolve(_returnObj2);
      }
    }).catch(function (err) {
      reject(err);
    });
  });
}

function getRidesUptoSevenDays(req, res /* , next */) {
  var currentDate = new Date().toISOString();
  var sevenDaysDate = new Date(moment(currentDate).add(7, 'days'));
  _trip2.default.aggregateAsync([{ $match: { bookingTime: { $gt: currentDate, $lt: sevenDaysDate }, tripStatus: 'unclaimed' } }]).then(function (ridesData) {
    if (ridesData.length > 0) {
      res.send({ status: true, message: 'Rides successfully fetched', data: ridesData });
    } else {
      res.send({ status: false, message: 'Rides not fetched', data: ridesData });
    }
  }).catch(function () {
    res.send({ status: false, message: 'server error while fetching rides' });
  });
}

exports.default = {
  rejectUser: rejectUser,
  approveUser: approveUser,
  getApprovePendingUsers: getApprovePendingUsers,
  getAllUsers: getAllUsers,
  getUsersDetails: getUsersDetails,
  updateUserDetails: updateUserDetails,
  userStats: userStats,
  createNewUser: createNewUser,
  getTotalUsers: getTotalUsers,
  getActiveDriverDetails: getActiveDriverDetails,
  getActiveCustomerDetails: getActiveCustomerDetails,
  changePassword: changePassword,
  getAdminRides: getAdminRides,
  getRidesUptoSevenDays: getRidesUptoSevenDays
};
module.exports = exports.default;
//# sourceMappingURL=super-admin-user.js.map
