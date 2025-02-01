'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uploadImage = exports.removePassenger = exports.updatePassenger = exports.addPassengerTrip = exports.addPassenger = undefined;

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.getPassengerIncompleteRides = getPassengerIncompleteRides;

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _cloudinary = require('cloudinary');

var _cloudinary2 = _interopRequireDefault(_cloudinary);

var _formidable = require('formidable');

var _formidable2 = _interopRequireDefault(_formidable);

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

var _trip = require('../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _serverConfig = require('../models/serverConfig');

var _serverConfig2 = _interopRequireDefault(_serverConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Get getCloudinaryDetails
 * @returns {getCloudinaryDetails}
 */
function getCloudinaryDetails() {
  return new _promise2.default(function (resolve, reject) {
    _serverConfig2.default.findOneAsync({ key: 'cloudinaryConfig' }).then(function (foundDetails) {
      resolve(foundDetails.value);
    }).catch(function (err) {
      reject(err);
    });
  });
}

var addPassenger = function addPassenger(req, res) {
  var _req$body = req.body,
      userId = _req$body.userId,
      passengerDetails = (0, _objectWithoutProperties3.default)(_req$body, ['userId']);
  // eslint-disable-next-line no-underscore-dangle

  passengerDetails._id = new _mongoose2.default.Types.ObjectId();
  _user2.default.findOneAsync({ _id: userId }).then(function (user) {
    var newPassengerList = user.passengerList.concat([passengerDetails]);
    _user2.default.findOneAndUpdateAsync({ _id: user._id }, { $set: { passengerList: newPassengerList } }, { new: true }) //eslint-disable-line
    .then(function (updateUser) {
      res.send({ message: 'Passenger successfully added', data: updateUser });
    }).catch(function (err) {
      res.send({ data: err, message: 'Error adding new passenger' });
    });
  });
};

// eslint-disable-next-line consistent-return
exports.addPassenger = addPassenger;
var addPassengerTrip = exports.addPassengerTrip = function addPassengerTrip(req, res) {
  var _req$body2 = req.body,
      tripId = _req$body2.tripId,
      pickUpTime = _req$body2.pickUpTime,
      passengerIds = _req$body2.passengerIds;

  if (passengerIds.length > 4) {
    return res.send({ status: false, code: 400, message: 'Maximum 4 passenger can be added in one ride.' });
  }
  _trip2.default.findOneAndUpdateAsync({ _id: tripId }, { $set: { passengerIds: passengerIds, pickUpTime: pickUpTime } }, { new: true }).then(function (tripData) {
    if (tripData) {
      res.send({ status: true, code: 200, message: 'Passeger added successfully' });
    } else {
      res.send({ status: false, code: 400, message: 'No passenger added' });
    }
  }).catch(function () {
    res.send({ status: false, code: 400, message: 'server error while adding passenger' });
  });
};

var updatePassenger = function updatePassenger(req, res) {
  var _req$body3 = req.body,
      userId = _req$body3.userId,
      passengerDetails = (0, _objectWithoutProperties3.default)(_req$body3, ['userId']);


  _user2.default.findOneAsync({ _id: userId }).then(function (user) {
    var passengerId = null;
    // eslint-disable-next-line array-callback-return
    user.passengerList.map(function (passenger) {
      if (passengerDetails.id === passenger.id) {
        passengerId = passenger.id;
      }
    });
    if (passengerId) {
      // todo: update passenger
    } else {
      res.send({ message: 'No passenger found' });
    }
  }).catch(function (err) {
    res.send({ data: err, message: 'Error in updating passenger details' });
  });
};

exports.updatePassenger = updatePassenger;
var removePassenger = exports.removePassenger = function removePassenger(req, res) {
  // eslint-disable-next-line no-underscore-dangle
  var userId = req.user._id;
  var passengerId = req.body.passengerId;

  getPassengerIncompleteRides(userId, passengerId).then(function (resp) {
    if (resp.data.length > 0) {
      res.send({ status: false, data: [], message: 'Passenger is added on trip, therefore cannot be deleted' });
    } else {
      _user2.default.findOneAsync({ _id: userId }).then(function (user) {
        var oldPassengerList = user.passengerList || [];
        var passengerList = oldPassengerList.map(function (p) {
          // eslint-disable-next-line no-underscore-dangle
          if (p._id === passengerId) {
            p.isDeleted = true;
            p.deletedAt = new Date().toISOString();
          }
          return p;
        });
        _user2.default.findOneAndUpdateAsync({ _id: user._id }, { $set: { passengerList: passengerList } }, { new: true }) // eslint-disable-line no-underscore-dangle
        .then(function (updateUser) {
          var newPassengerList = updateUser.passengerList;
          // console.log(newPassengerList);
          res.send({ data: newPassengerList, message: 'Passenger successfully removed' });
        }).catch(function (err) {
          res.send({ data: err, message: 'Unable to delete passenger' });
        });
      }).catch(function (err) {
        res.send({ data: err, message: 'Error in removing passenger' });
      });
    }
  });
};

function getPassengerIncompleteRides(userId, _id) {
  return new _promise2.default(function (resolve, reject) {
    _trip2.default.findAsync({ riderId: userId, passengerIds: { $in: [_id] }, $and: [{ tripStatus: { $ne: 'completed' } }, { tripStatus: { $ne: 'cancelled' } }, { tripStatus: { $ne: 'expired' } }] }).then(function (tripData) {
      if (tripData.length > 0) {
        var resp = {
          data: [],
          message: 'No trips found'
        };
        resolve(resp);
      } else {
        var _resp = {
          data: tripData,
          message: 'Trips found'
        };
        resolve(_resp);
      }
    }).catch(function (err) {
      reject(err);
    });
  });
}

/**
 * upload user image
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */
var uploadImage = exports.uploadImage = function uploadImage(req, res /* , next */) {
  getCloudinaryDetails().then(function (value) {
    if (value) {
      _cloudinary2.default.config({
        cloud_name: value.cloud_name,
        api_key: value.api_key,
        api_secret: value.api_secret
      });
      var form = new _formidable2.default.IncomingForm();
      form.on('error', function (err) {
        console.error(err); // eslint-disable-line no-console
      });

      form.parse(req, function (err, fields, files) {
        var imgpath = files.image;
        _cloudinary2.default.v2.uploader.upload(imgpath.path, {
          transformation: [{
            effect: 'improve',
            gravity: 'face',
            height: 100,
            radius: 'max',
            width: 100,
            crop: 'fill'
          }, { quality: 'auto' }]
        }, function (error, results) {
          if (results) {
            var user = req.user,
                passengerId = req.passengerId;

            if (req.headers.updatetype === 'profile') {
              // user.profileUrl = results.url;

              // eslint-disable-next-line no-underscore-dangle
              _user2.default.findOneAsync({ _id: user._id }).then(function (foundUser) {
                var oldPassengerList = foundUser.passengerList || [];
                var passengerList = oldPassengerList.map(function (p) {
                  // eslint-disable-next-line no-underscore-dangle
                  if (p._id === passengerId) {
                    p.profileUrl = results.url;
                  }

                  return p;
                });

                _user2.default.findOneAndUpdateAsync({ _id: foundUser._id }, { $set: { passengerList: passengerList } }, { new: true }) //eslint-disable-line
                .then(function (updateUser) {
                  var newPassengerList = updateUser.passengerList;
                  res.send({ success: true, message: 'Passenger image successfully updated', data: newPassengerList });
                }).catch(function () {
                  res.send({ data: err, message: 'Unable to update passenger image' });
                });
              }).catch(function () {
                res.send({ data: err, message: 'Error in updating passenger image' });
              });
            }
          }
        });
      });
    } else {
      var returnObj = {
        success: false,
        message: 'Problem in updating',
        data: req.user
      };
      res.send(returnObj);
    }
  });
};
//# sourceMappingURL=passenger.js.map
