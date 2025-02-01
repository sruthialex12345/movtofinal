'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _socketStore = require('../../service/socket-store.js');

var _socketStore2 = _interopRequireDefault(_socketStore);

var _user = require('../../models/user');

var _user2 = _interopRequireDefault(_user);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * user handler, handle update of the driver availability and send to riders
 * * @param socket object
 * @returns {*}
 */
function userHandler(socket) {
  socket.on('updateAvailable', function (userObj) {
    console.log('update available', userObj);
    // eslint-disable-next-line
    var userID = userObj._id;
    _user2.default.findOneAndUpdateAsync({ _id: userID }, { $set: { isAvailable: userObj.isAvailable } }, { new: true }).then(function (updatedUser) {
      // SocketStore.emitByUserId(userID, 'updateAvailable', updatedUser);
      _socketStore2.default.emitToAll('updateAvailable', updatedUser);
    }).error(function (e) {
      _socketStore2.default.emitByUserId(userID, 'socketError', e);
    });
  });
} //eslint-disable-line
exports.default = userHandler;
module.exports = exports.default;
//# sourceMappingURL=user-handler.js.map
