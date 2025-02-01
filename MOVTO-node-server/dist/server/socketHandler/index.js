'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _adminSocket = require('./story/admin-socket');

var _adminSocket2 = _interopRequireDefault(_adminSocket);

var _nearbyDriverHandler = require('./story/nearby-driver-handler');

var _nearbyDriverHandler2 = _interopRequireDefault(_nearbyDriverHandler);

var _requestTrip = require('./story/request-trip');

var _requestTrip2 = _interopRequireDefault(_requestTrip);

var _requestTrip3 = require('./story_v1/request-trip');

var _requestTrip4 = _interopRequireDefault(_requestTrip3);

var _updateTripRequest = require('./story_v1/update-trip-request');

var _updateTripRequest2 = _interopRequireDefault(_updateTripRequest);

var _socketStore = require('../service/socket-store');

var _socketStore2 = _interopRequireDefault(_socketStore);

var _startTrip = require('./story/start-trip');

var _startTrip2 = _interopRequireDefault(_startTrip);

var _updateLocation = require('./story/update-location');

var _updateLocation2 = _interopRequireDefault(_updateLocation);

var _userHandler = require('./story/user-handler');

var _userHandler2 = _interopRequireDefault(_userHandler);

var _fetchrides = require('./story/fetchrides');

var _fetchrides2 = _interopRequireDefault(_fetchrides);

var _cancelTrip = require('./story/cancel-trip');

var _cancelTrip2 = _interopRequireDefault(_cancelTrip);

var _updateTripRequest3 = require('./story/update-trip-request');

var _updateTripRequest4 = _interopRequireDefault(_updateTripRequest3);

var _userTypes = require('../constants/user-types');

var _updateLocation3 = require('./story_v1/update-location');

var _updateLocation4 = _interopRequireDefault(_updateLocation3);

var _requestTrip5 = require('./story_v2/request-trip');

var _requestTrip6 = _interopRequireDefault(_requestTrip5);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var socketHandler = function socketHandler(socket) {
  (0, _requestTrip2.default)(socket);
  (0, _requestTrip4.default)(socket);
  (0, _requestTrip6.default)(socket);
  (0, _startTrip2.default)(socket);
  (0, _updateLocation2.default)(socket);
  (0, _updateLocation4.default)(socket);
  (0, _nearbyDriverHandler2.default)(socket);
  (0, _adminSocket2.default)(socket);
  (0, _userHandler2.default)(socket);
  (0, _fetchrides2.default)(socket);
  (0, _cancelTrip2.default)(socket);
  (0, _updateTripRequest4.default)(socket);
  (0, _updateTripRequest2.default)(socket);

  socket.on('hello', function (data) {
    console.log('listen to hello', data);
    socket.emit('helloResponse', 'hello everyone');
  });

  socket.on('disconnect', function () {
    console.log('disconnecting socket, userType, id, tripid', socket.userType, socket.userId, socket.tripID);
    var userId = '';

    if (socket.userType == _userTypes.USER_TYPE_ADMIN && socket.tripID) {
      userId = socket.authToken + '/' + socket.tripID + '/';
    } else {
      userId = socket.authToken + '/' + socket.userId + '/';
    }
    _socketStore2.default.removeByUserId(userId, socket);
  });
};

exports.default = socketHandler;
module.exports = exports.default;
//# sourceMappingURL=index.js.map
