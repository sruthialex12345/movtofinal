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
var DocumentTypeSchema = new _mongoose.Schema({
  name: { type: String, default: null },
  requiredForApproval: { type: Boolean, default: true },
  addedDate: { type: Date, default: new Date().toISOString() },
  deletedDate: { type: Date, default: null }
});

exports.default = _mongoose2.default.model('document_types', DocumentTypeSchema);
module.exports = exports.default;
//# sourceMappingURL=documentTypes.js.map
