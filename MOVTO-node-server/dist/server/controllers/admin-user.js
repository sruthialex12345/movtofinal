'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

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

var _adminNotifyMessage = require('../models/adminNotifyMessage');

var _adminNotifyMessage2 = _interopRequireDefault(_adminNotifyMessage);

var _driverRouteTerminal = require('../models/driverRouteTerminal');

var _driverRouteTerminal2 = _interopRequireDefault(_driverRouteTerminal);

var _adminDriver = require('../models/adminDriver');

var _adminDriver2 = _interopRequireDefault(_adminDriver);

var _adminLocation = require('../models/adminLocation');

var _adminLocation2 = _interopRequireDefault(_adminLocation);

var _trip = require('../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _smsApi = require('../service/smsApi');

var _userTypes = require('../constants/user-types');

var _countryCode = require('../models/countryCode');

var _countryCode2 = _interopRequireDefault(_countryCode);

var _emailApi = require('../service/emailApi');

var _emailApi2 = _interopRequireDefault(_emailApi);

var _template = require('../service/template');

var templateService = _interopRequireWildcard(_template);

var _tripRequest = require('../models/tripRequest');

var _tripRequest2 = _interopRequireDefault(_tripRequest);

var _review = require('../models/review');

var _review2 = _interopRequireDefault(_review);

var _adminVehicle = require('../models/adminVehicle');

var _adminVehicle2 = _interopRequireDefault(_adminVehicle);

var _reservationCode = require('../models/reservationCode');

var _reservationCode2 = _interopRequireDefault(_reservationCode);

var _pushNotification = require('../service/pushNotification');

var PushNotification = _interopRequireWildcard(_pushNotification);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _tripRequestStatuses = require('../constants/trip-request-statuses');

var _bodyParser = require('body-parser');

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _global = require('../constants/global');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var randomstring = require("randomstring");

var async = require('async');
var moment = require('moment');

var debug = require('debug')('MGD-API: admin-user');

function getAllUsers(req, res, next) {
  var _req$query = req.query,
      pageNo = _req$query.pageNo,
      userType = _req$query.userType,
      _req$query$limit = _req$query.limit,
      limit = _req$query$limit === undefined ? _env2.default.limit : _req$query$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  var name = req.query.keyword ? req.query.keyword : '';
  var query = {
    userType: req.query.userType,
    isDeleted: false,
    $or: [{ "name": { $regex: name, $options: 'i' } }, { "fname": { $regex: name, $options: 'i' } }, { "email": { $regex: name, $options: 'i' } }, { "lname": { $regex: name, $options: 'i' } }]
  };
  _user2.default.countAsync(query)
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
      var _err = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(_err);
    }
    _user2.default.find(query, 'name fname lname email isdCode phoneNo address city state country isActive isDeleted adminTripTypes tripType countryCode accessCode')
    // .limit(limit)
    // .skip(skip)
    .then(function (userData) {
      returnObj.data = userData;
      returnObj.message = userType + 's found';
      returnObj.meta.currNoOfRecord = returnObj.data.length;
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
    email: req.body.email.toLowerCase(),
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
      var _err2 = new _APIError2.default('User not found with the given email id', _httpStatus2.default.NOT_FOUND);
      return next(_err2);
    } else {
      // eslint-disable-next-line
      user.comparePassword(req.body.oldpassword, function (passwordError, isMatch) {
        if (passwordError || !isMatch) {
          var _err3 = new _APIError2.default('Incorrect old password', _httpStatus2.default.UNAUTHORIZED);
          return next(_err3);
        }
        user.password = req.body.password;
        user.saveAsync().then(function (savedUser) {
          returnObj.success = true;
          returnObj.message = 'Password changed successfully';
          returnObj.data = savedUser;
          return res.send(returnObj);
        }).error(function (e) {
          var err = new _APIError2.default('Error while changing password ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          returnObj.success = false;
          returnObj.message = 'Password not changed';
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

/* start: manage drivers by admin */

function createNewUser(req, res, next) {
  var userData = (0, _assign2.default)({}, req.body);
  _user2.default.findOneAsync({
    $or: [{ email: req.body.email.toLowerCase(), userType: req.body.userType }, { userType: req.body.userType, phoneNo: req.body.phoneNo }]
  })
  // eslint-disable-next-line consistent-return
  .then(function (foundUser) {
    var returnObj = {
      success: false,
      message: '',
      data: null
    };
    console.log("found create adminuser ", foundUser);
    if (foundUser !== null) {
      console.log("I m here");
      var _err4 = new _APIError2.default('Email Id/phone No Already Exist', _httpStatus2.default.CONFLICT, true);
      return next(_err4);
    }
    _countryCode2.default.findOneAsync({ dial_code: req.body.isdCode }).then(function (CountryCodeDetails) {
      var accessCode = _util2.default.generateAccessCode();
      var newPassword = randomstring.generate({
        length: 8
        // charset: 'alphanumeric'
      });
      var userObj = new _user2.default({
        zone: userData.zone ? userData.zone : '',
        email: userData.email.toLowerCase(),
        phoneNo: userData.phoneNo,
        password: newPassword,
        accessCode: accessCode,
        userType: userData.userType,
        fname: userData.fname,
        lname: userData.lname,
        name: userData.fname && userData.lname && userData.fname + ' ' + userData.lname || userData.fname,
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
        countryCode: CountryCodeDetails && CountryCodeDetails.code ? CountryCodeDetails.code : '',
        emergencyDetails: userData.userType === _userTypes.USER_TYPE_RIDER ? {
          phone: userData.emergencyDetails.phone ? userData.emergencyDetails.phone : '',
          name: userData.emergencyDetails.name ? userData.emergencyDetails.name : '',
          imgUrl: null
        } : {
          phone: '',
          name: '',
          imgUrl: null
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
        loginStatus: true
      });
      userObj.saveAsync().then(function (savedUser) {
        returnObj.success = true;
        returnObj.message = 'User created successfully';
        returnObj["accessCode"] = accessCode;
        // console.log("saved user", savedUser);
        returnObj.data = savedUser;
        // create new admin driver accesscode
        var newAdminDriver = new _adminDriver2.default({
          userIdAdmin: req.user._id,
          userIdDriver: savedUser._id,
          accessCode: savedUser.accessCode,
          locationId: req.body.locationId
        });
        newAdminDriver.saveAsync().then(function (savedDoc) {
          var userObj = (0, _assign2.default)(savedUser, { newpass: newPassword, accessCode: accessCode });
          (0, _emailApi2.default)(savedUser._id, userObj, 'createDriver'); //eslint-disable-line
          return console.log("admindriver saved", savedDoc);
        }).error(function () {
          return console.log("error saving admindriver");
        });
        res.send(returnObj);
      }).error(function (e) {
        var err = new _APIError2.default('Error while Creating new User ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        returnObj.success = false;
        returnObj.message = 'user not created';
        console.log(err); // eslint-disable-line no-console
        return next(returnObj);
      });
    }).catch(function (e) {
      var err = new _APIError2.default('Error in creating user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('Error while Searching the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    return next(err);
  });
}

function getAllDrivers(req, res, next) {
  var andCondition = [];
  var obj = {};
  obj = {
    userIdAdmin: req.user._id
  };
  andCondition.push(obj);

  if (req.query && req.query.locationId != '') {
    obj = { locationId: req.query.locationId };
    andCondition.push(obj);
  }
  var _req$query2 = req.query,
      pageNo = _req$query2.pageNo,
      userType = _req$query2.userType,
      _req$query2$limit = _req$query2.limit,
      limit = _req$query2$limit === undefined ? _env2.default.limit : _req$query2$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  debug('skip value: ' + req.query.pageNo);
  _adminDriver2.default.countAsync({ $and: andCondition })
  // eslint-disable-next-line
  .then(function (totalUserRecord) {
    var returnObj = {
      success: true,
      message: 'no of drivers are zero', // `no of active drivers are ${returnObj.data.length}`;
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
      var _err5 = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(_err5);
    }
    _adminDriver2.default.find({ $and: andCondition }).populate('userIdDriver').limit(parseInt(limit)).skip(skip).then(function (userData) {
      returnObj.data = userData;
      returnObj.message = 'drivers found';
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      debug('no of records are ' + returnObj.meta.currNoOfRecord);
      return res.send(returnObj);
    }).catch(function (err) {
      res.send('Error', err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of users ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside getAllDrivers records');
    next(err);
  });
}

function getAllDriversMobile(req, res, next) {
  var andCondition = [];
  var obj = { isDeleted: false };
  obj = {
    userIdAdmin: req.user._id
  };
  andCondition.push(obj);

  if (req.query && req.query.locationId != '') {
    obj = { locationId: req.query.locationId };
    andCondition.push(obj);
  }
  var _req$query3 = req.query,
      pageNo = _req$query3.pageNo,
      _req$query3$limit = _req$query3.limit,
      limit = _req$query3$limit === undefined ? _env2.default.limit : _req$query3$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  debug('skip value: ' + req.query.pageNo);
  _adminDriver2.default.countAsync({ $and: andCondition })
  // eslint-disable-next-line
  .then(function (totalDriversRecord) {
    var returnObj = {
      success: true,
      message: 'no of vehicles are zero', // `no of active vehicles are ${returnObj.data.length}`;
      data: {
        meta: {
          totalNoOfPages: Math.ceil(totalDriversRecord / limit),
          limit: limit,
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
      var _err6 = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(_err6);
    }
    console.log('andcondition', andCondition);
    _adminDriver2.default.find({ $and: andCondition }).limit(parseInt(limit)).skip(skip).populate('userIdDriver', { name: 1, profileUrl: 1, email: 1, activeStatus: 1 }).then(function (driversData) {
      returnObj.data.drivers = driversData;
      returnObj.message = 'drivers found';
      returnObj.data.meta.currNoOfRecord = driversData.length;
      returnObj.data.meta.totalDrivers = totalDriversRecord;
      // debug(`no of records are ${returnObj.meta.currNoOfRecord}`);
      getDriverListMetaAsync(req).then(function (listMetaData) {
        returnObj.data.meta.activeDrivers = listMetaData.activeDrivers;
        return res.send(returnObj);
      }).catch(function (error) {
        var errorCustom = new _APIError2.default('error occured while counting the active drivers ' + error, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        return next(errorCustom);
      });
    }).catch(function (error) {
      var errorCustom = new _APIError2.default('error occured while searching the admin drivers ' + error, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      return next(errorCustom);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of users ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside getAllDrivers records');
    return next(err);
  });
}

function getDriverListMetaAsync(req) {
  return new _promise2.default(function (resolve, reject) {
    // get all shuttleIds
    var query = { isDeleted: false };
    query = {
      userIdAdmin: _mongoose2.default.Types.ObjectId(req.user._id)
    };

    if (req.query && req.query.locationId != '') {
      query.locationId = req.query.locationId;
    }

    _adminDriver2.default.aggregate([{ $match: query }, {
      $group: {
        _id: '',
        ids: { $addToSet: "$_id" }
      }
    }])
    // eslint-disable-next-line
    .then(function (results) {
      var result = results[0];
      console.log('aggregate result', result);
      var returnObj = { activeDrivers: null };
      var totalDriversRecord = result.ids;
      if (totalDriversRecord && Array.isArray(totalDriversRecord) && totalDriversRecord.length) {
        var tripQuery = {
          driverId: { $in: totalDriversRecord },
          activeStatus: true
        };
        _trip2.default.countAsync(tripQuery).then(function (activeTripsCount) {
          returnObj.activeDrivers = activeTripsCount;
          return resolve(returnObj);
        }).catch(function (error) {
          return reject(error);
        });
      } else {
        return resolve(returnObj);
      }
    }).catch(function (e) {
      var err = new _APIError2.default('error occured while counting the no of users ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      return reject(err);
    });
    // get all active shuttles
  });
}

function getAllRidesMobile(req, res, next) {
  var andCondition = [{
    adminId: _mongoose2.default.Types.ObjectId(req.user._id)
  }];

  if (req.query && req.query.status && req.query.status != '') {
    var obj = { tripRequestStatus: req.query.status };
    andCondition.push(obj);
  }

  // if(req.query && req.query.driverId != ''){
  //   let obj={driverId:req.query.driverId}
  //   andCondition.push(obj);
  // }
  console.log("andcondition", andCondition);

  var _req$query4 = req.query,
      pageNo = _req$query4.pageNo,
      _req$query4$limit = _req$query4.limit,
      limit = _req$query4$limit === undefined ? _env2.default.limit : _req$query4$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;

  debug('skip value: ' + req.query.pageNo);

  var aggregatePipeline = [{ $match: { $and: andCondition } }, {
    $lookup: {
      from: "trips",
      localField: "tripId",
      foreignField: "_id",
      as: "trip"
    }
  }, { $unwind: "$trip" }, {
    $lookup: {
      from: "users",
      localField: "riderId",
      foreignField: "_id",
      as: "riderDetails"
    }
  }, { $unwind: "$riderDetails" }, {
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
  }, {
    $lookup: {
      from: "users",
      localField: "driverId",
      foreignField: "_id",
      as: "driver"
    }
  }, { $unwind: "$driver" }, {
    $lookup: {
      from: "adminvehicles",
      localField: "vehicleId",
      foreignField: "_id",
      as: "shuttle"
    }
  }, { $unwind: "$shuttle" }, {
    $project: {
      rides: "$rides",
      "driver._id": 1,
      "driver.name": 1,
      "shuttle._id": 1,
      "shuttle.vechileNo": 1,
      "shuttle.name": 1
    }
  }, { $skip: parseInt(skip) }, { $limit: parseInt(limit) }];
  _tripRequest2.default.aggregateAsync(aggregatePipeline)
  // eslint-disable-next-line
  .then(function (totalRidesRecord) {
    console.log('totalriderecord', totalRidesRecord);
    var returnObj = {
      success: true,
      message: 'no of rides are zero', // `no of active vehicles are ${returnObj.data.length}`;
      data: {
        meta: {
          totalNoOfPages: Math.ceil(totalRidesRecord.length / limit),
          limit: limit,
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
      var _err7 = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(_err7);
    }
    console.log('andcondition', andCondition);
    getAllRidesMobileMeta(req).then(function (metaData) {
      returnObj.data.meta.totalRides = metaData && metaData.totalRidesDone;
      returnObj.data.meta.totalPassengers = metaData && metaData.totalPassengers;
      debug('no of records are ' + returnObj.data.meta.currNoOfRecord);
      return res.send(returnObj);
    }).catch(function (err) {
      var errorCustom = new _APIError2.default('error occured while getting rides ' + err, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      debug('error inside getAllDrivers records');
      return next(err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of users ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside getAllDrivers records');
    return next(err);
  });
}

function getAllRidesMobileMeta(req) {
  return new _promise2.default(function (resolve, reject) {
    var andCondition = [{ adminId: _mongoose2.default.Types.ObjectId(req.user._id), tripRequestStatus: _tripRequestStatuses.TRIP_REQUEST_ACCEPTED }];

    // if(req.query && req.query.locationId != ''){
    //   query.locationId = req.query.locationId
    // }

    var aggregatePipeline = [{ $match: { $and: andCondition } }, {
      $lookup: {
        from: "trips",
        localField: "tripId",
        foreignField: "_id",
        as: "trip"
      }
    }, { $unwind: "$trip" }, {
      $lookup: {
        from: "users",
        localField: "riderId",
        foreignField: "_id",
        as: "riderDetails"
      }
    }, { $unwind: "$riderDetails" }, {
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
    }, {
      $lookup: {
        from: "users",
        localField: "driverId",
        foreignField: "_id",
        as: "driver"
      }
    }, { $unwind: "$driver" }, {
      $lookup: {
        from: "adminvehicles",
        localField: "vehicleId",
        foreignField: "_id",
        as: "vehicle"
      }
    }, { $unwind: "$vehicle" }, {
      $project: {
        rides: "$rides",
        "driver._id": 1,
        "driver.name": 1,
        "vehicle._id": 1,
        "vehicle.vechileNo": 1,
        "vehicle.name": 1,
        "totalRides": { $size: "$rides" }
      }
    }, { $unwind: "$rides" }, {
      $group: {
        _id: "",
        totalRidesDone: { $sum: "$totalRides" },
        totalPassengers: { $sum: "$rides.seatBooked" }
      }
    }];

    _tripRequest2.default.aggregateAsync(aggregatePipeline).then(function (result) {
      return resolve(result[0]);
    }).catch(function (error) {
      console.log('error while fetching metadata for all rides', error);
      return reject(new Error('something went wrong while getting rides list'));
    });
  });
}

function getAllActiveTrips(req, res, next) {
  var _req$query5 = req.query,
      pageNo = _req$query5.pageNo,
      _req$query5$limit = _req$query5.limit,
      limit = _req$query5$limit === undefined ? _env2.default.limit : _req$query5$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  _adminDriver2.default.aggregate([{ $match: { userIdAdmin: _mongoose2.default.Types.ObjectId(req.user._id) } }, { $group: { _id: '', ids: { $addToSet: "$userIdDriver" } } }]).then(function (result) {
    console.log('result', result);
    var returnObj = {
      success: false, message: 'No drivers found', data: []
    };
    if (result && result.length) {
      result[0].ids;
      if (result[0].ids && result[0].ids.length) {
        var tripQuery = {
          driverId: { $in: result[0].ids },
          activeStatus: true
        };
        _trip2.default.countAsync(tripQuery).then(function (totalTripsRecord) {
          var returnObj = {
            success: true,
            message: 'no of trips', // `no of active vehicles are ${returnObj.data.length}`;
            data: []
          };

          if (totalTripsRecord < 1) {
            return res.send(returnObj);
          }

          if (skip > totalTripsRecord) {
            var _err8 = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
            return next(_err8);
          }

          var projectedFields = {
            activeStatus: 1,
            gpsLoc: 1,
            visitedTerminal: 1
          };

          _trip2.default.find(tripQuery, projectedFields).limit(parseInt(limit)).skip(skip).populate([{ path: 'driverId', select: 'name profileUrl email activeStatus' }, { path: 'shuttleId', select: 'name profileUrl activeStatus' }]).then(function (activeTrips) {
            returnObj.data = activeTrips;
            returnObj.message = 'Trips found';
            return res.send(returnObj);
          }).catch(function (error) {
            console.log('error searchng active trips ', error);
            var errorCustom = new _APIError2.default('Something went wrong while searching for trips', _httpStatus2.default.NOT_FOUND);
            return next(errorCustom);
          });
        });
      } else {
        res.send(returnObj);
      }
    } else {
      res.send(returnObj);
    }
  }).catch(function (error) {
    var errorCustom = new _APIError2.default('error occured while searching admin drivers ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    return reject(errorCustom);
  });
}

function getSelectedTripRoute(req, res, next) {
  var _req$query6 = (0, _extends3.default)({}, req.query),
      tripID = _req$query6.tripID;

  console.log("tripID", tripID);
  var returnObj = {
    success: false,
    message: '',
    data: { driverRoute: [] }
  };
  _trip2.default.findOneAsync({ _id: tripID, activeStatus: true }).then(function (result) {
    console.log("activate shuttle status", result);
    if (result) {
      // get trip driver's route and terminals
      _driverRouteTerminal2.default.findAsync({ driverId: result.driverId, isDeleted: false }).then(function (driverData) {
        if (driverData.length > 0) {
          returnObj.success = true;
          returnObj.data = { driverRoute: driverData };
          return res.send(returnObj);
        } else {
          returnObj.data = { driverRoute: [] };
          return res.send(returnObj);
        }
      }).catch(function (err) {
        console.log("occured while searching for the route", err);
        var err = new _APIError2.default('Error occured while searching for the route', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
        next(err);
      });
    } else {
      returnObj.message = 'No active trip found';
      return res.send(returnObj);
    }
  }).catch(function (e) {
    return next(e);
  });
}

function updateDriverDetails(req, res, next) {
  var updateUserObj = (0, _assign2.default)({}, req.body);
  _user2.default.findOneAsync({ _id: req.body.driverId }).then(function (userDoc) {
    var returnObj = {
      success: false,
      message: 'unable to find the object',
      data: null,
      meta: null
    };
    if (userDoc) {
      _countryCode2.default.findOneAsync({ dial_code: req.body.isdCode }).then(function (CountryCodeDetails) {

        userDoc.postalCode = updateUserObj.postalCode;
        userDoc.isdCode = updateUserObj.isdCode;
        userDoc.countryCode = CountryCodeDetails && CountryCodeDetails.code ? CountryCodeDetails.code : '', userDoc.name = updateUserObj.name;
        userDoc.fname = updateUserObj.fname ? updateUserObj.fname : userDoc.fname;
        userDoc.lname = updateUserObj.lname ? updateUserObj.lname : userDoc.lname;
        userDoc.phoneNo = updateUserObj.phoneNo ? updateUserObj.phoneNo : userDoc.phoneNo;
        userDoc.address = updateUserObj.address ? updateUserObj.address : userDoc.address;
        userDoc.city = updateUserObj.city ? updateUserObj.city : userDoc.city;
        userDoc.state = updateUserObj.state ? updateUserObj.state : userDoc.state;
        userDoc.country = updateUserObj.country ? updateUserObj.country : userDoc.country;
        userDoc.zone = updateUserObj.zone ? updateUserObj.zone : userDoc.zone;
        userDoc.locationId = updateUserObj.locationId ? updateUserObj.locationId : userDoc.locationId;
        userDoc.saveAsync().then(function (savedDoc) {
          if (savedDoc.password) {
            debug('inside password delete function');
            savedDoc = savedDoc.toObject();
            delete savedDoc.password;
          }
          _adminDriver2.default.findOneAndUpdateAsync({ userIdDriver: req.body.driverId }, { $set: { locationId: req.body.locationId } }, { new: true }).then(function (savedUser) {
            returnObj.success = true;
            returnObj.message = 'user document saved';
            returnObj.data = savedDoc;
            res.send(returnObj);
          }).error(function (e) {
            var err = new _APIError2.default('error in saving image ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
            next(err);
          });
          res.send(returnObj);
        }).error(function (e) {
          var err = new _APIError2.default('Error occured while updating the user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          next(err);
        });
      }).catch(function (e) {
        var err = new _APIError2.default('Error in creating user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    } else {
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function removeDriver(req, res, next) {
  _trip2.default.findOneAsync({ "driver._id": req.query.driverId, activeStatus: true }) // eslint-disable-line no-underscore-dangle
  .then(function (driverTrip) {
    var returnObj = {
      success: false,
      message: "Sorry, You cant delete driver, as driver is on trip",
      data: []
    };
    if (driverTrip) {
      return res.send(returnObj);
    }
    _user2.default.updateAsync({ _id: req.query.driverId }, { $set: { isDeleted: true } }) // eslint-disable-line no-underscore-dangle
    .then(function (savedDoc) {
      returnObj.success = true;
      returnObj.message = "Driver deleted successfully";
      return res.send(returnObj);
    }).error(function (e) {
      var err = new _APIError2.default('Error occured while Updating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while Updating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
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
  var updateUserObj = (0, _assign2.default)({}, req.body);
  _user2.default.findOneAsync({ _id: req.query.driverId }).then(function (userDoc) {
    var returnObj = {
      success: false,
      message: 'Unable to find the Driver',
      data: null,
      meta: null
    };
    if (userDoc) {
      returnObj.success = true;
      returnObj.message = 'Success';
      returnObj.data = userDoc;
      res.send(returnObj);
    } else {
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

// not in use after adding terminals functionality
function updateDriverRoute(req, res) {
  var id = req.query.id;
  var routeConfig = req.body.routeConfig;

  console.log('update route', req.body.routeConfig);
  _user2.default.findOneAndUpdateAsync({ _id: id }, { $set: { routesConfig: routeConfig } }, { new: true }).then(function (userUpdateData) {
    var returnObj = {
      success: false,
      message: 'Unable to update  driver , driver id provided didnt match ',
      data: null
    };
    returnObj.data = userUpdateData;
    if (returnObj.data) {
      returnObj.success = true;
      returnObj.message = 'user updated';
      res.send(returnObj);
    } else {
      res.send(returnObj);
    }
  }).catch(function (err) {
    next(err);
  });
}

function getDriverRoute(req, res, next) {
  var updateUserObj = (0, _assign2.default)({}, req.body);
  _user2.default.findOneAsync({ _id: req.query.driverId }).then(function (userDoc) {
    var returnObj = {
      success: false,
      message: 'Unable to find the driver route',
      data: null,
      meta: null
    };
    if (userDoc) {
      _driverRouteTerminal2.default.findAsync({ driverId: userDoc._id, isDeleted: false }).then(function (driverData) {
        if (driverData.length > 0) {
          returnObj.success = true;
          returnObj.message = 'Driver route found';
          returnObj.data = driverData;
          res.send(returnObj);
        } else {
          res.send(returnObj);
        }
      }).error(function (err) {
        var err = new _APIError2.default('Error occured while searching for the route ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    } else {
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function addRouteTerminals(req, res, next) {
  var driverId = req.query.driverId;
  var terminals = req.body.terminals;
  /**
   * 1. check if driver exists
   * 2. add terminal
   */

  console.log("I mahe reeeee", req.query);
  _user2.default.findOneAsync({
    userType: _userTypes.USER_TYPE_DRIVER, _id: driverId
  })
  // eslint-disable-next-line consistent-return
  .then(function (foundUser) {
    _driverRouteTerminal2.default.updateAsync({ driverId: req.query.id }, { $set: { isDeleted: true } }, { multi: true }) // eslint-disable-line no-underscore-dangle
    .then(function (routes) {
      console.log("routes", routes);
      var returnObj = {
        success: false,
        message: '',
        data: null
      };
      var addedTerminals = {};
      async.eachOf(terminals, function (terminal, key, cb) {
        var terminalObj = new _driverRouteTerminal2.default({
          isSelected: terminal.isSelected ? terminal.isSelected : false,
          driverId: terminal.driverId,
          adminId: terminal.adminId,
          loc: terminal.loc,
          address: terminal.address,
          name: terminal.name,
          // terminal(default) | waypoint | startTerminal | endTerminal
          type: terminal.type ? terminal.type : 'terminal'
        });

        terminalObj.saveAsync()
        // DriverRouteTerminalSchema.insertMany(terminals)
        .then(function (savedTerminal) {
          addedTerminals[key] = savedTerminal;
          cb();
        }).catch(function (e) {
          cb(err);
        });
      }, function (e) {
        if (e) {
          console.log("err adding terminals", _err9);
          var _err9 = new _APIError2.default('Error while Adding terminals ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          returnObj.success = false;
          returnObj.message = 'Error while adding terminals';
          console.log(_err9); // eslint-disable-line no-console
          res.send(returnObj);
        } else {
          returnObj.success = true;
          returnObj.message = 'Terminals added successfully';
          // console.log("saved terminals", addedTerminals);
          returnObj.data = addedTerminals;
          // create new admin driver accesscode
          res.send(returnObj);
        }
      });
    }).error(function (e) {
      var err = new _APIError2.default('Error occured while Updating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('Error while Searching the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    return next(err);
  });
}

function updateRouteTerminal(req, res, next) {
  var driverId = req.query.driverId;
  var _req$body = req.body,
      adminId = _req$body.adminId,
      terminal = _req$body.terminal;

  terminal.driverId = driverId;
  terminal.adminId = adminId;
  /**
   * 1. check if terminal exists
   * 2. update terminal
   */
  terminal.updatedAt = new Date().toISOString();
  _driverRouteTerminal2.default.findOneAndUpdateAsync({ _id: terminal._id, isDeleted: false }, { $set: terminal }, { new: true }).then(function (terminalUpdateData) {
    var returnObj = {
      success: false,
      message: ' Terminal not found ',
      data: null
    };
    returnObj.data = terminalUpdateData;
    if (returnObj.data) {
      returnObj.success = true;
      returnObj.message = 'Terminal updated';
      res.send(returnObj);
    } else {
      res.send(returnObj);
    }
  }).catch(function (err) {
    next(err);
  });
}

/* end: manage drivers by admin */

function requestNewAccessCode(req, res, next) {
  var userData = (0, _assign2.default)({}, req.body);
  _user2.default.findOneAsync({
    phoneNo: userData.phoneNo,
    userType: userData.userType
  })
  // eslint-disable-next-line consistent-return
  .then(function (foundUser) {
    var returnObj = {
      success: false,
      message: '',
      data: null
    };
    if (foundUser) {
      var accessCode = _util2.default.generateAccessCode();
      foundUser.accessCode = accessCode;

      foundUser.saveAsync().then(function (savedUser) {
        returnObj.success = true;
        returnObj.message = 'access code updated successfully and sms sent to the registered mobile no.';
        returnObj["accessCode"] = accessCode;
        console.log("saved user", savedUser);
        var smsText = 'Your CIDR access code is: ' + accessCode;
        (0, _smsApi.sendSms)(savedUser._id, smsText, function (err, data) {
          if (err) {
            console.log(err); // eslint-disable-line no-console
          } else {
            console.log(data); // eslint-disable-line no-console
          }
        });
        returnObj.data = savedUser;
        // create new admin driver accesscode
        var newAdminDriver = new _adminDriver2.default({
          userIdAdmin: req.body.adminId,
          userIdDriver: savedUser._id,
          accessCode: savedUser.password
        });
        newAdminDriver.saveAsync().then(function (savedDoc) {
          return console.log("admindriver saved", savedDoc);
        }).error(function () {
          return console.log("error saving admindriver");
        });
        res.send(returnObj);
      }).error(function (e) {
        var err = new _APIError2.default('Error while updating driver\'s access code ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        returnObj.success = false;
        returnObj.message = 'access code could not be updated';
        console.log(err); // eslint-disable-line no-console
        return next(returnObj);
      });
    } else {
      var _err10 = new _APIError2.default('No driver found', _httpStatus2.default.NOT_FOUND);
      return next(_err10);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error while Searching the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    return next(err);
  });
}

// Function to fetch available rides based on Filters
function getAdminRides(req, res /* , next */) {
  var _req$body2 = req.body,
      upcoming = _req$body2.upcoming,
      progress = _req$body2.progress,
      completed = _req$body2.completed,
      pageNo = _req$body2.pageNo;

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

function hashed(password) {
  return new _promise2.default(function (resolve, reject) {
    _bcrypt2.default.genSalt(10, function (err, salt) {
      if (err) {
        reject(err);
      }
      _bcrypt2.default.hash(password, salt, function (hashErr, hash) {
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
  var _req$query7 = req.query,
      pageNo = _req$query7.pageNo,
      userType = _req$query7.userType,
      _req$query7$limit = _req$query7.limit,
      limit = _req$query7$limit === undefined ? _env2.default.limit : _req$query7$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  debug('skip value: ' + req.query.pageNo);
  _adminLocation2.default.countAsync({ userIdAdmin: req.user._id, isDeleted: false })
  // eslint-disable-next-line
  .then(function (totalUserRecord) {
    var returnObj = {
      success: true,
      message: 'no of locations are zero', // `no of active drivers are ${returnObj.data.length}`;
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
      var _err11 = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(_err11);
    }
    _adminLocation2.default.find({ userIdAdmin: req.user._id, isDeleted: false }).limit(limit).skip(skip).then(function (userData) {
      returnObj.data = userData;
      returnObj.message = 'Locations found';
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      debug('no of records are ' + returnObj.meta.currNoOfRecord);
      return res.send(returnObj);
    }).catch(function (err) {
      res.send('Error', err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of users ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside getLocationsLists records');
    next(err);
  });
}

function getLocationById(req, res, next) {
  var locationID = req.query.locationID;

  var returnObj = {
    success: false,
    message: 'Location Id is not defined',
    data: null
  };
  if (locationID) {
    _adminLocation2.default.findByIdAsync(locationID).then(function (locationData) {
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
    }).error(function (e) {
      var err = new _APIError2.default('Error occured while findind the user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      next(err);
    });
  } else {
    res.send(returnObj);
  }
}

/* start: manage drivers by admin */

function addLocation(req, res, next) {
  var Locations = (0, _assign2.default)({}, req.body);
  var searchObj = {
    userIdAdmin: req.user._id,
    name: req.body.name,
    isDeleted: false
  };
  _adminLocation2.default.findOneAsync(searchObj)
  // eslint-disable-next-line consistent-return
  .then(function (foundUser) {
    var returnObj = {
      success: false,
      message: "",
      data: null
    };
    if (foundUser !== null) {
      var _err12 = new _APIError2.default("Name Already Exist", _httpStatus2.default.CONFLICT, true);
      return next(_err12);
    } else {
      var edges = req.body.radius ? req.body.radius * 3 : 32;
      var adminLocationObj = new _adminLocation2.default({
        "name": Locations.name ? Locations.name : "",
        "zone": Locations.zone,
        "userIdAdmin": req.user._id,
        "radius": req.body.radius ? req.body.radius : 0,
        "polygons": _util2.default.getCirclePolygons({ coordinates: Locations.zone.location, radius: req.body.radius, numberOfEdges: edges })
      });
      adminLocationObj.saveAsync().then(function (savedUser) {
        returnObj.success = true;
        returnObj.message = "Location created successfully";
        returnObj.data = savedUser;
        res.send(returnObj);
      }).error(function (e) {
        var err = new _APIError2.default('Error while adding new Address ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        returnObj.success = false;
        returnObj.message = "Address not created";
        console.log(err); // eslint-disable-line no-console
        return next(returnObj);
      });
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error while Searching the Address ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    return next(err);
  });
}

function updateLocation(req, res, next) {
  var Locations = (0, _assign2.default)({}, req.body);
  var searchObj = {
    _id: { $ne: req.body.locationID },
    userIdAdmin: req.user._id,
    name: Locations.name,
    isDeleted: false
  };
  _adminLocation2.default.findOneAsync(searchObj)
  // eslint-disable-next-line consistent-return
  .then(function (foundUser) {
    var returnObj = {
      success: false,
      message: "",
      data: null
    };
    if (foundUser !== null) {
      var _err13 = new _APIError2.default("Name Already Exist", _httpStatus2.default.CONFLICT, true);
      return next(_err13);
    } else {
      var edges = req.body.radius ? req.body.radius * 3 : 32;
      var objUpdate = {
        "userIdAdmin": req.user._id,
        "radius": req.body.radius ? req.body.radius : 0,
        name: req.body.name ? req.body.name : ""
      };
      if (Locations.zoneUpdate) {
        objUpdate.zone = Locations.zone;
        objUpdate.polygons = _util2.default.getCirclePolygons({ coordinates: Locations.zone.location, radius: req.body.radius, numberOfEdges: edges });
      } else {
        objUpdate.polygons = _util2.default.getCirclePolygons({ coordinates: Locations.currentAddress.location, radius: req.body.radius, numberOfEdges: edges });
      }

      _adminLocation2.default.findOneAndUpdateAsync({ _id: req.body.locationID }, { $set: objUpdate }).then(function (savedUser) {
        returnObj.success = true;
        returnObj.message = "Location updated successfully";
        returnObj.data = savedUser;
        res.send(returnObj);
      }).error(function (e) {
        var err = new _APIError2.default('Error while adding new Address ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        returnObj.success = false;
        returnObj.message = "Location not created";
        console.log(err); // eslint-disable-line no-console
        return next(returnObj);
      });
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error while Searching the Address ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    return next(err);
  });
}

function removeLocation(req, res, next) {
  _user2.default.findOneAsync({ adminId: req.user._id, locationId: req.query.locationID }, { _id: 1, locationId: 1 }).then(function (driverFound) {
    if (driverFound) {
      var returnObj = {
        success: false,
        message: "You can't deleted location, because drive is active in location",
        data: []
      };
      return res.send(returnObj);
    }
    _adminVehicle2.default.findOneAsync({ adminId: req.user._id, locationId: req.query.locationID }, { _id: 1, locationId: 1 }).then(function (vehicalFound) {
      if (vehicalFound) {
        var _returnObj3 = {
          success: false,
          message: "You can't deleted location, because vehicle is active in location",
          data: []
        };
        return res.send(_returnObj3);
      }
      _adminLocation2.default.updateAsync({ _id: req.query.locationID }, { $set: { isDeleted: true } }).then(function (deletedLocation) {
        var returnObj = {
          success: true,
          message: 'Location deleted successfully',
          data: deletedLocation
        };
        return res.send(returnObj);
      }).error(function (e) {
        return next(e);
      });
    }).error(function (e) {
      return next(e);
    });
  }).error(function (e) {
    return next(e);
  });
};

function viewRiders(req, res, next) {
  var _req$query8 = req.query,
      pageNo = _req$query8.pageNo,
      rider = _req$query8.rider,
      _req$query8$limit = _req$query8.limit,
      limit = _req$query8$limit === undefined ? _env2.default.limit : _req$query8$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  _tripRequest2.default.countAsync({ riderId: rider })
  // eslint-disable-next-line
  .then(function (totalUserRecord) {
    var returnObj = {
      success: true,
      message: 'no of ' + rider + 's are zero', // `no of active drivers are ${returnObj.data.length}`;
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
      var _err14 = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(_err14);
    }
    _tripRequest2.default.find({ riderId: rider }).limit(limit).skip(skip).populate({ path: 'riderId', select: 'name fname lname phoneNo isdCode' }).populate({ path: 'driverId', select: 'name fname lname phoneNo isdCode' }).sort({ _id: -1 }).then(function (userData) {
      returnObj.data = userData;
      returnObj.message = rider + 's found';
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      return res.send(returnObj);
    }).catch(function (err) {
      res.send('Error', err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of users ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside get rides records');
    next(err);
  });
}

function viewRating(req, res, next) {
  var _req$query9 = req.query,
      pageNo = _req$query9.pageNo,
      _id = _req$query9._id,
      _req$query9$limit = _req$query9.limit,
      limit = _req$query9$limit === undefined ? _env2.default.limit : _req$query9$limit,
      type = _req$query9.type;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  var andCondition = [];
  var obj = {};

  obj = {
    reviewToType: type
  };
  andCondition.push(obj);

  if (_id && _id != '' && type != "superAdmin") {
    obj = { reviewToId: _id };
    andCondition.push(obj);
  }
  _review2.default.countAsync({ $and: andCondition })
  // eslint-disable-next-line
  .then(function (totalUserRecord) {
    var returnObj = {
      success: true,
      message: 'no of vehicle are zero', // `no of active drivers are ${returnObj.data.length}`;
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
      var _err15 = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(_err15);
    }
    _review2.default.find({ $and: andCondition }).limit(limit).skip(skip).populate({ path: 'reviewerId', select: 'name email fname lname phoneNo isdCode' }).populate({ path: 'reviewToId', select: 'name email fname lname phoneNo isdCode tripType' }).sort({ _id: -1 }).then(function (userData) {
      returnObj.data = userData;
      returnObj.message = 'Reviews found';
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      return res.send(returnObj);
    }).catch(function (err) {
      return res.send('Error', err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of users ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside get rating records');
    next(err);
  });
}

function viewVehicles(req, res, next) {
  var _req$query10 = req.query,
      pageNo = _req$query10.pageNo,
      admin_id = _req$query10.admin_id,
      _req$query10$limit = _req$query10.limit,
      limit = _req$query10$limit === undefined ? _env2.default.limit : _req$query10$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  var condition = { userIdAdmin: admin_id };
  _adminVehicle2.default.countAsync(condition)
  // eslint-disable-next-line
  .then(function (totalUserRecord) {
    var returnObj = {
      success: true,
      message: 'no of Vehicle are zero', // `no of active drivers are ${returnObj.data.length}`;
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
      var _err16 = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(_err16);
    }
    _adminVehicle2.default.find(condition).limit(limit).skip(skip).sort({ _id: -1 }).then(function (userData) {
      returnObj.data = userData;
      returnObj.message = 'Vehicles found';
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      return res.send(returnObj);
    }).catch(function (err) {
      res.send('Error', err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of users ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside get vehicles records');
    next(err);
  });
}

function viewDrivers(req, res, next) {
  var _req$query11 = req.query,
      pageNo = _req$query11.pageNo,
      admin_id = _req$query11.admin_id,
      _req$query11$limit = _req$query11.limit,
      limit = _req$query11$limit === undefined ? _env2.default.limit : _req$query11$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  var condition = { adminId: admin_id, isDeleted: false };
  _user2.default.countAsync(condition)
  // eslint-disable-next-line
  .then(function (totalUserRecord) {
    var returnObj = {
      success: true,
      message: 'no of Vehicle are zero', // `no of active drivers are ${returnObj.data.length}`;
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
      var _err17 = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(_err17);
    }
    _user2.default.find(condition).limit(limit).skip(skip).sort({ _id: -1 }).populate({ path: 'userIdDriver', select: 'name fname lname email isdCode phoneNo address city state country' }).then(function (userData) {
      returnObj.data = userData;
      returnObj.message = 'Vehicles found';
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      return res.send(returnObj);
    }).catch(function (err) {
      return res.send('Error', err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of users ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside get vehicles records');
    next(err);
  });
}

// { email: req.body.email, phoneNo: req.body.phoneNo }
function createAdmin(req, res, next) {
  var userData = (0, _assign2.default)({}, req.body);
  var orCondition = {
    $or: [{ email: req.body.email.toLowerCase(), userType: _userTypes.USER_TYPE_ADMIN, isDeleted: false }, { phoneNo: req.body.phoneNo, userType: _userTypes.USER_TYPE_ADMIN, isDeleted: false }]
  };
  _user2.default.findOneAsync(orCondition)
  // eslint-disable-next-line consistent-return
  .then(function (foundUser) {
    var returnObj = {
      success: false,
      message: '',
      data: null
    };
    if (foundUser) {
      if (foundUser && foundUser.email == req.body.email.toLowerCase() && foundUser.phoneNo == req.body.phoneNo) {
        var msg = "User already registered with same email address and mobile number";
        var _err18 = new _APIError2.default(msg, _httpStatus2.default.CONFLICT, true);
        return next(_err18);
      } else if (foundUser.email == req.body.email.toLowerCase()) {
        var msg = "User already registered with same email address";
        var _err19 = new _APIError2.default(msg, _httpStatus2.default.CONFLICT, true);
        return next(_err19);
      } else {
        var msg = "User already registered with same mobile number";
        var _err20 = new _APIError2.default(msg, _httpStatus2.default.CONFLICT, true);
        return next(_err20);
      }
    }

    _countryCode2.default.findOneAsync({ dial_code: req.body.isdCode }).then(function (CountryCodeDetails) {
      var accessCode = _util2.default.generateAccessCode();
      var reservationCode = _util2.default.generateUniueReservationCode();
      var newPassword = randomstring.generate({
        length: 6
      });
      getPassword(_global.MASTER_PASSWORD).then(function (masterPassWord) {
        var userObj = new _user2.default({
          accessCode: accessCode,
          email: userData.email.toLowerCase(),
          phoneNo: userData.phoneNo,
          reservationCode: reservationCode,
          password: newPassword,
          masterPassword: masterPassWord,
          userType: userData.userType ? userData.userType : _userTypes.USER_TYPE_ADMIN,
          name: userData.name,
          isdCode: req.body.isdCode,
          mobileVerified: true,
          countryCode: CountryCodeDetails && CountryCodeDetails.code ? CountryCodeDetails.code : '',
          loginStatus: false,
          tripType: req.body.tripType ? req.body.tripType : TRIP_CIRCULAR_STATIC,
          adminTripTypes: req.body.tripType,
          profileUrl: userData.profileUrl ? _util2.default.getUploadsAvtarsUrl(req) + "/" + userData.profileUrl : _util2.default.getUploadsAvtarsUrl(req) + "/provider_default.png",
          address: userData.address
        });
        userObj.saveAsync().then(function (savedUser) {
          returnObj.success = true;
          returnObj.message = 'Admin created successfully';
          returnObj.data = savedUser;
          var userObj = (0, _assign2.default)(savedUser, { newpass: newPassword, email: savedUser.email });
          (0, _emailApi2.default)(savedUser._id, userObj, 'createAdmin'); //eslint-disable-line
          res.send(returnObj);
        }).error(function (e) {
          var err = new _APIError2.default('Error while Creating new User ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          returnObj.success = false;
          returnObj.message = 'Admin not created';
          console.log(err); // eslint-disable-line no-console
          return next(returnObj);
        });
      }).catch(function (e) {
        var err = new _APIError2.default('Error in creating user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    }).catch(function (e) {
      var err = new _APIError2.default('Error in creating user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('Error while Searching the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    return next(err);
  });
}

function getAdminDetails(req, res, next) {
  _user2.default.findOneAsync({ _id: req.query.adminId }).then(function (userDoc) {
    var returnObj = {
      success: false,
      message: 'Unable to find the Driver',
      data: null,
      meta: null
    };
    if (userDoc) {
      returnObj.success = true;
      returnObj.message = 'Success';
      returnObj.data = userDoc;
      res.send(returnObj);
    } else {
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function updateAdmin(req, res, next) {
  var updateUserObj = (0, _assign2.default)({}, req.body);
  _user2.default.findOneAsync({ _id: req.body.adminId }).then(function (userDoc) {
    var returnObj = {
      success: false,
      message: 'unable to find the object',
      data: null,
      meta: null
    };
    if (userDoc) {
      _user2.default.findOneAsync({ phoneNo: req.body.phoneNo }).then(function (userDetails) {
        if (userDetails && userDetails._id != req.body.adminId) {
          var msg = "User already registered with same mobile number";
          returnObj.message = msg;
          return res.send(returnObj);
        }
        _countryCode2.default.findOneAsync({ dial_code: req.body.isdCode }).then(function (CountryCodeDetails) {
          userDoc.isdCode = updateUserObj.isdCode;
          userDoc.countryCode = CountryCodeDetails && CountryCodeDetails.code ? CountryCodeDetails.code : '', userDoc.name = updateUserObj.name;
          userDoc.address = updateUserObj.address ? updateUserObj.address : userDoc.address;
          userDoc.phoneNo = updateUserObj.phoneNo ? updateUserObj.phoneNo : userDoc.phoneNo;
          userDoc.email = updateUserObj.email.toLowerCase() ? updateUserObj.email.toLowerCase() : userDoc.email;
          userDoc.profileUrl = updateUserObj.profileUrl ? _util2.default.getUploadsAvtarsUrl(req) + "/" + updateUserObj.profileUrl : userDoc.profileUrl;

          userDoc.saveAsync().then(function (savedDoc) {
            returnObj.success = true;
            returnObj.message = 'Admin document saved';
            returnObj.data = savedDoc;
            res.send(returnObj);
          }).error(function (e) {
            var err = new _APIError2.default('Error occured while updating the user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
            next(err);
          });
        }).catch(function (e) {
          var err = new _APIError2.default('Error in creating user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          next(err);
        });
      }).catch(function (e) {
        var err = new _APIError2.default('Error in creating user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    } else {
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function updateStatus(req, res, next) {
  _user2.default.updateAsync({ _id: req.body._id }, { $set: { isActive: req.body.status } }) // eslint-disable-line no-underscore-dangle
  .then(function (savedDoc) {
    var returnObj = {
      success: true,
      message: 'Admin status changed successfully',
      data: savedDoc
    };
    res.send(returnObj);
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while Updating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}
function adminRemove(req, res, next) {
  _user2.default.updateAsync({ _id: req.body._id }, { $set: { isDeleted: req.body.status } }) // eslint-disable-line no-underscore-dangle
  .then(function (savedDoc) {
    var returnObj = {
      success: true,
      message: 'Admin has been removed successfully',
      data: savedDoc
    };
    res.send(returnObj);
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while Updating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function getCount(req, res, next) {
  _user2.default.countAsync({ userType: "admin", isDeleted: false }) // eslint-disable-line no-underscore-dangle
  .then(function (adminCount) {
    _user2.default.countAsync({ userType: "driver", isDeleted: false }) // eslint-disable-line no-underscore-dangle
    .then(function (driverCount) {
      _user2.default.countAsync({ userType: "rider", isDeleted: false }) // eslint-disable-line no-underscore-dangle
      .then(function (riderCount) {
        _adminVehicle2.default.countAsync({ isDeleted: false }) // eslint-disable-line no-underscore-dangle
        .then(function (shuttleCount) {
          var returnObj = {
            success: true,
            message: 'Dashboard Count',
            data: {
              admin: adminCount,
              driver: driverCount,
              shuttle: shuttleCount,
              riderCount: riderCount
            }
          };
          res.send(returnObj);
        }).error(function (e) {
          var err = new _APIError2.default('Error occured while Updating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          next(err);
        });
      }).error(function (e) {
        var err = new _APIError2.default('Error occured while Updating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    }).error(function (e) {
      var err = new _APIError2.default('Error occured while Updating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while Updating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function getDriverList(req, res, next) {

  var condition = { adminId: req.user._id, isDeleted: false };
  _user2.default.find(condition, { name: 1 }).then(function (userData) {
    var returnObj = {
      success: true,
      message: 'Driver found',
      data: userData
    };
    return res.send(returnObj);
  }).catch(function (e) {
    var err = new _APIError2.default('Error occured while Updating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function getReports(req, res, next) {

  var strDate = new Date(req.body.fromdate);
  var stoDate = new Date(req.body.todate);

  var startDate = moment(strDate);
  startDate.utc();
  startDate.hours(0);
  startDate.minutes(0);
  startDate.seconds(0);

  // console.log("macthdate",startDate)

  var stopDate = moment(stoDate);
  stopDate.utc();
  stopDate.hours(23);
  stopDate.minutes(59);
  stopDate.seconds(59);

  var andCondition = [{
    requestUpdatedTime: {
      $lte: new Date(stopDate),
      $gte: new Date(startDate)
    }, tripRequestStatus: _tripRequestStatuses.TRIP_REQUEST_COMPLETED, adminId: req.user._id
  }];
  if (req.body.driverId) {
    var obj = {
      driverId: _mongoose2.default.Types.ObjectId(req.body.driverId)
    };
    andCondition.push(obj);
  }

  var pipeline = [{
    "$match": {
      $and: andCondition
    }
  }, { "$group": { _id: { "$dateToString": { "format": "%Y-%m-%d", "date": "$requestUpdatedTime" } },
      "count": { "$sum": 1 } } }, { $sort: { "_id": 1 } }];

  _tripRequest2.default.aggregate(pipeline).then(function (requestData) {
    var returnObj = {
      success: true,
      message: 'Report found',
      data: requestData
    };
    return res.send(returnObj);
  }).catch(function (e) {
    var err = new _APIError2.default('Error occured while Updating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function getReportToExcel(req, res, next) {

  var strDate = new Date(req.body.fromdate);
  var stoDate = new Date(req.body.todate);

  var startDate = moment(strDate);
  startDate.utc();
  startDate.hours(0);
  startDate.minutes(0);
  startDate.seconds(0);

  // console.log("macthdate",startDate)

  var stopDate = moment(stoDate);
  stopDate.utc();
  stopDate.hours(23);
  stopDate.minutes(59);
  stopDate.seconds(59);

  var andCondition = [{
    requestUpdatedTime: {
      $lte: new Date(stopDate),
      $gte: new Date(startDate)
    }, tripRequestStatus: _tripRequestStatuses.TRIP_REQUEST_COMPLETED, adminId: req.user._id
  }];
  if (req.body.driverId) {
    var obj = {
      driverId: _mongoose2.default.Types.ObjectId(req.body.driverId)
    };
    andCondition.push(obj);
  }

  var pipeline = [{
    "$match": {
      $and: andCondition
    }
  }];

  _tripRequest2.default.aggregate(pipeline).then(function (requestData) {
    var newArray = [];
    var obj = {};
    requestData = _underscore2.default.groupBy(requestData, 'driverId');
    for (var key in requestData) {
      newArray.push({ 'riderDetails': requestData[key], 'driverName': requestData[key][0].driverId });
    }
    var options = { path: "riderDetails.riderId" };
    _user2.default.populate(newArray, options, function (er, riderData) {
      var options = { path: "driverName" };
      _user2.default.populate(riderData, options, function (er, finalData) {
        // console.log("finalDatafinalDatafinalData",finalData)
        getRidersForDrivers(0, finalData, function (finaRes) {
          var returnObj = {
            success: true,
            message: 'Report found',
            data: finaRes
          };
          return res.send(returnObj);
        });
      });
    });
    // res.send(requestData);
  }).catch(function (e) {
    var err = new _APIError2.default('Error occured while Updating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function getRidersForDrivers(i, result, callback) {
  if (i < result.length) {
    var no = 0;

    // console.log("result00000000000000000000000",result)
    result[i].riderDetails.forEach(function (riders) {
      no = no + 1;
      riders['riderName'] = riders.riderId.name;
      riders['date'] = moment(riders.requestUpdatedTime).format("YYYY-MM-DD HH:mm:ss");
      riders['sourceAddress'] = riders.srcLoc.address;
      riders['destAddress'] = riders.destLoc.address;
      riders['waitingTime'] = moment(riders.waitingTime).format("h:mm");
    });
    result[i]['driverName'] = result[i]['driverName'].name;
    result[i].riderDetails = _underscore2.default.map(result[i].riderDetails, function (o) {
      return _underscore2.default.pick(o, ['riderName', 'date', 'sourceAddress', 'destAddress', 'waitingTime']);
    });
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
  _tripRequest2.default.aggregate([{ "$match": {
      adminId: _mongoose2.default.Types.ObjectId(req.body._id),
      tripRequestStatus: _tripRequestStatuses.TRIP_REQUEST_COMPLETED
    }
  }, {
    $lookup: {
      from: "users",
      localField: "riderId",
      foreignField: "_id",
      as: "riderDetails"
    }
  }, {
    $unwind: "$riderDetails" //, includeArrayIndex: "arrayIndex" }
  }, {
    $group: {
      _id: {
        "_id": "$riderDetails._id",
        "name": "$riderDetails.name"
        //         "riderDetails": {
        //             "$push": "$riderDetails"
        //         }
      } }
  }]).then(function (findRiders) {
    var returnObj = {
      success: true,
      message: 'Rider found',
      data: findRiders
    };
    return res.send(returnObj);
  }).catch(function (e) {
    var err = new _APIError2.default('Error occured while Updating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function getAvgWaitTime(req, res, next) {
  // var strDate = moment(req.body.fromdate).add(1, 'days');
  // var stoDate = moment(req.body.todate).add(1, 'days');

  var strDate = new Date(req.body.fromdate);
  var stoDate = new Date(req.body.todate);

  var startDate = moment(strDate);
  startDate.utc();
  startDate.hours(0);
  startDate.minutes(0);
  startDate.seconds(0);

  // console.log("macthdate",startDate)

  var stopDate = moment(stoDate);
  stopDate.utc();
  stopDate.hours(23);
  stopDate.minutes(59);
  stopDate.seconds(59);
  // console.log("after",startDate)
  // console.log("after",stopDate)
  var andCondition = [{
    requestUpdatedTime: {
      $lte: new Date(stopDate),
      $gte: new Date(startDate)
    }, tripRequestStatus: _tripRequestStatuses.TRIP_REQUEST_COMPLETED, adminId: req.user._id
  }];

  _tripRequest2.default.aggregate([{ "$match": {
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
        "requestUpdatedTime": { $dateToString: { format: "%Y-%m-%d", date: "$requestUpdatedTime" } }
        // "name": "$riderInfo.name",
        // "waitingTime":"$waitingTime",
      },
      total: { $sum: { $divide: ["$waitingTime", 60000] } },
      count: { "$sum": 1 },
      waitingTimes: { $push: { $divide: ["$waitingTime", 60000] } //"$waitingTime"}
      } }
  }, {
    $sort: { "_id.requestUpdatedTime": 1 }
  }]).then(function (requestData) {
    var returnObj = {
      success: true,
      message: 'Report found',
      data: requestData
    };
    return res.send(returnObj);
  }).catch(function (e) {
    var err = new _APIError2.default('Error occured while Updating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
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
  startDate.hours(0);
  startDate.minutes(0);
  startDate.seconds(0);

  // console.log("macthdate",startDate)

  var stopDate = moment(stoDate);
  stopDate.utc();
  stopDate.hours(23);
  stopDate.minutes(59);
  stopDate.seconds(59);

  console.log("after", new Date(stopDate));
  console.log("after", new Date(startDate));
  var andCondition = [{
    requestTime: {
      $lte: new Date(stopDate),
      $gte: new Date(startDate) //, tripRequestStatus: TRIP_REQUEST_ACCEPTED,
    }, adminId: req.user._id
  }];

  _tripRequest2.default.aggregate([{ "$match": {
      $and: andCondition
    }
  }, {
    $project: {
      hour: { $hour: "$requestTime" },
      minutes: { $minute: "$requestTime" },
      requestTime: "$requestTime",
      requestTimes: { $dateToString: { format: "%Y-%m-%d", date: "$requestTime" } }
    }
  }, {
    $group: {
      _id: {
        "requestTime": { $dateToString: { format: "%Y-%m-%d", date: "$requestTime" } }
        // "riderId":"$riderId",
        // "hour":{ $hour: "$requestTime" },
        // "minutes": { $minute: "$requestTime" },
      },
      // total: { $sum: { $divide: [ "$waitingTime", 60000 ] }},
      count: { "$sum": 1 },
      // waitingTimes: {$push: { $divide: [ "$waitingTime", 60000 ] }}
      "hour": { $push: { $hour: "$requestTime" } }
    }
  }, {
    $sort: {
      "_id.requestTime": 1,
      "_id.hour": 1
    }
  }]).then(function (requestData) {
    // let newArray = [];
    // let obj = {};
    // requestData = _.groupBy(requestData, 'hour');
    // for (var key in requestData) {
    //   newArray.push({ 'riderDetails': requestData[key] })
    // }
    var returnObj = {
      success: true,
      message: 'Report found',
      data: requestData
    };
    return res.send(returnObj);
  }).catch(function (e) {
    var err = new _APIError2.default('Error occured while Updating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function updatePartner(req, res, next) {
  var updateUserObj = (0, _assign2.default)({}, req.body);
  _user2.default.findOneAsync({ _id: req.body.adminId }).then(function (userDoc) {
    var returnObj = {
      success: false,
      message: 'unable to find the object',
      data: null,
      meta: null
    };
    if (userDoc) {
      var orCondition = {
        $or: [{ email: req.body.email.toLowerCase(), userType: _userTypes.USER_TYPE_ADMIN, isDeleted: false }, { email: req.body.email.toLowerCase(), userType: _userTypes.USER_TYPE_RIDER, isDeleted: false }, { phoneNo: req.body.phoneNo, userType: _userTypes.USER_TYPE_ADMIN, isDeleted: false }, { phoneNo: req.body.phoneNo, userType: _userTypes.USER_TYPE_RIDER, isDeleted: false }]
      };
      _user2.default.findOneAsync(orCondition).then(function (userDetails) {
        if (userDetails && userDetails._id != req.body.adminId) {
          var msg = "User already registered with same email and phone number.";

          if (userDetails.phoneNo === req.body.phoneNo) {
            var msg = "User already registered with same mobile number";
          }
          if (userDetails.email === req.body.email) {
            var msg = "User already registered with same email";
          }
          returnObj.message = msg;
          return res.send(returnObj);
        }
        _countryCode2.default.findOneAsync({ dial_code: req.body.isdCode }).then(function (CountryCodeDetails) {
          var newPhone = false;
          userDoc.name = updateUserObj.name;
          userDoc.adminTripTypes = [req.body.tripType], userDoc.tripType = req.body.tripType, userDoc.address = updateUserObj.address;
          userDoc.profileUrl = updateUserObj.profileUrl ? _util2.default.getUploadsAvtarsUrl(req) + "/" + updateUserObj.profileUrl : userDoc.profileUrl;
          userDoc.email = updateUserObj.email.toLowerCase() ? updateUserObj.email.toLowerCase() : userDoc.email;
          if (userDoc.phoneNo != req.body.phoneNo || userDoc.isdCode != req.body.isdCode) {
            var otpValue = _util2.default.generateVerificationCode();
            var phoneDetails = {
              isdCode: req.body.isdCode,
              countryCode: CountryCodeDetails && CountryCodeDetails.code ? CountryCodeDetails.code : '',
              phoneNo: req.body.phoneNo,
              country: CountryCodeDetails && CountryCodeDetails.name ? CountryCodeDetails.name : ''
            };
            userDoc.updatePhoneDetails = phoneDetails;
            userDoc.otp = otpValue;
            newPhone = true;
          }

          userDoc.saveAsync().then(function (savedDoc) {
            _user2.default.findAsync({ adminId: savedDoc._id, userType: _userTypes.USER_TYPE_DRIVER }, { locationId: 1, adminId: 1 }).then(function (driverObj) {
              driverObj.map(function (driverDet) {
                var driverupdate = {
                  tripType: req.body.tripType,
                  adminTripTypes: [req.body.tripType],
                  route: {
                    locationId: driverDet.locationId,
                    adminId: driverDet.adminId,
                    terminals: []
                  }
                };
                console.log("                    ");
                console.log(" driverupdate ", driverupdate);
                console.log("                    ");
                _user2.default.findOneAndUpdateAsync({ _id: driverDet._id }, { $set: driverupdate }).then(function (updateUserObj) {}).error(function (e) {
                  var err = new _APIError2.default('Something went wrong while updating driver routes ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
                  next(err);
                });
              });
            }).error(function (e) {
              var err = new _APIError2.default('Something went wrong while updating driver routes ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
              next(err);
            });

            if (!newPhone) {
              returnObj.code = 200;
              returnObj.success = true;
              returnObj.message = 'Account information has been updated';
              returnObj.data = savedDoc;
              return res.send(returnObj);
            } else {
              (0, _smsApi.sendSmsUpdateMobile)(savedDoc.updatePhoneDetails, 'Your verification code is ' + savedDoc.otp, function (err /* , data */) {
                if (err) {
                  returnObj.code = 202;
                  returnObj.success = false;
                  returnObj.message = 'Something went wrong while updating mobile number, Rest information has been updated.';
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
          }).error(function (e) {
            var err = new _APIError2.default('Error occured while updating the user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
            next(err);
          });
        }).catch(function (e) {
          var err = new _APIError2.default('Error in creating user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          next(err);
        });
      }).catch(function (e) {
        var err = new _APIError2.default('Error in creating user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    } else {
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

// Generate Reservation Code
function generateReservationCode(req, res, next) {
  var adminId = req.user._id;
  var newReservationCode = _util2.default.generateUniueReservationCode();
  var returnObj = {
    success: false,
    message: 'unable to update reservation code , user id provided did not match ',
    data: null
  };
  returnObj.data = [];
  _user2.default.findOneAsync({ _id: adminId, reservationCode: newReservationCode }, { _id: 1, reservationCode: 1 }).then(function (code) {
    if (code) {
      returnObj.success = false;
      returnObj.message = 'Reservation Code already exist with this code, Please regenerate again.';
      return res.send(returnObj);
    }
    _user2.default.findOneAndUpdateAsync({ _id: adminId }, { $set: { reservationCode: newReservationCode } }).then(function (userUpdateData) {
      if (returnObj.data) {
        returnObj.success = 'true';
        returnObj.message = 'Reservation Code updated';
        returnObj.data = userUpdateData;
      }
      return res.send(returnObj);
    }).catch(function (err) {
      res.send('Error', err);
    });
  }).catch(function (err) {
    res.send('Error', err);
  });
}

// Get Reservation Code
function getReservationCode(req, res, next) {
  var condition = { _id: req.user._id, isDeleted: false };

  _user2.default.findOneAsync(condition, { reservationCode: 1 }).then(function (userData) {
    var returnObj = {
      success: true,
      message: 'Reservation Code found',
      data: userData
    };
    return res.send(returnObj);
  }).catch(function (e) {
    var err = new _APIError2.default('Error occured while get Reservation Code ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

// Share Reservation Code/Add entry in reservationSchema
function shareReservationCode(req, res, next) {
  console.log("req.user", (0, _stringify2.default)(req.user));
  var adminId = req.user._id;
  var saveObj = {
    'userIdAdmin': adminId,
    'reservationCode': req.body.data.reservationCode,
    'name': req.body.data.name,
    'email': req.body.data.email,
    'company_name': req.user.name
  };
  var codeSchemaObj = new _reservationCode2.default(saveObj);
  codeSchemaObj.save().then(function (codeData) {
    var returnObj = {
      success: false,
      message: 'Unable to share reservation code, please try after sometime',
      data: null
    };

    returnObj.data = codeData;
    if (returnObj.data) {
      (0, _emailApi2.default)(codeData._id, codeData, 'reservationCode');
      returnObj.success = 'true';
      returnObj.message = 'Reservation code shared';
      return res.send(returnObj);
    }
  }).catch(function (err) {
    res.send('Error', err);
  });
}

// send On Demand Message
function sendOnDemandMessage(req, res, next) {
  var twoDays = new Date(moment().subtract(2, 'day'));
  var condition = {
    adminId: req.user._id,
    requestUpdatedTime: { $gte: twoDays }
  };
  _tripRequest2.default.distinct("riderId", condition).then(function (codeData) {
    _user2.default.find({ isDeleted: false, isActive: true, '_id': { $in: codeData } }, { loggedInDevices: 1 }).then(function (userData) {
      var pushData = {
        payload: { success: true, message: req.body.message, data: [] },
        body: req.body.message,
        title: 'Circullar Drive'
      };
      userData.map(function (userDetails) {
        if (userDetails && userDetails.loggedInDevices && Array.isArray(userDetails.loggedInDevices) && userDetails.loggedInDevices.length) {
          PushNotification.sendNotificationByUserIdAsync(userDetails._id, pushData);
        }
      });
      var returnObj = {
        success: false,
        message: 'Unable to send message, please try after sometime',
        data: null
      };
      returnObj.data = codeData;
      if (returnObj.data) {
        // sendEmail(codeData._id, codeData, 'reservationCode');
        returnObj.success = 'true';
        returnObj.message = 'Message has been send successfully';
        return res.send(returnObj);
      }
    }).catch(function (err) {
      return res.send('Error', err);
    });
  }).catch(function (err) {
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
  var _this = this;

  // console.log("req.body", req.body);
  sendSmsToMultipleMobile(req).then(function (result) {
    var succMsg = [];
    var failMsg = [];
    var msgTosend = 'Message has been';
    result.map(function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(msgTo, index) {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (msgTo.sent == 1) {
                  succMsg.push(msgTo.phonNo);
                } else {
                  failMsg.push(msgTo.phonNo);
                }

              case 1:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, _this);
      }));

      return function (_x2, _x3) {
        return _ref.apply(this, arguments);
      };
    }());
    var successExpload = succMsg.toString();
    var failExpload = failMsg.toString();
    console.log("MSDD SENDD", successExpload);
    console.log("failMsg SENDD", failExpload);
    if (successExpload && failExpload) {
      var msgTosend = 'Message has been send successfully to ' + successExpload + ' failed to send ' + failExpload;
    } else if (successExpload && !failExpload) {
      var msgTosend = 'Message has been send successfully to ' + successExpload;
    } else {
      var msgTosend = 'Message has been failed to send ' + failExpload;
    }

    var returnObj = {
      success: true,
      message: msgTosend,
      data: null
    };
    console.log("returnObj", returnObj);
    return res.send(returnObj);
  });
}

var sendSmsToMultipleMobile = function sendSmsToMultipleMobile(req) {
  return new _promise2.default(function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(resolve, reject) {
      var driver;
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.prev = 0;
              _context3.next = 3;
              return _promise2.default.all(req.body.itemRows.map(function () {
                var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(smsTo, index) {
                  var phoneDetails, smsText, result;
                  return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          phoneDetails = {
                            isdCode: smsTo.isdCode,
                            phoneNo: smsTo.phoneNo
                          };
                          smsText = req.body.message;

                          smsText = smsText.replace(/(\r\n|\n|\r)/gm, "");

                          _context2.next = 5;
                          return sendSmsToMultipleMobileNumbers(phoneDetails, smsText);

                        case 5:
                          result = _context2.sent;
                          return _context2.abrupt('return', _promise2.default.resolve(result));

                        case 7:
                        case 'end':
                          return _context2.stop();
                      }
                    }
                  }, _callee2, undefined);
                }));

                return function (_x6, _x7) {
                  return _ref3.apply(this, arguments);
                };
              }()));

            case 3:
              driver = _context3.sent;
              return _context3.abrupt('return', resolve(driver));

            case 7:
              _context3.prev = 7;
              _context3.t0 = _context3['catch'](0);
              return _context3.abrupt('return', reject(_context3.t0));

            case 10:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, undefined, [[0, 7]]);
    }));

    return function (_x4, _x5) {
      return _ref2.apply(this, arguments);
    };
  }());
};

var sendSmsToMultipleMobileNumbers = function sendSmsToMultipleMobileNumbers(phoneDetails, smsText) {
  return new _promise2.default(function () {
    var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(resolve, reject) {
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.prev = 0;
              _context4.next = 3;
              return (0, _smsApi.sendSmsUpdateMobile)(phoneDetails, smsText, function (err, data) {
                if (!err) {
                  var sccs = {
                    sent: 1,
                    phonNo: '+' + phoneDetails.isdCode + phoneDetails.phoneNo
                  };
                  return resolve(sccs);
                } else {
                  var fils = {
                    sent: 0,
                    phonNo: '+' + phoneDetails.isdCode + phoneDetails.phoneNo
                  };
                  return resolve(fils);
                }
              });

            case 3:
              _context4.next = 8;
              break;

            case 5:
              _context4.prev = 5;
              _context4.t0 = _context4['catch'](0);
              return _context4.abrupt('return', reject(_context4.t0));

            case 8:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, undefined, [[0, 5]]);
    }));

    return function (_x8, _x9) {
      return _ref4.apply(this, arguments);
    };
  }());
};

// Get Reservation Code
function getCustomMessage(req, res, next) {
  var condition = { _id: req.user._id, isDeleted: false };

  _user2.default.findOneAsync(condition, { custom_message: 1 }).then(function (userData) {
    var returnObj = {
      success: true,
      message: 'Custom Message Code found',
      data: userData
    };
    return res.send(returnObj);
  }).catch(function (e) {
    var err = new _APIError2.default('Error occured while get Reservation Code ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

// Get sendCustomMessage Code
function updateCustomMessage(req, res, next) {
  var adminId = req.user._id;
  var custom_message = req.body.message && req.body.message != '' ? req.body.message : "";
  _user2.default.findOneAndUpdateAsync({ _id: adminId }, { $set: { custom_message: custom_message } }).then(function (userUpdateData) {
    var returnObj = {
      success: true,
      message: 'Custom message has been updated successfully',
      data: userUpdateData
    };
    res.send(returnObj);
  }).catch(function (err) {
    res.send('Error', err);
  });
}

function getAdminCustomTemplate(req, res, next) {
  var responseObj = { success: false, message: "", data: null };
  templateService.getCustomEmailTemplate(req.user._id).then(function (renderedHtml) {
    console.log("renderedhtml", renderedHtml);
    responseObj.data = renderedHtml;
    responseObj.success = true;
    res.send(responseObj);
  }).catch(function (err) {
    return next(err);
  });
}

function checkCurrentPassword(req, res, next) {
  _user2.default.findOneAsync({ _id: req.user._id }, '+password')
  // eslint-disable-next-line consistent-return
  .then(function (user) {
    if (!user) {
      var _err21 = new _APIError2.default('User not found with this email', _httpStatus2.default.NOT_FOUND, true);
      return next(_err21);
    } else {
      user.comparePassword(req.body.password, function (passwordError, isMatch) {
        var returnObj = {};
        if (passwordError || !isMatch) {
          returnObj.success = false;
          returnObj.message = 'Password not matched';
        } else {
          returnObj.success = true;
          returnObj.message = 'Password matched';
        }
        return res.send(returnObj);
      });
    }
  }).catch(function (err123) {
    var err = new _APIError2.default('error in getting current user details ' + err123, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function changePasswordAdmin(req, res, next) {

  _user2.default.findOneAsync({ _id: req.user._id }, '+password')
  // eslint-disable-next-line consistent-return
  .then(function (user) {
    var returnObj = {
      success: false,
      message: '',
      data: null
    };
    if (!user) {
      var _err22 = new _APIError2.default('User not found with the given email id', _httpStatus2.default.NOT_FOUND);
      return next(_err22);
    } else {
      // eslint-disable-next-line
      user.password = req.body.password;
      user.saveAsync().then(function (savedUser) {
        returnObj.success = true;
        returnObj.message = 'Password changed successfully';
        returnObj.data = savedUser;
        return res.send(returnObj);
      }).error(function (e) {
        var err = new _APIError2.default('Error while changing password ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        returnObj.success = false;
        returnObj.message = 'Password not changed';
        console.log(err); // eslint-disable-line no-console
        return next(returnObj);
      });
    }
  }).error(function (e) {
    var err = new _APIError2.default('error while finding user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

// drivers list
function available_drivers(req, res) {
  var adminId = _mongoose2.default.Types.ObjectId(req.body._id).toString();
  _user2.default.find({ adminId: adminId, userType: 'driver', isDeleted: false }).then(function (foundDrives) {
    console.log(foundDrives);
    res.send({ success: true, message: 'Drivers list', data: foundDrives });
  }).catch(function (err) {
    res.send({ success: false, message: 'Something went wrong' });
  });
}

function getSettings(req, res, next) {
  _user2.default.findOneAsync({ _id: req.user._id }, { settings: 1 })
  // eslint-disable-next-line consistent-return
  .then(function (user) {
    var returnObj = {
      success: false,
      message: '',
      data: null
    };
    if (!user) {
      var _err23 = new _APIError2.default('User not found with the given email id', _httpStatus2.default.NOT_FOUND);
      return next(_err23);
    } else {
      returnObj.success = true;
      returnObj.message = 'Settings found';
      returnObj.data = user.settings;
      return res.send(returnObj);
    }
  }).catch(function (e) {
    var err = new _APIError2.default('error while finding user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function updateSettings(req, res, next) {

  var newTime = req.body.slots;
  _user2.default.findOneAsync({ _id: req.user._id }, '+password')
  // eslint-disable-next-line consistent-return
  .then(function (user) {
    var returnObj = {
      success: false,
      message: '',
      data: null
    };
    if (!user) {
      var _err24 = new _APIError2.default('User not found with the given email id', _httpStatus2.default.NOT_FOUND);
      return next(_err24);
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
      user.saveAsync().then(function (savedUser) {
        // const newDayTime = savedUser.settings.dayTimings.monday.slots;
        var newDayTime = [];
        newDayTime.push(newTime);
        // console.log(newDayTime);
        // console.log(savedUser);
        _user2.default.findOneAndUpdateAsync({ _id: req.user._id }, { $set: { "settings.dayTimings.monday.slots": newDayTime } }, { new: true }) //eslint-disable-line
        .then(function (updateUser) {
          returnObj.success = true;
          returnObj.message = 'Updated  successfully';
          returnObj.data = updateUser;
          return res.send(returnObj);
        }).catch(function (e) {
          var err = new _APIError2.default('Error while updating settings', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
          returnObj.success = false;
          returnObj.message = 'Something went wrong';
          console.log(err); // eslint-disable-line no-console
          return next(returnObj);
        });
      }).error(function (e) {
        var err = new _APIError2.default('Error while updating settings', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
        returnObj.success = false;
        returnObj.message = 'Something went wrong';
        console.log(err); // eslint-disable-line no-console
        return next(returnObj);
      });
    }
  }).error(function (e) {
    var err = new _APIError2.default('error while finding user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}
function addUpdateHoliday(req, res, next) {
  var holidayId = _mongoose2.default.Types.ObjectId(req.body.holidays._id).toString();
  if (req.body.holidays._id) {
    _user2.default.findOneAsync({ _id: req.user._id, "settings.holidays._id": { $eq: holidayId } }).then(function (user) {
      console.log(user);
      var holidays = user.settings.holidays;

      var checkdate = false;
      var indexOfHoliday = -1;
      if (holidays.length !== 0) {
        // eslint-disable-next-line
        holidays.map(function (obj, index) {
          //eslint-disable-line
          if (obj._id == holidayId) {
            obj.date = req.body.holidays.date, obj.title = req.body.holidays.title;
            // console.log("id match",obj._id)
          }
        });
        // console.log("final holidays", holidays)
      }
      _user2.default.findOneAndUpdateAsync({ _id: req.user._id }, { $set: { "settings.holidays": holidays } }, { new: true }) //eslint-disable-line
      .then(function (updateUser) {
        // const holidayDetails = updateUser.settings.holidays;
        res.send({ data: updateUser, message: 'Holiday Successfully update' });
      }).catch(function (err) {
        res.send({ data: err, message: 'Unable to update Holiday' });
      });
    }).error(function (e) {
      var err = new _APIError2.default('error while finding user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      next(err);
    });
    //New Hoiliday creatiton
  } else if (!req.body.holidays._id) {

    _user2.default.findOneAsync({ _id: req.user._id, "settings.holidays.date": { $ne: req.body.holidays.date } })
    // eslint-disable-next-line consistent-return
    .then(function (user) {
      console.log(user);
      var returnObj = {
        success: false,
        message: 'Holiday Already Present',
        data: null
      };
      if (!user) {
        res.send(returnObj);
      } else {
        // eslint-disable-next-line

        // user.settings.holidays=push(req.body.holiday);
        var newHoliday = req.body.holidays;
        var newHolidayDetails = user.settings.holidays;
        newHolidayDetails.push(newHoliday);
        _user2.default.findOneAndUpdateAsync({ _id: req.user._id }, { $set: { "settings.holidays": newHolidayDetails, "$sort": { "settings.holidays.date": 1 } } }, { new: true }) //eslint-disable-line
        .then(function (updateUser) {
          //console.log("===========after update=======================",updateUser)
          returnObj.success = true;
          returnObj.message = 'Updated  successfully';
          returnObj.data = updateUser;
          res.send(returnObj);
        }).error(function (e) {
          var err = new _APIError2.default('Error while updating settings', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
          returnObj.success = false;
          returnObj.message = 'Something went wrong';
          console.log(err); // eslint-disable-line no-console
          res.send(returnObj);
        });
      }
    }).error(function (e) {
      var err = new _APIError2.default('error while finding user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }
}

function removeHoliday(req, res) {
  // UserSchema.findOneAsync({ _id: req.user._id }, { 'settings': { 'holidays': { $eq: { _id: req.body.holidays._id } } } })
  _user2.default.findOneAsync({ _id: req.body.adminId, isDeleted: false }).then(function (user) {
    var removeHolidayId = _mongoose2.default.Types.ObjectId(req.body.holidays._id).toString();
    var holidays = user.settings.holidays;

    console.log("holidays     >:", holidays);
    var indexOfHoliday = -1;
    if (holidays.length !== 0) {
      // eslint-disable-next-line
      console.log("length", holidays.length);
      holidays.map(function (obj, index) {
        //eslint-disable-line
        console.log("dbId", obj._id);
        console.log("req-Id", removeHolidayId);
        if (obj._id == removeHolidayId) {

          indexOfHoliday = index;
          console.log("match:", indexOfHoliday);
        }
      });
    }
    if (indexOfHoliday === -1) {
      console.log("indexOfHoliday", indexOfHoliday);
      res.send({ message: 'Holiday Not Found' });
    } else {
      holidays.splice(indexOfHoliday, 1);
      console.log("final list", holidays);
      _user2.default.findOneAndUpdateAsync({ _id: req.body.adminId }, { $set: { "settings.holidays": holidays } }, { new: true }) //eslint-disable-line
      .then(function (updateUser) {
        var holidayDetails = updateUser.settings.holidays;
        res.send({ data: holidayDetails, message: 'Holiday Successfully Removed' });
      }).catch(function (err) {
        res.send({ data: err, message: 'Unable to delete Holiday' });
      });
    }
  }).catch(function (err) {
    console.log("ERROR 2>", err);
    res.send({ success: false, message: '', data: null });
  });
}

// Get Reservation Code
function getNotifyMessage(req, res, next) {
  var condition = { userIdAdmin: req.user._id };

  _adminNotifyMessage2.default.findOneAsync(condition, { message: 1 }).then(function (userData) {
    var returnObj = {
      success: true,
      message: 'Notify message found',
      data: userData
    };
    return res.send(returnObj);
  }).catch(function (e) {
    var err = new _APIError2.default('Error occured while get Reservation Code ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}
function saveToNotifyMessage(req, res, next) {
  console.log("req adding saveToNotifyMessage", req.body);
  var AdminNotifyMessageObj = new _adminNotifyMessage2.default({
    userIdAdmin: req.user._id,
    message: req.body.message
  });
  AdminNotifyMessageObj.saveAsync().then(function (adminNotifyMessage) {
    console.log("req adding saveToNotifyMessage", adminNotifyMessage);
    var returnObj = {
      success: true,
      message: "Notify message has been added successfully.",
      data: adminNotifyMessage
    };
    return res.send(returnObj);
  }).error(function (e) {
    console.log("error adding saveToNotifyMessage", e);
    var err = new _APIError2.default('Error occured while saving Notify Message ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function updateToNotifyMessage(req, res, next) {
  _adminNotifyMessage2.default.updateAsync({ _id: req.body._id }, { $set: { message: req.body.message } }) // eslint-disable-line no-underscore-dangle
  .then(function (savedDoc) {
    var returnObj = {
      success: true,
      message: 'Notify message updated successfully',
      data: savedDoc
    };
    return res.send(returnObj);
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while Updating Notify message ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function getPassword(password) {
  return new _promise2.default(function (resolve, reject) {
    _bcrypt2.default.genSalt(10, function (err, salt) {
      if (err) {
        reject(err);
      }
      // eslint-disable-next-line
      _bcrypt2.default.hash(password, salt, function (hashErr, hash) {
        //eslint-disable-line
        if (hashErr) {
          reject(hashErr);
        }
        resolve(hash);
      });
    });
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
  getRidesUptoSevenDays: getRidesUptoSevenDays,
  requestNewAccessCode: requestNewAccessCode,
  getAllDrivers: getAllDrivers,
  updateDriverDetails: updateDriverDetails,
  removeDriver: removeDriver,
  getDriverDetails: getDriverDetails,
  updateDriverRoute: updateDriverRoute,
  //addRouteTerminals AND updateRouteTerminal not IN USE after restructure of route as separarte entity
  updateRouteTerminal: updateRouteTerminal,
  addRouteTerminals: addRouteTerminals,
  getDriverRoute: getDriverRoute,
  getLocationsLists: getLocationsLists,
  getLocationById: getLocationById,
  addLocation: addLocation,
  updateLocation: updateLocation,
  removeLocation: removeLocation,
  viewRiders: viewRiders,
  viewRating: viewRating,
  viewVehicles: viewVehicles,
  viewDrivers: viewDrivers,
  getAdminCustomTemplate: getAdminCustomTemplate,
  createAdmin: createAdmin, getAdminDetails: getAdminDetails, updateAdmin: updateAdmin, updateStatus: updateStatus, adminRemove: adminRemove, updatePartner: updatePartner, //Admin Functions
  generateReservationCode: generateReservationCode, getReservationCode: getReservationCode, shareReservationCode: shareReservationCode, //Reservation Code  Function Functions
  getAllDriversMobile: getAllDriversMobile,
  getAllRidesMobile: getAllRidesMobile,
  getAllActiveTrips: getAllActiveTrips,
  getSelectedTripRoute: getSelectedTripRoute,
  getCount: getCount,
  getDriverList: getDriverList,
  getReports: getReports,
  sendOnDemandMessage: sendOnDemandMessage, sendToCustomerMessage: sendToCustomerMessage, saveToNotifyMessage: saveToNotifyMessage, updateToNotifyMessage: updateToNotifyMessage, getNotifyMessage: getNotifyMessage, getCustomMessage: getCustomMessage, updateCustomMessage: updateCustomMessage, //Reservation Code  Function Functions
  checkCurrentPassword: checkCurrentPassword, changePasswordAdmin: changePasswordAdmin, // Chnage password Partner
  available_drivers: available_drivers,
  getSettings: getSettings,
  updateSettings: updateSettings,
  addUpdateHoliday: addUpdateHoliday,
  removeHoliday: removeHoliday,
  getReportToExcel: getReportToExcel,
  getRiderList: getRiderList,
  getAvgWaitTime: getAvgWaitTime,
  getPeakNLowTime: getPeakNLowTime
};
module.exports = exports.default;
//# sourceMappingURL=admin-user.js.map
