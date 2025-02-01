import bodyParser from 'body-parser';
import compress from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import expressValidation from 'express-validation';
import expressWinston from 'express-winston';
import helmet from 'helmet';
import httpStatus from 'http-status';
import methodOverride from 'method-override';
import passport from 'passport';
import path from 'path';
import APIError from '../server/helpers/APIError';
import config from './env';
import routes from '../server/routes';
import winstonInstance from './winston';

import passConfig from './passport-config';
import * as cronJob from '../server/cronJobs/index';

const app = express();
const fs = require('fs');
if (config.env === 'development') {
  const http = require('http');
  var server = http.createServer(app);
  // app.use(logger('dev'));
}else if (config.env === 'staging'){
  const https = require('https');
  const privateKey = fs.readFileSync('/var/www/apps/staging/SSL/staging.pem', 'utf8');
  const certificate = fs.readFileSync('/var/www/apps/staging/SSL/7984f5174d3d6289.crt', 'utf8');
  var ca = fs.readFileSync('/var/www/apps/staging/SSL/gd_bundle-g2-g1.crt');
  const httpsOptions = {key: privateKey, cert: certificate, ca: ca};
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
app.use(bodyParser.json({limit: '500mb'}));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(compress());
app.use(methodOverride());

// configure passport for authentication
passConfig(passport);
app.use(passport.initialize());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// enable detailed API logging in dev env
if (config.env === 'development') {
  expressWinston.requestWhitelist.push('body');
  expressWinston.responseWhitelist.push('body');
  app.use((req, res, next)=>  {
    console.log("***********URL****************");
    console.log(req.originalUrl);
    console.log("***************************");
    next();
  })
}
app.use(express.static(path.resolve(__dirname, '../../public')));

app.use('/uploads/avtars', express.static(__dirname+'/../uploads/avtars'));
app.use('/uploads/shuttles', express.static(__dirname+'/../uploads/shuttles'));

// mount public folder on / path
// app.get('/', (req, res) => {
//   res.sendFile(path.resolve(__dirname, '../../public/index.html'));
// });

// mount all routes on /api path
app.use('/api', routes);

app.get('/*', function(req, res){
  res.sendFile(path.resolve(__dirname, '../../public/index.html'));
})

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
app.use((err, req, res, next) => {
  if (err instanceof expressValidation.ValidationError) {
    // validation error contains errors which is an array of error each containing message[]
    const unifiedErrorMessage = err.errors.map(error => {
      console.log("error messages", err.messages);
      return error.messages.join('. ');
    }).join(' and ').split('\"').splice(1,1)[0];

    const error = new APIError(unifiedErrorMessage, err.status, true);
    return next(error);
  } else if (!(err instanceof APIError)) {
    const apiError = new APIError(err.message, err.status, err.isPublic);
    return next(apiError);
  }
  return next(err);
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new APIError('API not found', httpStatus.NOT_FOUND);
  return next(err);
});

// log error in winston transports except when executing test suite
if (config.env !== 'test') {
  app.use(expressWinston.errorLogger({
    winstonInstance,
  }));
}

// error handler, send stacktrace only during development
app.use((
  err,
  req,
  res,
  next //eslint-disable-line
) => {

  winstonInstance.info("***********URL****************");
  winstonInstance.info(req.originalUrl);
  winstonInstance.info("***************************");

  winstonInstance.info(`<<<<<<<<< req body >>>>>>>>>>`);
  winstonInstance.info(`${JSON.stringify(req.body)}`);
  winstonInstance.info(`<<<<<<<<< req body >>>>>>>>>>`);

  winstonInstance.info(`<<<<<<<<< req query >>>>>>>>>>`);
  winstonInstance.info(`${JSON.stringify(req.query)}`);
  winstonInstance.info(`<<<<<<<<< req query >>>>>>>>>>`);

  winstonInstance.info(`<<<<<<<<< req error >>>>>>>>>>`);
  winstonInstance.info(`${err}`);
  winstonInstance.info(`<<<<<<<<< req error >>>>>>>>>>`);

  // console.log("global error middleware", err.message, err);
  res.status(err.status).json({
    success: false,
    code:err.status,
    message: err.isPublic ? err.message : httpStatus[err.status],
    stack: config.env === 'development' ? err.stack : {},
  });
})
  // res.status(err.status).json({
  //   success: false,
  //   message: err.isPublic ? err.message : httpStatus[err.status],
  //   stack: config.env === 'development' ? err.stack : {},
  // }));

export default server;
