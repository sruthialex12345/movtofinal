'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

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

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _adminVehicle = require('../models/adminVehicle');

var _adminVehicle2 = _interopRequireDefault(_adminVehicle);

var _userTypes = require('../constants/user-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('MGD-API: admin-user');

/* start: manage vehicles by admin */

function createNewVehicle(req, res, next) {
  var vehicleData = (0, _assign2.default)({}, req.body);
  _adminVehicle2.default.findOneAsync({
    userIdAdmin: req.user._id, vehicleNo: req.body.vehicleNo
  })
  // eslint-disable-next-line consistent-return
  .then(function (foundVehicle) {
    var returnObj = {
      success: false,
      message: '',
      data: null
    };
    if (foundVehicle !== null) {
      var err = new _APIError2.default('Vehicle No Already Exist', _httpStatus2.default.CONFLICT);
      return next(err);
    }
    var accessCode = _util2.default.generateAccessCode();
    var vehicleObj = new _adminVehicle2.default({
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
      imageUrl: vehicleData.imageUrl ? _util2.default.getUploadsAvtarsUrl(req) + "/" + vehicleData.imageUrl : _util2.default.getUploadsShuttlesUrl(req) + '/inactive_Shuttle@3x.png',
      state: vehicleData.state,
      country: vehicleData.country,
      zone: vehicleData.zone ? vehicleData.zone : '',
      locationId: vehicleData.locationId
    });

    vehicleObj.saveAsync().then(function (savedVehicle) {
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
    }).error(function (e) {
      var err = new _APIError2.default('Error while Creating new vehicle ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      returnObj.success = false;
      returnObj.message = 'Vehicle not created';
      console.log(err); // eslint-disable-line no-console
      return next(returnObj);
    });
  }).error(function (e) {
    var err = new _APIError2.default('Error while Searching the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    return next(err);
  });
}

function getAllVehicles(req, res, next) {
  var andCondition = [];
  var obj = { isDeleted: false, userIdAdmin: req.user._id };
  andCondition.push(obj);

  if (req.query && req.query.locationId != '') {
    obj = { locationId: req.query.locationId };
    andCondition.push(obj);
  }
  var _req$query = req.query,
      pageNo = _req$query.pageNo,
      _req$query$limit = _req$query.limit,
      limit = _req$query$limit === undefined ? _env2.default.limit : _req$query$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  debug('skip value: ' + req.query.pageNo);
  _adminVehicle2.default.countAsync({ $and: andCondition })
  // eslint-disable-next-line
  .then(function (totalVehicleRecord) {
    var returnObj = {
      success: true,
      message: 'no of vehicles are zero', // `no of active vehicles are ${returnObj.data.length}`;
      data: null,
      meta: {
        totalNoOfPages: Math.ceil(totalVehicleRecord / limit),
        limit: limit,
        currPageNo: pageNo,
        currNoOfRecord: 20
      }
    };
    if (totalVehicleRecord < 1) {
      return res.send(returnObj);
    }
    if (skip > totalVehicleRecord) {
      var err = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(err);
    }
    _adminVehicle2.default.find({ $and: andCondition }).limit(parseInt(limit)).skip(skip).then(function (vehicleData) {
      returnObj.data = vehicleData;
      returnObj.message = 'Vehicles found';
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

function getAllVehiclesMobile(req, res, next) {
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
  var _req$query2 = req.query,
      pageNo = _req$query2.pageNo,
      _req$query2$limit = _req$query2.limit,
      limit = _req$query2$limit === undefined ? _env2.default.limit : _req$query2$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  debug('skip value: ' + req.query.pageNo);
  _adminVehicle2.default.countAsync({ $and: andCondition })
  // eslint-disable-next-line
  .then(function (totalVehicleRecord) {
    var returnObj = {
      success: true,
      message: 'no of vehicles are zero', // `no of active vehicles are ${returnObj.data.length}`;
      data: {
        meta: {
          totalNoOfPages: Math.ceil(totalVehicleRecord / limit),
          limit: limit,
          currPageNo: pageNo,
          currNoOfRecord: 0,
          totalShuttles: 0
        },
        shuttles: []
      }
    };
    if (totalVehicleRecord < 1) {
      return res.send(returnObj);
    }
    if (skip > totalVehicleRecord) {
      var err = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(err);
    }
    console.log('andcondition', andCondition);
    _adminVehicle2.default.find({ $and: andCondition }).limit(parseInt(limit)).skip(skip).then(function (vehicleData) {
      returnObj.data.shuttles = vehicleData || [];
      returnObj.message = 'Vehicles found';
      returnObj.data.meta.currNoOfRecord = returnObj.data.length;
      // debug(`no of records are ${returnObj.meta.currNoOfRecord}`);
      getVehileListMetaAsync(req).then(function (listMetaData) {
        returnObj.data.shuttles = vehicleData || [];
        returnObj.data.meta.totalShuttles = totalVehicleRecord || 0;
        returnObj.data.meta.activeShuttles = listMetaData.activeShuttles;
        return res.send(returnObj);
      }).catch(function (error) {
        var errorCustom = new _APIError2.default('error occured while counting the active shuttles ' + error, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        return next(errorCustom);
      });
    }).catch(function (error) {
      var errorCustom = new _APIError2.default('error occured while counting the active shuttles ' + error, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      return next(errorCustom);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of users ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    return next(err);
  });
}

function updateVehicleDetails(req, res, next) {
  var updateVehicleObj = (0, _assign2.default)({}, req.body);
  _trip2.default.findOneAsync({
    "shuttleId": updateVehicleObj.vehicleId,
    "activeStatus": true
  }).then(function (TripDoc) {
    if (TripDoc) {
      var returnObj = {
        success: false,
        message: 'Vehicle is active on trip, So you cant update his details now.',
        data: null,
        meta: null
      };
      return res.send(returnObj);
    }

    _adminVehicle2.default.findOneAsync({ _id: req.body.vehicleId }).then(function (vehicleDoc) {
      var returnObj = {
        success: false,
        message: 'unable to find the object',
        data: null,
        meta: null
      };
      if (vehicleDoc) {
        vehicleDoc.name = updateVehicleObj.name;
        vehicleDoc.company = updateVehicleObj.company ? updateVehicleObj.company : vehicleDoc.company;
        vehicleDoc.seats = updateVehicleObj.seats ? updateVehicleObj.seats : 4, vehicleDoc.vehicleNo = updateVehicleObj.vehicleNo ? updateVehicleObj.vehicleNo : vehicleDoc.vehicleNo;
        vehicleDoc.carModel = updateVehicleObj.carModel ? updateVehicleObj.carModel : vehicleDoc.carModel;
        vehicleDoc.type = updateVehicleObj.type ? updateVehicleObj.type : vehicleDoc.type;
        vehicleDoc.regNo = updateVehicleObj.regNo ? updateVehicleObj.regNo : vehicleDoc.regNo;
        vehicleDoc.RC_ownerName = updateVehicleObj.rcOwnerName ? updateVehicleObj.rcOwnerName : vehicleDoc.rcOwnerName;
        vehicleDoc.color = updateVehicleObj.color ? updateVehicleObj.color : vehicleDoc.color, vehicleDoc.regDate = updateVehicleObj.regDate ? updateVehicleObj.regDate : vehicleDoc.regDate, vehicleDoc.imageUrl = updateVehicleObj.imageUrl ? updateVehicleObj.imageUrl : vehicleDoc.imageUrl;
        vehicleDoc.state = updateVehicleObj.state ? updateVehicleObj.state : vehicleDoc.state, vehicleDoc.country = updateVehicleObj.country ? updateVehicleObj.country : vehicleDoc.country;
        vehicleDoc.zone = updateVehicleObj.zone ? updateVehicleObj.zone : vehicleDoc.zone, vehicleDoc.locationId = updateVehicleObj.locationId ? updateVehicleObj.locationId : vehicleDoc.locationId, vehicleDoc.imageUrl = updateVehicleObj.imageUrl ? _util2.default.getUploadsAvtarsUrl(req) + "/" + updateVehicleObj.imageUrl : vehicleDoc.imageUrl;
        vehicleDoc.saveAsync().then(function (savedDoc) {
          returnObj.success = true;
          returnObj.message = 'Vehicle document updated';
          returnObj.data = savedDoc;
          res.send(returnObj);
        }).error(function (e) {
          var err = new _APIError2.default('Error occured while updating the vehicle details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          next(err);
        });
      } else {
        res.send(returnObj);
      }
    }).error(function (e) {
      var err = new _APIError2.default('Error occured while searching for the vehicles ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while checking vehicles status ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function removeVehicle(req, res, next) {
  _adminVehicle2.default.findOneAsync({ _id: req.query.vehicleId, activeStatus: true }) // eslint-disable-line no-underscore-dangle
  .then(function (shuttleTrip) {
    var returnObj = {
      success: false,
      message: "Sorry, You cant delete shuttle, as shuttle is on trip",
      data: []
    };
    if (shuttleTrip) {
      return res.send(returnObj);
    }
    _adminVehicle2.default.updateAsync({ _id: req.query.vehicleId }, { $set: { isDeleted: true } }) // eslint-disable-line no-underscore-dangle
    .then(function (savedDoc) {
      returnObj.success = true;
      returnObj.message = "Shuttle deleted successfully";
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

function getVehicleDetails(req, res, next) {
  var updateUserObj = (0, _assign2.default)({}, req.body);
  _adminVehicle2.default.findOneAsync({ _id: req.query.vehicleId }).then(function (vehicleDoc) {
    var returnObj = {
      success: false,
      message: 'Unable to find the Vehicle',
      data: null,
      meta: null
    };
    if (vehicleDoc) {
      returnObj.success = true;
      returnObj.message = 'Success';
      returnObj.data = vehicleDoc;
      res.send(returnObj);
    } else {
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the vehicle ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function getVehileListMetaAsync(req) {
  return new _promise2.default(function (resolve, reject) {
    // get all shuttleIds
    var query = { isDeleted: false };
    query = {
      userIdAdmin: _mongoose2.default.Types.ObjectId(req.user._id)
    };

    if (req.query && req.query.locationId != '') {
      query.locationId = req.query.locationId;
    }

    _adminVehicle2.default.aggregate([{ $match: query }, {
      $group: {
        _id: '',
        ids: { $addToSet: "$_id" }
      }
    }])
    // eslint-disable-next-line
    .then(function (results) {
      var result = results[0];
      var returnObj = { activeShuttles: null };
      var totalVehicleRecord = result.ids;
      totalVehicleRecord = totalVehicleRecord.map(function (id) {
        return _mongoose2.default.Types.ObjectId(id);
      });
      if (totalVehicleRecord && Array.isArray(totalVehicleRecord) && totalVehicleRecord.length) {
        var tripQuery = {
          shuttleId: { $in: totalVehicleRecord },
          activeStatus: true
        };
        _trip2.default.countAsync(tripQuery).then(function (activeTripsCount) {
          returnObj.activeShuttles = activeTripsCount;
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

/* end: manage vehicles by admin */

exports.default = {
  createNewVehicle: createNewVehicle,
  getAllVehicles: getAllVehicles,
  updateVehicleDetails: updateVehicleDetails,
  removeVehicle: removeVehicle,
  getVehicleDetails: getVehicleDetails,
  getAllVehiclesMobile: getAllVehiclesMobile
};
module.exports = exports.default;
//# sourceMappingURL=admin-vehicle.js.map
