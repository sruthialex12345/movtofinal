'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.signUpProvider = exports.ridesCompletingAtTerminal = exports.updateShuttleStatus = exports.driverHistory = exports.rideHistory = exports.tripRideRequests = exports.riderAdminList = exports.nearByDropOffPoints = exports.nearByPickupPoints = exports.driverShuttleList = exports.removeRiderLocation = exports.getRiderLocations = exports.createRiderLocation = exports.resetPassword = exports.forgotPassword = exports.loadUser = exports.removeUser = exports.uploadUserImage = exports.updateUserName = exports.updateUser = exports.updateMobileNumber = exports.resendMobileVerificationCode = exports.createUser = exports.getUser = exports.uploadBaseImageHandler = exports.uploadImageHandler = exports.upload = undefined;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.driverRoutes = driverRoutes;
exports.addReview = addReview;
exports.getCurrentTripOrRequest = getCurrentTripOrRequest;
exports.getRiderNotificationRequests = getRiderNotificationRequests;
exports.validateReservationCode = validateReservationCode;
exports.listReview = listReview;
exports.driverChangeVehicle = driverChangeVehicle;

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _cloudinary = require('cloudinary');

var _cloudinary2 = _interopRequireDefault(_cloudinary);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _formidable = require('formidable');

var _formidable2 = _interopRequireDefault(_formidable);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _mocha = require('mocha');

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _appConfig = require('../models/appConfig');

var _appConfig2 = _interopRequireDefault(_appConfig);

var _env = require('../../config/env');

var _env2 = _interopRequireDefault(_env);

var _emailApi = require('../service/emailApi');

var _emailApi2 = _interopRequireDefault(_emailApi);

var _smsApi = require('../service/smsApi');

var _serverConfig = require('../models/serverConfig');

var _serverConfig2 = _interopRequireDefault(_serverConfig);

var _user3 = require('../models/user');

var _user4 = _interopRequireDefault(_user3);

var _driverRouteTerminal = require('../models/driverRouteTerminal');

var _driverRouteTerminal2 = _interopRequireDefault(_driverRouteTerminal);

var _location = require('../models/location');

var _location2 = _interopRequireDefault(_location);

var _review = require('../models/review');

var _review2 = _interopRequireDefault(_review);

var _countryCode = require('../models/countryCode');

var _countryCode2 = _interopRequireDefault(_countryCode);

var _util = require('../helpers/util');

var _util2 = _interopRequireDefault(_util);

var _userTypes = require('../constants/user-types');

var _adminDriver = require('../models/adminDriver');

var _adminDriver2 = _interopRequireDefault(_adminDriver);

var _adminVehicle = require('../models/adminVehicle');

var _adminVehicle2 = _interopRequireDefault(_adminVehicle);

var _tripRequest = require('../models/tripRequest');

var _tripRequest2 = _interopRequireDefault(_tripRequest);

var _trip = require('../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _tripRequestStatuses = require('../constants/trip-request-statuses');

var TRIP_REQUEST_STATUS = _interopRequireWildcard(_tripRequestStatuses);

var _socketStore = require('../service/socket-store');

var _socketStore2 = _interopRequireDefault(_socketStore);

var _tripType = require('../constants/trip-type');

var _bodyParser = require('body-parser');

var _global = require('../constants/global');

var _adminLocation = require('../models/adminLocation');

var _adminLocation2 = _interopRequireDefault(_adminLocation);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var randomstring = require("randomstring"); //eslint-disable-line

var ObjectId = require('mongoose').Types.ObjectId;

var multer = require('multer');
var mime = require('mime');
var fs = require('fs');
var debug = require('debug')('MGD-API: admin-user');


var storage = multer.diskStorage({
  destination: function destination(req, file, cb) {
    var validExts = ['jpeg', 'jpg', 'png'];
    if (validExts.indexOf(mime.getExtension(file.mimetype)) < 0) {
      console.log('wrong format uploading file');
      return cb(new Error("Wrong format"), null);
    }
    cb(null, __dirname + '/../../uploads/avtars');
  },
  filename: function filename(req, file, cb) {
    console.log('format..', file);
    var fileName = file.fieldname + '-' + Date.now() + ('.' + mime.getExtension(file.mimetype));
    file.newName = fileName;
    req.file = file;
    console.log('file name', req.file, file);
    cb(null, fileName);
  }
});

var upload = exports.upload = multer({ storage: storage }).single('avtar');

var uploadImageHandler = exports.uploadImageHandler = function uploadImageHandler(req, res, next) {
  console.log('uploading image', req);
  upload(req, res, function (err) {
    if (err) {
      console.log('err', _err);
      var _err = new _APIError2.default('error in uploading image ' + _err, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      next(_err);
    } else {
      var _returnObj = {
        success: true,
        message: 'file uploaded successfully',
        data: req.file
      };
      res.send(_returnObj);
    }

    // Everything went fine
  });
};

var uploadBaseImageHandler = exports.uploadBaseImageHandler = function uploadBaseImageHandler(req, res, next) {
  var outputJSON = "";
  var photoname = 'avtar_' + (Date.now() + '.png');
  var imagename = __dirname + "/../../uploads/avtars/" + photoname;
  if (req.body.avtar.indexOf("base64,") != -1) {
    var Data = req.body.avtar.split('base64,');
    var base64Data = Data[1];
    fs.writeFile(imagename, base64Data, 'base64', function (err) {
      if (err) {
        console.log('err', _err2);
        var _err2 = new _APIError2.default('error in uploading image ' + _err2, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(_err2);
      } else {
        var profileImageUrl = _util2.default.getUploadsAvtarsUrl(req) + '/' + photoname;
        var _user = req.user;

        _user.profileUrl = profileImageUrl;
        var userObj = new _user4.default(_user);
        _user4.default.findOneAndUpdateAsync({ _id: _user._id }, { $set: { profileUrl: profileImageUrl } }, { new: true }).then(function (savedUser) {
          var returnObj = {
            success: true,
            message: 'File uploaded successfully',
            data: savedUser
          };
          res.send(returnObj);
        }).error(function (e) {
          var err = new _APIError2.default('error in saving image ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          next(err);
        });
      }
    });
  } else {
    var _returnObj2 = {
      success: false,
      message: 'Inavalid Image',
      code: 400
    };
    res.send(_returnObj2);
  }
};

/**
 * Get user
 * @returns {User}
 */
var getUser = exports.getUser = function getUser(req, res) {
  return res.send({ success: true, message: 'user found', data: req.user });
};

var saveVerificationCode = function saveVerificationCode(userId, verificationCode) {
  return _user4.default.findByIdAndUpdateAsync({ _id: userId }, { $set: { otp: verificationCode } }, { new: true });
};

var sendVerificationCode = function sendVerificationCode(userId, verificationCode) {
  return new _promise2.default(function (resolve, reject) {
    (0, _smsApi.sendSms)(userId, 'Your verification code is ' + verificationCode, function (err, data) {
      if (err) {
        console.log('error sending sms', err);
        var errResp = new _APIError2.default('Error: Sending mobile verification code.', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
        reject(errResp);
      } else {
        console.log("message sent successfully");
        resolve({});
      }
    });
  });
};

function createVerificationCode(userId) {
  var verificationCode = _util2.default.generateVerificationCode();
  return new _promise2.default(function (resolve, reject) {
    saveVerificationCode(userId, verificationCode).then(function (updatedUser) {
      if (updatedUser) {
        sendVerificationCode(userId, verificationCode).then(function (res) {
          console.log('send verification resolved', res);
          resolve(res);
        }).catch(function (e) {
          reject(e);
        });
      } else {
        var err = new _APIError2.default('Rider not found', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
        reject(err);
      }
    }).catch(function (error) {
      reject(error);
    });
  });
}

/**
 * Get getCloudinaryDetails
 * @returns {getCloudinaryDetails}
 */
function getCloudinaryDetails() {
  return new _promise2.default(function (resolve, reject) {
    _serverConfig2.default.findOneAsync({ key: 'cloudinaryConfig' }).then(function (foundDetails) {
      resolve(foundDetails.value);
    }).catch(function (err) {
      reject(err);
    });
  });
}

/**
 * Get appConfig
 * @returns {appConfig}
 */
function getConfig() {
  return new _promise2.default(function (resolve, reject) {
    _appConfig2.default.findOneAsync({ key: 'sendConfig' }).then(function (foundDetails) {
      resolve(foundDetails.value);
    }).catch(function (err) {
      reject(err);
    });
  });
}
function getApproveConfig() {
  return new _promise2.default(function (resolve, reject) {
    _appConfig2.default.findOneAsync({ key: 'approveConfig' }).then(function (foundDetails) {
      resolve(foundDetails && foundDetails.value);
    }).catch(function (err) {
      reject(err);
    });
  });
}
/**
 * Create new user
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.mobileNumber - The mobileNumber of user.
 * @returns {User}
 */
// { email: req.body.email, phoneNo: req.body.phoneNo }

/**
 * 1. Check if the user already exist with email/usertype || phoneNo/userType
 * 2. send otp to mobile
 * 3. if no error sending mobile otp create user
 */
var createUser = exports.createUser = function createUser(req, res, next) {
  _user4.default.findOneAsync({
    $or: [{ email: req.body.email.toLowerCase(), userType: req.body.userType ? req.body.userType : _userTypes.USER_TYPE_RIDER, isDeleted: false }, { userType: req.body.userType ? req.body.userType : _userTypes.USER_TYPE_RIDER, phoneNo: req.body.phoneNo, isDeleted: false }]
  }).then(function (foundUser) {
    if (foundUser !== null && foundUser.userType === (req.body.userType ? req.body.userType : _userTypes.USER_TYPE_RIDER)) {
      var numberunique = foundUser._id;
      _user4.default.findOneAndUpdateAsync({ _id: foundUser._id }, { $set: { loginStatus: true, jwtAccessToken: numberunique } }, { new: true }).then(function (updateUserObj) {
        if (updateUserObj) {
          var jwtTokenAuth = {
            _id: updateUserObj._id,
            userType: updateUserObj.userType,
            email: updateUserObj.email,
            fname: updateUserObj.fname,
            accessCode: updateUserObj.accessCode,
            numberunique: numberunique
          };
          var jwtAccessToken = _jsonwebtoken2.default.sign(jwtTokenAuth, _env2.default.jwtSecret);
          var _returnObj3 = {
            success: true,
            message: '',
            data: {}
          };
          if (updateUserObj.email == req.body.email.toLowerCase() && updateUserObj.phoneNo == req.body.phoneNo) {
            var msg = "User already registered with same email address and mobile number";
          } else if (updateUserObj.email == req.body.email.toLowerCase()) {
            var msg = "User already registered with same email address";
          } else {
            var msg = "User already registered with same mobile number";
          }

          _returnObj3.data.jwtAccessToken = 'JWT ' + jwtAccessToken;
          _returnObj3.data.user = updateUserObj;
          _returnObj3.message = msg;
          _returnObj3.success = false;
          return res.send(_returnObj3);
        }
      }).error(function (e) {
        var err = new _APIError2.default('Error in updating user details while login ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    } else {
      _countryCode2.default.findOneAsync({ dial_code: req.body.isdCode }).then(function (CountryCodeDetails) {
        getApproveConfig().then(function (values) {
          var otpValue = _util2.default.generateVerificationCode();
          var accessCode = _util2.default.generateAccessCode();
          var reservationCode = _util2.default.generateUniueReservationCode();
          var newPassword = randomstring.generate({
            length: 6
            // charset: 'alphanumeric'
          });
          var newUser = {
            tripType: req.body.tripType ? req.body.tripType : _tripType.TRIP_CIRCULAR_STATIC,
            email: req.body.email.toLowerCase(),
            reservationCode: reservationCode,
            userType: req.body.userType ? req.body.userType : _userTypes.USER_TYPE_RIDER,
            name: req.body.name,
            phoneNo: req.body.phoneNo,
            isdCode: req.body.isdCode,
            adminTripTypes: req.body.adminTripTypes,
            managerDetails: req.body.managerDetails,
            isDeleted: req.body.isDeleted ? req.body.isDeleted : false,
            countryCode: req.body.countryCode,
            gpsLoc: [19.02172902354515, 72.85368273308545],
            carDetails: req.body.userType === _userTypes.USER_TYPE_DRIVER ? { type: 'sedan' } : {},
            mapCoordinates: [0, 0],
            isApproved: req.body.userType === _userTypes.USER_TYPE_DRIVER ? values && values.autoApproveDriver ? values.autoApproveDriver : true : values && values.autoApproveRider ? values.autoApproveRider : true,
            loginStatus: false,
            country: req.body.country ? req.body.country : '',
            otp: otpValue
          };
          if (req.body.userType == _userTypes.USER_TYPE_ADMIN) {
            newUser["accessCode"] = accessCode;
            newUser["password"] = newPassword;
            newUser["isDeleted"] = true;
            newUser['profileUrl'] = _util2.default.getUploadsAvtarsUrl(req) + "/provider_default.png";
            newUser['address'] = req.body.address ? req.body.address : "";
            var phoneDetails = {
              isdCode: req.body.managerDetails.isdCode,
              // countryCode: req.body.managerDetails.countryCode,
              phoneNo: req.body.managerDetails.phoneNo
              // countryCode:(CountryCodeDetails && CountryCodeDetails.code)?CountryCodeDetails.code:'',
              // userType:req.body.userType
            };
          }
          if (req.body.userType == _userTypes.USER_TYPE_RIDER) {
            var _phoneDetails;

            newUser['profileUrl'] = _util2.default.getUploadsAvtarsUrl(req) + "/default_user.png", newUser["isDeleted"] = true;
            newUser["password"] = req.body.password;
            var phoneDetails = (_phoneDetails = {
              isdCode: req.body.isdCode,
              countryCode: req.body.countryCode,
              phoneNo: req.body.phoneNo
            }, (0, _defineProperty3.default)(_phoneDetails, 'countryCode', CountryCodeDetails && CountryCodeDetails.code ? CountryCodeDetails.code : ''), (0, _defineProperty3.default)(_phoneDetails, 'userType', req.body.userType), _phoneDetails);
          }
          var user = new _user4.default(newUser);
          if (req.body.profileImageUrl) {
            user.profileUrl = req.body.profileImageUrl;
          }
          /**
           * 2. send verification code to the mobile number
           */
          (0, _smsApi.sendSmsBeforeRegister)(phoneDetails, 'Your verification code is  ' + otpValue, function (err /* , data */) {
            if (err) {
              var _returnObj4 = {};
              _returnObj4.success = false;
              _returnObj4.message = 'Something went wrong while sending otp on mobile number';
              res.send(_returnObj4);
            } else {
              user.saveAsync().then(function (savedUser) {
                var numberunique = savedUser._id;
                _user4.default.findOneAndUpdateAsync({ _id: savedUser._id }, { $set: { jwtAccessToken: numberunique } }).then(function (updateUserObj) {
                  var returnObj = {
                    success: true,
                    message: '',
                    data: {}
                  };
                  var jwtTokenAuth = {
                    _id: savedUser._id,
                    userType: savedUser.userType,
                    email: savedUser.email,
                    fname: savedUser.fname,
                    accessCode: savedUser.accessCode,
                    numberunique: numberunique
                  };
                  var jwtAccessToken = _jsonwebtoken2.default.sign(jwtTokenAuth, _env2.default.jwtSecret);
                  returnObj.data.jwtAccessToken = 'JWT ' + jwtAccessToken;
                  returnObj.data.user = savedUser;
                  returnObj.message = 'Verification code sent successfully to your mobile';
                  res.send(returnObj);
                  getConfig().then(function (data) {
                    if (data.email.emailVerify) {
                      (0, _emailApi2.default)(savedUser._id, savedUser, 'emailVerify'); //eslint-disable-line
                    }
                    if (data.email.onRegistrationRider && savedUser.userType === _userTypes.USER_TYPE_RIDER) {
                      (0, _emailApi2.default)(savedUser._id, savedUser, 'register'); //eslint-disable-line
                    }
                    if (data.email.onRegistrationDriver && savedUser.userType === _userTypes.USER_TYPE_DRIVER) {
                      (0, _emailApi2.default)(savedUser._id, savedUser, 'register'); //eslint-disable-line
                    }
                  }).catch(function (err) {
                    console.log('error getting app config', err);
                    returnObj.status = 200;
                    returnObj.message = 'Something went wrong';

                    res.send(returnObj);
                  });
                }).error(function (e) {
                  return next(e);
                });
              }).error(function (e) {
                return next(e);
              });
            }
          });
        }).catch(function (e) {
          var err = new _APIError2.default('Error in creating user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          next(err);
        });
      }).catch(function (e) {
        var err = new _APIError2.default('Error in creating user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    }
  });
};

// function to resend OTP to user
var resendMobileVerificationCode = exports.resendMobileVerificationCode = function resendMobileVerificationCode(req, res /* , next */) {
  var userId = req.body.userId;

  var returnObj = {};

  createVerificationCode(userId).then(function (result) {
    returnObj.status = true;
    returnObj.message = 'Verification code has been sent.';
    console.log("createverication resolved", result);
    res.send(returnObj);
  }).catch(function (err) {
    returnObj.status = false;
    returnObj.message = 'Error: Unable to send verification code.';
    res.send(returnObj);
  });
};

// function to edit phone no in otp screen
var updateMobileNumber = exports.updateMobileNumber = function updateMobileNumber(req, res /* , next */) {
  // console.log("user", req.user);
  var _req$body = req.body,
      isdCode = _req$body.isdCode,
      countryCode = _req$body.countryCode,
      phoneNo = _req$body.phoneNo;

  var userId = req.user._id;
  var returnObj = {};
  var otpValue = _util2.default.generateVerificationCode();
  /**
   * 1. check if user exists
   * 2. check if user exist with the update mobile number and the same user type
   * 3. send verification code to the mobile number
   * 4. if otp sent successfully and verified update the mobile number
   */

  /**
   * 1. check if user exists
   */
  _user4.default.findOneAsync({ _id: userId }).then(function (user) {
    if (user) {
      /**
       * 2. check if user exist with the update mobile number and the same user type
       */
      _user4.default.findOneAsync({ phoneNo: phoneNo, userType: user.userType }).then(function (userExists) {
        if (userExists) {
          returnObj.success = false;
          returnObj.message = 'Mobile number already exists';
          return res.send(returnObj);
        }

        var phoneDetails = {
          isdCode: isdCode,
          countryCode: countryCode,
          phoneNo: phoneNo
        };
        var updateData = { otp: otpValue, updatePhoneDetails: phoneDetails };
        /**
         * 3. send verification code to the mobile number
         */
        (0, _smsApi.sendSmsUpdateMobile)(phoneDetails, 'Your verification code is ' + otpValue, function (err /* , data */) {
          if (err) {
            returnObj.success = false;
            returnObj.message = err && err.message ? err.message : 'Something went wrong while updating mobile number';
            res.send(returnObj);
          } else {
            returnObj.success = true;
            returnObj.message = 'Phone no is updated, a verification code has been sent to the mobile number provided.';
            /**
             * 4. if otp sent successfully update the mobile number
             */
            _user4.default.findOneAndUpdateAsync({ _id: userId }, { $set: updateData }, { new: true }).then(function (updatedUser) {
              if (updatedUser) {
                returnObj.success = true;
                returnObj.message = 'Phone no is updated, a verification code has been sent to the mobile number provided.';
                res.send(returnObj);
              } else {
                returnObj.success = false;
                returnObj.message = 'Phone no is not updated';
                res.send(returnObj);
              }
            }).catch(function (error) {
              console.log(error);
              returnObj.success = false;
              returnObj.message = 'server error to update phone no';
              res.send(returnObj);
            });
          }
        });
      }).catch(function (err) {
        next(e);
      });
    } else {
      returnObj.success = false;
      returnObj.message = 'User does not exist';
      res.send(returnObj);
    }
  }).catch(function (error) {
    console.log(error);
    returnObj.status = false;
    returnObj.message = 'server error to update phone no';
    res.send(returnObj);
  });
};

/**
 * Update existing user
 * @property {Object} req.body.user - user object containing all fields.
 * @returns {User}
 */
var updateUser = exports.updateUser = function updateUser(req, res, next) {
  var user = req.user;


  user.name = req.body.name ? req.body.name : user.name;
  user.email = req.body.email.toLowerCase() ? req.body.email.toLowerCase() : user.email;
  user.phoneNo = req.body.phoneNo ? req.body.phoneNo : user.phoneNo;
  // user.deviceId = req.body.deviceId ? req.body.deviceId : user.deviceId;
  // user.pushToken = req.body.pushToken ? req.body.pushToken : user.deviceId;
  user.tokenId = req.body.tokenId ? req.body.tokenId : user.tokenId;
  user.emergencyDetails = req.body.emergencyDetails ? req.body.emergencyDetails : user.emergencyDetails;
  user.homeAddress = req.body.homeAddress ? req.body.homeAddress : user.homeAddress;
  user.workAddress = req.body.workAddress ? req.body.workAddress : user.workAddress;
  user.carDetails = req.body.carDetails ? req.body.carDetails : user.carDetails;
  user.licenceDetails = req.body.licenceDetails ? req.body.licenceDetails : user.licenceDetails;
  user.bankDetails = req.body.bankDetails ? req.body.bankDetails : user.bankDetails;
  user.isAvailable = req.body.isAvailable;

  user.saveAsync().then(function (savedUser) {
    var returnObj = {
      success: true,
      message: 'user details updated successfully',
      data: savedUser
    };
    res.send(returnObj);
  }).error(function (e) {
    return next(e);
  });
};

var updateUserName = exports.updateUserName = function updateUserName(req, res, next) {
  var user = req.user;


  user.name = req.body.name ? req.body.name : user.name;

  user.saveAsync().then(function (savedUser) {
    var returnObj = {
      success: true,
      message: 'user name updated successfully',
      data: savedUser
    };
    res.send(returnObj);
  }).error(function (e) {
    return next(e);
  });
};

/**
 * function  to upload pic
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */
var uploadUserImage = exports.uploadUserImage = function uploadUserImage(req, res, next) {
  getCloudinaryDetails().then(function (value) {
    if (value) {
      _cloudinary2.default.config({
        cloud_name: value.cloud_name,
        api_key: value.api_key,
        api_secret: value.api_secret
      });
      var form = new _formidable2.default.IncomingForm();
      form.on('error', function (err) {
        console.error(err); //eslint-disable-line
      });

      form.parse(req, function (err, fields, files) {
        var imgpath = files.image;
        _cloudinary2.default.v2.uploader.upload(imgpath.path,
        // {
        //   transformation: [
        //     {
        //       effect: 'improve',
        //       gravity: 'face',
        //       height: 100,
        //       width: 100,
        //       crop: 'fill',
        //     },
        //     { quality: 'auto' },
        //   ],
        // },
        function (error, results) {
          if (results) {
            var _user2 = req.user;

            if (req.headers.updatetype === 'profile') {
              _user2.profileUrl = results.url;
              _user4.default.findOneAndUpdateAsync({ _id: _user2._id }, //eslint-disable-line
              { $set: { profileUrl: results.url } }, { new: true }).then(function (savedUser) {
                var returnObj = {
                  success: true,
                  message: 'user pic updated successfully',
                  data: savedUser
                };
                res.send(returnObj);
              }).error(function (e) {
                return next(e);
              });
            }
            if (req.headers.updatetype === 'licence') {
              _user2.profileUrl = results.url;
              _user4.default.findOneAndUpdateAsync({ _id: _user2._id }, //eslint-disable-line
              { $set: { licenceUrl: results.url } }, { new: true }).then(function (savedUser) {
                var returnObj = {
                  success: true,
                  message: 'user licenceDetails updated successfully',
                  data: savedUser
                };
                res.send(returnObj);
              }).error(function (e) {
                return next(e);
              });
            }
            if (req.headers.updatetype === 'permit') {
              _user2.profileUrl = results.url;
              _user4.default.findOneAndUpdateAsync({ _id: _user2._id }, //eslint-disable-line
              { $set: { vechilePaperUrl: results.url } }, { new: true }).then(function (savedUser) {
                var returnObj = {
                  success: true,
                  message: 'user vechilePaperUrl updated successfully',
                  data: savedUser
                };
                res.send(returnObj);
              }).error(function (e) {
                return next(e);
              });
            }
            if (req.headers.updatetype === 'insurance') {
              _user2.profileUrl = results.url;
              _user4.default.findOneAndUpdateAsync({ _id: _user2._id }, //eslint-disable-line
              { $set: { insuranceUrl: results.url } }, { new: true }).then(function (savedUser) {
                var returnObj = {
                  success: true,
                  message: 'user insuranceUrl updated successfully',
                  data: savedUser
                };
                res.send(returnObj);
              }).error(function (e) {
                return next(e);
              });
            }
            if (req.headers.updatetype === 'registration') {
              _user2.profileUrl = results.url;
              _user4.default.findOneAndUpdateAsync({ _id: _user2._id }, //eslint-disable-line
              { $set: { rcBookUrl: results.url } }, { new: true }).then(function (savedUser) {
                var returnObj = {
                  success: true,
                  message: 'user rcBookUrl updated successfully',
                  data: savedUser
                };
                res.send(returnObj);
              }).error(function (e) {
                return next(e);
              });
            }
          }
        });
      });
    } else {
      var _returnObj5 = {
        success: false,
        message: 'Problem in updating',
        data: req.user
      };
      res.send(_returnObj5);
    }
  });
};

/**
 * Get user list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {User[]}
 */
// function list(req, res, next) {
//   const { limit = 50, skip = 0 } = req.query;
//   User.list({ limit, skip }).then((users) => res.json(users))
//     .error((e) => next(e));
// }

/**
 * Delete user.
 * @returns {User}
 */
var removeUser = exports.removeUser = function removeUser(req, res, next) {
  var user = req.user;

  user.removeAsync().then(function (deletedUser) {
    var returnObj = {
      success: true,
      message: 'user deleted successfully',
      data: deletedUser
    };
    res.send(returnObj);
  }).error(function (e) {
    return next(e);
  });
};

/**
 * Load user and append to req.
 */
var loadUser = exports.loadUser = function loadUser(req, res, next, id) {
  _user4.default.get(id).then(function (user) {
    req.user = user; // eslint-disable-line no-param-reassign
    return next();
  }).error(function (e) {
    return next(e);
  });
};

function hashed(password) {
  return new _promise2.default(function (resolve, reject) {
    _bcrypt2.default.genSalt(10, function (err, salt) {
      if (err) {
        reject(err);
      }
      _bcrypt2.default.hash(password, salt, function (hashErr, hash) {
        if (hashErr) {
          reject(hashErr);
        }
        console.log(hash); //eslint-disable-line
        resolve(hash);
      });
    });
  });
}

var forgotPassword = exports.forgotPassword = function forgotPassword(req, res, next) {
  console.log("Request Body", req.body);
  var userType = _userTypes.USER_TYPE_RIDER;
  req.body.userType = req.body.userType ? req.body.userType : userType;
  console.log("Request Body updated", req.body);
  _user4.default.findOneAsync({ email: req.body.email.toLowerCase(), userType: req.body.userType })
  // eslint-disable-next-line
  .then(function (foundUser) {
    if (foundUser) {
      // const newPassword = Math.random()
      //   .toString(36)
      //   .substr(2, 6);
      var newPassword = randomstring.generate({
        length: 6
        // charset: 'alphanumeric'
      });
      hashed(newPassword).then(function (result) {
        var hashPassword = result;
        _user4.default.findOneAndUpdateAsync({ _id: foundUser._id }, { $set: { password: hashPassword } }) //eslint-disable-line
        // eslint-disable-next-line
        .then(function (updateUserObj) {
          if (updateUserObj) {
            getConfig().then(function (data) {
              if (data.email.onForgotPassword) {
                var userObj = (0, _assign2.default)(updateUserObj, { newpass: newPassword, accessCode: foundUser.accessCode });
                (0, _emailApi2.default)(updateUserObj._id, userObj, 'forgot'); //eslint-disable-line
              }
            });
            var _returnObj6 = {
              success: true,
              message: '',
              data: {}
            };
            // returnObj.data.jwtAccessToken = `JWT ${jwtAccessToken}`;
            // returnObj.data.user = updateUserObj;`
            _returnObj6.message = 'Check your Email Please';
            _returnObj6.success = true;
            return res.send(_returnObj6);
          }
        }).error(function (e) {
          var err = new _APIError2.default('error in updating user details while login ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          return res.send(err);
        });
      });
    } else {
      var _returnObj7 = {
        success: true,
        message: '',
        data: {}
      };
      _returnObj7.message = 'No user exist with this email';
      _returnObj7.success = false;
      return res.send(_returnObj7);
    }
  }).error(function (e) {
    return next(e);
  });
};

var resetPassword = exports.resetPassword = function resetPassword(req, res, next) {
  _user4.default.findOneAsync({ email: req.body.email.toLowerCase(), userType: req.body.userType }, '+password')
  // eslint-disable-next-line
  .then(function (foundUser) {
    if (foundUser) {
      console.log(foundUser);
      // check if old password is correct
      foundUser.comparePassword(req.body.oldPassword, function (passwordError, isMatch) {
        if (passwordError || !isMatch) {
          var _returnObj8 = {
            success: false,
            message: 'Incorrect Old password, Please try Again',
            data: {}
          };
          return res.send(_returnObj8);
          // const err = new APIError('Incorrect password', httpStatus.UNAUTHORIZED);
          // return next(err);
        }
        // set new password
        var newPassword = req.body.newPassword;
        hashed(newPassword).then(function (result) {
          var hashPassword = result;
          _user4.default.findOneAndUpdateAsync({ _id: foundUser._id }, { $set: { password: hashPassword } }) //eslint-disable-line
          // eslint-disable-next-line
          .then(function (updateUserObj) {
            if (updateUserObj) {
              var _returnObj9 = {
                success: true,
                message: 'Password reset successfully',
                data: {}
              };
              return res.send(_returnObj9);
            }
          }).error(function (e) {
            var err = new _APIError2.default('Error in updating user password', _httpStatus2.default.INTERNAL_SERVER_ERROR);
            return res.send(err);
          });
        });
      });
    } else {
      var _returnObj10 = {
        success: false,
        message: 'No user exists',
        data: {}
      };
      return res.send(_returnObj10);
    }
  }).error(function (e) {
    return next(e);
  });
};

var createRiderLocation = exports.createRiderLocation = function createRiderLocation(req, res) {
  var _req$body2 = req.body,
      userId = _req$body2.userId,
      address = _req$body2.address,
      name = _req$body2.name;

  var location = new _location2.default({
    userId: userId,
    address: address,
    name: name
  });

  location.saveAsync().then(function (locationData) {
    if (locationData) {
      res.send({ status: true, message: 'Location successfully added', data: locationData });
    } else {
      res.send({ status: false, message: 'Internal server error.' });
    }
  }).catch(function () {
    res.send({ status: false, message: 'Internal server error.' });
  });
};

var getRiderLocations = exports.getRiderLocations = function getRiderLocations(req, res) {
  var userId = req.body.userId;

  _location2.default.findAsync({ userId: userId }).then(function (locations) {
    if (locations) {
      return res.send({
        success: true,
        data: [locations]
      });
    } else {
      return res.send({
        success: false,
        message: 'No locations exist',
        data: {}
      });
    }
  }).catch(function () {
    return res.send({
      success: false,
      message: 'Server error fetching locations',
      data: {}
    });
  });
};

/**
 * Flags a location as removed
 * @property {Object} req.body.user - user object containing all fields.
 * @returns {User}
 */
var removeRiderLocation = exports.removeRiderLocation = function removeRiderLocation(req, res) {
  // eslint-disable-next-line
  var userId = req.user._id;
  var locationId = req.body.locationId;


  _location2.default.findOneAndUpdateAsync({ _id: user._id, locationId: locationId }, //eslint-disable-line
  { $set: { isDeleted: true, deletedAt: new Date().toISOString() } }, { new: true }).then(function (locationData) {
    res.send({ data: locationData, message: 'Location successfully removed' });
  }).catch(function (err) {
    res.send({ data: err, message: 'Unable to delete location' });
  });
};

/** Driver controllers */
/**
 * @param  {user, accessCode} req
 * @param  {} res
 * @returns {Shuttles}
 */
var driverShuttleList = exports.driverShuttleList = function driverShuttleList(req, res) {
  /**
   * 1. find driver admin
   * 2. lookup for the vehicles under the same admin which are available
   */
  // console.log('req user', req.user);
  var _req$query = req.query,
      pageNo = _req$query.pageNo,
      _req$query$limit = _req$query.limit,
      limit = _req$query$limit === undefined ? _env2.default.limit : _req$query$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  debug('skip value: ' + req.query.pageNo);
  // find all driver under the same admin
  _adminVehicle2.default.countAsync({ "userIdAdmin": req.user.userType == _userTypes.USER_TYPE_ADMIN ? req.user._id : req.user.adminId, isDeleted: false, activeStatus: false, locationId: req.user.locationId })
  // eslint-disable-next-line
  .then(function (totalVehicleRecord) {
    var returnObj = {
      success: true,
      message: 'No vehicles found', // `no of active vehicles are ${returnObj.data.length}`;
      data: null,
      meta: {
        totalNoOfPages: Math.ceil(totalVehicleRecord / limit),
        limit: limit,
        currPageNo: pageNo,
        currNoOfRecord: 0
      }
    };
    if (totalVehicleRecord < 1) {
      return res.send(returnObj);
    }
    if (skip > totalVehicleRecord) {
      var err = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(err);
    }
    _adminVehicle2.default.find({ "userIdAdmin": req.user.userType == _userTypes.USER_TYPE_ADMIN ? req.user._id : req.user.adminId, isDeleted: false, activeStatus: false, locationId: req.user.locationId }).limit(limit).skip(skip).then(function (vehicleData) {
      returnObj.data = vehicleData;
      returnObj.message = 'vehicles found';
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      debug('no of records are ' + returnObj.meta.currNoOfRecord);
      return res.send(returnObj);
    }).catch(function (err) {
      var err = new _APIError2.default('Error finding vehicles', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
      res.send('Error', err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of users ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside getAllDrivers records');
    next(err);
  });
};

var nearByPickupPoints = exports.nearByPickupPoints = function nearByPickupPoints(req, res, next) {
  // const { adminId,name } = req.query;
  var adminId = req.query.adminId;
  var name = req.query.name ? req.query.name : '';
  var query = { adminId: adminId, isDeleted: false, $or: [{ "name": { $regex: name, $options: 'i' } }, { "address": { $regex: name, $options: 'i' } }] };
  _driverRouteTerminal2.default.findAsync(query).then(function (doc) {
    var returnObj = {
      success: true,
      message: 'No pickup point available',
      data: null,
      meta: null
    };
    if (doc && doc.length) {
      var _returnObj11 = {
        success: true,
        message: 'Pickup points are available',
        data: {
          locations: doc
        }
      };
      res.send(_returnObj11);
    } else {
      returnObj.data = { locations: [] };
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for pickup points ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
};

var nearByDropOffPoints = exports.nearByDropOffPoints = function nearByDropOffPoints(req, res, next) {
  var source = JSON.parse(req.query.source);
  var adminId = req.query.adminId;
  var name = req.query.name ? req.query.name : '';
  var query = { adminId: adminId, isDeleted: false, loc: { $ne: source }, $or: [{ "name": { $regex: name, $options: 'i' } }, { "address": { $regex: name, $options: 'i' } }] };
  _driverRouteTerminal2.default.findAsync(query).then(function (doc) {
    var returnObj = {
      success: true,
      message: 'No location available',
      data: null,
      meta: null
    };
    if (doc && doc.length) {
      var _returnObj12 = {
        success: true,
        message: 'Dropoff points are available',
        data: {
          locations: doc
        }
      };
      res.send(_returnObj12);
    } else {
      returnObj.data = { locations: [] };
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for dropoffs ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
};

var riderAdminList = exports.riderAdminList = function riderAdminList(req, res, next) {

  var filter = { userType: 'admin', isActive: true, isDeleted: false };
  if (req.query.name) {
    var text = req.query.name;
    // var regex = new RegExp('[\\?&]' + text + '=([^&#]*)', 'i');
    filter.name = { $regex: text, $options: 'i' };
  }

  console.log("filter provider list>>>>>>>", (0, _stringify2.default)(filter));

  _user4.default.adminList(filter).then(function (adminNewArr) {
    console.log("filter providers admins>>>>>>>", (0, _stringify2.default)(filter));
    getShuttleListByAdmin(adminNewArr).then(function (admins) {
      var returnObj = {};
      if (admins.length !== 0) {
        returnObj.success = true;
        returnObj.message = 'Available service providers';
        returnObj.data = admins;
      } else {
        returnObj.success = true;
        returnObj.message = 'No service provider found';
        returnObj.data = [];
      }
      console.log("filter provider list returned>>>>>>>", (0, _stringify2.default)(returnObj));
      res.send(returnObj);
    }).catch(function (err) {
      next(err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while retreiving list', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
    next(err);
  });
};

function getShuttleListByAdmin(returnObj) {
  return new _promise2.default(function (resolve, reject) {
    _promise2.default.all(returnObj.map(function (objVehicle, index) {
      return _adminVehicle2.default.findOneAsync({ userIdAdmin: _mongoose2.default.Types.ObjectId(objVehicle._id), isDeleted: false, activeStatus: true, isAvailable: true
      }, { userIdAdmin: 1 }).then(function (result) {
        returnObj[index] = (0, _assign2.default)({}, returnObj[index], { shuttelStatus: result ? true : false });
        return _promise2.default.resolve(returnObj[index]);
      });
    })).then(function (adminList) {
      if (adminList) {
        adminList.map(function (vehicle, i) {
          vehicle._doc.shuttelStatus = vehicle.shuttelStatus;
          returnObj[i] = vehicle._doc;
        });
      }

      console.log("filter provider list getShuttleListByAdmin>>>>>>>", (0, _stringify2.default)(returnObj));
      return resolve(returnObj);
    }).catch(function (err) {
      if (err) {
        console.log('err', err); // eslint-disable-line no-console
      }
      return reject(returnObj);
    });
  });
}

function getCountryCodeByIsdCode() {
  var isdCode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

  return new _promise2.default(function (resolve, reject) {
    _countryCode2.default.findOneAsync({ dial_code: isdCode }).then(function (CountryCodeDetals) {
      resolve(CountryCodeDetals);
    }).catch(function (err) {
      reject(err);
    });
  });
}

function getTotalSeatsBookedDriverTerminalAsync(tripId, terminalId) {
  return _tripRequest2.default.aggregateAsync([{ $match: {
      tripId: _mongoose2.default.Types.ObjectId(tripId),
      "srcLoc._id": _mongoose2.default.Types.ObjectId(terminalId),
      "tripRequestStatus": TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE
    } }, { $lookup: {
      from: "trips",
      localField: "tripId",
      foreignField: "_id",
      as: "tripData"
    }
  }, { $unwind: "$tripData" }, { $match: { "tripData.activeStatus": true } }, {
    $group: {
      "_id": "$tripId",
      "totalSeatsBooked": { "$sum": "$seatBooked" }
    }
  }]);
}

function getDriverTerminalRequestsAsync(tripId, terminalId) {
  return new _promise2.default(function (resolve, reject) {
    _tripRequest2.default.aggregateAsync([{
      $match: {
        tripId: _mongoose2.default.Types.ObjectId(tripId),
        "srcLoc._id": _mongoose2.default.Types.ObjectId(terminalId)
      }
    }, {
      $lookup: {
        from: 'users',
        localField: "riderId",
        foreignField: '_id',
        as: 'riderDetails'
      }
    }, {
      $unwind: "$riderDetails"
    }, { $sort: { "requestTime": -1, "requestUpdatedTime": -1 } }]).then(function (result) {
      if (result && Array.isArray(result)) {
        return resolve(result.map(function (request) {
          request.riderDetails && request.riderDetails.password && delete request.riderDetails.password;
          return request;
        }));
      }
      return resolve(result);
    }).catch(function (err) {
      return reject(err);
    });
  });
}

function getTerminalNewRequestsCountAsync(tripId, terminalId) {
  return new _promise2.default(function (resolve, reject) {
    _tripRequest2.default.aggregateAsync([{
      $match: {
        tripId: _mongoose2.default.Types.ObjectId(tripId),
        "srcLoc._id": _mongoose2.default.Types.ObjectId(terminalId),
        "tripRequestStatus": TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT
      }
    }]).then(function (result) {
      resolve(result);
    }).catch(function (err) {
      reject(err);
    });
  });
}

function getTotalTripSeatsBookedAsync(tripId) {
  return _tripRequest2.default.aggregateAsync([{ $match: { tripId: _mongoose2.default.Types.ObjectId(tripId), "tripRequestStatus": TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE } }, { $lookup: {
      from: "trips",
      localField: "tripId",
      foreignField: "_id",
      as: "tripData"
    }
  }, { $unwind: "$tripData" }, { $match: { "tripData.activeStatus": true } }, {
    $group: {
      "_id": "$tripId",
      "totalSeatsBooked": { "$sum": "$seatBooked" }
    }
  }]);
}

function getAllTripRequestsAsync(tripId) {
  return new _promise2.default(function (resolve, reject) {
    _tripRequest2.default.aggregateAsync([{
      $match: {
        tripId: _mongoose2.default.Types.ObjectId(tripId)
      }
    }, {
      $lookup: {
        from: 'users',
        localField: "riderId",
        foreignField: '_id',
        as: 'riderDetails'
      }
    }, {
      $unwind: "$riderDetails"
    }, { $sort: { "requestTime": -1, "requestUpdatedTime": -1 }
      // not supported on staging server mongo error only _id can be excluded
      // {
      //   $project: {'riderDetails.password': 0}
      // }
    }]).then(function (result) {
      if (result && Array.isArray(result)) {
        return resolve(result.map(function (request) {
          request.riderDetails && request.riderDetails.password && delete request.riderDetails.password;
          return request;
        }));
      }
      return resolve(result);
    }).catch(function (err) {
      reject(err);
    });
  });
}

function getTripNewRequestsCountAsync(tripId) {
  return new _promise2.default(function (resolve, reject) {
    _tripRequest2.default.aggregateAsync([{
      $match: {
        tripId: _mongoose2.default.Types.ObjectId(tripId),
        "tripRequestStatus": TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT
      }
    }]).then(function (result) {
      resolve(result);
    }).catch(function (err) {
      reject(err);
    });
  });
}

var tripRideRequests = exports.tripRideRequests = function tripRideRequests(req, res, next) {
  var terminalID = req.query.terminalId;
  var tripID = req.query.tripId;
  var returnObj = {
    success: false,
    message: 'Requests not found',
    data: {
      meta: {
        onBoardCount: 0,
        newRequestsCount: 0
      },
      rides: [] // should have all requests on the terminal
    }
  };
  if (req.query.terminalId) {
    var promises = [getTotalSeatsBookedDriverTerminalAsync(tripID, terminalID), getTerminalNewRequestsCountAsync(tripID, terminalID), getDriverTerminalRequestsAsync(tripID, terminalID)];
  } else {
    var promises = [getTotalTripSeatsBookedAsync(tripID), getTripNewRequestsCountAsync(tripID), getAllTripRequestsAsync(tripID)];
  }

  _promise2.default.all(promises).then(function (results) {
    var resultOnboardCount = results && results[0] || 0;
    // let resultNewRequestsCount = results && results[1] || 0;
    var resultNewRequests = results && results[2] || [];
    returnObj.success = true;
    returnObj.message = 'Terminal requests found';
    returnObj.data = {
      meta: {
        onBoardCount: resultOnboardCount[0] && resultOnboardCount[0].totalSeatsBooked ? resultOnboardCount[0].totalSeatsBooked : 0,
        newRequestsCount: results[1] && results[1].length || 0
      },
      rides: resultNewRequests || []
    };
    res.send(returnObj);
  }).catch(function (error) {
    console.log("error while getting terminal rides", error);
    var customError = new _APIError2.default('Something went wrong', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
    next(customError);
  });
};

var rideHistory = exports.rideHistory = function rideHistory(req, res, next) {
  var _req$query2 = req.query,
      id = _req$query2.id,
      pageNo = _req$query2.pageNo,
      _req$query2$limit = _req$query2.limit,
      limit = _req$query2$limit === undefined ? 20 : _req$query2$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  _tripRequest2.default.countAsync({ riderId: id }).then(function (response) {
    var returnObj = {
      success: true,
      message: 'no of rides are zero', // `no of active vehicles are ${returnObj.data.length}`;
      data: {
        rides: [],
        meta: {
          totalNoOfPages: Math.ceil(response / limit),
          limit: limit,
          currPageNo: pageNo,
          currNoOfRecord: 0
        }
      }
    };
    if (response < 1) {
      return res.send(returnObj);
    }
    if (skip > response) {
      var err = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(err);
    }
    _tripRequest2.default.find({ riderId: id }).populate({ path: 'adminId', select: 'name fname lname email' }).sort({ requestTime: -1, requestUpdatedTime: -1 }).limit(limit).skip(skip).then(function (records) {
      returnObj.data.rides = records;
      returnObj.message = 'Rides found';
      returnObj.data.meta.currNoOfRecord = records.length;
      return res.send(returnObj);
    }).catch(function (err) {
      res.send('Error', err);
    });
  }).error(function (e) {
    var returnObj = {
      success: true,
      message: 'no of rides are zero',
      data: {
        rides: [],
        meta: {
          totalNoOfPages: 0,
          limit: limit,
          currPageNo: 0,
          currNoOfRecord: 0
        }
      }

    };
    return res.send(returnObj);
    /*const err = new APIError(`error occured while counting the no of rides ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    debug('error inside rideHistory records');
    next(err);*/
  });
};

var driverHistory = exports.driverHistory = function driverHistory(req, res, next) {
  var _req$query3 = req.query,
      id = _req$query3.id,
      pageNo = _req$query3.pageNo,
      _req$query3$limit = _req$query3.limit,
      limit = _req$query3$limit === undefined ? 20 : _req$query3$limit;

  var skip = pageNo ? (pageNo - 1) * limit : _env2.default.skip;
  debug('skip value: ' + req.query.pageNo);
  _trip2.default.countAsync({ driverId: id })
  // eslint-disable-next-line
  .then(function (response) {
    var returnObj = {
      success: true,
      message: 'no of rides are zero', // `no of active vehicles are ${returnObj.data.length}`;
      data: {
        rides: [],
        meta: {
          totalNoOfPages: response < limit ? 1 : Math.ceil(response / limit),
          limit: limit,
          currPageNo: pageNo,
          currNoOfRecord: 0
        }
      }
    };
    if (response.length < 1) {
      return res.send(returnObj);
    }
    if (skip > response.length) {
      var err = new _APIError2.default('Request Page does not exists', _httpStatus2.default.NOT_FOUND);
      return next(err);
    }
    _trip2.default.find({ driverId: id }).populate({ path: 'shuttleId' }).sort({ tripStartAt: -1 }).limit(limit).skip(skip).then(function (records) {
      returnObj.data.rides = records;
      returnObj.message = 'Rides found';
      returnObj.data.meta.currNoOfRecord = records.length;
      returnObj.data.meta.totalNoOfRecord = response;
      // returnObj.data.meta.totalNoOfPages = returnObj.meta.totalNoOfPages;
      // returnObj.data.meta.currNoOfRecord = records.length;
      debug('no of records are ' + returnObj.data.meta.currNoOfRecord);
      return res.send(returnObj);
    }).catch(function (err) {
      res.send('Error', err);
    });
  }).error(function (e) {
    var returnObj = {
      success: true,
      message: 'no of rides are zero',
      data: {
        rides: [],
        meta: {
          totalNoOfPages: 0,
          limit: limit,
          currPageNo: 0,
          currNoOfRecord: 0
        }
      }
    };
    return res.send(returnObj);
    var err = new _APIError2.default('error occured while counting the no of rides ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside rideHistory records');
    next(err);
  });
};

function driverRoutes(req, res, next) {
  var updateUserObj = (0, _assign2.default)({}, req.body);
  _user4.default.findOneAsync({ _id: req.query.driverId }).then(function (userDoc) {
    var returnObj = {
      success: false,
      message: 'Unable to find the driver route',
      data: null,
      meta: null
    };
    if (userDoc) {
      _driverRouteTerminal2.default.findAsync({ driverId: userDoc._id, isDeleted: false }).then(function (driverData) {
        if (driverData.length > 0) {
          returnObj.success = true;
          returnObj.message = 'Driver route found';
          returnObj.data = driverData;
          res.send(returnObj);
        } else {
          res.send(returnObj);
        }
      }).error(function (err) {
        var err = new _APIError2.default('Error occured while searching for the route ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    } else {
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

var updateShuttleStatus = exports.updateShuttleStatus = function updateShuttleStatus(req, res, next) {
  if (req.user.userType == _userTypes.USER_TYPE_ADMIN) {
    var err = new _APIError2.default('You are not authorized to activate trip', _httpStatus2.default.UNAUTHORIZED, true);
    return next(err);
  }
  var _req$query4 = req.query,
      activeStatus = _req$query4.activeStatus,
      shuttleId = _req$query4.shuttleId,
      driverId = _req$query4.driverId,
      id = _req$query4.id;


  if (activeStatus == 'true') {
    var tripUpdateData = {
      shuttleId: shuttleId,
      driverId: driverId,
      activeStatus: true
    };

    _trip2.default.findOne({ driverId: driverId, activeStatus: true }).populate('shuttleId').exec().then(function (result) {
      if (result) {
        var _returnObj13 = {
          success: false,
          message: 'Driver already activated another shuttle',
          data: { response: result, driverRoute: [] }
        };
        if (result.shuttleId._id == shuttleId) {
          _returnObj13.success = true;
          _returnObj13.message = 'Shuttle is already activated';
          _returnObj13.data = { response: result, driverRoute: [] };
          _driverRouteTerminal2.default.findAsync({ driverId: driverId, isDeleted: false }).then(function (driverData) {
            if (driverData.length > 0) {
              _returnObj13.data = { response: result, driverRoute: driverData };
              return res.send(_returnObj13);
            } else {
              _returnObj13.data = { response: result, driverRoute: [] };
              return res.send(_returnObj13);
            }
          }).catch(function (err) {
            var err = new _APIError2.default('Error occured while searching for the route', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
            next(err);
          });
        } else {
          res.send(_returnObj13);
          return notifyDriverAdminTripStatus(driverId, result._id);
        }
      } else {
        updateDriverVehicleStatusAsync(driverId, shuttleId, true).then(function (results) {
          var newTrip = new _trip2.default(tripUpdateData);
          newTrip.save().then(function (response) {
            _user4.default.findOneAsync({ _id: req.query.driverId }).then(function (userDoc) {
              if (userDoc) {
                _driverRouteTerminal2.default.findAsync({ driverId: userDoc._id, isDeleted: false }).then(function (driverData) {
                  if (driverData.length > 0) {
                    var _returnObj14 = {
                      success: true,
                      message: 'Trip activated successfully',
                      data: { response: response, driverRoute: driverData }
                    };
                    res.send(_returnObj14);
                    return notifyDriverAdminTripStatus(driverId, response._id);
                  } else {
                    var _returnObj15 = {
                      success: true,
                      message: 'Trip activated successfully',
                      data: { response: response, driverRoute: [] }
                    };
                    res.send(_returnObj15);
                    return notifyDriverAdminTripStatus(driverId, response._id);
                  }
                }).catch(function (err) {
                  console.log("occured while searching for the route", err);
                  var err = new _APIError2.default('Error occured while searching for the route', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
                  next(err);
                });
              } else {
                return res.send(returnObj);
              }
            }).error(function (e) {
              var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
              next(err);
            });
          }).catch(function (e) {
            return next(e);
          });
        }).catch(function (error) {
          next(error);
        });
      }
    }).catch(function (e) {
      return next(e);
    });
  } else if (activeStatus == 'false') {
    _trip2.default.findOneAndUpdateAsync({ _id: id, activeStatus: true }, { $set: { activeStatus: false, tripEndTime: new Date().toISOString() } }, { new: true })
    // eslint-disable-next-line
    .then(function (updatedTripObj) {
      var returnObj = {
        success: true,
        message: '',
        data: {}
      };
      if (updatedTripObj) {
        returnObj.message = 'Shuttle Deactived';
        updateDriverVehicleStatusAsync(updatedTripObj.driverId, updatedTripObj.shuttleId, false).then(function (results) {
          res.send(returnObj);
          return notifyDriverAdminTripStatus(updatedTripObj.driverId, updatedTripObj._doc._id);
        }).catch(function (error) {
          next(e);
        });
      } else {
        returnObj.success = false;
        returnObj.message = 'No Active Shuttle';
        return res.send(returnObj);
      }
    }).error(function (e) {
      var err = new _APIError2.default('Something went wrong', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
      next(err);
    });
  }
};

var tripUpdateMessageToAdmin = {
  true: "New Trip started",
  false: "Trip deactivated"
};

var tripUpdateEventToAdmin = {
  true: "tripCreated",
  false: "tripDeactivated"
};

function notifyDriverAdminTripStatus(driverId, tripId) {
  var query = {
    userIdDriver: driverId,
    isDeleted: false
  };
  _adminDriver2.default.findOne(query).populate([{ path: 'userIdDriver', select: 'name email' }, { path: 'userIdAdmin', select: 'name email' }]).then(function (result) {
    if (result) {
      _trip2.default.findOne({ _id: tripId }, { gpsLoc: 1, activeStatus: 1, visitedTerminal: 1 }).populate([{ path: 'driverId', select: 'email activeStatus profileUrl name gpsLoc' }, { path: 'shuttleId', select: 'name activeStatus' }]).then(function (trip) {
        var payload = {
          success: false,
          message: "Trip not found",
          data: {}
        };
        if (trip) {
          var data = (0, _assign2.default)({}, trip);
          if (!data._doc.gpsLoc || !data._doc.gpsLoc.length) {
            data._doc.gpsLoc = data._doc.driverId && data._doc.driverId.gpsLoc;
          }
          payload.success = true;
          payload.message = tripUpdateMessageToAdmin[trip.activeStatus];
          payload.data = data._doc;

          _socketStore2.default.emitByUserId(result.userIdAdmin._id, tripUpdateEventToAdmin[trip.activeStatus], payload);
        }
      }).catch(function (err) {
        console.log("error while sending notification to the admin", err);
      });
    }
  });
}

function updateDriverVehicleStatusAsync(driverId, vehicleId, status) {
  return new _promise2.default(function (resolve, reject) {

    var promises = [_adminVehicle2.default.updateAsync({ _id: vehicleId, isDeleted: false }, { $set: { activeStatus: status } }, { new: true }), _user4.default.updateAsync({ _id: driverId, isDeleted: false }, { $set: { activeStatus: status } }, { new: true })];

    _promise2.default.all(promises).then(function (results) {
      if (results && !results[0]) {
        return reject(new Error("Something went wrong while updating trip vehicle"));
      } else if (results && !results[1]) {
        return reject(new Error("Something went wrong while updating trip driver"));
      } else if (results && results[0] && results[1]) {
        return resolve(results);
      } else {
        return reject(new Error("Something went wrong while updating trip driver and vehicle"));
      }
    }).catch(function (error) {
      return reject(error);
    });
  });
}

var ridesCompletingAtTerminal = exports.ridesCompletingAtTerminal = function ridesCompletingAtTerminal(req, res, next) {
  var _req$query5 = req.query,
      driverId = _req$query5.driverId,
      terminalId = _req$query5.terminalId,
      tripId = _req$query5.tripId;

  var returnObj = {
    success: false,
    message: 'Unable to find rides completing at terminal',
    data: []
  };

  // check if trip is active with provided trip details

  _trip2.default.findOneAsync({ _id: tripId, driverId: driverId, activeStatus: true }).then(function (trip) {
    if (trip) {
      getAllRidersCompletingTripAtTerminal(tripId, terminalId).then(function (rides) {
        if (rides.length > 0) {
          returnObj.success = true;
          returnObj.message = 'Rides found';
          returnObj.data = rides;
          return res.send(returnObj);
        } else {
          return res.send(returnObj);
        }
      }).error(function (err) {
        var err = new _APIError2.default('Error occured while searching for the route ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        return next(err);
      });
    } else {
      returnObj.message = 'Trip not found';
      return res.send(returnObj);
    }
  }).catch(function (error) {
    var err = new _APIError2.default('Error occured while searching for the trip ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    return next(err);
  });
};

function getAllRidersCompletingTripAtTerminal(tripId, terminalId) {
  var aggregateStages = [{
    $match: {
      tripId: _mongoose2.default.Types.ObjectId(tripId),
      "destLoc._id": _mongoose2.default.Types.ObjectId(terminalId),
      "tripRequestStatus": TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED
    }
  }, {
    $lookup: {
      from: 'users',
      localField: "riderId",
      foreignField: '_id',
      as: 'riderDetails'
    }
  }, {
    $unwind: "$riderDetails"
  }];

  return TripRequestSchema.aggregateAsync(aggregateStages);
}

function addReview(req, res, next) {
  // const { reviewerId, reviewToId, reviewType, message, rating } = req.body;

  var reviewObj = new _review2.default({
    reviewerId: req.body.reviewerId,
    reviewToId: req.body.reviewToId,
    reviewToType: req.body.reviewToType,
    message: req.body.message,
    adminId: req.body.adminId,
    rating: req.body.rating || 0
  });

  reviewObj.saveAsync().then(function (newReviewObj) {
    if (req.body.reviewToType == 'driver' || req.body.reviewToType == 'admin') {
      _review2.default.aggregateAsync([{ "$match": { "reviewToId": ObjectId(req.body.reviewToId) } }, { "$group": {
          "_id": null,
          "avg": { "$avg": "$rating" }
        } }]).then(function (average) {
        _user4.default.updateAsync({ _id: ObjectId(req.body.reviewToId) }, { $set: { avgRating: average[0].avg } }, { multi: true }) // eslint-disable-line no-underscore-dangle
        .then(function () {
          var returnObj = {
            success: true,
            message: "Review has been added successfully.",
            data: average
          };
          return res.send(returnObj);
        }).error(function (e) {
          var err = new _APIError2.default('Error occured while Updating Average ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          next(err);
        });
      }).error(function (e) {
        console.log("error adding review1", e);
        var err = new _APIError2.default('Error occured while computing revenue graph ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    } else {
      var _returnObj16 = {
        success: true,
        message: "Review has been added successfully.",
        data: newReviewObj
      };
      res.send(_returnObj16);
    }
  }).error(function (e) {
    console.log("error adding review1", e);
    var err = new _APIError2.default('Error occured while saving trip object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function getCurrentTripOrRequest(req, res, next) {
  var returnObj = { success: false, message: 'no trip or request found', data: { response: {}, driverRoute: [] } };
  if (req.user.userType == _userTypes.USER_TYPE_DRIVER) {
    _trip2.default.findOne({ driverId: req.user._id, activeStatus: true }).populate('shuttleId').exec().then(function (result) {
      if (result) {
        returnObj = {
          success: false,
          message: 'Currently active trip',
          data: { response: result, driverRoute: [] }
        };
        // get trip driver's route and terminals
        _driverRouteTerminal2.default.findAsync({ driverId: req.user._id, isDeleted: false }).then(function (driverData) {
          if (driverData.length > 0) {
            returnObj.success = true;
            returnObj.data = { response: result, driverRoute: driverData };
            return res.send(returnObj);
          } else {
            returnObj.data = { response: result, driverRoute: [] };
            return res.send(returnObj);
          }
        }).catch(function (err) {
          console.log("occured while searching for the route", err);
          var err = new _APIError2.default('Error occured while searching for the route', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
          next(err);
        });
      } else {
        returnObj.message = 'No active trip found';
        return res.send(returnObj);
      }
    }).catch(function (e) {
      return next(e);
    });
  } else if (req.user.userType == _userTypes.USER_TYPE_RIDER) {
    var tripRequestStatuses = [TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE];

    _tripRequest2.default.find({ riderId: req.user._id, tripRequestStatus: { $in: tripRequestStatuses } }).populate([{ path: 'adminId', select: 'name fname lname email' }, { path: 'tripId', select: 'driverId ' }]).sort({ requestTime: -1, requestUpdatedTime: -1 }).limit(1).then(function (tripRequests) {
      var tripRequest = tripRequests && Array.isArray(tripRequests) && tripRequests[0] || null;
      if (tripRequest && tripRequest.tripId) {
        _driverRouteTerminal2.default.findAsync({ driverId: tripRequest.tripId.driverId, isDeleted: false }).then(function (driverData) {
          if (driverData.length > 0) {
            returnObj.success = true;
            returnObj.message = "Trip request with active trip found";
            returnObj.data = { response: tripRequest, driverRoute: driverData };
            return res.send(returnObj);
          } else {
            returnObj.message = "Trip request found";
            returnObj.data = { response: tripRequest, driverRoute: [] };
            return res.send(returnObj);
          }
        }).catch(function (err) {
          console.log("occured while searching for the route", err);
          var err = new _APIError2.default('Error occured while searching for the route', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
          next(err);
        });
      } else if (tripRequest) {
        returnObj.message = 'Trip request with no trip found';
        returnObj.data = { response: tripRequest, driverRoute: [] };
        return res.send(returnObj);
      } else {
        returnObj.message = "No trip request found";
        return res.send(returnObj);
      }
    }).catch(function (err) {
      res.send('Error', err);
    });
  } else {
    returnObj.message = 'Not a valid user';
    res.send(returnObj);
  }
}

function getRiderNotificationRequests(req, res, next) {
  var returnObj = { success: false, message: 'no request found', data: [] };
  var tripRequestStatuses = [TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE];
  _tripRequest2.default.aggregateAsync([{ $match: { riderId: _mongoose2.default.Types.ObjectId(req.user._id), tripRequestStatus: { $in: tripRequestStatuses } } }, {
    $lookup: {
      from: "trips",
      localField: "tripId",
      foreignField: "_id",
      as: "trip"
    }
  }, { $unwind: "$trip" }, {
    $lookup: {
      from: "adminvehicles",
      localField: "trip.shuttleId",
      foreignField: "_id",
      as: "shuttle"
    }
  }, { $unwind: "$shuttle" }, {
    $lookup: {
      from: "users",
      localField: "trip.driverId",
      foreignField: "_id",
      as: "driver"
    }
  }, { $unwind: "$driver" },
  // not supported on staging server mongo (v3.2.21) error only _id can be excluded
  // {
  //   $addFields: {
  //     "shuttleLocation": {
  //       "latitude": { $arrayElemAt: [ "$trip.gpsLoc", 1 ] },
  //       "longitude": { $arrayElemAt: [ "$trip.gpsLoc", 0 ] }
  //     }
  //   }
  // },
  {
    $project: {
      "shuttleLocation": {
        "latitude": { $arrayElemAt: ["$trip.gpsLoc", 1] },
        "longitude": { $arrayElemAt: ["$trip.gpsLoc", 0] }
      },
      "driver": { $cond: { if: { $eq: ["$tripRequestStatus", "request"] }, then: {}, else: "$driver" } },
      "shuttle": { $cond: { if: { $eq: ["$tripRequestStatus", "request"] }, then: {}, else: "$shuttle" } },
      "riderId": "$riderId",
      "driverId": "$driverId",
      "tripId": "$tripId",
      "adminId": "$adminId",
      "_id": "$_id",
      "seatBooked": "$seatBooked",
      "requestUpdatedTime": "$requestUpdatedTime",
      "requestTime": "$requestTime",
      "longitudeDelta": "$longitudeDelta",
      "latitudeDelta": "$latitudeDelta",
      "destAddress": "$destAddress",
      "pickUpAddress": "$pickUpAddress",
      "tripRequestIssue": "$tripRequestIssue",
      "tripRequestStatus": "$tripRequestStatus",
      "paymentStatus": "$paymentStatus",
      "paymentMode": "$paymentMode",
      "endAddress": "$endAddress",
      "startAddress": "$startAddress",
      "destLoc": "$destLoc",
      "srcLoc": "$srcLoc"
    }
  },
  // not supported on staging server mongo error only _id can be excluded
  // {
  //   $project: {
  //     'trip': 0,
  //     "driver.password": 0,
  //     "driver.accessCode": 0,
  //   }
  // },
  // not supported on staging server mongo (v3.2.21) error only _id can be excluded
  // {
  //   $addFields: {
  //     "driver": {$cond: { if: { $eq: [ "$tripRequestStatus", "request" ] }, then: {}, else: "$driver" }},
  //     "shuttle": {$cond: { if: { $eq: [ "$tripRequestStatus", "request" ] }, then: {}, else: "$shuttle" }}
  //   }
  // },
  { $sort: { requestTime: -1, requestUpdatedTime: -1 } }, { $limit: 1 }]).then(function (result) {
    if (result && Array.isArray(result) && result.length) {
      returnObj.success = true;
      returnObj.message = "All requests found";
      returnObj.data = result[0];
      return res.send(returnObj);
    } else {
      returnObj.message = "No request found";
      return res.send(returnObj);
    }
  }).catch(function (error) {
    var err = new _APIError2.default('Something went wrong, while searching for rides', _httpStatus2.default.INTERNAL_SERVER_ERROR, true);
    console.log("error is:", error);
    return next(err);
  });
}

function validateReservationCode(req, res, next) {
  var returnObj = {};
  console.log("             ");
  console.log("req.body.reservationCode.length", req.body.reservationCode.length);
  console.log("             ");
  if (req.body.reservationCode.length != 4) {
    returnObj.success = false;
    returnObj.message = 'Please enter last 4 digits of reservation code.';
    return res.send(returnObj);
  }

  _user4.default.findOneAsync({ _id: req.body.adminId, isDeleted: false })
  // eslint-disable-next-line consistent-return
  .then(function (user) {
    console.log("             ");
    console.log("user", user);
    console.log("             ");
    if (!user) {
      var err = new _APIError2.default('Service provider not found', _httpStatus2.default.NOT_FOUND, true);
      return next(err);
    } else {
      var lastFourDigits = user.reservationCode.substr(user.reservationCode.length - 4);
      if (req.body.reservationCode != lastFourDigits) {
        returnObj.success = false;
        returnObj.message = 'Reservationcode not matched';
      } else {
        returnObj.success = true;
        returnObj.message = 'Reservationcode matched';
      }
      return res.send(returnObj);
    }
  }).catch(function (err123) {
    var err = new _APIError2.default('error in getting Reservation code ' + err123, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function listReview(req, res, next) {}

function driverChangeVehicle(req, res, next) {
  var returnObj = { success: false, message: '', data: null };
  var driverId = _mongoose2.default.Types.ObjectId(req.body.driverId);
  console.log("req.body --- >", req.body);
  _trip2.default.findOneAsync({ _id: req.body.tripId, activeStatus: true }).then(function (tripDetails) {
    if (!tripDetails) {
      console.log("in trip");
      returnObj.message = "Trip not found";
      res.send(returnObj);
    } else {
      _adminVehicle2.default.findOneAsync({ _id: req.body.vehicalId, isDeleted: false }).then(function (findVehical) {
        if (!findVehical) {
          console.log("in vehicle");
          returnObj.success = false;
          returnObj.message = "Vehicle not found";
          returnObj.data = null;
          res.send(returnObj);
        } else {
          console.log("tripDetails.driver.locationId", tripDetails.driver.locationId);
          console.log("findVehical.locationId", findVehical.locationId);
          var bookedSeat = tripDetails.seatBooked;
          var totalSeat = findVehical.seats;
          console.log("bookedSeat", bookedSeat);
          console.log("totalSeat", totalSeat);
          if (!_mongoose2.default.Types.ObjectId(tripDetails.driver.locationId).equals(findVehical.locationId)) {
            console.log("RES ----> 1");
            returnObj.message = "Vehicle not available for this location";
            return res.send(returnObj);
          } else if (totalSeat < bookedSeat) {
            console.log("RES ----> 2");
            returnObj.message = "Vehicle does not have required seats available";
            return res.send(returnObj);
          } else if (!_mongoose2.default.Types.ObjectId(tripDetails.driver._id).equals(driverId)) {
            console.log("RES ----> 3");
            returnObj.message = "Driver does not exist on this trip";
            return res.send(returnObj);
          } else if (!_mongoose2.default.Types.ObjectId(tripDetails.driver.adminId).equals(findVehical.userIdAdmin)) {
            console.log("RES ----> 4");
            returnObj.message = "Vehicle or driver may have different service providers";
            return res.send(returnObj);
          }
          // updateDriverVehicleStatusAsync(driverId, tripDetails.shuttleId, false)
          _adminVehicle2.default.updateAsync({ _id: tripDetails.shuttleId, isDeleted: false }, { $set: { activeStatus: false } }, { new: true }).then(function (updateVehicleStatus) {
            _trip2.default.findOneAndUpdateAsync({ _id: req.body.tripId, activeStatus: true }, { $set: { shuttleId: findVehical._id } }, { one: true }).then(function (updatetrip) {
              if (!updatetrip) {
                console.log("in both matching step");
                returnObj.success = false;
                returnObj.message = "Trip not found";
                returnObj.data = null;
                res.send(returnObj);
              } else {
                // updateDriverVehicleStatusAsync(driverId, tripDetails.shuttleId, false)
                _adminVehicle2.default.updateAsync({ _id: req.body.vehicalId, isDeleted: false }, { $set: { activeStatus: true } }, { new: true }).then(function (updateVehicleStatus) {
                  _tripRequest2.default.find({ tripId: _mongoose2.default.Types.ObjectId(req.body.tripId) }).populate({ path: 'adminId', select: 'name fname lname email' }).populate({ path: 'riderId', select: 'name fname lname email' }).then(function (result) {
                    console.log("result>>>>>>", (0, _stringify2.default)(result));
                    if (!result) {
                      returnObj.success = false;
                      returnObj.message = "Trip requset not found";
                      returnObj.data = null;
                      res.send(returnObj);
                    } else {
                      notifyRideVehicalChange(result, updatetrip);
                      returnObj.success = true;
                      returnObj.message = "Vehicle Changed In Trip";
                      returnObj.data = result;
                      res.send(returnObj);
                    }
                  }).catch(function (err) {
                    // const err = new APIError(`error in getting TripRequestDetails ${err}`, httpStatus.INTERNAL_SERVER_ERROR);
                    next(err);
                  });
                }).catch(function (err) {
                  next(err);
                });
                console.log("match>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
              }
            }).catch(function (err) {
              var error = new _APIError2.default('error in trip and vehicle details not match  ' + err, _httpStatus2.default.INTERNAL_SERVER_ERROR);
              next(error);
            });
          }).catch(function (err) {
            next(err);
          });
        }
      }).catch(function (err) {
        var error = new _APIError2.default('error in getting TripRequestDetails ' + err, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(error);
      });
    }
  }).catch(function (err) {
    var error = new _APIError2.default('error in getting TripRequestDetails ' + err, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(error);
  });
};

function notifyRideVehicalChange(requests, data) {
  var eventPayload = {
    success: true,
    message: 'Vehicle Changed By Driver',
    data: data
  };
  var eventPayload1 = {
    success: true,
    message: 'Vehicle Changed By Driver',
    data: data
  };

  requests.map(function (request, index) {
    _socketStore2.default.emitByUserId(request.riderId._id, "vehicleChangedRider", eventPayload1);
  });

  _socketStore2.default.emitByUserId(data.driver.adminId, "VehicleChangedAdmin", eventPayload);
}

var signUpProvider = exports.signUpProvider = function signUpProvider(req, res, next) {
  _user4.default.findOneAsync({
    $or: [{ email: req.body.email.toLowerCase(), userType: req.body.userType ? req.body.userType : _userTypes.USER_TYPE_RIDER, isDeleted: false }, { userType: req.body.userType ? req.body.userType : _userTypes.USER_TYPE_RIDER, phoneNo: req.body.phoneNo, isDeleted: false }]
  }).then(function (foundUser) {
    if (foundUser !== null && foundUser.userType === (req.body.userType ? req.body.userType : _userTypes.USER_TYPE_RIDER)) {
      var numberunique = foundUser._id;
      _user4.default.findOneAndUpdateAsync({ _id: foundUser._id }, { $set: { loginStatus: true, jwtAccessToken: numberunique } }, { new: true }).then(function (updateUserObj) {
        if (updateUserObj) {
          if (updateUserObj.email == req.body.email.toLowerCase() && updateUserObj.phoneNo == req.body.phoneNo) {
            var msg = "User already registered with same email address and mobile number";
          } else if (updateUserObj.email == req.body.email.toLowerCase()) {
            var msg = "User already registered with same email address";
          } else {
            var msg = "User already registered with same mobile number";
          }
          var _returnObj17 = {
            success: false,
            message: msg,
            data: { user: updateUserObj }
          };
          return res.send(_returnObj17);
        }
      }).error(function (e) {
        var err = new _APIError2.default('Error in updating user details while login ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    } else {
      _countryCode2.default.findOneAsync({ dial_code: req.body.isdCode }).then(function (CountryCodeDetails) {
        getApproveConfig().then(function (values) {
          var otpValue = _util2.default.generateVerificationCode();
          var accessCode = _util2.default.generateAccessCode();
          var reservationCode = _util2.default.generateUniueReservationCode();
          var newPassword = randomstring.generate({
            length: 6
            // charset: 'alphanumeric'
          });
          getPassword(_global.MASTER_PASSWORD).then(function (masterPassWord) {
            var _newUser;

            var newUser = (_newUser = {
              tripType: req.body.tripType ? req.body.tripType : _tripType.TRIP_CIRCULAR_STATIC,
              email: req.body.email.toLowerCase(),
              reservationCode: reservationCode,
              userType: req.body.userType ? req.body.userType : _userTypes.USER_TYPE_RIDER,
              name: req.body.name,
              phoneNo: req.body.phoneNo,
              isdCode: req.body.isdCode,
              adminTripTypes: req.body.adminTripTypes,
              managerDetails: req.body.managerDetails,
              isDeleted: req.body.isDeleted ? req.body.isDeleted : false,
              countryCode: req.body.countryCode,
              gpsLoc: [19.02172902354515, 72.85368273308545],
              carDetails: req.body.userType === _userTypes.USER_TYPE_DRIVER ? { type: 'sedan' } : {},
              mapCoordinates: [0, 0],
              isApproved: req.body.userType === _userTypes.USER_TYPE_DRIVER ? values && values.autoApproveDriver ? values.autoApproveDriver : true : values && values.autoApproveRider ? values.autoApproveRider : true,
              loginStatus: false,
              country: req.body.country ? req.body.country : '',
              otp: otpValue,
              accessCode: accessCode,
              password: newPassword,
              masterPassword: masterPassWord
            }, (0, _defineProperty3.default)(_newUser, 'isDeleted', false), (0, _defineProperty3.default)(_newUser, 'isActive', false), (0, _defineProperty3.default)(_newUser, 'profileUrl', _util2.default.getUploadsAvtarsUrl(req) + "/provider_default.png"), (0, _defineProperty3.default)(_newUser, 'address', req.body.address ? req.body.address : ""), (0, _defineProperty3.default)(_newUser, 'mobileVerified', true), _newUser);
            var user = new _user4.default(newUser);
            user.saveAsync().then(function (savedUser) {
              var numberunique = savedUser._id;
              _user4.default.findOneAndUpdateAsync({ _id: savedUser._id }, { $set: { jwtAccessToken: numberunique } }).then(function (updatedUser) {
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
                var smsText = 'Credentials for login  email: ' + updatedUser.email + ' password: ' + newPassword + ' accesscode: ' + accessCode;
                (0, _emailApi2.default)(updatedUser._id, userObj, 'createAdmin');
                (0, _emailApi2.default)(updatedUser._id, managerObj, 'sendEmailToManager');
                (0, _smsApi.sendSmsBeforeRegister)(managerPhoneDetails, smsText, function (err /* , data */) {
                  var returnObj = {
                    success: true,
                    message: 'You Have Been Successfully Registered! Please login',
                    data: { user: savedUser }
                  };
                  if (err) {
                    returnObj.message = 'You Have Been Successfully Registered! Please login , Unable to send sms because ' + err.message;
                  }
                  if (req.body.locationObject) {
                    var edges = req.body.radius ? req.body.radius * 3 : 32;
                    var adminLocationObj = new _adminLocation2.default({
                      "name": req.body.locationObject.name ? req.body.locationObject.name : "",
                      "zone": req.body.locationObject.zone,
                      "userIdAdmin": updatedUser._id,
                      "radius": req.body.locationObject.radius ? req.body.locationObject.radius : 0,
                      "polygons": _util2.default.getCirclePolygons({ coordinates: req.body.locationObject.zone.location, radius: req.body.locationObject.radius, numberOfEdges: edges })
                    });
                    adminLocationObj.saveAsync().then(function (savedUser) {
                      return res.send(returnObj);
                    }).error(function (e) {
                      var err = new _APIError2.default('Error while adding new Address ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
                      return next(returnObj);
                    });
                  } else {
                    return res.send(returnObj);
                  }

                  return res.send(returnObj);
                });
              }).error(function (e) {
                return next(e);
              });
            }).error(function (e) {
              return next(e);
            });
          }).catch(function (e) {
            var err = new _APIError2.default('Error in creating user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
            next(err);
          });
        }).catch(function (e) {
          var err = new _APIError2.default('Error in creating user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          next(err);
        });
      }).catch(function (e) {
        var err = new _APIError2.default('Error in creating user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
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

// function notifyAdminVehicalChange(request, othertrip){
//   let eventPayload = {
//     success: true,
//     message: 'Request is transferred',
//     data: othertrip
//   }
//   SocketStore.emitByUserId(request.riderId, "requestTransferredRider", eventPayload);
// }
//# sourceMappingURL=user.js.map
