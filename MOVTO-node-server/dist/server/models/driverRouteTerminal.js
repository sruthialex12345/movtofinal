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
var DriverRouteTerminalSchema = new _mongoose.Schema({
  isSelected: { type: Boolean, default: false },
  driverId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
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
});

exports.default = _mongoose2.default.model('driverRouteTerminals', DriverRouteTerminalSchema);
module.exports = exports.default;
//# sourceMappingURL=driverRouteTerminal.js.map
