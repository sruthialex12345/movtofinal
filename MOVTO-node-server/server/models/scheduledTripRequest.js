import mongoose, { Schema } from 'mongoose';
import { TRIP_REQUEST_INIT } from '../constants/schedule-request-statuses';

const ScheduledTripRequestSchema = new Schema({
  isDeleted: { type: Boolean, default: false },
  riderId: { type: Schema.Types.ObjectId, ref: 'User' },
  tripId: { type: Schema.Types.ObjectId, ref: 'trip' },
  tripRequestId: { type: Schema.Types.ObjectId, ref: 'tripRequest' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  adminId: { type: Schema.Types.ObjectId, ref: 'User' },
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
  requestTime: { type: Date, default: (new Date()).toISOString() },
  requestUpdatedTime: { type: Date, default: (new Date()).toISOString() },
  scheduledTime: { type: Date, default: null },
  seatBooked: { type: Number, default: 1},
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, default: TRIP_REQUEST_INIT }
});

ScheduledTripRequestSchema.statics = {

};

export default mongoose.model('scheduledTripRequest', ScheduledTripRequestSchema);
