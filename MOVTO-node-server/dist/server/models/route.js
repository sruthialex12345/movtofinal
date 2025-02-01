'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * User locations Schema (Address book)
 */
var RouteSchema = new _mongoose.Schema({
  adminId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
  stopDurationSource: { type: Number, default: 600 }, // duration in seconds
  name: { type: String },
  locationId: { type: _mongoose.Schema.Types.ObjectId, ref: 'AdminLocation' },
  address: { type: String, default: null },
  createdAt: { type: Date, default: new Date().toISOString() },
  updatedAt: { type: Date, default: new Date().toISOString() },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  terminals: [{
    timeToNextTerminal: { type: Number, default: 0 },
    sequenceNo: { type: Number },
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
    deletedAt: { type: Date, default: null },
    tripRequests: { type: [_mongoose.Schema.Types.Mixed], default: [] }
  }]
});

exports.default = _mongoose2.default.model('routes', RouteSchema);
module.exports = exports.default;
//# sourceMappingURL=route.js.map
