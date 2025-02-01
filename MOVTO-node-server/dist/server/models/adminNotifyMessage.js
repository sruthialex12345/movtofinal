'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var AdminNotifyMessageSchema = new _mongoose.Schema({
  userIdAdmin: { type: _mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, default: 'Run your business on the go. Download CircularDrive.  \n\nAnroid : https://bit.ly/2SXLD3H \niOS: https://apple.co/2Tn7OiW' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

exports.default = _mongoose2.default.model('AdminNotifyMessage', AdminNotifyMessageSchema);
module.exports = exports.default;
//# sourceMappingURL=adminNotifyMessage.js.map
