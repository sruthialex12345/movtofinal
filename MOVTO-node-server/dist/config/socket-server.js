'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _env = require('./env');

var _env2 = _interopRequireDefault(_env);

var _socketHandler = require('../server/socketHandler');

var _socketHandler2 = _interopRequireDefault(_socketHandler);

var _socketStore = require('../server/service/socket-store');

var _socketStore2 = _interopRequireDefault(_socketStore);

var _userTypes = require('../server/constants/user-types');

var _user = require('../server/models/user');

var _user2 = _interopRequireDefault(_user);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('MGD-API:socket-server');

function startSocketServer(server) {
  var io = require('socket.io').listen(server); //eslint-disable-line

  // debug('SocketServer started');
  io.on('connection', function (socket) {
    console.log("new socket client>>>>>>", socket.id);
    // debug('Client connected to socket', socket.id);
    var authToken = socket.handshake.query.token ? socket.handshake.query.token.replace('JWT ', '') : ""; // check for authentication of the socket
    _jsonwebtoken2.default.verify(authToken, _env2.default.jwtSecret, function (err, userDtls) {
      if (err) {
        socket.disconnect();
      } else if (userDtls) {
        _user2.default.findOneAsync({ _id: userDtls._id, isDeleted: false, jwtAccessToken: userDtls.numberunique }).then(function (user) {
          if (user) {
            socket.userId = userDtls._id; //eslint-disable-line
            socket.userType = userDtls.userType;
            socket.authToken = authToken;
            var userId = '';
            if (userDtls.userType == _userTypes.USER_TYPE_ADMIN && socket.handshake.query.tripID) {
              socket.tripID = socket.handshake.query.tripID;
              userId = authToken + '/' + socket.handshake.query.tripID + '/';
            } else {
              userId = authToken + '/' + socket.userId + '/';
            }
            debug('inside socket server \n\n ' + userDtls._id + ' ' + userDtls.email + ' ' + userDtls.fname); //eslint-disable-line
            // SocketStore.addByUserId(socket.userId, socket);
            _socketStore2.default.addByUserId(userId, socket);
            (0, _socketHandler2.default)(socket); // call socketHandler to handle different socket scenario
          } else {
            socket.disconnect();
          }
        }).error(function (e) {
          socket.disconnect();
        });
      }
    });
  });
}

exports.default = { startSocketServer: startSocketServer };
module.exports = exports.default;
//# sourceMappingURL=socket-server.js.map
