import mongoose, { Schema } from 'mongoose';

/**
 * User locations Schema (Address book)
 */
const RouteSchema = new Schema({
  adminId: { type: Schema.Types.ObjectId, ref: 'User' },
  stopDurationSource: {type: Number, default: 600}, // duration in seconds
  name: {type: String},
  locationId: { type: Schema.Types.ObjectId, ref: 'AdminLocation' },
  address: { type: String, default: null },
  createdAt: { type: Date, default: new Date().toISOString() },
  updatedAt: { type: Date, default: new Date().toISOString() },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  terminals: [{
    timeToNextTerminal: {type: Number, default: 0},
    sequenceNo: { type: Number },
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
    deletedAt: { type: Date, default: null },
    tripRequests: { type: [Schema.Types.Mixed], default: [] }
  }]
});

export default mongoose.model('routes', RouteSchema);
