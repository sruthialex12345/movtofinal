'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * User Review Schema (Address book)
 */
var ReviewSchema = new _mongoose.Schema({
  reviewerId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewToId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  adminId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewToType: { type: String, default: null },
  message: { type: String, default: 0 },
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: new Date().toISOString() },
  updatedAt: { type: Date, default: new Date().toISOString() },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
});

exports.default = _mongoose2.default.model('reviews', ReviewSchema);
module.exports = exports.default;
//# sourceMappingURL=review.js.map
