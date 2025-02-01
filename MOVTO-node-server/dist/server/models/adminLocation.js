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
var AdminLocationSchema = new _mongoose.Schema({
  userIdAdmin: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
  radius: { type: Number, default: 0 },
  name: { type: String, default: null },
  zone: {
    location: { type: [Number, Number], index: '2d' },
    formattedAddress: { type: _mongoose.Schema.Types.String, default: " " }
  },
  polygons: {
    type: { type: String, default: "Polygon" },
    coordinates: { type: [[[Number, Number]]] }
  },
  createdAt: { type: Date, default: new Date().toISOString() },
  updatedAt: { type: Date, default: new Date().toISOString() },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
});

exports.default = _mongoose2.default.model('AdminLocation', AdminLocationSchema);
module.exports = exports.default;
//# sourceMappingURL=adminLocation.js.map
