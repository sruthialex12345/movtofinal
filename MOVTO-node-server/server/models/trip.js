import httpStatus from 'http-status';
import mongoose, { Schema } from 'mongoose';
import APIError from '../helpers/APIError';
import UserSchema from './user';
import Utilities from '../helpers/util';

const debug = require('debug')('MGD-API: trip model');

const TripSchema = new Schema({
  // riderId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  driver: {
    _id: {type: Schema.Types.ObjectId, ref: 'User'},
    name: {type: String, default: null}, // for riders only (not confirmed yet)
    fname: {type: String, default: null},
    lname: {type: String, default: null},
    email: { type: String, default: null },
    locationId: { type: Schema.Types.ObjectId, ref: 'AdminLocation' },
    gpsLoc: {
      type: [Number],
      index: '2d',
    },
    latitudeDelta: { type: Number, default: 0.013 },
    longitudeDelta: { type: Number, default: 0.022 },
    profileUrl: {
      type: String
    },
    activeStatus: { type: Boolean, default: false }, // if active on trip
    // driver properties
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    locationId: { type: Schema.Types.ObjectId, ref: 'AdminLocation' },
    // dynamicRoute | circularStaticRoute | directStaticRoute
    tripType: { type: String, default: null },
    route: {
      _id: {type: Schema.Types.ObjectId, ref: 'routes'},
      stopDurationSource: {type: Number},
      adminId: { type: Schema.Types.ObjectId, ref: 'User' },
      name: {type: String},
      locationId: { type: Schema.Types.ObjectId, ref: 'AdminLocation' },
      address: { type: String, default: null },
      createdAt: { type: Date, default: new Date().toISOString() },
      updatedAt: { type: Date, default: new Date().toISOString() },
      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date, default: null },
      terminals: [{
        _id: {type: Schema.Types.ObjectId},
        timeToNextTerminal: {type: Number, default: 0},
        sequenceNo: { type: Number },
        adminId: { type: Schema.Types.ObjectId, ref: 'User' },
        isSelected: { type: Boolean, default: false },
        loc: {type: [Number, Number], index: '2d'},
        address: { type: String, default: null },
        name: { type: String, default: null },
        // terminal(default) | waypoint | startTerminal | endTerminal
        type: { type: String, default: 'terminal' },
        createdAt: { type: Date, default: new Date().toISOString() },
        updatedAt: { type: Date, default: new Date().toISOString() },
        tripRequests: { type: [Schema.Types.Mixed], default: [] },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
      }]
    },
    isAvailable: { type: Boolean, default: true }
  },
  shuttleId: { type: Schema.Types.ObjectId, ref: 'AdminVehicle', default: null },
  transferredTo: { type: Schema.Types.ObjectId, ref: 'trip', default: null },
  gpsLoc: {
    type: [Number],
    index: '2d',
  },
  // srcLoc: {
  //   type: [Number],
  //   index: '2d',
  // },
  // destLoc: {
  //   type: [Number],
  //   index: '2d',
  // },
  tripStartAt: { type: Date, default: (new Date()).toISOString()  },
  tripEndTime: { type: Date, default: null },
  tripRequests: {type: Array, default: []},
  seatBooked: { type: Number, default: 0 },
  seatsAvailable: { type: Number, default: 0 },
  // tripStartAt: { type: Date,default: Date.now  },
  // tripEndTime: { type: Date, default: null },
  // seatBooked: { type: Number, default: 0 },
  tripIssue: { type: String, default: 'noIssue' },
  roadMapUrl: { type: String, default: null },
  passengerIds: { type: Array, default: [] },
  visitedTerminalIds: { type: [Schema.Types.ObjectId], default: [] },
  visitedTerminalsCount: { type: Number, default: 0 },
  toDestination: { type: Boolean, default: true },
  visitedTerminal: { type: Schema.Types.Mixed, default: null },
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

TripSchema.path('driver._id').validate((driverId, respond) => {
  debug(`inside validator with driverId value ->${driverId}`);
  return UserSchema.findByIdAsync(driverId).then((driverData) => {
    if (driverData) {
      return respond(true);
    } else {
      debug(`driver validation failed ${driverData}`);
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
  list({ skip, limit, filter } = {}) {
    let searchObj = {};
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
    return this.find(searchObj)
      .sort({ _id: -1 })
      .select('-__v')
      .skip(skip)
      .limit(limit)
      .populate('riderId driverId')
      .execAsync();
  },

  get(tripId) {
    return this.findById(tripId)
      .populate('shuttleId driverId')
      .execAsync()
      .then((tripObj) => {
        if (tripObj) {
          return tripObj;
        }
        const err = new APIError('No such trip exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  getCount(filter) {
    let searchObj = {};
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

  updateSeats(query,availableSeats,bookedSeat) {
    console.log(">>>>>>>>>>>>>>>>>>>");
    console.log("                     ");
    console.log("updating seats avai booked", availableSeats, bookedSeat);
    console.log("                     ");
    console.log(">>>>>>>>>>>>>>>>>>>");
    return this.updateAsync(query, {$set: {seatsAvailable: availableSeats,seatBooked: bookedSeat}}, {new: true})
  },
};

export default mongoose.model('trip', TripSchema);
