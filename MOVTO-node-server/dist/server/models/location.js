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
var LocationSchema = new _mongoose.Schema({
  userId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
  locationId: { type: _mongoose.Schema.Types.ObjectId },
  address: { type: String, default: null },
  name: { type: String, default: null },
  createdAt: { type: Date, default: new Date().toISOString() },
  updatedAt: { type: Date, default: new Date().toISOString() },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
});

exports.default = _mongoose2.default.model('locations', LocationSchema);
module.exports = exports.default;
//# sourceMappingURL=location.js.map
