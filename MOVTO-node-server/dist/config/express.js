'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _compression = require('compression');

var _compression2 = _interopRequireDefault(_compression);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _expressValidation = require('express-validation');

var _expressValidation2 = _interopRequireDefault(_expressValidation);

var _expressWinston = require('express-winston');

var _expressWinston2 = _interopRequireDefault(_expressWinston);

var _helmet = require('helmet');

var _helmet2 = _interopRequireDefault(_helmet);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _methodOverride = require('method-override');

var _methodOverride2 = _interopRequireDefault(_methodOverride);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _APIError = require('../server/helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _env = require('./env');

var _env2 = _interopRequireDefault(_env);

var _routes = require('../server/routes');

var _routes2 = _interopRequireDefault(_routes);

var _winston = require('./winston');

var _winston2 = _interopRequireDefault(_winston);

var _passportConfig = require('./passport-config');

var _passportConfig2 = _interopRequireDefault(_passportConfig);

var _index = require('../server/cronJobs/index');

var cronJob = _interopRequireWildcard(_index);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();
var fs = require('fs');
if (_env2.default.env === 'development') {
  var _http = require('http');
  var server = _http.createServer(app);
  // app.use(logger('dev'));
} else if (_env2.default.env === 'staging') {
  var https = require('https');
  var privateKey = fs.readFileSync('/var/www/apps/staging/SSL/staging.pem', 'utf8');
  var certificate = fs.readFileSync('/var/www/apps/staging/SSL/7984f5174d3d6289.crt', 'utf8');
  var ca = fs.readFileSync('/var/www/apps/staging/SSL/gd_bundle-g2-g1.crt');
  var httpsOptions = { key: privateKey, cert: certificate, ca: ca };
  var server = https.createServer(httpsOptions, app);
} else {
  // const https = require('https');
  // const privateKey = fs.readFileSync('/var/www/apps/certs/private-key.pem', 'utf8');
  // const certificate = fs.readFileSync('/var/www/apps/certs/2bd0a85b033f3ce2.crt', 'utf8');
  // var ca = fs.readFileSync('/var/www/apps/certs/gd_bundle-g2-g1.crt');
  // const httpsOptions = {key: privateKey, cert: certificate, ca: ca};
  // var server = https.createServer(httpsOptions, app);
  var http = require('http');
  var server = http.createServer(app);
}
// var allowCrossDomain = function(req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
//   res.header('Access-Control-Allow-Credentials', true);
//   res.header('Access-Control-Expose-Headers', 'Authorization')
//   res.header('Access-Control-Allow-Headers', 'Content-Type,Origin, X-Requested-With, Content-Type, Accept, Authorization');
//   // if ('OPTIONS' == req.method) {
//   //   res.send(200);
//   // } else {
//     next();
//   //}
// };

// app.use(allowCrossDomain);
// parse body params and attache them to req.body
app.use(_bodyParser2.default.json({ limit: '500mb' }));
app.use(_bodyParser2.default.urlencoded({ extended: true }));

app.use((0, _cookieParser2.default)());
app.use((0, _compression2.default)());
app.use((0, _methodOverride2.default)());

// configure passport for authentication
(0, _passportConfig2.default)(_passport2.default);
app.use(_passport2.default.initialize());

// secure apps by setting various HTTP headers
app.use((0, _helmet2.default)());

// enable CORS - Cross Origin Resource Sharing
app.use((0, _cors2.default)());

// enable detailed API logging in dev env
if (_env2.default.env === 'development') {
  _expressWinston2.default.requestWhitelist.push('body');
  _expressWinston2.default.responseWhitelist.push('body');
  app.use(function (req, res, next) {
    console.log("***********URL****************");
    console.log(req.originalUrl);
    console.log("***************************");
    next();
  });
}
app.use(_express2.default.static(_path2.default.resolve(__dirname, '../../public')));

app.use('/uploads/avtars', _express2.default.static(__dirname + '/../uploads/avtars'));
app.use('/uploads/shuttles', _express2.default.static(__dirname + '/../uploads/shuttles'));

// mount public folder on / path
// app.get('/', (req, res) => {
//   res.sendFile(path.resolve(__dirname, '../../public/index.html'));
// });

// mount all routes on /api path
app.use('/api', _routes2.default);

app.get('/*', function (req, res) {
  res.sendFile(_path2.default.resolve(__dirname, '../../public/index.html'));
});

// initialise cron job
cronJob.checkAndProcessScheduledRequests();
cronJob.notifyRiderDriverBeforeAnHour();
cronJob.notificationIfNoActiveTrip();
// cronJob.notifyUserUnclaimedRidesAtEight();
// cronJob.notifyUserUnclaimedRidesAtNine();
// cronJob.notifyUserUnclaimedRides30MinBefore();
// cronJob.emailDriverWeekly();
// cronJob.cancelRideRequestAfter10Min();

// if error is not an instanceOf APIError, convert it.
app.use(function (err, req, res, next) {
  if (err instanceof _expressValidation2.default.ValidationError) {
    // validation error contains errors which is an array of error each containing message[]
    var unifiedErrorMessage = err.errors.map(function (error) {
      console.log("error messages", err.messages);
      return error.messages.join('. ');
    }).join(' and ').split('\"').splice(1, 1)[0];

    var error = new _APIError2.default(unifiedErrorMessage, err.status, true);
    return next(error);
  } else if (!(err instanceof _APIError2.default)) {
    var apiError = new _APIError2.default(err.message, err.status, err.isPublic);
    return next(apiError);
  }
  return next(err);
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new _APIError2.default('API not found', _httpStatus2.default.NOT_FOUND);
  return next(err);
});

// log error in winston transports except when executing test suite
if (_env2.default.env !== 'test') {
  app.use(_expressWinston2.default.errorLogger({
    winstonInstance: _winston2.default
  }));
}

// error handler, send stacktrace only during development
app.use(function (err, req, res, next //eslint-disable-line
) {

  _winston2.default.info("***********URL****************");
  _winston2.default.info(req.originalUrl);
  _winston2.default.info("***************************");

  _winston2.default.info('<<<<<<<<< req body >>>>>>>>>>');
  _winston2.default.info('' + (0, _stringify2.default)(req.body));
  _winston2.default.info('<<<<<<<<< req body >>>>>>>>>>');

  _winston2.default.info('<<<<<<<<< req query >>>>>>>>>>');
  _winston2.default.info('' + (0, _stringify2.default)(req.query));
  _winston2.default.info('<<<<<<<<< req query >>>>>>>>>>');

  _winston2.default.info('<<<<<<<<< req error >>>>>>>>>>');
  _winston2.default.info('' + err);
  _winston2.default.info('<<<<<<<<< req error >>>>>>>>>>');

  // console.log("global error middleware", err.message, err);
  res.status(err.status).json({
    success: false,
    code: err.status,
    message: err.isPublic ? err.message : _httpStatus2.default[err.status],
    stack: _env2.default.env === 'development' ? err.stack : {}
  });
});
// res.status(err.status).json({
//   success: false,
//   message: err.isPublic ? err.message : httpStatus[err.status],
//   stack: config.env === 'development' ? err.stack : {},
// }));

exports.default = server;
module.exports = exports.default;
//# sourceMappingURL=express.js.map
