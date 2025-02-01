'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _env = require('../../../config/env');

var _env2 = _interopRequireDefault(_env);

var _socketStore = require('../../service/socket-store.js');

var _socketStore2 = _interopRequireDefault(_socketStore);

var _user = require('../../models/user');

var _user2 = _interopRequireDefault(_user);

var _userTypes = require('../../constants/user-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//eslint-disable-line
function nearbyDriverHandler(socket) {
  socket.on('updatePickupRegion', function (userRegion) {
    // get the rider id
    // update the coordinates in database
    // for simulation emit coordinates to all connected drivers
    // fire query to get nearby drivers from database
    // emit the resultant array in callback
    var coordinates = [userRegion.region.latitude, userRegion.region.longitude];
    // eslint-disable-next-line
    var userId = userRegion.user._id;
    console.log(userId);
    // for simulation only
    // socket.broadcast.emit('riderMapCoordinates', coordinates);
    // simulation ends
    _user2.default.findOneAndUpdateAsync({ _id: userId }, { $set: { mapCoordinates: coordinates } }, { new: true }).then(function (updatedUser) {
      return _user2.default.findAsync({
        $and: [{ gpsLoc: { $geoWithin: { $centerSphere: [updatedUser.mapCoordinates, _env2.default.radius] } } }, { currTripId: null, currTripState: null }, { loginStatus: true }, { userType: _userTypes.USER_TYPE_DRIVER }, { isAvailable: true }]
      });
    }).then(function (driverArray) {
      if (driverArray) {
        console.log(driverArray.length, 'driverArray');
        _socketStore2.default.emitByUserId(userId, 'nearByDriversList', driverArray);
      }
    });
  });
}

exports.default = nearbyDriverHandler;
module.exports = exports.default;
//# sourceMappingURL=nearby-driver-handler.js.map
