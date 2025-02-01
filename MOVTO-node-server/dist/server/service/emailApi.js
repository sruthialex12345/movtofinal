'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _nodemailer = require('nodemailer');

var _nodemailer2 = _interopRequireDefault(_nodemailer);

var _nodemailerSmtpTransport = require('nodemailer-smtp-transport');

var _nodemailerSmtpTransport2 = _interopRequireDefault(_nodemailerSmtpTransport);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _serverConfig = require('../models/serverConfig');

var _serverConfig2 = _interopRequireDefault(_serverConfig);

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

var _contact = require('../models/contact');

var _contact2 = _interopRequireDefault(_contact);

var _requestDemo = require('../models/requestDemo');

var _requestDemo2 = _interopRequireDefault(_requestDemo);

var _reservationCode = require('../models/reservationCode');

var _reservationCode2 = _interopRequireDefault(_reservationCode);

var _joinOurPartner = require('../models/joinOurPartner');

var _joinOurPartner2 = _interopRequireDefault(_joinOurPartner);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require('email-templates'),
    EmailTemplate = _require.EmailTemplate;

var registerDir = _path2.default.resolve(__dirname, '../templates', 'register');
var register = new EmailTemplate(_path2.default.join(registerDir));

var endtripDir = _path2.default.resolve(__dirname, '../templates', 'endTrip');
var endTrip = new EmailTemplate(_path2.default.join(endtripDir));

var forgotDir = _path2.default.resolve(__dirname, '../templates', 'forgotPassword');
var forgot = new EmailTemplate(_path2.default.join(forgotDir));

var rideAcceptDir = _path2.default.resolve(__dirname, '../templates', 'rideAccept');
var rideAccept = new EmailTemplate(_path2.default.join(rideAcceptDir));

var emailDir = _path2.default.resolve(__dirname, '../templates', 'emailVerify');
var emailVerify = new EmailTemplate(_path2.default.join(emailDir));

var weeklyStatsDir = _path2.default.resolve(__dirname, '../templates', 'weeklyStats');
var weeklyStats = new EmailTemplate(_path2.default.join(weeklyStatsDir));

var createDriveDir = _path2.default.resolve(__dirname, '../templates', 'createDriver');
var createDriveObj = new EmailTemplate(_path2.default.join(createDriveDir));

var createAdminDir = _path2.default.resolve(__dirname, '../templates', 'createAdmin');
var createAdminObj = new EmailTemplate(_path2.default.join(createAdminDir));

var sendEmailToManagerDir = _path2.default.resolve(__dirname, '../templates', 'sendEmailToManager');
var sendEmailToManagerObj = new EmailTemplate(_path2.default.join(sendEmailToManagerDir));

var createContactusDir = _path2.default.resolve(__dirname, '../templates', 'contactus');
var createContactusObj = new EmailTemplate(_path2.default.join(createContactusDir));

var requestDemoDir = _path2.default.resolve(__dirname, '../templates', 'requestDemo');
var requestDemoObj = new EmailTemplate(_path2.default.join(requestDemoDir));

var createJoinOurPartnerDir = _path2.default.resolve(__dirname, '../templates', 'joinOurPartner');
var createJoinOurPartnerObj = new EmailTemplate(_path2.default.join(createJoinOurPartnerDir));

var ReservationCodeDir = _path2.default.resolve(__dirname, '../templates', 'reservationCode');
var ReservationCodeObj = new EmailTemplate(_path2.default.join(ReservationCodeDir));

function getEmailApiDetails() {
  return new _promise2.default(function (resolve, reject) {
    _serverConfig2.default.findOneAsync({ key: 'emailConfig' }).then(function (foundDetails) {
      resolve(foundDetails.value);
    }).catch(function (err) {
      reject(err);
    });
  });
}

function sendEmail(userId, responseObj, type) {
  var Schema = _user2.default;
  if (type == 'contactus') {
    Schema = _contact2.default;
  }
  if (type == 'requestDemo') {
    Schema = _requestDemo2.default;
  }
  if (type == 'reservationCode') {
    Schema = _reservationCode2.default;
  }
  if (type == 'joinOurPartner') {
    Schema = _joinOurPartner2.default;
  }
  Schema.findOneAsync({ _id: userId }).then(function (userObj) {
    getEmailApiDetails().then(function (details) {
      var transporter = _nodemailer2.default.createTransport((0, _nodemailerSmtpTransport2.default)({
        host: details.host,
        port: details.port,
        secure: details.secure, // secure:true for port 465, secure:false for port 587
        auth: {
          user: details.username,
          pass: details.password
        }
      }));
      responseObj.fname = userObj.fname;

      var locals = (0, _assign2.default)({}, { data: responseObj });

      if (type === 'emailVerify') {
        // eslint-disable-next-line
        emailVerify.render(locals, function (err, results) {
          if (err) {
            return console.error(err); //eslint-disable-line
          }
          var mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: 'Verify your Account with Strap TaxiApp', // Subject line
            text: results.text, // plain text body
            html: results.html // html body
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            console.log('result in emailApi', info);
            return info;
          });
        });
      }
      if (type === 'register') {
        // eslint-disable-next-line
        register.render(locals, function (err, results) {
          if (err) {
            return console.error(err); //eslint-disable-line
          }
          var mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: 'Your Account with Strap TaxiApp is created', // Subject line
            text: results.text, // plain text body
            html: results.html // html body
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            console.log('result in emailApi', info);
            return info;
          });
        });
      }
      if (type === 'endTrip') {
        endTrip.render(locals, function (err, results) {
          if (err) {
            return console.error(err);
          }
          var mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: 'Ride Details with Strap TaxiApp', // Subject line
            text: results.text, // plain text body
            html: results.html // html body
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            console.log('result in emailApi', info);
            return info;
          });
        });
      }
      if (type === 'forgot') {
        forgot.render(locals, function (err, results) {
          if (err) {
            return console.error(err);
          }
          var mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: 'Your Account Password with CIDR', // Subject line
            text: results.text, // plain text body
            html: results.html // html body
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            console.log('result in emailApi', info);
            return info;
          });
        });
      }
      if (type === 'rideAccept') {
        rideAccept.render(locals, function (err, results) {
          if (err) {
            return console.error(err);
          }
          var mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: 'Strap TaxiApp Driver Details', // Subject line
            text: results.text, // plain text body
            html: results.html // html body
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            console.log('result in emailApi', info);
            return info;
          });
        });
      }
      if (type === 'weeklyStatsDriver') {
        weeklyStats.render(locals, function (err, results) {
          if (err) {
            return console.error(err);
          }
          var mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: 'Strap TaxiApp Driver Weekly Stats', // Subject line
            text: results.text, // plain text body
            html: results.html // html body
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            console.log('result in emailApi', info);
            return info;
          });
        });
      }
      if (type === 'createDriver') {
        createDriveObj.render(locals, function (err, results) {
          if (err) {
            return console.error(err);
          }
          var mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: 'Your Account Password and Access code with CIDR', // Subject line
            text: results.text, // plain text body
            html: results.html // html body
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            console.log('result in emailApi', info);
            return info;
          });
        });
      }
      if (type === 'createAdmin') {
        createAdminObj.render(locals, function (err, results) {
          if (err) {
            return console.error(err);
          }
          var mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: 'Your Account Password with CIDR', // Subject line
            text: results.text, // plain text body
            html: results.html // html body
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            console.log('result in emailApi', info);
            return info;
          });
        });
      }
      if (type === 'sendEmailToManager') {
        sendEmailToManagerObj.render(locals, function (err, results) {
          if (err) {
            return console.error(err);
          }
          var mailOptions = {
            from: details.username, // sender address
            to: userObj.managerDetails[0].email, // list of receivers
            subject: 'Your Account Password with CIDR', // Subject line
            text: results.text, // plain text body
            html: results.html // html body
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            return info;
          });
        });
      }
      if (type === 'contactus') {
        _user2.default.findOneAsync({ userType: 'superAdmin' }, 'name email').then(function (adminObj) {
          createContactusObj.render(locals, function (err, results) {
            if (err) {
              return console.error(err);
            }
            var mailOptions = {
              from: userObj.email, // sender address
              to: adminObj.email, // list of receivers
              subject: 'New Query message', // Subject line
              replyTo: userObj.email, //This is what I tried
              text: results.text, // plain text body
              html: results.html // html body
            };
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log('error in emailApi', error);
                return error;
              }
              console.log('result in emailApi', info);
              return info;
            });
          });
        });
      }
      if (type === 'requestDemo') {
        _user2.default.findOneAsync({ userType: 'superAdmin' }, 'name email').then(function (adminObj) {
          requestDemoObj.render(locals, function (err, results) {
            if (err) {
              return console.error(err);
            }
            var mailOptions = {
              from: userObj.email, // sender address
              to: "sales@circulardrive.com", // list of receivers
              subject: 'Request Demo Message', // Subject line
              replyTo: userObj.email, //This is what I tried
              text: results.text, // plain text body
              html: results.html // html body
            };
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log('error in emailApi', error);
                return error;
              }
              console.log('result in emailApi', info);
              return info;
            });
          });
        });
      }
      if (type === 'joinOurPartner') {
        _user2.default.findOneAsync({ userType: 'superAdmin' }, 'name email').then(function (adminObj) {
          createJoinOurPartnerObj.render(locals, function (err, results) {
            if (err) {
              return console.error(err);
            }
            var mailOptions = {
              from: userObj.email, // sender address
              to: adminObj.email, // list of receivers
              subject: 'New Query message', // Subject line
              replyTo: userObj.email, //This is what I tried
              text: results.text, // plain text body
              html: results.html // html body
            };
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log('error in emailApi', error);
                return error;
              }
              console.log('result in emailApi', info);
              return info;
            });
          });
        });
      }
      if (type === 'reservationCode') {
        _user2.default.findOneAsync({ _id: userObj.userIdAdmin }, 'name email').then(function (adminObj) {
          ReservationCodeObj.render(locals, function (err, results) {
            if (err) {
              return console.error(err);
            }
            var mailOptions = {
              from: adminObj.email, // sender address
              to: userObj.email, // list of receivers
              subject: 'Reservation Code', // Subject line
              replyTo: adminObj.email, //This is what I tried
              text: results.text, // plain text body
              html: results.html // html body
            };
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log('error in emailApi', error);
                return error;
              }
              console.log('result in emailApi', info);
              return info;
            });
          });
        });
      }
    });
  });
}

exports.default = sendEmail;
module.exports = exports.default;
//# sourceMappingURL=emailApi.js.map
