'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _passportJwt = require('passport-jwt');

var _passportJwt2 = _interopRequireDefault(_passportJwt);

var _env = require('./env');

var _env2 = _interopRequireDefault(_env);

var _user = require('../server/models/user');

var _user2 = _interopRequireDefault(_user);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ExtractJwt = _passportJwt2.default.ExtractJwt;

var jwtStrategy = _passportJwt2.default.Strategy;

function passportConfiguration(passport) {
  var opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
  // opts.tokenQueryParameterName = ExtractJwt.fromUrlQueryParameter(auth_token);
  opts.secretOrKey = _env2.default.jwtSecret;
  passport.use(new jwtStrategy(opts, function (jwtPayload, cb) {
    _user2.default.findOneAsync({ _id: jwtPayload._id, jwtAccessToken: jwtPayload.numberunique }) //eslint-disable-line
    .then(function (user) {
      return cb(null, user);
    }).error(function (err) {
      return cb(err, false);
    });
  }));
}

exports.default = passportConfiguration;
module.exports = exports.default;
//# sourceMappingURL=passport-config.js.map
