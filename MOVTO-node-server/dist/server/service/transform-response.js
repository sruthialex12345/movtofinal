'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fetchReturnObj = fetchReturnObj;
exports.getRiderObj = getRiderObj;
exports.getDriverDtls = getDriverDtls;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

var _userTypes = require('../constants/user-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function fetchReturnObj(obj) {
  var returnObj = {};
  returnObj = obj.toObject();
  return new _bluebird2.default(function (resolve, reject) {
    getRiderObj(returnObj.riderId).then(function (riderObj) {
      if (riderObj) {
        returnObj.rider = riderObj;
      }
    }).then(function () {
      return getDriverDtls(returnObj.driverId, reject).then(function (driverObj) {
        returnObj.driver = driverObj;
      });
    }).then(function () {
      resolve(returnObj);
      return returnObj;
    });
  });
}

function getRiderObj(riderId) {
  return _user2.default.findOneAsync({ _id: riderId, userType: _userTypes.USER_TYPE_RIDER });
}

function getDriverDtls(driverId, reject) {
  return _user2.default.findOneAsync({ _id: driverId, userType: _userTypes.USER_TYPE_DRIVER })
  // .then((userDtls) => {
  //   if (userDtls) {
  //     return DriverSchema.findOneAsync({ driverId: userDtls._id }). then((driverExtraDetails) => {
  //       if (driverExtraDetails) {
  //         const userObject = userDtls.toObject();
  //         userObject.carDetails = driverExtraDetails.carDetails;
  //         return userObject;
  //       }
  //     })
  //     .error((e) => reject(e));
  //   }
  // })
  .error(function (errDriverDtls) {
    return reject(errDriverDtls);
  });
}
//# sourceMappingURL=transform-response.js.map
