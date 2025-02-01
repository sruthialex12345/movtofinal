'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _serverConfig = require('../models/serverConfig');

var _serverConfig2 = _interopRequireDefault(_serverConfig);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//eslint-disable-line

function getConfig(req, res, next) {
  // eslint-disable-next-line
  _serverConfig2.default.find(function (error, configData) {
    if (error) {
      var err = new _APIError2.default('error while finding corresponding data  ' + error, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      return next(err);
    }
    var configObj = {};
    _lodash2.default.map(configData, function (keyData) {
      configObj[keyData.key] = keyData.value;
    });
    res.send(configObj);
  });
}

function updateConfig(req, res, next) {
  var reqObj = (0, _assign2.default)({}, req.body);
  var result = [];
  var keys = _lodash2.default.keys(reqObj);
  var values = _lodash2.default.values(reqObj);
  _lodash2.default.map(keys, function (keyitem, index) {
    _serverConfig2.default.findOneAsync({ key: keyitem }).then(function (foundKey) {
      if (foundKey !== null) {
        _serverConfig2.default.findOneAndUpdateAsync({ key: keyitem }, { $set: { value: values[index] } }, { new: true }).then(function (updatedConfigObj) {
          if (updatedConfigObj) {
            result.push(updatedConfigObj);
            res.send(result);
          }
        }).error(function (e) {
          var err = new _APIError2.default('error in updating user details while login ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          next(err);
        });
      } else {
        var newConfig = new _serverConfig2.default({
          type: (0, _typeof3.default)(values[index]),
          key: keyitem,
          value: values[index]
        });
        newConfig.saveAsync().then(function (savedConfigObj) {
          result.push(savedConfigObj);
          if (result.length === keys.length) {
            res.send(result);
          }
        }).error(function (e) {
          return next(e);
        });
      }
    });
  });
}

exports.default = { getConfig: getConfig, updateConfig: updateConfig };
module.exports = exports.default;
//# sourceMappingURL=server-config.js.map
