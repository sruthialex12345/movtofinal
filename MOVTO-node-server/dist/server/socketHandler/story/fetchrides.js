'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _trip = require('../../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _socketStore = require('../../service/socket-store');

var _socketStore2 = _interopRequireDefault(_socketStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function fetchRidesUptoSevenDays(socket) {
  /**
   * updateLocation event is fired by rider or driver whenever their location is changed. also it send location update to corresponding rider or driver if they are in any tripRequest or trip.
   * @param userObj - user whose location has to be updated
   * @returns emit an updateDriverLocation or updateRiderLocation event based on userType.
   */

  socket.on('availableRides', function (driverId) {
    var currentDate = new Date().toISOString();
    var sevenDaysDate = new Date((0, _moment2.default)(currentDate).add(7, 'days'));
    _trip2.default.aggregateAsync([{ $match: { bookingTime: { $gt: currentDate, $lt: sevenDaysDate }, tripStatus: 'unclaimed' } }]).then(function (ridesData) {
      if (ridesData.length > 0) {
        _socketStore2.default.emitByUserId(driverId, 'Seven days rides', ridesData);
      } else {
        _socketStore2.default.emitByUserId(driverId, 'No rides are available', ridesData);
      }
    }).catch(function () {
      var ridesData = [];
      _socketStore2.default.emitByUserId(driverId, 'server error while finding available rides  ', ridesData);
    });
  });
}

exports.default = fetchRidesUptoSevenDays;
module.exports = exports.default;
//# sourceMappingURL=fetchrides.js.map
