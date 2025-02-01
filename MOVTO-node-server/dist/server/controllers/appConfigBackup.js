'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _appConfig = require('../models/appConfig');

var _appConfig2 = _interopRequireDefault(_appConfig);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');

/**
 * Return the trip details of the user.
 * @param req
 * @param res
 * @param next
 * @returns { trip: historyObjArray[{ tripObj }]  }
 */
function getConfig(req, res, next) {
  // eslint-disable-next-line
  _appConfig2.default.find(function (error, configData) {
    if (error) {
      var err = new _APIError2.default('error while finding version number for the user  ' + error, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      return next(err);
    }
    res.send(configData);
  });
}

function updateVersion(next) {
  return new _promise2.default(function (resolve, reject) {
    _appConfig2.default.findOneAsync({ key: 'version' }).then(function (foundKey) {
      if (foundKey !== null) {
        var prevValue = foundKey.value;
        var newVersion = prevValue + 1;
        _appConfig2.default.findOneAndUpdateAsync({ key: 'version' }, { $set: { value: newVersion, type: 'Number' } }, { new: true }).then(function (updatedVersion) {
          if (updatedVersion) {
            resolve(updatedVersion);
          }
        }).error(function (e) {
          var err = new _APIError2.default('error in updating user details while login ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          next(err);
        });
      } else {
        var newVersionConfig = new _appConfig2.default({
          type: 'Number',
          key: 'version',
          value: 1
        });
        newVersionConfig.saveAsync().then(function (savedVersionConfigObj) {
          resolve(savedVersionConfigObj);
        }).error(function (e) {
          return reject(e);
        });
      }
    });
  });
}

function updateConfig(req, res, next) {
  var reqObj = (0, _assign2.default)({}, req.body);
  var result = [];
  var keys = _.keys(reqObj);
  var values = _.values(reqObj);
  _.map(keys, function (keyitem, index) {
    _appConfig2.default.findOneAsync({ key: keyitem }).then(function (foundKey) {
      if (foundKey !== null) {
        if (foundKey.value !== values[index]) {
          _appConfig2.default.findOneAndUpdateAsync({ key: keyitem }, { $set: { value: values[index] } }, { new: true }).then(function (updatedConfigObj) {
            if (updatedConfigObj) {
              result.push(updatedConfigObj);
              if (result.length === keys.length) {
                updateVersion(next).then(function (versionConfig) {
                  result.push(versionConfig);
                  res.send(result);
                });
              }
            }
          }).error(function (e) {
            var err = new _APIError2.default('error in updating user details while login ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
            next(err);
          });
        } else {
          result.push(foundKey);
          if (result.length === keys.length) {
            res.send(result);
          }
        }
      } else {
        var newConfig = new _appConfig2.default({
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
function getConfigVersion(req, res, next) {
  // eslint-disable-next-line
  _appConfig2.default.find(function (error, configData) {
    if (error) {
      var err = new _APIError2.default('error while finding version number for the user  ' + error, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      return next(err);
    }
    var returnObj = {
      success: true,
      message: 'config version number',
      data: configData.version
    };
    res.send(returnObj);
  });
}

exports.default = { getConfigVersion: getConfigVersion, getConfig: getConfig, updateConfig: updateConfig };
module.exports = exports.default;
//# sourceMappingURL=appConfigBackup.js.map
