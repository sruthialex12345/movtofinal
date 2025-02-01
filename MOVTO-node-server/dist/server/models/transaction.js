'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TransactionSchema = new _mongoose.Schema({
  userIdTo: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
  userIdFrom: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, default: null },
  tripId: { type: _mongoose.Schema.Types.ObjectId, ref: 'trip', default: null },
  createdAt: { type: Date, default: new Date().toISOString() },
  updatedAt: { type: Date, default: new Date().toISOString() }
});

exports.default = _mongoose2.default.model('Transaction', TransactionSchema);
module.exports = exports.default;
//# sourceMappingURL=transaction.js.map
