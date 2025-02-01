'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _driver;

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _user = require('./user');

var _user2 = _interopRequireDefault(_user);

var _util = require('../helpers/util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('MGD-API: trip model');

var TripSchema = new _mongoose.Schema({
  // riderId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  driver: (_driver = {
    _id: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, default: null }, // for riders only (not confirmed yet)
    fname: { type: String, default: null },
    lname: { type: String, default: null },
    email: { type: String, default: null },
    locationId: { type: _mongoose.Schema.Types.ObjectId, ref: 'AdminLocation' },
    gpsLoc: {
      type: [Number],
      index: '2d'
    },
    latitudeDelta: { type: Number, default: 0.013 },
    longitudeDelta: { type: Number, default: 0.022 },
    profileUrl: {
      type: String
    },
    activeStatus: { type: Boolean, default: false }, // if active on trip
    // driver properties
    adminId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' }
  }, (0, _defineProperty3.default)(_driver, 'locationId', { type: _mongoose.Schema.Types.ObjectId, ref: 'AdminLocation' }), (0, _defineProperty3.default)(_driver, 'tripType', { type: String, default: null }), (0, _defineProperty3.default)(_driver, 'route', {
    _id: { type: _mongoose.Schema.Types.ObjectId, ref: 'routes' },
    stopDurationSource: { type: Number },
    adminId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    locationId: { type: _mongoose.Schema.Types.ObjectId, ref: 'AdminLocation' },
    address: { type: String, default: null },
    createdAt: { type: Date, default: new Date().toISOString() },
    updatedAt: { type: Date, default: new Date().toISOString() },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    terminals: [{
      _id: { type: _mongoose.Schema.Types.ObjectId },
      timeToNextTerminal: { type: Number, default: 0 },
      sequenceNo: { type: Number },
      adminId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
      isSelected: { type: Boolean, default: false },
      loc: { type: [Number, Number], index: '2d' },
      address: { type: String, default: null },
      name: { type: String, default: null },
      // terminal(default) | waypoint | startTerminal | endTerminal
      type: { type: String, default: 'terminal' },
      createdAt: { type: Date, default: new Date().toISOString() },
      updatedAt: { type: Date, default: new Date().toISOString() },
      tripRequests: { type: [_mongoose.Schema.Types.Mixed], default: [] },
      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date, default: null }
    }]
  }), (0, _defineProperty3.default)(_driver, 'isAvailable', { type: Boolean, default: true }), _driver),
  shuttleId: { type: _mongoose.Schema.Types.ObjectId, ref: 'AdminVehicle', default: null },
  transferredTo: { type: _mongoose.Schema.Types.ObjectId, ref: 'trip', default: null },
  gpsLoc: {
    type: [Number],
    index: '2d'
  },
  // srcLoc: {
  //   type: [Number],
  //   index: '2d',
  // },
  // destLoc: {
  //   type: [Number],
  //   index: '2d',
  // },
  tripStartAt: { type: Date, default: new Date().toISOString() },
  tripEndTime: { type: Date, default: null },
  tripRequests: { type: Array, default: [] },
  seatBooked: { type: Number, default: 0 },
  seatsAvailable: { type: Number, default: 0 },
  // tripStartAt: { type: Date,default: Date.now  },
  // tripEndTime: { type: Date, default: null },
  // seatBooked: { type: Number, default: 0 },
  tripIssue: { type: String, default: 'noIssue' },
  roadMapUrl: { type: String, default: null },
  passengerIds: { type: Array, default: [] },
  visitedTerminalIds: { type: [_mongoose.Schema.Types.ObjectId], default: [] },
  visitedTerminalsCount: { type: Number, default: 0 },
  toDestination: { type: Boolean, default: true },
  visitedTerminal: { type: _mongoose.Schema.Types.Mixed, default: null },
  activeStatus: { type: Boolean, default: true },
  isScheduledTrip: { type: Boolean, default: false }
});

// TripSchema.path('riderId').validate((riderId, respond) => {
//   debug(`inside validator with riderId value ->${riderId}`);
//   return UserSchema.findByIdAsync(riderId).then((riderData) => {
//     if (riderData) {
//       return respond(true);
//     } else {
//       debug(`rider validation failed ${riderData}`);
//       return respond(false);
//     }
//   });
// }, 'Invalid Rider Id');

TripSchema.path('driver._id').validate(function (driverId, respond) {
  debug('inside validator with driverId value ->' + driverId);
  return _user2.default.findByIdAsync(driverId).then(function (driverData) {
    if (driverData) {
      return respond(true);
    } else {
      debug('driver validation failed ' + driverData);
      return respond(false);
    }
  });
}, 'Invalid DriverId');

// TripSchema.pre('update', function tripSchemaPre(next) {
//   const trip = this;
//   if (trip.isModified('activeStatus')) {
//     trip.tripStatusAt = utils.getUnixTimeStamp(new Date());
//   }

//   next();
// });

// TripSchema.pre('save', function tripSchemaPre(next) {
//   const trip = this;
//   if (trip.isModified('activeStatus') || trip.isNew) {
//     trip.tripStatusAt = utils.getUnixTimeStamp(new Date());
//   }

//   next();
// });

TripSchema.statics = {
  /**
   * List users in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list: function list() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        skip = _ref.skip,
        limit = _ref.limit,
        filter = _ref.filter;

    var searchObj = {};
    switch (filter) {
      case 'Ongoing':
        searchObj = {};
        searchObj.tripStatus = 'onTrip';
        break;
      case 'Completed':
        searchObj = {};
        searchObj.tripStatus = 'endTrip';
        break;
      default:
        searchObj = {};
    }
    return this.find(searchObj).sort({ _id: -1 }).select('-__v').skip(skip).limit(limit).populate('riderId driverId').execAsync();
  },
  get: function get(tripId) {
    return this.findById(tripId).populate('shuttleId driverId').execAsync().then(function (tripObj) {
      if (tripObj) {
        return tripObj;
      }
      var err = new _APIError2.default('No such trip exists!', _httpStatus2.default.NOT_FOUND);
      return _promise2.default.reject(err);
    });
  },
  getCount: function getCount(filter) {
    var searchObj = {};
    switch (filter) {
      case 'Ongoing':
        searchObj = {};
        searchObj.tripStatus = 'onTrip';
        break;
      case 'Completed':
        searchObj = {};
        searchObj.tripStatus = 'endTrip';
        break;
      default:
        searchObj = {};
    }
    return this.count(searchObj).execAsync();
  },
  updateSeats: function updateSeats(query, availableSeats, bookedSeat) {
    console.log(">>>>>>>>>>>>>>>>>>>");
    console.log("                     ");
    console.log("updating seats avai booked", availableSeats, bookedSeat);
    console.log("                     ");
    console.log(">>>>>>>>>>>>>>>>>>>");
    return this.updateAsync(query, { $set: { seatsAvailable: availableSeats, seatBooked: bookedSeat } }, { new: true });
  }
};

exports.default = _mongoose2.default.model('trip', TripSchema);
module.exports = exports.default;
//# sourceMappingURL=trip.js.map
