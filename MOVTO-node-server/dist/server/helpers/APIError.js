'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @extends Error
 */
var ExtendableError = function (_Error) {
  (0, _inherits3.default)(ExtendableError, _Error);

  function ExtendableError(message, status, isPublic) {
    (0, _classCallCheck3.default)(this, ExtendableError);

    var _this = (0, _possibleConstructorReturn3.default)(this, (ExtendableError.__proto__ || (0, _getPrototypeOf2.default)(ExtendableError)).call(this, message));

    _this.name = _this.constructor.name;
    _this.message = message;
    _this.status = status;
    _this.isPublic = isPublic;
    _this.isOperational = true;
    Error.captureStackTrace(_this, _this.constructor.name);
    return _this;
  }

  return ExtendableError;
}(Error);
/**
 * Class representing an API error.
 * @extends ExtendableError
 */


var APIError = function (_ExtendableError) {
  (0, _inherits3.default)(APIError, _ExtendableError);

  /**
   * Creates an API error.
   * @param {string} message - Error message.
   * @param {number} status - HTTP status code of error.
   * @param {boolean} isPublic - Whether the message should be visible to user or not.
   */
  function APIError(message) {
    var status = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _httpStatus2.default.INTERNAL_SERVER_ERROR;
    var isPublic = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    (0, _classCallCheck3.default)(this, APIError);
    return (0, _possibleConstructorReturn3.default)(this, (APIError.__proto__ || (0, _getPrototypeOf2.default)(APIError)).call(this, message, status, isPublic));
  }

  return APIError;
}(ExtendableError);

exports.default = APIError;
module.exports = exports.default;
//# sourceMappingURL=APIError.js.map
