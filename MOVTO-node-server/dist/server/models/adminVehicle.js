'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var AdminVehicleSchema = new _mongoose.Schema({
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
  userIdAdmin: { type: _mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  accessCode: { type: String, default: null },
  name: { type: String, default: null, required: true },
  company: { type: String, default: null },
  carModel: { type: String, default: null },
  vehicleNo: { type: String, default: null },
  type: { type: String, default: null },
  regNo: { type: String, default: null },
  RC_ownerName: { type: String, default: null },
  color: { type: String, default: null },
  locationId: { type: _mongoose.Schema.Types.ObjectId, ref: 'AdminLocation' },
  regDate: { type: Date, default: null },
  imageUrl: { type: String, default: null },
  state: { type: String, default: null },
  country: { type: String, default: null },
  isAvailable: { type: Boolean, default: true },
  activeStatus: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  seats: { type: Number, default: 4 }
}, { timestamps: true });

exports.default = _mongoose2.default.model('AdminVehicle', AdminVehicleSchema);
module.exports = exports.default;
//# sourceMappingURL=adminVehicle.js.map
