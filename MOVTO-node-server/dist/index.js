'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _env = require('./config/env');

var _env2 = _interopRequireDefault(_env);

var _express = require('./config/express');

var _express2 = _interopRequireDefault(_express);

var _socketServer = require('./config/socket-server');

var _socketServer2 = _interopRequireDefault(_socketServer);

var _winston = require('./config/winston');

var _winston2 = _interopRequireDefault(_winston);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// promisify mongoose
_bluebird2.default.promisifyAll(_mongoose2.default);

// connect to mongo db
_mongoose2.default.connect(_env2.default.db, { useMongoClient: true, keepAlive: 1 }, function () {
  if (_env2.default.env === 'test') {
    _mongoose2.default.connection.db.dropDatabase();
  }
  if (process.env.DEBUG === '*') {
    _mongoose2.default.set("debug", function (collectionName, method, query, doc) {
      console.log(collectionName + '.' + method, (0, _stringify2.default)(query), doc);
    });
  }
});
_mongoose2.default.connection.on('error', function () {
  throw new Error('unable to connect to database: ' + _env2.default.db);
});

var debug = require('debug')('MGD-API:index');
// starting socket server
_socketServer2.default.startSocketServer(_express2.default);

// listen on port config.port
var cidrPort = process.env.PORT || _env2.default.port;
_express2.default.listen(cidrPort, function () {
  console.log('process env port', cidrPort);
  _winston2.default.info('Listening on port ' + cidrPort + '....');
  debug('server started on port ' + cidrPort);
});

exports.default = _express2.default;
module.exports = exports.default;
//# sourceMappingURL=index.js.map
