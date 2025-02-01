'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _userTypes = require('../constants/user-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** check if driver has access code verified */

function driverAccessCode(req, res, next) {
  if (req.user.accessCodeVerified) {
    next();
  } else {
    var err = new _APIError2.default('Access Denied', _httpStatus2.default.UNAUTHORIZED, true);
    return next(err);
  }
}

function isDriver(req, res, next) {
  if (req.user.userType === _userTypes.USER_TYPE_DRIVER) {
    next();
  } else {
    var err = new _APIError2.default('Access Denied', _httpStatus2.default.UNAUTHORIZED, true);
    return next(err);
  }
}

exports.default = {
  driverAccessCode: driverAccessCode,
  isDriver: isDriver
};
module.exports = exports.default;
//# sourceMappingURL=authorization.js.map
