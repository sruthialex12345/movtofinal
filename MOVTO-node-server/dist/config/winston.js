'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logFile = _path2.default.join(__dirname, '../../logF.log');
console.log("file to log>>>>>>>>>>", logFile);
var logger = new _winston2.default.Logger({
  transports: [new _winston2.default.transports.Console({
    json: true,
    colorize: true
  }), new _winston2.default.transports.File({ filename: _path2.default.join(logFile) })]
});

exports.default = logger;
module.exports = exports.default;
//# sourceMappingURL=winston.js.map
