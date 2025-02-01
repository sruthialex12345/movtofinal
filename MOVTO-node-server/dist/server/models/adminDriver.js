'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var AdminDriverSchema = new _mongoose.Schema({
  userIdAdmin: { type: _mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userIdDriver: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
  locationId: { type: _mongoose.Schema.Types.ObjectId, ref: 'AdminLocation' },
  accessCode: { type: _mongoose.Schema.Types.String, required: true, select: false },
  zone: {
    geometry: {
      location: {
        type: [Number, Number],
        index: '2d'
      }
    },
    formattedAddress: {
      type: _mongoose.Schema.Types.String,
      default: " "
    }
  },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

exports.default = _mongoose2.default.model('AdminDriver', AdminDriverSchema);
module.exports = exports.default;
//# sourceMappingURL=adminDriver.js.map
