'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * AppConfig Schema
 */
var DriverDocumentsSchema = new _mongoose.Schema({
  driverId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  documentId: { type: _mongoose.Schema.Types.ObjectId, default: null },
  uri: { type: String, default: null },
  expirationDate: { type: Date },
  addedDate: { type: Date, default: new Date().toISOString() },
  deletedDate: { type: Date, default: null }
});

exports.default = _mongoose2.default.model('driver_document', DriverDocumentsSchema);
module.exports = exports.default;
//# sourceMappingURL=driverDocuments.js.map
