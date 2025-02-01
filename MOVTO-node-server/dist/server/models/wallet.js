'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _userTypes = require('../constants/user-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var WalletSchema = new _mongoose.Schema({
  userEmail: { type: String, default: null },
  userId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
  userType: { type: String, default: _userTypes.USER_TYPE_RIDER },
  stripeAccountId: { type: String, default: null },
  walletBalance: { type: Number, default: 0 },
  createdAt: { type: Date, default: new Date().toISOString() },
  updatedAt: { type: Date, default: new Date().toISOString() }
});

exports.default = _mongoose2.default.model('Wallet', WalletSchema);
module.exports = exports.default;
//# sourceMappingURL=wallet.js.map
