'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _env = require('../../config/env');

var _env2 = _interopRequireDefault(_env);

var _trip = require('../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _tripRequest = require('../models/tripRequest');

var _tripRequest2 = _interopRequireDefault(_tripRequest);

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

var _userTypes = require('../constants/user-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function tripDetails(req, res, next) {
  var limit = req.query.limit ? req.query.limit : _env2.default.limit;
  var pageNo = req.query.pageNo ? req.query.pageNo : 1;
  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  var filter = req.query.filter ? req.query.filter : _env2.default.tripFilter;
  _trip2.default.getCount(filter)
  // eslint-disable-next-line consistent-return
  .then(function (totalTripRecords) {
    var returnObj = {
      success: false,
      message: 'no of trips are zero',
      data: null,
      meta: {
        totalNoOfPages: Math.ceil(totalTripRecords / limit),
        limit: limit,
        currPageNo: pageNo,
        totalRecords: totalTripRecords.length
      }
    };
    if (totalTripRecords < 1) {
      returnObj.success = true;
      returnObj.data = [];
      returnObj.meta.totalNoOfPages = 0;
      returnObj.meta.limit = limit;
      returnObj.meta.currPageNo = 0;
      returnObj.meta.totalRecords = 0;
      return res.send(returnObj);
    }
    if (skip > totalTripRecords) {
      var err = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(err);
    }

    _trip2.default.list({ skip: skip, limit: limit, filter: filter }).then(function (tripData) {
      if (tripData.length !== 0) {
        var trips = tripData.map(transformReturnObj);
        returnObj.success = true;
        returnObj.message = 'trip object retrieved';
        returnObj.data = trips;
      } else {
        returnObj.success = true;
        returnObj.message = 'no trip details available';
      }
      res.send(returnObj);
    }).error(function (e) {
      var err = new _APIError2.default('Error occured while retreiving trip object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while counting trip object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function getOngoingTripDetails(req, res, next) {
  addDriverRider().then(function (returnObj) {
    returnObj.success = true;
    returnObj.message = 'no of trips are ' + returnObj.data.length;
    returnObj.meta.totalRecords = '' + returnObj.data.length;
    res.send(returnObj);
  }).catch(function (err) {
    next(err);
  });
}

function addDriverRider() {
  return new _promise2.default(function (resolve, reject) {
    _trip2.default.find({ tripStatus: 'onTrip' }).then(function (ongoingTripRecords) {
      var returnObj = {
        success: true,
        message: 'no of trips are zero',
        data: null,
        meta: {
          totalRecords: ongoingTripRecords.length
        }
      };
      returnObj.data = ongoingTripRecords;
      var r1 = JSON.parse((0, _stringify2.default)(returnObj));
      addRider(r1).then(function (responseObj) {
        return addDriver(responseObj);
      }).then(function (responseObj) {
        return resolve(responseObj);
      }).catch(function (err) {
        reject(err);
      });
    }).catch(function (err) {
      reject(err);
    }); // find catch
  });
}

function getSpecificUserTripDetails(req, res, next) {
  var userId = req.params.userId;

  var returnObj = {
    success: false,
    message: 'user Id is not defined',
    data: null
  };
  if (userId) {
    _trip2.default.find({ $or: [{ driverId: userId }, { riderId: userId }] }).then(function (tripData) {
      if (tripData) {
        returnObj.success = true;
        returnObj.message = 'user found and its corresponding trip details';
        returnObj.data = tripData;
        var r1 = JSON.parse((0, _stringify2.default)(returnObj));
        addRider(r1).then(function (responseObj) {
          return addDriver(responseObj);
        }).then(function (responseObj) {
          responseObj.success = true;
          responseObj.message = 'no of trips are ' + responseObj.data.length;
          res.send(responseObj);
        }).catch(function (err) {
          next(err);
        });
      } else {
        returnObj.success = false;
        returnObj.message = 'user trip details not found with the given id';
        returnObj.data = null;
        res.send(returnObj);
      }
      // res.send(returnObj);
    }).catch(function (err) {
      next(err);
    });
  } else {
    res.send(returnObj);
  }
}

function getRecentReviewedTripDetails(req, res, next) {
  _trip2.default.find({ tripStatus: 'endTrip' }).then(function (recentReviewedTripRecords) {
    var returnObj = {
      success: true,
      message: 'no of trips are zero',
      data: null,
      meta: {
        totalRecords: recentReviewedTripRecords.length
      }
    };
    returnObj.data = recentReviewedTripRecords;
    var r1 = JSON.parse((0, _stringify2.default)(returnObj));
    addRider(r1).then(function (responseObj) {
      return addDriver(responseObj);
    }).then(function (responseObj) {
      responseObj.success = true;
      responseObj.message = 'no of trips are ' + responseObj.data.length;
      responseObj.meta.totalRecords = '' + responseObj.data.length;
      res.send(responseObj);
    }).catch(function (err) {
      next(err);
    });
  }).catch(function (err) {
    next(err);
  });
}

function addRider(returnObj) {
  return new _promise2.default(function (resolve, reject) {
    _promise2.default.all(returnObj.data.map(function (item, index) {
      return _user2.default.findOneAsync({ _id: item.riderId }).then(function (result) {
        returnObj.data[index] = (0, _assign2.default)({}, returnObj.data[index], { profileUrl: result.profileUrl, riderName: result.fname + result.lname });
        return _promise2.default.resolve(returnObj.data[index]);
      });
    })).then(function (rider) {
      if (rider) {
        console.log('rider created', rider); // eslint-disable-line no-console
      }
      return resolve(returnObj);
    }).catch(function (err) {
      if (err) {
        console.log('error', err); // eslint-disable-line no-console
      }
      return reject(returnObj);
    });
  });
}

function addDriver(returnObj) {
  return new _promise2.default(function (resolve, reject) {
    _promise2.default.all(returnObj.data.map(function (item, index) {
      return _user2.default.findOneAsync({ _id: item.driverId }).then(function (result) {
        returnObj.data[index] = (0, _assign2.default)({}, returnObj.data[index], { driverName: result.fname + result.lname });
        return _promise2.default.resolve(returnObj.data[index]);
      });
    })).then(function (driver) {
      if (driver) {
        console.log('driver created', driver); // eslint-disable-line no-console
      }
      return resolve(returnObj);
    }).catch(function (err) {
      if (err) {
        console.log('err', err); // eslint-disable-line no-console
      }
      return reject(returnObj);
    });
  });
}

function createNewTrip(req, res, next) {
  var _req$body = req.body,
      riderId = _req$body.riderId,
      driverId = _req$body.driverId;


  _user2.default.findAsync({ $or: [{ $and: [{ userType: _userTypes.USER_TYPE_RIDER }, { _id: riderId }] }, { $and: [{ userType: _userTypes.USER_TYPE_DRIVER }, { _id: driverId }] }] })
  // eslint-disable-next-line consistent-return
  .then(function (foundUserData) {
    if (foundUserData.length !== 2) {
      var err = new _APIError2.default('rider or driver does not exist', _httpStatus2.default.BAD_REQUEST);
      return next(err);
    }

    if (foundUserData[0].currTripId !== null || foundUserData[1].currTripId !== null) {
      var errMsg = '';
      if (foundUserData[0].userType === _userTypes.USER_TYPE_RIDER && foundUserData[0].currTripId === null) {
        errMsg += 'Rider is On Trip';
      }
      if (foundUserData[1].userType === _userTypes.USER_TYPE_DRIVER && foundUserData[1].currTripId === null) {
        errMsg += 'Driver is On Trip';
      }
      var _err = new _APIError2.default(errMsg, _httpStatus2.default.BAD_REQUEST);
      return next(_err);
    }
    var tripObj = new _trip2.default({
      riderId: req.body.riderId,
      driverId: req.body.driverId,
      srcLoc: req.body.srcLoc ? req.body.srcLoc : [1, 2],
      destLoc: req.body.destLoc ? req.body.destLoc : [3, 4],
      pickUpAddress: req.body.pickUpAddress,
      destAddress: req.body.destAddress
    });
    tripObj.saveAsync().then(function (newTripObj) {
      var returnObj = {
        success: true,
        message: 'trip object created',
        data: newTripObj,
        meta: null
      };
      var tripRequest = new _tripRequest2.default({
        riderId: newTripObj.riderId,
        driverId: newTripObj.driverId,
        tripId: newTripObj._id, // eslint-disable-line no-underscore-dangle
        srcLoc: newTripObj.srcLoc,
        destLoc: newTripObj.destLoc,
        pickUpAddress: newTripObj.pickUpAddress,
        destAddress: newTripObj.destAddress,
        tripRequestStatus: 'completed',
        tripRequestIssue: 'noIssue'
      });
      tripRequest.saveAsync().then(function () {
        _user2.default.updateAsync({ $or: [{ _id: newTripObj.riderId }, { _id: newTripObj.driverId }] }, { $set: { currTripId: newTripObj._id, currTripState: 'trip' } }, { multi: true }) // eslint-disable-line no-underscore-dangle
        .then(function () {
          res.send(returnObj);
        }).error(function (e) {
          var err = new _APIError2.default('Error occured while Updating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          next(err);
        });
      }).error(function (e) {
        var err = new _APIError2.default('Error occured while Saving Trip Request Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    }).error(function (e) {
      var err = new _APIError2.default('Error occured while saving trip object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while finding rider or driver ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function updateTrip(req, res, next) {
  var tripId = req.body._id; // eslint-disable-line no-underscore-dangle
  var tripObj = {
    riderId: req.body.riderId,
    driverId: req.body.driverId,
    srcLoc: req.body.srcLoc ? req.body.srcLoc : [1, 2],
    destLoc: req.body.destLoc ? req.body.destLoc : [2, 2],
    pickUpAddress: req.body.pickUpAddress ? req.body.pickUpAddress : 'new Dehli',
    destAddress: req.body.destAddress ? req.body.destAddress : 'mumbai',
    tripAmt: req.body.tripAmt ? req.body.tripAmt : 0,
    tripIssue: req.body.tripIssue ? req.body.tripIssue : 'noIssue',
    tripStatus: req.body.tripStatus ? req.body.tripStatus : 'OnTrip',
    tripEndTime: req.body.tripEndTime ? req.body.tripEndTime : null,
    paymentMode: req.body.paymentMode ? req.body.paymentMode : 'cash',
    taxiType: req.body.taxiType ? req.body.taxiType : 'taxiMini',
    riderRatingByDriver: req.body.riderRatingByDriver ? req.body.riderRatingByDriver : 0,
    driverRatingByRider: req.body.driverRatingByRider ? req.body.driverRatingByRider : 0,
    riderReviewByDriver: req.body.riderReviewByDriver ? req.body.riderReviewByDriver : null,
    driverReviewByRider: req.body.driverReviewByRider ? req.body.driverReviewByRider : null,
    seatBooked: req.body.seatBooked ? req.body.seatBooked : 1
  };

  _trip2.default.findOneAndUpdateAsync({ _id: tripId }, { $set: tripObj }, { new: 1, runValidators: true })
  // eslint-disable-next-line consistent-return
  .then(function (updatedTripObj) {
    var returnObj = {
      success: false,
      message: 'unable to update trip object as trip id provided didnt match',
      data: null,
      meta: null
    };
    if (updatedTripObj) {
      returnObj.success = true;
      returnObj.message = 'trip object updated';
      returnObj.data = updatedTripObj;
      if (updatedTripObj.tripStatus === 'endTrip') {
        _user2.default.updateAsync({ $or: [{ _id: updatedTripObj.riderId }, { _id: updatedTripObj.driverId }] }, { $set: { currTripId: null, currTripState: null } }, { new: true, multi: true }).then(function () {
          return res.send(returnObj);
        }) // sending the updated tripObj in the fronted
        .error(function (e) {
          var err = new _APIError2.default('Error occured while updatating User Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          return next(err);
        });
      }
    } else {
      var err = new _APIError2.default('Trip Id did not matched', _httpStatus2.default.BAD_REQUEST);
      return next(err);
    }
    // res.send(returnObj);
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while updatating trip object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function loadTripDetails(req, res, next) {
  var tripId = req.params.tripId;

  _trip2.default.get(tripId).then(function (tripData) {
    var returnObj = {
      success: true,
      message: 'trip object found',
      data: transformReturnObj(tripData)
    };
    res.send(returnObj);
  }).error(function (e) {
    return next(e);
  });
}

function tripRevenueGraph(req, res, next) {
  var lastYearDate = new Date().toISOString();
  lastYearDate.setDate(1);
  lastYearDate.setMonth(lastYearDate.getMonth() - 11);
  lastYearDate = new Date(lastYearDate);
  var returnObj = {
    success: false,
    message: 'no of trips avaliable',
    data: [],
    lastYearDate: lastYearDate
  };
  _trip2.default.aggregateAsync([{ $match: { bookingTime: { $gt: lastYearDate } } }, {
    $project: {
      year: { $year: '$bookingTime' },
      month: { $month: '$bookingTime' },
      tripAmt: '$tripAmt',
      tripStatus: '$tripStatus'
    }
  }, { $match: { tripStatus: 'endTrip' } }, {
    $group: {
      _id: 'RevenueGraph',
      1: { $sum: { $cond: [{ $eq: ['$month', 1] }, '$tripAmt', 0] } },
      2: { $sum: { $cond: [{ $eq: ['$month', 2] }, '$tripAmt', 0] } },
      3: { $sum: { $cond: [{ $eq: ['$month', 3] }, '$tripAmt', 0] } },
      4: { $sum: { $cond: [{ $eq: ['$month', 4] }, '$tripAmt', 0] } },
      5: { $sum: { $cond: [{ $eq: ['$month', 5] }, '$tripAmt', 0] } },
      6: { $sum: { $cond: [{ $eq: ['$month', 6] }, '$tripAmt', 0] } },
      7: { $sum: { $cond: [{ $eq: ['$month', 7] }, '$tripAmt', 0] } },
      8: { $sum: { $cond: [{ $eq: ['$month', 8] }, '$tripAmt', 0] } },
      9: { $sum: { $cond: [{ $eq: ['$month', 9] }, '$tripAmt', 0] } },
      10: { $sum: { $cond: [{ $eq: ['$month', 10] }, '$tripAmt', 0] } },
      11: { $sum: { $cond: [{ $eq: ['$month', 11] }, '$tripAmt', 0] } },
      12: { $sum: { $cond: [{ $eq: ['$month', 12] }, '$tripAmt', 0] } }
    }
  }]).then(function (revenueGraphDocs) {
    returnObj.success = true;
    returnObj.message = 'revenue graph for the trip';
    returnObj.data = revenueGraphDocs;
    res.send(returnObj);
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while computing revenue graph ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function transformReturnObj(tripData) {
  if (tripData instanceof Object) {
    tripData = tripData.toObject();
    if (tripData.riderId) {
      tripData.rider = tripData.riderId;
      tripData.riderId = tripData.rider._id ? tripData.rider._id : null; // eslint-disable-line no-underscore-dangle
    }
    if (tripData.driverId) {
      tripData.driver = tripData.driverId;
      tripData.driverId = tripData.driver._id ? tripData.driver._id : null; // eslint-disable-line no-underscore-dangle
    }
  }
  return tripData;
}

exports.default = {
  tripDetails: tripDetails,
  getOngoingTripDetails: getOngoingTripDetails,
  getRecentReviewedTripDetails: getRecentReviewedTripDetails,
  createNewTrip: createNewTrip,
  updateTrip: updateTrip,
  loadTripDetails: loadTripDetails,
  tripRevenueGraph: tripRevenueGraph,
  getSpecificUserTripDetails: getSpecificUserTripDetails
};
module.exports = exports.default;
//# sourceMappingURL=admin-trip.js.map
