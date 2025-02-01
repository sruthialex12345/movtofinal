'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

require('whatwg-fetch');

var _socketStore = require('../../service/socket-store.js');

var _socketStore2 = _interopRequireDefault(_socketStore);

var _transformResponse = require('../../service/transform-response');

var _appConfig = require('../../models/appConfig');

var _appConfig2 = _interopRequireDefault(_appConfig);

var _payment = require('../../controllers/payment');

var _payment2 = _interopRequireDefault(_payment);

var _emailApi = require('../../service/emailApi');

var _emailApi2 = _interopRequireDefault(_emailApi);

var _pushExpo = require('../../service/pushExpo');

var _pushExpo2 = _interopRequireDefault(_pushExpo);

var _smsApi = require('../../service/smsApi');

var _tripRequest = require('../../models/tripRequest');

var _tripRequest2 = _interopRequireDefault(_tripRequest);

var _trip = require('../../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _user = require('../../models/user.js');

var _user2 = _interopRequireDefault(_user);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//eslint-disable-line
/**
 * Get appConfig
 * @returns {appConfig}
 */
//eslint-disable-line
/* eslint-disable */
function getConfig() {
  return new _promise2.default(function (resolve, reject) {
    _appConfig2.default.findOneAsync({ key: 'sendConfig' }).then(function (foundDetails) {
      resolve(foundDetails.value);
    }).catch(function (err) {
      reject(err);
    });
  });
}
/**
 * startTriphandler function create a new trip object which stores the different details related to trip.
 * @param socket object
 * @returns {*}
 */
//eslint-disable-line
var startTripHandler = function startTripHandler(socket) {
  /**
   * startTrip event is emitted by driver when trip get started
   * @param tripRequest object
   * @param callback function
   * @return send tripUpdated event to the rider with all the information related to trip
   */
  socket.on('startTrip', function (tripRequestObj, cb) {
    var riderID = tripRequestObj.riderId;
    var driverID = tripRequestObj.driverId;
    tripRequestObj.tripRequestStatus = 'completed';
    var tripObj = new _trip2.default({
      riderId: riderID,
      driverId: driverID,
      srcLoc: tripRequestObj.srcLoc,
      destLoc: tripRequestObj.destLoc,
      pickUpAddress: tripRequestObj.pickUpAddress,
      destAddress: tripRequestObj.destAddress,
      paymentMode: tripRequestObj.paymentMode,
      pickUpTime: tripRequestObj.pickUpTime,
      passengerIds: tripRequestObj.passengerIds ? tripRequestObj.passengerIds : []
    });
    tripObj.saveAsync().then(function (savedTrip) {
      tripRequestObj.tripId = savedTrip._id;
      _tripRequest2.default.findOneAndUpdateAsync({ _id: tripRequestObj._id }, { $set: tripRequestObj }).error(function (e) {
        _socketStore2.default.emitByUserId(riderID, 'socketError', e);
        _socketStore2.default.emitByUserId(driverID, 'socketError', e);
      });
      _user2.default.updateAsync({ $or: [{ _id: savedTrip.riderId }, { _id: savedTrip.driverId }] }, { $set: { currTripId: savedTrip._id, currTripState: 'trip' } }, { new: true, multi: true }).then(function () {
        (0, _transformResponse.fetchReturnObj)(savedTrip).then(function (returnObj) {
          notifyUserBySmsOfPickUpAndDrop(savedTrip, 'pick');
          (0, _pushExpo2.default)(riderID, 'Driver has started trip');
          _socketStore2.default.emitByUserId(riderID, 'tripUpdated', returnObj);
          cb(returnObj);
        });
      }).error(function (e) {
        _socketStore2.default.emitByUserId(savedTrip.riderId, 'socketError', {
          message: 'error while updating currTripId of user to start Trip',
          data: e
        });
        _socketStore2.default.emitByUserId(savedTrip.driverId, 'socketError', {
          message: 'error while updating currTripId of user to start Trip',
          data: e
        });
      });
    }).error(function (e) {
      cb(null);
      console.log('some error occured inside the socket Error');
      _socketStore2.default.emitByUserId(riderID, 'socketError', e);
      _socketStore2.default.emitByUserId(driverID, 'socketError', e);
    });
  });

  /**
   * tripUpdate emit is fired when rider or driver make any changes to trip Object
   * @param trip object
   * @return send tripUpdated event to the rider and driver with all the information related to trip
   */

  socket.on('tripUpdate', function (tripObj) {
    var riderID = tripObj.riderId;
    var driverID = tripObj.driverId;
    if (tripObj.tripStatus === 'endTrip' && tripObj.riderRatingByDriver === 0 && tripObj.driverRatingByRider === 0) {
      var then = (0, _moment2.default)(tripObj.bookingTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ");
      var now = (0, _moment2.default)(new Date().toISOString());
      tripObj.travelTime = _moment2.default.duration(then.diff(now));
      if (tripObj.travelTime < 0) {
        tripObj.travelTime = Math.abs(tripObj.travelTime);
      }
      _user2.default.updateAsync({ $or: [{ _id: tripObj.riderId }, { _id: tripObj.driverId }] }, { $set: { currTripId: null, currTripState: null } }, { new: true, multi: true }).then(function () {
        // updated user records
        getConfig().then(function (data) {
          if (data.email.onEndTripRider) {
            (0, _emailApi2.default)(tripObj.riderId, tripObj, 'endTrip');
          }
          if (data.email.onEndTripDriver) {
            (0, _emailApi2.default)(tripObj.driverId, tripObj, 'endTrip');
          }
          if (data.sms.onEndTripRider) {
            // sendSms(tripObj.riderId, 'You have reached the Destination');
            notifyUserBySmsOfPickUpAndDrop(tripObj, 'drop');
          }
          if (data.sms.onEndTripDriver) {
            (0, _smsApi.sendSms)(tripObj.driverId, 'You have drop the Rider ');
          }
        });
      }).error(function (e) {
        _socketStore2.default.emitByUserId(tripObj.riderId, 'socketError', {
          message: 'error while updating currTripId of user to null when Trip ends',
          data: e
        });
        _socketStore2.default.emitByUserId(tripObj.driverId, 'socketError', {
          message: 'error while updating currTripId of user to null Trip ends',
          data: e
        });
      });
    }
    if (tripObj.riderRatingByDriver !== 0 || tripObj.driverRatingByRider !== 0) {
      updateUserRating(tripObj);
    } else if (tripObj.paymentMode === 'CARD') {
      _payment2.default.cardPayment(tripObj).then(function (status) {
        tripObj.paymentStatus = status;
        _trip2.default.findOneAndUpdateAsync({ _id: tripObj._id }, { $set: tripObj }, { new: true }).then(function (updatedTripObject) {
          (0, _transformResponse.fetchReturnObj)(updatedTripObject).then(function (updatedTripObj) {
            _socketStore2.default.emitByUserId(riderID, 'tripUpdated', updatedTripObj);
            _socketStore2.default.emitByUserId(driverID, 'tripUpdated', updatedTripObj);
          });
        }).error(function (e) {
          _socketStore2.default.emitByUserId(riderID, 'socketError', e);
          _socketStore2.default.emitByUserId(driverID, 'socketError', e);
        });
      });
    } else {
      _trip2.default.findOneAndUpdateAsync({ _id: tripObj._id }, { $set: tripObj }, { new: true }).then(function (updatedTripObject) {
        (0, _transformResponse.fetchReturnObj)(updatedTripObject).then(function (updatedTripObj) {
          _socketStore2.default.emitByUserId(riderID, 'tripUpdated', updatedTripObj);
          _socketStore2.default.emitByUserId(driverID, 'tripUpdated', updatedTripObj);
        });
      }).error(function (e) {
        _socketStore2.default.emitByUserId(riderID, 'socketError', e);
        _socketStore2.default.emitByUserId(driverID, 'socketError', e);
      });
    }
  });
};

function updateUserRating(tripObj) {
  if (tripObj.riderRatingByDriver !== 0) {
    _trip2.default.findOneAndUpdateAsync({ _id: tripObj._id }, { $set: { riderRatingByDriver: tripObj.riderRatingByDriver } }, { new: true }).then(function (updatedTripObj) {
      _trip2.default.aggregateAsync([{
        $match: {
          riderId: updatedTripObj.riderId,
          tripStatus: 'endTrip',
          riderRatingByDriver: { $gt: 0 }
        }
      }, {
        $group: {
          _id: '$riderId',
          userRt: { $avg: '$riderRatingByDriver' }
        }
      }]).then(function (res) {
        if (res.length !== 0) {
          _user2.default.findOneAndUpdateAsync({ _id: res[0]._id }, { $set: { userRating: res[0].userRt.toFixed(2) } }, { new: true }).error(function (e) {
            _socketStore2.default.emitByUserId(tripObj.riderId, 'socketError', e);
            _socketStore2.default.emitByUserId(tripObj.driverId, 'socketError', e);
          });
        }
      }).error(function (e) {
        _socketStore2.default.emitByUserId(tripObj.riderId, 'socketError', e);
        _socketStore2.default.emitByUserId(tripObj.driverId, 'socketError', e);
      });
    }).error(function (e) {
      _socketStore2.default.emitByUserId(tripObj.riderId, 'socketError', e);
      _socketStore2.default.emitByUserId(tripObj.driverId, 'socketError', e);
    });
  }

  if (tripObj.driverRatingByRider !== 0) {
    _trip2.default.findOneAndUpdateAsync({ _id: tripObj._id }, {
      $set: {
        driverRatingByRider: tripObj.driverRatingByRider,
        driverReviewByRider: tripObj.driverReviewByRider
      }
    }, { new: true }).then(function (updatedTripObj) {
      _trip2.default.aggregateAsync([{
        $match: {
          driverId: updatedTripObj.driverId,
          tripStatus: 'endTrip',
          driverRatingByRider: { $gt: 0 }
        }
      }, {
        $group: {
          _id: '$driverId',
          userRt: { $avg: '$driverRatingByRider' }
        }
      }]).then(function (res) {
        if (res.length !== 0) {
          _user2.default.findOneAndUpdateAsync({ _id: res[0]._id }, { $set: { userRating: res[0].userRt.toFixed(2) } }, { new: true }).error(function (e) {
            _socketStore2.default.emitByUserId(tripObj.riderId, 'socketError', e);
            _socketStore2.default.emitByUserId(tripObj.driverId, 'socketError', e);
          });
        }
      }).error(function (e) {
        _socketStore2.default.emitByUserId(tripObj.riderId, 'socketError', e);
        _socketStore2.default.emitByUserId(tripObj.driverId, 'socketError', e);
      });
    }).error(function (e) {
      _socketStore2.default.emitByUserId(tripObj.riderId, 'socketError', e);
      _socketStore2.default.emitByUserId(tripObj.driverId, 'socketError', e);
    });
  }
}

function notifyUserBySmsOfPickUpAndDrop(savedTrip, type) {
  _trip2.default.findOne({ _id: savedTrip._id }).populate('riderId', '_id fname lname passengerList').populate('driverId', '_id fname lname').exec(function (err, tripObj) {
    if (err) {
      console.log('server error while finding trip ' + err);
    } else {
      if (tripObj.passengerIds.length > 0 && tripObj.riderId && tripObj.driverId) {
        var passengerName = "";
        var smsText = "";
        tripObj.passengerIds.forEach(function (item, index) {
          tripObj.riderId.passengerList.forEach(function (element) {
            if (item == element._id) {
              if (tripObj.passengerIds.length == 1) {
                passengerName = element.fname + " has";
              } else if (tripObj.passengerIds.length == 2) {
                if (index == 1) {
                  passengerName = passengerName + " and " + element.fname + " have";
                } else {
                  passengerName = element.fname;
                }
              } else {
                if (index == tripObj.passengerIds.length - 1) {
                  passengerName = passengerName.slice(0, -2);
                  passengerName = passengerName + " and " + element.fname + " have";
                } else {
                  passengerName = passengerName + element.fname + ", ";
                }
              }
            }
          });
        });
        if (type == 'pick') {
          smsText = passengerName + ' been picked up.';
        } else {
          smsText = passengerName + ' been dropped off. Please remember to rate your experience in the app.';
        }
        sendSmsToRider(tripObj.riderId._id, smsText);
      } else {
        console.log("No passenger found");
      }
    }
  });
}

function sendSmsToRider(userId, smsText) {
  (0, _smsApi.sendSms)(userId, smsText, function (err, data) {
    if (err) {
      console.log('server error while sending sms to rider ' + err);
    } else {
      console.log("Sms is successfully sent to rider");
    }
  });
}

exports.default = startTripHandler;
module.exports = exports.default;
//# sourceMappingURL=start-trip.js.map
