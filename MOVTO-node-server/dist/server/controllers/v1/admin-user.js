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

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var getDistanceByOriginDestination = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(req, res, next) {
    var src, des, returnObj, response;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            src = req.query.src.split(' ').join('%20');
            des = req.query.des.split(' ').join('%20');
            returnObj = { success: false, message: '', data: {} };
            _context.prev = 3;
            _context.next = 6;
            return _axios2.default.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
              params: {
                origins: src,
                destinations: des,
                units: 'imperial',
                mode: 'driving',
                key: _global.GOOGLE_API_KEY
              }
            });

          case 6:
            response = _context.sent;


            returnObj.success = true;
            returnObj.message = 'Route created successfully';
            returnObj.data = response.data;
            res.send(returnObj);
            _context.next = 17;
            break;

          case 13:
            _context.prev = 13;
            _context.t0 = _context['catch'](3);

            res.send(returnObj);
            console.log(_context.t0);

          case 17:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[3, 13]]);
  }));

  return function getDistanceByOriginDestination(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _APIError = require('../../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _util = require('../../helpers/util');

var _util2 = _interopRequireDefault(_util);

var _env = require('../../../config/env');

var _env2 = _interopRequireDefault(_env);

var _user = require('../../models/user');

var _user2 = _interopRequireDefault(_user);

var _route = require('../../models/route');

var _route2 = _interopRequireDefault(_route);

var _adminDriver = require('../../models/adminDriver');

var _adminDriver2 = _interopRequireDefault(_adminDriver);

var _trip = require('../../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _adminLocation = require('../../models/adminLocation');

var _adminLocation2 = _interopRequireDefault(_adminLocation);

var _tripRequest = require('../../models/tripRequest');

var _tripRequest2 = _interopRequireDefault(_tripRequest);

var _smsApi = require('../../service/smsApi');

var _shared = require('../../service/shared');

var Shared = _interopRequireWildcard(_shared);

var _pushNotification = require('../../service/pushNotification');

var PushNotification = _interopRequireWildcard(_pushNotification);

var _userTypes = require('../../constants/user-types');

var _countryCode = require('../../models/countryCode');

var _countryCode2 = _interopRequireDefault(_countryCode);

var _emailApi = require('../../service/emailApi');

var _emailApi2 = _interopRequireDefault(_emailApi);

var _socketStore = require('../../service/socket-store');

var _socketStore2 = _interopRequireDefault(_socketStore);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _tripRequestStatuses = require('../../constants/trip-request-statuses');

var TRIP_REQUEST_STATUS = _interopRequireWildcard(_tripRequestStatuses);

var _tripType = require('../../constants/trip-type');

var _global = require('../../constants/global');

var _adminVehicle = require('../../models/adminVehicle');

var _adminVehicle2 = _interopRequireDefault(_adminVehicle);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ObjectId = require('mongoose').Types.ObjectId;
var randomstring = require("randomstring");
//const curl = new (require( 'curl-request' ))();
var debug = require('debug')('MGD-API: admin-user');
var querystring = require('querystring');

// var easyimg = require('easyimage');
var fs = require('fs');
var formidable = require('formidable');

function getDriverRoute(req, res, next) {
  _user2.default.findOneAsync({
    _id: req.query.driverId
  }).then(function (userDoc) {
    var returnObj = {
      success: false,
      message: 'Unable to find the driver route',
      data: null,
      meta: null
    };
    if (userDoc) {
      returnObj.success = true;
      returnObj.message = 'Driver route found';
      returnObj.data = userDoc.route.terminals;
      res.send(returnObj);
    } else {
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function getRouteById(req, res, next) {
  console.log("getRouteById", req.query);
  _route2.default.findOneAsync({
    _id: req.query.Id
  }).then(function (RouteDoc) {
    var returnObj = {
      success: false,
      message: 'Unable to find route',
      data: null,
      meta: null
    };
    if (RouteDoc) {
      returnObj.success = true;
      returnObj.message = 'Admin route found';
      returnObj.data = RouteDoc;
      res.send(returnObj);
    } else {
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function getSelectedTripRoute(req, res, next) {
  var _req$query = (0, _extends3.default)({}, req.query),
      tripID = _req$query.tripID;

  console.log("tripID?????????????????????????????????????????????", tripID);
  var returnObj = {
    success: false,
    message: '',
    data: {
      driverRoute: []
    }
  };
  _trip2.default.findOneAsync({
    _id: tripID,
    activeStatus: true
  }).then(function (result) {
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
  }).catch(function (e) {
    return next(e);
  });
}

/* start: manage drivers by admin */

function createNewUser(req, res, next) {
  var userData = (0, _assign2.default)({}, req.body);
  var host = req.get('host');
  var url = req.protocol + '://' + req.get('host');
  _user2.default.findOneAsync({
    $or: [{
      email: req.body.email.toLowerCase(),
      userType: req.body.userType,
      isDeleted: false
    }, {
      userType: req.body.userType,
      phoneNo: req.body.phoneNo,
      isDeleted: false
    }]
  })
  // eslint-disable-next-line consistent-return
  .then(function (foundUser) {
    var returnObj = {
      success: false,
      message: '',
      data: null
    };
    if (foundUser !== null) {
      var err = new _APIError2.default('Email Id/phone No Already Exist', _httpStatus2.default.CONFLICT, true);
      return next(err);
    }
    _countryCode2.default.findOneAsync({
      dial_code: req.body.isdCode
    }).then(function (CountryCodeDetails) {
      var accessCode = _util2.default.generateAccessCode();
      var newPassword = randomstring.generate({
        length: 6,
        charset: 'alphanumeric'
      });
      // get location details and set default gpsLoc for driver
      _adminLocation2.default.findOneAsync({ _id: req.body.locationId }).then(function (locDetails) {
        if (locDetails) {
          var userObj = new _user2.default({
            zone: userData.zone ? userData.zone : '',
            email: userData.email.toLowerCase(),
            phoneNo: userData.phoneNo,
            profileUrl: userData.profileUrl ? _util2.default.getUploadsAvtarsUrl(req) + "/" + userData.profileUrl : _util2.default.getUploadsAvtarsUrl(req) + "/default_user.png",
            password: newPassword,
            accessCode: accessCode,
            userType: userData.userType,
            tripType: userData.tripType,
            fname: userData.fname,
            lname: userData.lname,
            name: userData.fname && userData.lname && userData.fname + ' ' + userData.lname || userData.fname,
            dob: userData.dob,
            bloodGroup: userData.bloodGroup ? userData.bloodGroup : null,
            gpsLoc: locDetails.zone.location,
            isdCode: req.body.isdCode,
            locationId: req.body.locationId,
            adminId: req.user._id,

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
            mapCoordinates: [0, 0]
          });
          if (userData.routeId && userData.tripType != _tripType.TRIP_DYNAMIC) {
            _route2.default.findOneAsync({
              _id: userData.routeId
            }).then(function (route) {
              userObj["route"] = route;
              userObj.saveAsync().then(function (savedUser) {
                returnObj.success = true;
                returnObj.message = 'User created successfully';
                returnObj["accessCode"] = accessCode;
                // console.log("saved user", savedUser);
                returnObj.data = savedUser;
                // create new admin driver accesscode
                var userObj = (0, _assign2.default)(savedUser, {
                  newpass: newPassword,
                  accessCode: accessCode
                });
                (0, _emailApi2.default)(savedUser._id, userObj, 'createDriver');
                return res.send(returnObj);
              }).error(function (e) {
                console.log("ERROR", e);
                var err = new _APIError2.default('Error while Creating new User ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
                returnObj.success = false;
                returnObj.message = 'user not created';
                //console.log(err); // eslint-disable-line no-console
                return next(returnObj);
              });
            }).catch(function (error) {
              var err = new _APIError2.default('Error while Creating new User ' + error, _httpStatus2.default.INTERNAL_SERVER_ERROR);
              returnObj.success = false;
              returnObj.message = 'user not created';
              //console.log(err); // eslint-disable-line no-console
              return next(returnObj);
            });
          } else {
            var Obj = {
              locationId: req.body.locationId,
              adminId: req.user._id,
              terminals: []
            };
            userObj["route"] = Obj;
            userObj.saveAsync().then(function (savedUser) {
              returnObj.success = true;
              returnObj.message = 'User created successfully';
              returnObj["accessCode"] = accessCode;
              // console.log("saved user", savedUser);
              returnObj.data = savedUser;
              // create new admin driver accesscode
              var userObj = (0, _assign2.default)(savedUser, {
                newpass: newPassword,
                accessCode: accessCode
              });
              (0, _emailApi2.default)(savedUser._id, userObj, 'createDriver');
              res.send(returnObj);
            }).error(function (e) {
              console.log("                                     ");
              console.log("I Ma HEREE");
              console.log("******************************END*****************************");
              var err = new _APIError2.default('Error while Creating new User ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
              returnObj.success = false;
              returnObj.message = 'user not created';
              //console.log(err); // eslint-disable-line no-console
              return next(returnObj);
            });
          }
        } else {
          var _error = new _APIError2.default('Location not found', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
          next(_error);
        }
      }).catch(function (err) {
        var error = new _APIError2.default('Something went wrong', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
        next(error);
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
  var obj = {
    isDeleted: false,
    adminId: req.user._id,
    userType: _userTypes.USER_TYPE_DRIVER
  };

  andCondition.push(obj);

  if (req.query && req.query.locationId != '') {
    obj = {
      locationId: req.query.locationId
    };
    andCondition.push(obj);
  }
  var _req$query2 = req.query,
      pageNo = _req$query2.pageNo,
      userType = _req$query2.userType,
      _req$query2$limit = _req$query2.limit,
      limit = _req$query2$limit === undefined ? _env2.default.limit : _req$query2$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  debug('skip value: ' + req.query.pageNo);
  console.log("and condition", andCondition);
  _user2.default.countAsync({
    $and: andCondition
  })
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
      var err = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(err);
    }
    _user2.default.find({
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
    }).limit(parseInt(limit)).skip(skip).then(function (userData) {
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
  var obj = {
    isDeleted: false,
    adminId: req.user._id,
    userType: _userTypes.USER_TYPE_DRIVER
  };
  andCondition.push(obj);

  if (req.query && req.query.locationId && req.query.locationId != '') {
    obj = {
      locationId: req.query.locationId
    };
    andCondition.push(obj);
  }
  var _req$query3 = req.query,
      pageNo = _req$query3.pageNo,
      _req$query3$limit = _req$query3.limit,
      limit = _req$query3$limit === undefined ? _env2.default.limit : _req$query3$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  debug('skip value: ' + req.query.pageNo);
  _user2.default.countAsync({
    $and: andCondition
  })
  // eslint-disable-next-line
  .then(function (totalDriversRecord) {
    var returnObj = {
      success: true,
      message: 'no of drivers are zero', // `no of active vehicles are ${returnObj.data.length}`;
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
      var err = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(err);
    }
    console.log('andcondition', andCondition);
    _user2.default.find({
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
    }).limit(parseInt(limit)).skip(skip).then(function (driversData) {
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
    var returnObj = {
      activeDrivers: 0
    };
    // get all shuttleIds
    var andCondition = [];
    var obj = {
      activeStatus: true,
      "driver.adminId": _mongoose2.default.Types.ObjectId(req.user._id)
    };
    andCondition.push(obj);

    if (req.query && req.query.locationId && req.query.locationId != '') {
      obj = {
        "driver.locationId": req.query.locationId
      };
      andCondition.push(obj);
    }
    _trip2.default.countAsync({
      $and: andCondition
    }).then(function (activeTripsCount) {
      returnObj.activeDrivers = activeTripsCount;
      return resolve(returnObj);
    }).catch(function (error) {
      return reject(error);
    });
    // get all active shuttles
  });
}

function getAllActiveTrips(req, res, next) {
  var _req$query4 = req.query,
      pageNo = _req$query4.pageNo,
      _req$query4$limit = _req$query4.limit,
      limit = _req$query4$limit === undefined ? _env2.default.limit : _req$query4$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  _user2.default.aggregate([{
    $match: {
      adminId: _mongoose2.default.Types.ObjectId(req.user._id)
    }
  }, {
    $group: {
      _id: 'adminId',
      ids: {
        $addToSet: "$_id"
      }
    }
  }]).then(function (result) {
    console.log('result getAllActiveTrips', result);
    var returnObj = {
      success: false,
      message: 'No drivers found',
      data: []
    };
    if (result && result.length) {
      if (result[0].ids && result[0].ids.length) {
        var tripQuery = {
          "driver._id": {
            $in: result[0].ids
          },
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
            var err = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
            return next(err);
          }

          var projectedFields = {
            activeStatus: 1,
            gpsLoc: 1,
            visitedTerminal: 1,
            'driver.email': 1,
            'driver.activeStatus': 1,
            'driver.profileUrl': 1,
            'driver.name': 1,
            'driver._id': 1
          };

          _trip2.default.find(tripQuery, projectedFields).limit(parseInt(limit)).skip(skip).populate([{
            path: 'shuttleId',
            select: 'name imageUrl activeStatus'
          }]).then(function (activeTrips) {
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

function updateDriverDetails(req, res, next) {
  var updateUserObj = (0, _assign2.default)({}, req.body);
  _trip2.default.findOneAsync({
    "driver._id": updateUserObj.driverId,
    "activeStatus": true
  }).then(function (TripDoc) {
    if (TripDoc) {
      var returnObj = {
        success: false,
        message: 'Drive is active on trip, So you cant update his details now.',
        data: null,
        meta: null
      };
      return res.send(returnObj);
    }
    _user2.default.findOneAsync({
      _id: req.body.driverId
    }).then(function (userDoc) {
      var returnObj = {
        success: false,
        message: 'unable to find the object',
        data: null,
        meta: null
      };
      if (userDoc) {
        _countryCode2.default.findOneAsync({
          dial_code: req.body.isdCode
        }).then(function (CountryCodeDetails) {
          _adminLocation2.default.findOneAsync({ _id: updateUserObj.locationId }).then(function (locDetails) {
            if (locDetails) {
              userDoc.gpsLoc = locDetails.zone.location;
              userDoc.tripType = updateUserObj.tripType;
              userDoc.route = updateUserObj.route;
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
              userDoc.profileUrl = updateUserObj.profileUrl ? _util2.default.getUploadsAvtarsUrl(req) + "/" + updateUserObj.profileUrl : userDoc.profileUrl;
              if (updateUserObj.routeId && updateUserObj.tripType != _tripType.TRIP_DYNAMIC) {
                _route2.default.findOneAsync({
                  _id: updateUserObj.routeId
                }).then(function (route) {
                  userDoc["route"] = route;
                  userDoc.saveAsync().then(function (savedDoc) {
                    if (savedDoc.password) {
                      debug('inside password delete function');
                      savedDoc = savedDoc.toObject();
                      delete savedDoc.password;
                    }
                    returnObj.success = true;
                    returnObj.message = 'user document updated successfully';
                    returnObj.data = savedDoc;
                    res.send(returnObj);
                  }).error(function (e) {
                    var err = new _APIError2.default('Error occured while updating the user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
                    next(err);
                  });
                }).catch(function (error) {
                  var err = new _APIError2.default('Error while Creating new User ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
                  returnObj.success = false;
                  returnObj.message = 'user document not updated,Please try again later.';
                  console.log(err); // eslint-disable-line no-console
                  return next(returnObj);
                });
              } else {
                var Obj = {
                  locationId: req.body.locationId,
                  adminId: req.user._id,
                  terminals: []
                };
                userDoc["route"] = Obj;
                userDoc.saveAsync().then(function (savedDoc) {
                  if (savedDoc.password) {
                    debug('inside password delete function');
                    savedDoc = savedDoc.toObject();
                    delete savedDoc.password;
                  }
                  returnObj.success = true;
                  returnObj.message = 'user document updated successfully';
                  returnObj.data = savedDoc;
                  res.send(returnObj);
                }).error(function (e) {
                  var err = new _APIError2.default('Error occured while updating the user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
                  next(err);
                });
              }
            } else {
              var _error2 = new _APIError2.default('Location not found', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
              next(_error2);
            }
          }).catch(function (err) {
            var error = new _APIError2.default('Something went wrong', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
            next(error);
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
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function removeDriver(req, res, next) {
  _user2.default.findOneAndUpdateAsync({
    _id: req.query.driverId
  }, {
    isDeleted: true
  }, {
    new: true
  }).then(function (deletedUser) {
    var returnObj = {
      success: true,
      message: 'user deleted successfully',
      data: deletedUser
    };
    res.send(returnObj);
  }).error(function (e) {
    return next(e);
  });
};

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
        res.send(returnObj);
      }).error(function (e) {
        var err = new _APIError2.default('Error while updating driver\'s access code ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        returnObj.success = false;
        returnObj.message = 'access code could not be updated';
        console.log(err); // eslint-disable-line no-console
        return next(returnObj);
      });
    } else {
      var err = new _APIError2.default('No driver found', _httpStatus2.default.NOT_FOUND);
      return next(err);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error while Searching the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    return next(err);
  });
}

function viewDrivers(req, res, next) {
  var _req$query5 = req.query,
      pageNo = _req$query5.pageNo,
      admin_id = _req$query5.admin_id,
      _req$query5$limit = _req$query5.limit,
      limit = _req$query5$limit === undefined ? _env2.default.limit : _req$query5$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  var condition = {
    adminId: admin_id,
    userType: _userTypes.USER_TYPE_DRIVER,
    isDeleted: false
  };
  _user2.default.countAsync(condition)
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
      var err = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(err);
    }
    _user2.default.find(condition, {
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
    }).limit(limit).skip(skip).sort({
      _id: -1
    }).then(function (userData) {
      returnObj.data = userData;
      returnObj.message = 'Drivers found';
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

/**********************************************************
 * manage routes
 **********************************************************/

function addRoute(req, res, next) {
  var routeData = (0, _assign2.default)({}, req.body);
  var returnObj = {
    success: false,
    message: '',
    data: {}
  };

  var terminals = [];
  if (routeData.terminals && routeData.terminals.length) {
    Shared.fromTerminalToTerminalTimeAsync(routeData.terminals).then(function (terminalsWithTime) {
      console.log(">>>>>>>>>>>>>>>", terminalsWithTime);
      terminals = terminalsWithTime.map(function (terminal, index) {
        return {
          timeToNextTerminal: terminal.timeToNextTerminal,
          sequenceNo: index + 1,
          _id: new _mongoose2.default.Types.ObjectId(),
          loc: terminal.loc,
          address: terminal.address,
          name: terminal.name,
          type: terminal.type,
          adminId: terminal.adminId
        };
      });

      _route2.default.findOneAsync({ name: routeData.name }).then(function (result) {
        if (result) {
          returnObj.message = "Name already taken";
          return res.send(returnObj);
        } else {
          var routeObj = new _route2.default({
            locationId: routeData.locationId,
            name: routeData.name,
            address: routeData.address,
            terminals: terminals || [],
            adminId: req.user._id
          });
          routeObj.saveAsync().then(function (savedRoute) {
            returnObj.success = true;
            returnObj.message = 'Route created successfully';
            returnObj.data = savedRoute;
            res.send(returnObj);
          }).error(function (e) {
            var err = new _APIError2.default('Error while Creating route', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
            returnObj.success = false;
            returnObj.message = 'Something went wrong';
            console.log(err); // eslint-disable-line no-console
            return next(returnObj);
          });
        }
      }).catch(function (error) {
        var err = new _APIError2.default('Error while Creating route', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
        returnObj.success = false;
        returnObj.message = 'Something went wrong';
        console.log(err); // eslint-disable-line no-console
        return next(returnObj);
      });
    }).catch(function (err) {
      next(err);
    });
  } else {
    returnObj.message = "Invalid route terminals";
    res.send(returnObj);
  }
}

function updateRoute(req, res, next) {
  var adminId = req.user._id.adminId;
  var _req$body = req.body,
      locationId = _req$body.locationId,
      address = _req$body.address;

  /**
   * 1. check if terminal exists
   * 2. update terminal
   */

  var updateObj = {
    locationId: locationId,
    address: address,
    updatedAt: new Date().toISOString()
  };
  _route2.default.findOneAndUpdateAsync({
    adminId: adminId,
    isDeleted: false
  }, {
    $set: updateObj
  }, {
    new: true
  }).then(function (routeUpdateData) {
    var returnObj = {
      success: false,
      message: ' Route not found ',
      data: {}
    };
    returnObj.data = routeUpdateData;
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

function removeRoute(req, res, next) {
  console.log("removeRoute ", req.query);
  var routeId = req.query.routeId;


  var returnObj = {
    success: false,
    message: '',
    data: {}
  };

  var query = {
    _id: ObjectId(routeId)
  };

  var updateObj = {
    $set: {
      isDeleted: true
    }
  };
  _route2.default.findOneAndUpdateAsync(query, updateObj, {
    new: true
  }).then(function (routeUpdateData) {
    console.log("routeUpdateData ", routeUpdateData);
    returnObj.data = routeUpdateData;
    if (returnObj.data) {
      returnObj.success = true;
      returnObj.message = 'Route deleted successfully';
      return res.send(returnObj);
    } else {
      return res.send(returnObj);
    }
  }).catch(function (err) {
    next(err);
  });
}

function addTerminal(req, res, next) {
  var routeId = req.query.routeId;
  var terminal = req.body.terminal;


  var terminalObj = {
    _id: new _mongoose2.default.Types.ObjectId(),
    loc: terminal.loc,
    address: terminal.address,
    name: terminal.name,
    type: terminal.type
  };

  var returnObj = {
    success: false,
    message: '',
    data: {}
  };

  var updateObj = {
    $addToSet: {
      terminals: terminalObj
    }
  };

  _route2.default.findOneAndUpdateAsync({
    _id: routeId,
    adminId: adminId,
    isDeleted: false
  }, {
    updateObj: updateObj
  }, {
    new: true
  }).then(function (routeUpdateData) {
    returnObj.data = routeUpdateData;
    if (returnObj.data) {
      returnObj.success = true;
      returnObj.message = 'Terminal added successfully';
      res.send(returnObj);
    } else {
      res.send(returnObj);
    }
  }).catch(function (err) {
    next(err);
  });
}

function updateTerminal(req, res, next) {
  var routeId = req.query.routeId;
  var terminal = req.body.terminal;


  var terminalObj = {
    _id: terminal._id,
    loc: terminal.loc,
    address: terminal.address,
    name: terminal.name,
    type: terminal.type
  };

  var returnObj = {
    success: false,
    message: '',
    data: {}
  };

  var query = {
    _id: routeId,
    adminId: adminId,
    isDeleted: false,
    'terminal._id': terminal._id
  };

  var updateObj = {
    $set: {
      'terminals.$': terminalObj
    }
  };

  _route2.default.findOneAndUpdateAsync({
    query: query
  }, {
    updateObj: updateObj
  }, {
    new: true
  }).then(function (routeUpdateData) {
    returnObj.data = routeUpdateData;
    if (returnObj.data) {
      returnObj.success = true;
      returnObj.message = 'Terminal updated successfully';
      res.send(returnObj);
    } else {
      res.send(returnObj);
    }
  }).catch(function (err) {
    next(err);
  });
}

function removeTerminal(req, res, next) {
  var routeId = req.query.routeId;
  var terminal = req.body.terminal;


  var terminalObj = {
    _id: terminal._id
  };

  var returnObj = {
    success: false,
    message: '',
    data: {}
  };

  var query = {
    _id: routeId,
    adminId: adminId,
    isDeleted: false,
    'terminal._id': terminal._id
  };

  var updateObj = {
    $set: {
      'terminals.$.isDeleted': true
    }
  };

  _route2.default.findOneAndUpdateAsync({
    query: query
  }, {
    updateObj: updateObj
  }, {
    new: true
  }).then(function (routeUpdateData) {
    returnObj.data = routeUpdateData;
    if (returnObj.data) {
      returnObj.success = true;
      returnObj.message = 'Terminal deleted successfully';
      res.send(returnObj);
    } else {
      res.send(returnObj);
    }
  }).catch(function (err) {
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
    };
    andCondition.push(obj);
  }
  var _req$query6 = req.query,
      pageNo = _req$query6.pageNo,
      _req$query6$limit = _req$query6.limit,
      limit = _req$query6$limit === undefined ? _env2.default.limit : _req$query6$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  debug('skip value: ' + req.query.pageNo);
  _route2.default.countAsync({
    $and: andCondition
  })
  // eslint-disable-next-line
  .then(function (totalUserRecord) {
    var returnObj = {
      success: true,
      message: 'no of routes are zero', // `no of active drivers are ${returnObj.data.length}`;
      data: null,
      meta: {
        totalNoOfPages: Math.ceil(totalUserRecord / limit),
        limit: limit,
        currPageNo: pageNo,
        currNoOfRecord: 0
      }
    };
    if (totalUserRecord < 1) {
      return res.send(returnObj);
    }
    if (skip > totalUserRecord) {
      var err = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(err);
    }
    _route2.default.find({
      $and: andCondition
    }).populate({
      path: 'locationId'
    }).limit(parseInt(limit)).skip(skip).then(function (routeData) {
      returnObj.data = routeData;
      returnObj.message = 'routes found';
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      debug('no of records are ' + returnObj.meta.currNoOfRecord);
      return res.send(returnObj);
    }).catch(function (err) {
      res.send('Error', err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of routes ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
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

  var returnObj = {
    success: true,
    message: '', // `no of active drivers are ${returnObj.data.length}`;
    data: {}
  };
  _route2.default.find({
    query: query
  }).then(function (routeData) {
    if (routeData) {
      returnObj.success = true;
      returnObj.data = routeData;
      returnObj.message = 'route found';
    } else {
      returnObj.success = false;
      returnObj.message = 'not found';
    }
    return res.send(returnObj);
  }).catch(function (err) {
    res.send('Error', err);
  });
}

function getAllRidesMobile(req, res, next) {
  console.log("                        ");
  console.log("ReQ -----> ", req.body);
  console.log("                        ");

  var andCondition = [{
    adminId: _mongoose2.default.Types.ObjectId(req.user._id)
  }];

  // Filters

  // Checking Status
  if (req.body && req.body.status && req.body.status != '') {
    var obj = {
      tripRequestStatus: {
        $in: req.body.status
      }
    };
    andCondition.push(obj);
  }
  // Checking driver Ids
  if (req.body && req.body.driverIds && req.body.driverIds != '') {
    var objIds = req.body.driverIds.map(function (id) {
      return _mongoose2.default.Types.ObjectId(id);
    });
    var _obj = {
      driverId: {
        $in: objIds
      }
    };
    andCondition.push(_obj);
  }

  // Checking Start Terminal
  if (req.body && req.body.startTerminalID && req.body.startTerminalID != '') {
    var _obj2 = {
      "srcLoc._id": req.body.startTerminalID
    };
    andCondition.push(_obj2);
  }
  // Checking End Terminal
  if (req.body && req.body.toTerminalID && req.body.toTerminalID != '') {
    var _obj3 = {
      "destLoc._id": req.body.toTerminalID
    };
    andCondition.push(_obj3);
  }

  console.log("andcondition", (0, _stringify2.default)(andCondition));

  var _req$query7 = req.query,
      pageNo = _req$query7.pageNo,
      _req$query7$limit = _req$query7.limit,
      limit = _req$query7$limit === undefined ? _env2.default.limit : _req$query7$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;

  debug('skip value: ' + req.query.pageNo);

  var aggregatePipeline = [{
    $match: {
      $and: andCondition
    }
  }, {
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
  }, {
    $match: {
      "trip.activeStatus": true
    }
  }, {
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
  }, {
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
  }, {
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
  }, {
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
  }, {
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
  }];

  if (req.body && req.body.timeSort == true) {
    aggregatePipeline.splice(1, 0, {
      $sort: {
        requestTime: 1
      }
    });
  } else {
    aggregatePipeline.splice(1, 0, {
      $sort: {
        _id: -1
      }
    });
  }
  console.log('totalriderecord', (0, _stringify2.default)(aggregatePipeline));
  _tripRequest2.default.aggregateAsync(aggregatePipeline)
  // eslint-disable-next-line
  .then(function (totalRidesRecord) {
    console.log('totalriderecord', (0, _stringify2.default)(totalRidesRecord));
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
      var err = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(err);
    }
    console.log('andcondition', (0, _stringify2.default)(andCondition));
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
    var andCondition = [{
      adminId: _mongoose2.default.Types.ObjectId(req.user._id),
      tripRequestStatus: _tripRequestStatuses.TRIP_REQUEST_ACCEPTED
    }];

    // if(req.query && req.query.locationId != ''){
    //   query.locationId = req.query.locationId
    // }

    var aggregatePipeline = [{
      $match: {
        $and: andCondition
      }
    }, {
      $lookup: {
        from: "trips",
        localField: "tripId",
        foreignField: "_id",
        as: "trip"
      }
    }, {
      $unwind: "$trip"
    }, {
      $lookup: {
        from: "users",
        localField: "riderId",
        foreignField: "_id",
        as: "riderDetails"
      }
    }, {
      $unwind: "$riderDetails"
    }, {
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
    }, {
      $lookup: {
        from: "users",
        localField: "driverId",
        foreignField: "_id",
        as: "driver"
      }
    }, {
      $unwind: "$driver"
    }, {
      $lookup: {
        from: "adminvehicles",
        localField: "vehicleId",
        foreignField: "_id",
        as: "vehicle"
      }
    }, {
      $unwind: "$vehicle"
    }, {
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
    }, {
      $unwind: "$rides"
    }, {
      $group: {
        _id: "",
        totalRidesDone: {
          $sum: "$totalRides"
        },
        totalPassengers: {
          $sum: "$rides.seatBooked"
        }
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

function uploadImage(req, res, next) {
  var src = __dirname + '/../../../uploads/avtars/';
  var outputJson = new Object();
  var vaidImage = false;
  var form = new formidable.IncomingForm();
  form.keepExtensions = true; //keep file extension
  form.uploadDir = src;
  form.type = true;
  form.onPart = function (part) {
    if (!part.filename || part.filename.match(/\.(jpg|jpeg|png)$/i)) {
      vaidImage = true;
      this.handlePart(part);
    } else {
      vaidImage = false;
      return res.json({ status: 500, msg: 'Invaid image' });
    }
  };
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

  _user2.default.findOneAsync({ _id: req.body.adminId }).then(function (adminDetails) {
    var returnObj = {
      success: true,
      message: 'Driver status has been updated succussfully',
      data: []
    };
    if (!adminDetails) {
      returnObj.success = false, returnObj.message = 'Admin details not found', returnObj.data = [];
      return res.send(returnObj);
    } else {
      _trip2.default.findOneAsync({
        "driver._id": req.body.driverId,
        "activeStatus": true
      }).then(function (TripDoc) {
        if (!TripDoc) {
          notifyDriverStatus(req, adminDetails);
          returnObj.data = [];
          return res.send(returnObj);
        } else {
          var tripRequestStatuses = [TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE, TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED];
          _tripRequest2.default.findAsync({ tripId: TripDoc._id, tripRequestStatus: { $in: tripRequestStatuses } }).then(function (TripRequesrDocs) {
            if (TripRequesrDocs && TripRequesrDocs.length) {
              _async2.default.eachOf(TripRequesrDocs, function (request, key, cb) {
                var newTripReqObj = {
                  requestUpdatedTime: new Date().toISOString(),
                  tripRequestStatus: TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED
                };
                // Updating Triprequest Schema with new driver and new TripId
                _tripRequest2.default.findOneAndUpdateAsync({ _id: request._id }, { $set: newTripReqObj }, { new: true }).then(function (savedTripRequest) {
                  // notifyRideTransferRider(savedTripRequest, toTrip);
                  var toTripUpdates = {
                    $addToSet: { tripRequests: savedTripRequest }
                  };
                  if (savedTripRequest.tripRequestStatus == TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
                    toTripUpdates["$inc"] = { seatBooked: request.seatBooked, seatsAvailable: -request.seatBooked };
                  }
                  // Updating To trip with updated Triprequest Start
                  _trip2.default.findOneAndUpdateAsync({ _id: TripDoc._id, activeStatus: true }, toTripUpdates, { new: true }).then(function (updatedTrip) {
                    notifyRiderTripChangeStatus(savedTripRequest, adminDetails);
                    cb();
                  }).error(function (e) {
                    cb(e);
                  });
                  /****** END:- Updating To trip with updated Triprequest END ************/
                }).error(function (e) {
                  cb(e);
                });
                /******* END:- Updating To trip with updated Triprequest END ***************/
              }, function (e) {
                if (e) {
                  var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
                  next(err);
                } else {
                  // Updating To trip with updated Triprequest Start
                  deactivateTripAsync(TripDoc._id).then(function (updatedTrip) {
                    notifyDriverStatus(req, adminDetails);
                    returnObj.data = updatedTrip;
                    return res.send(returnObj);
                  }).catch(function (err) {
                    return next(error);
                  });
                }
              });
            } else {
              deactivateTripAsync(TripDoc._id).then(function (updatedTrip) {
                notifyDriverStatus(req, adminDetails);
                returnObj.data = updatedTrip;
                return res.send(returnObj);
              }).catch(function (err) {
                return next(err);
              });
            }
          }).error(function (e) {
            var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
            next(err);
          });
        }
      }).error(function (e) {
        var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the Admin ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
};

function deactivateTripAsync(tripId) {
  return new _promise2.default(function (resolve, reject) {
    _trip2.default.findOneAndUpdateAsync({ _id: tripId }, { $set: { activeStatus: false } }, { new: true }).then(function (updatedTrip) {
      console.log('updatedTrip>>>>>>>>>>>>>>', (0, _stringify2.default)(updatedTrip));
      _adminVehicle2.default.findOneAndUpdateAsync({ _id: updatedTrip.shuttleId }, { $set: { activeStatus: false } }, { new: true }).then(function (updatedTrip) {
        resolve(updatedTrip);
        /******* END :- Updating from trip with Old Triprequest Start ************/
      }).catch(function (err) {
        console.log("Error occured while searching for the trip1", err);
        var error = new _APIError2.default('Error occured while searching for the trip', _httpStatus2.default.INTERNAL_SERVER_ERROR);
        reject(error);
      });
    }).catch(function (err) {
      console.log("Error occured while searching for the trip2", err);
      var error = new _APIError2.default('Error occured while searching for the trip', _httpStatus2.default.INTERNAL_SERVER_ERROR);
      reject(error);
    });
  });
}

function notifyDriverStatus(req, adminDetails) {
  _user2.default.updateAsync({ _id: req.body.driverId }, { $set: { loginStatus: false, jwtAccessToken: null } }) // eslint-disable-line no-underscore-dangle
  .then(function (savedDoc) {
    var res = {
      ride: {
        riderDetails: savedDoc
      },
      driverRoute: []
    };
    var message = 'Admin canceled your session , please contact shuttle operator +' + adminDetails.isdCode + adminDetails.phoneNo;
    _socketStore2.default.emitByUserId(req.body.driverId, 'driverDeactivate', { success: true, message: message, data: res });
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while Updating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function notifyRiderTripChangeStatus(savedTripRequest, adminDetails) {
  var message = 'Admin cancel the trip, please contact shuttle operator +' + adminDetails.isdCode + adminDetails.phoneNo;
  _socketStore2.default.emitByUserId(savedTripRequest.riderId, 'requestRejectedRider', { success: true, message: message, data: savedTripRequest });

  var pushData = {
    success: true, message: 'Request Rejected',
    data: savedTripRequest
  };
  return pushNotificationToRider(savedTripRequest.riderId, savedTripRequest.tripRequestStatus, pushData);
  /******* END :- Updating from trip with Old Triprequest Start ************/
}

function pushNotificationToRider(riderId, status, data) {
  var pushData = {
    body: 'Ride Updated Successfully',
    title: 'Ride Updated',
    payload: data.payload
  };
  if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED) {
    pushData.body = "Your Request has been accepted";
  } else if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_REJECTED) {
    pushData.body = "Your Request has been rejected";
  } else if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_CANCELLED) {
    pushData.body = "Request has been cancelled successfully";
  } else if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_COMPLETED) {
    pushData.body = "Your ride has been completed.";
  } else if (status == TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE) {
    pushData.body = "Your ride has been en routed";
  } else {
    return false;
  }
  return PushNotification.sendNotificationByUserIdAsync(riderId, pushData);
}

exports.default = {
  getDriverRoute: getDriverRoute,
  getRouteById: getRouteById,
  getSelectedTripRoute: getSelectedTripRoute,
  createNewUser: createNewUser,
  getAllDrivers: getAllDrivers,
  getAllDriversMobile: getAllDriversMobile,
  getAllRidesMobile: getAllRidesMobile,
  getAllActiveTrips: getAllActiveTrips,
  updateDriverDetails: updateDriverDetails,
  uploadImage: uploadImage,
  removeDriver: removeDriver,
  requestNewAccessCode: requestNewAccessCode,
  viewDrivers: viewDrivers,
  // manage routes
  addRoute: addRoute,
  getDistanceByOriginDestination: getDistanceByOriginDestination,
  updateRoute: updateRoute,
  getAllRoutes: getAllRoutes,
  getRouteDetails: getRouteDetails,
  removeRoute: removeRoute,
  addTerminal: addTerminal,
  updateTerminal: updateTerminal,
  removeTerminal: removeTerminal,
  // Manage driver by mobile admin make driver online OffLine
  onlineOffline: onlineOffline
};
module.exports = exports.default;
//# sourceMappingURL=admin-user.js.map
