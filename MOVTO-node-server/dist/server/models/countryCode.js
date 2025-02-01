"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require("mongoose");

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CountryCodeSchema = new _mongoose.Schema({
    name: { type: String, default: "United States" },
    code: { type: String, default: "US" },
    isdcode: { type: String, default: '+1' },
    createdAt: { type: Date, default: new Date().toISOString() },
    updatedAt: { type: Date, default: new Date().toISOString() }
});

exports.default = _mongoose2.default.model('countryCode', CountryCodeSchema);
module.exports = exports.default;
//# sourceMappingURL=countryCode.js.map
