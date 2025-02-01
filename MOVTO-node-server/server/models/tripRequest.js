import mongoose, { Schema } from 'mongoose';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER } from '../constants/user-types';

const TripRequestSchema = new Schema({
  riderId: { type: Schema.Types.ObjectId, ref: 'User' },
  driverId: { type: Schema.Types.ObjectId, ref: 'User' },
  adminId: { type: Schema.Types.ObjectId, ref: 'User' },
  tripId: { type: Schema.Types.ObjectId, ref: 'trip' },
  scheduledRequestId: { type: Schema.Types.ObjectId, ref: 'scheduledTripRequest' },
  isScheduled: { type: Boolean, default: false },
  srcLoc: {
    _id: { type: Schema.Types.ObjectId},
    sequenceNo: { type: Number },
    timeToNextTerminal: {type: Number, default: 0},
    isSelected: { type: Boolean, default: false },
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    loc: {type: [Number, Number], index: '2d'},
    address: { type: String, default: null },
    name: { type: String, default: null },
    // terminal(default) | waypoint | startTerminal | endTerminal
    type: { type: String, default: 'terminal' },
    createdAt: { type: Date, default: new Date().toISOString() },
    updatedAt: { type: Date, default: new Date().toISOString() },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  destLoc: {
    _id: { type: Schema.Types.ObjectId},
    sequenceNo: { type: Number },
    timeToNextTerminal: {type: Number, default: 0},
    isSelected: { type: Boolean, default: false },
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    loc: {type: [Number, Number], index: '2d'},
    address: { type: String, default: null },
    name: { type: String, default: null },
    // terminal(default) | waypoint | startTerminal | endTerminal
    type: { type: String, default: 'terminal' },
    createdAt: { type: Date, default: new Date().toISOString() },
    updatedAt: { type: Date, default: new Date().toISOString() },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  startAddress: { type: String, default: null },
  endAddress: { type: String, default: null },
  paymentMode: { type: String, default: 'CASH' },
  paymentStatus: { type: String, default: null },
  /**
   * Average waiting time by Rider
   *  waitingTime
   */
  waitingTime:{type:Number,default:300000},
  /**
   * statuses:
   * request|accepted|completed|cancelled|rejected|enRoute|arriving|arrived
   */
  tripRequestStatus: { type: String, default: 'request' },
  tripRequestIssue: { type: String, default: 'busy' },
  pickUpAddress: { type: String, default: null },
  destAddress: { type: String, default: null },
  latitudeDelta: { type: Number, default: 0.012 },
  longitudeDelta: { type: Number, default: 0.012 },
  requestTime: { type: Date, default: (new Date()).toISOString() },
  requestUpdatedTime: { type: Date, default: (new Date()).toISOString() },
  seatBooked: { type: Number, default: 1 },
});

TripRequestSchema.statics = {
  userList({
    skip = 0, limit = 10, userId = null, userType = null
  } = {}) {
    let searchObj = {};
    if (userType === USER_TYPE_RIDER) {
      searchObj = {};
      searchObj.riderId = userId;
    }
    if (userType === USER_TYPE_DRIVER) {
      searchObj = {};
      searchObj.driverId = userId;
    }
    return this.find(searchObj)
      .skip(skip)
      .limit(limit)
      .populate('riderId driverId tripId')
      .execAsync();
  },

  getUserCount(userType, userId) {
    let searchObj = {};
    if (userType === USER_TYPE_RIDER) {
      searchObj = {};
      searchObj.riderId = userId;
    }
    if (userType === USER_TYPE_DRIVER) {
      searchObj = {};
      searchObj.driverId = userId;
    }

    return this.countAsync(searchObj);
  },
};

export default mongoose.model('tripRequest', TripRequestSchema);
