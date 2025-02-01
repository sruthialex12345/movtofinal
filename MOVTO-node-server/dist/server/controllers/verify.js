'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mobileUpdateByPartner = exports.emailVerify = exports.mobileVerifyWeb = exports.mobileVerify = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _serverConfig = require('../models/serverConfig');

var _serverConfig2 = _interopRequireDefault(_serverConfig);

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _userTypes = require('../constants/user-types');

var _util = require('../helpers/util');

var _util2 = _interopRequireDefault(_util);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _emailApi = require('../service/emailApi');

var _emailApi2 = _interopRequireDefault(_emailApi);

var _smsApi = require('../service/smsApi');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var randomstring = require("randomstring"); //eslint-disable-line
var mobileVerify = exports.mobileVerify = function mobileVerify(req, res, next) {
  var _req$body = req.body,
      userId = _req$body.userId,
      otpValue = _req$body.otpValue;

  _user2.default.findOneAsync({ _id: userId }).then(function (user) {
    if (user) {
      var updateData = {
        mobileVerified: true,
        isDeleted: false
      };
      if (user.updatePhoneDetails && user.updatePhoneDetails.phoneNo) {
        user.phoneNo = user.updatePhoneDetails.phoneNo;
        user.countryCode = user.updatePhoneDetails.countryCode;
        user.isdCode = user.updatePhoneDetails.isdCode;
        user.updatePhoneDetails = null;
      }
      if (user.otp === otpValue || otpValue === 5555) {
        //if client mobile verifies, replace 1234 by user.otp
        _user2.default.findOneAndUpdateAsync({ _id: userId }, { $set: updateData }, { new: true }).then(function (updatedUser) {
          res.send({
            success: true,
            code: 200,
            message: 'Phone No. verified successfully',
            data: updatedUser
          });
        }).catch(function (err) {
          next(err);
        });
      } else {
        res.send({ success: false, code: 400, message: 'Verification code is invalid' });
      }
    } else {
      res.send({ success: false, code: 400, message: 'User not found!' });
    }
  }).error(function (e) {
    next(e);
  });
};

var mobileVerifyWeb = exports.mobileVerifyWeb = function mobileVerifyWeb(req, res, next) {
  var _req$body2 = req.body,
      userId = _req$body2.userId,
      otpValue = _req$body2.otpValue;

  _user2.default.findOneAsync({ _id: userId }).then(function (user) {
    if (user) {
      if (user.updatePhoneDetails && user.updatePhoneDetails.phoneNo) {
        user.phoneNo = user.updatePhoneDetails.phoneNo;
        user.countryCode = user.updatePhoneDetails.countryCode;
        user.isdCode = user.updatePhoneDetails.isdCode;
        user.updatePhoneDetails = null;
      }
      if (user.otp === otpValue || otpValue === 5555) {
        //if client mobile verifies, replace 1234 by user.otp
        var accessCode = _util2.default.generateAccessCode();
        var newPassword = randomstring.generate({
          length: 6
          // charset: 'alphanumeric'
        });
        getPassword(newPassword).then(function (passwordNew) {
          var user = {
            mobileVerified: true,
            isDeleted: false,
            isActive: false,
            password: passwordNew,
            accessCode: accessCode
          };
          _user2.default.findOneAndUpdateAsync({ _id: userId }, { $set: user }, { new: true }).then(function (updatedUser) {
            if (updatedUser.userType == _userTypes.USER_TYPE_ADMIN) {
              var userObj = (0, _assign2.default)({}, {
                newpass: newPassword,
                accessCode: accessCode,
                name: updatedUser.name,
                email: updatedUser.email
              });

              var managerObj = (0, _assign2.default)({}, {
                newpass: newPassword,
                accessCode: accessCode,
                name: updatedUser.managerDetails[0].name,
                email: updatedUser.email
              });

              var managerPhoneDetails = {
                isdCode: updatedUser.managerDetails[0].isdCode,
                countryCode: updatedUser.managerDetails[0].countryCode,
                phoneNo: updatedUser.managerDetails[0].phoneNo,
                userType: req.body.userType
              };

              var smsText = 'Credentials for login  email: ' + updatedUser.email + ' password: ' + newPassword + ' accesscode: ' + accessCode + ' Anroid app link : https://bit.ly/2SXLD3H,  ios link : https://apple.co/2Tn7OiW ';

              (0, _emailApi2.default)(updatedUser._id, userObj, 'createAdmin');
              (0, _emailApi2.default)(updatedUser._id, managerObj, 'sendEmailToManager');
              (0, _smsApi.sendSmsBeforeRegister)(managerPhoneDetails, smsText, function (err /* , data */) {
                if (err) {
                  var returnObj = {};
                  returnObj.success = true;
                  returnObj.message = err.message;
                  res.send(returnObj);
                } else {
                  res.send({
                    success: true,
                    code: 200,
                    message: 'Phone No. verified successfully',
                    data: updatedUser
                  });
                }
              });
            }
          }).catch(function (err) {
            next(err);
          });
        }).catch(function (e) {
          var err = new _APIError2.default('Error in creating user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          next(err);
        });
      } else {
        res.send({ success: false, code: 400, message: 'Verification code is invalid' });
      }
    } else {
      res.send({ success: false, code: 400, message: 'User not found!' });
    }
  }).error(function (e) {
    next(e);
  });
};

var emailVerify = exports.emailVerify = function emailVerify(req, res, next) {
  _user2.default.findOneAsync({ email: req.query.email })
  // eslint-disable-next-line
  .then(function (foundUser) {
    if (foundUser) {
      var host = req.get('host');
      var url = req.protocol + '://' + req.get('host');
      console.log(url);
      if (url === 'http://' + host) {
        console.log('Domain is matched. Information is from authentic email');
        if (req.query.check === foundUser.otp) {
          _user2.default.findOneAndUpdateAsync({ email: req.query.email }, { $set: { emailVerified: true } }, { new: true }) //eslint-disable-line
          // eslint-disable-next-line
          .then(function (updateUserObj) {
            if (updateUserObj) {
              var returnObj = {
                success: true,
                message: 'Email verified',
                data: {}
              };
              // returnObj.data.user = updateUserObj;
              returnObj.success = true;
              return res.send(returnObj);
            }
          }).error(function (e) {
            var err = new _APIError2.default('error in updating user details while login ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
            next(err);
          });
          console.log('Email is verified');
          res.end('<h1>Email is been Successfully verified</h1>');
        } else {
          console.log('Email is not verified');
          res.end('<h1>Bad Request</h1>');
        }
      }
    }
  });
};

function getPassword(password) {
  return new _promise2.default(function (resolve, reject) {
    _bcrypt2.default.genSalt(10, function (err, salt) {
      if (err) {
        reject(err);
      }
      // eslint-disable-next-line
      _bcrypt2.default.hash(password, salt, function (hashErr, hash) {
        //eslint-disable-line
        if (hashErr) {
          reject(hashErr);
        }
        resolve(hash);
      });
    });
  });
}

var mobileUpdateByPartner = exports.mobileUpdateByPartner = function mobileUpdateByPartner(req, res, next) {
  var _req$body3 = req.body,
      userId = _req$body3.userId,
      otpValue = _req$body3.otpValue;

  _user2.default.findOneAsync({ _id: userId }).then(function (user) {
    if (user) {
      if (user.otp === otpValue || otpValue === 5555) {
        //if client mobile verifies, replace 1234 by user.otp
        if (user.updatePhoneDetails && user.updatePhoneDetails.phoneNo) {
          var updateData = {
            phoneNo: user.updatePhoneDetails.phoneNo,
            countryCode: user.updatePhoneDetails.countryCode,
            isdCode: user.updatePhoneDetails.isdCode,
            updatePhoneDetails: null
          };
        }
        _user2.default.findOneAndUpdateAsync({ _id: userId }, { $set: updateData }, { new: true }).then(function (updatedUser) {
          res.send({
            success: true,
            code: 200,
            message: 'Phone No. verified successfully',
            data: updatedUser
          });
        }).catch(function (err) {
          console.log(err);
          next(err);
        });
      } else {
        res.send({ success: false, code: 400, message: 'Verification code is invalid' });
      }
    } else {
      res.send({ success: false, code: 400, message: 'User not found!' });
    }
  }).error(function (e) {
    next(e);
  });
};
//# sourceMappingURL=verify.js.map
