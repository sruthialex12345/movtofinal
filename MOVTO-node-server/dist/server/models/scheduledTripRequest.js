'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _scheduleRequestStatuses = require('../constants/schedule-request-statuses');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ScheduledTripRequestSchema = new _mongoose.Schema({
  isDeleted: { type: Boolean, default: false },
  riderId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
  tripId: { type: _mongoose.Schema.Types.ObjectId, ref: 'trip' },
  tripRequestId: { type: _mongoose.Schema.Types.ObjectId, ref: 'tripRequest' },
  createdBy: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
  srcLoc: {
    _id: { type: _mongoose.Schema.Types.ObjectId },
    sequenceNo: { type: Number },
    timeToNextTerminal: { type: Number, default: 0 },
    isSelected: { type: Boolean, default: false },
    adminId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
    loc: { type: [Number, Number], index: '2d' },
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
    _id: { type: _mongoose.Schema.Types.ObjectId },
    sequenceNo: { type: Number },
    timeToNextTerminal: { type: Number, default: 0 },
    isSelected: { type: Boolean, default: false },
    adminId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
    loc: { type: [Number, Number], index: '2d' },
    address: { type: String, default: null },
    name: { type: String, default: null },
    // terminal(default) | waypoint | startTerminal | endTerminal
    type: { type: String, default: 'terminal' },
    createdAt: { type: Date, default: new Date().toISOString() },
    updatedAt: { type: Date, default: new Date().toISOString() },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  requestTime: { type: Date, default: new Date().toISOString() },
  requestUpdatedTime: { type: Date, default: new Date().toISOString() },
  scheduledTime: { type: Date, default: null },
  seatBooked: { type: Number, default: 1 },
  assignedTo: { type: _mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, default: _scheduleRequestStatuses.TRIP_REQUEST_INIT }
});

ScheduledTripRequestSchema.statics = {};

exports.default = _mongoose2.default.model('scheduledTripRequest', ScheduledTripRequestSchema);
module.exports = exports.default;
//# sourceMappingURL=scheduledTripRequest.js.map
