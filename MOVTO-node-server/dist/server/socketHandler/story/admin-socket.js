'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _socketStore = require('../../service/socket-store.js');

var _socketStore2 = _interopRequireDefault(_socketStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function dashboardHandler() {
  // console.log(socket, 'socket in dashboardHandler');
  // SocketStore.display();
  // SocketStore.emitByUserId(
  //   '59428b1bb0c3cc0f554fd52a',
  //   'getDriverDetails',
  //   'test'
  // );
  // const data = {
  //   name: 'admin',
  // };
  console.log(_socketStore2.default);
  // socket.emit('getDriverDetails', data);
  // SocketStore.emitByUserId(
  //   '59428b1bb0c3cc0f554fd52a',
  //   'getDriverDetails',
  //   data
  // );
  // SocketStore.emitByUserId(tripRequestObj.riderId, 'socketError', { message: 'error while updating tripRequestStatus based on distance', data: err });
  // SocketStore.emitByUserId(tripRequestObj.driverId, 'socketError', { message: 'error while updating tripRequestStatus based on distance', data: err });
} /* eslint-disable */
exports.default = dashboardHandler;
module.exports = exports.default;
//# sourceMappingURL=admin-socket.js.map
