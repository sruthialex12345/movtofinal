'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _env = require('../../config/env');

var _env2 = _interopRequireDefault(_env);

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

var _userTypes = require('../constants/user-types');

var _trip = require('../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _socketStore = require('../service/socket-store');

var _socketStore2 = _interopRequireDefault(_socketStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var randomstring = require("randomstring");

/**
 * Returns jwt token  and user object if valid email and password is provided
 * @param req (email, password, userType)
 * @param res
 * @param next
 * @returns {jwtAccessToken, user}
 */
function loginAdmin(req, res, next) {
  // console.log("Request-->", req);
  _user2.default.findOneAsync({ email: req.body.email.toLowerCase(), isDeleted: false, $or: [{ userType: _userTypes.USER_TYPE_ADMIN }, { userType: _userTypes.USER_TYPE_SUPER_ADMIN }] }, '+password')
  // eslint-disable-next-line consistent-return

  .then(function (user) {
    // console.log("Request-->", user);
    if (!user) {
      var err = new _APIError2.default('User not found', _httpStatus2.default.NOT_FOUND, true);
      return next(err);
    } else if (!user.mobileVerified) {
      var _err = new _APIError2.default('Verification code not verified', _httpStatus2.default.NOT_FOUND, true);
      return next(_err);
    } else if (!user.isActive) {
      var _err2 = new _APIError2.default('Your account is not active, Please contact admin.', _httpStatus2.default.NOT_FOUND, true);
      return next(_err2);
    } else {
      // eslint-disable-next-line consistent-return
      user.comparePassword(req.body.password, function (passwordError, isMatch) {
        if (passwordError || !isMatch) {
          var _err3 = new _APIError2.default('Incorrect Username/Password', _httpStatus2.default.UNAUTHORIZED, true);
          return next(_err3);
        }
        var numberunique = user._id;
        user.jwtAccessToken = numberunique;
        user.loginStatus = true;
        var jwtTokenAuth = {
          _id: user._id,
          userType: user.userType,
          email: user.email,
          fname: user.fname,
          accessCode: user.accessCode,
          numberunique: numberunique
        };
        user.gpsLoc = [19.02172902354515, 72.85368273308545];
        var token = _jsonwebtoken2.default.sign(jwtTokenAuth, _env2.default.jwtSecret);
        var updateDoc = {};
        if (req.body.device && req.body.device.token) {
          user.loggedInDevices = [{ token: req.body.device.token, type: req.body.device.type }];
          // userToUpdate = {...user};
          // delete userToUpdate.loggedInDevices;
          // console.log("usertoudpate", userToUpdate);
          // updateDoc['$addToSet'] = {
          //   loggedInDevices: {token: req.body.device.token, type: req.body.device.type}
          // }
        }
        updateDoc['$set'] = user;
        _user2.default.findOneAndUpdateAsync({ _id: user._id }, updateDoc, { new: true }) // eslint-disable-line no-underscore-dangle
        .then(function (updatedUser) {
          var returnObj = {
            success: true,
            message: 'User successfully logged in',
            data: {
              jwtAccessToken: 'JWT ' + token,
              user: updatedUser
            }
          };
          res.json(returnObj);
        }).error(function (err123) {
          var err = new _APIError2.default('error in updating user details while login ' + err123, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          next(err);
        });
      });
    }
  }).error(function (e) {
    var err = new _APIError2.default('erro while finding user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function loginDriver(req, res, next) {
  var userObj = {
    email: req.body.email.toLowerCase(),
    userType: _userTypes.USER_TYPE_DRIVER,
    isDeleted: false
  };

  _user2.default.findOneAsync(userObj, '+password')
  // eslint-disable-next-line consistent-return
  .then(function (user) {
    if (!user) {
      var err = new _APIError2.default('User not found with this email', _httpStatus2.default.NOT_FOUND, true);
      return next(err);
    } else if (!user.isActive) {
      var _err4 = new _APIError2.default('Your account is not active, Please contact admin.', _httpStatus2.default.NOT_FOUND, true);
      return next(_err4);
    } else {
      // eslint-disable-next-line consistent-return
      user.comparePassword(req.body.password, function (passwordError, isMatch) {
        if (passwordError || !isMatch) {
          var _err5 = new _APIError2.default('Incorrect Username/Password', _httpStatus2.default.UNAUTHORIZED, true);
          return next(_err5);
        }
        if (user.loginStatus) {
          var _err6 = new _APIError2.default('You are already logged into another device.', _httpStatus2.default.UNAUTHORIZED, true);
          return next(_err6);
        }
        var unixTimestamp = Math.round(new Date().getTime() / 1000);
        var randomNumber = randomstring.generate({
          length: 8
        });
        var numberunique = randomNumber + unixTimestamp + user._id;
        user.jwtAccessToken = numberunique;
        user.loginStatus = true;
        if (req.body.gpsLoc) {
          user.gpsLoc = req.body.gpsLoc;
        }
        var jwtTokenAuth = {
          _id: user._id,
          userType: user.userType,
          email: user.email,
          fname: user.fname,
          accessCode: user.accessCode,
          numberunique: numberunique
        };
        var token = _jsonwebtoken2.default.sign(jwtTokenAuth, _env2.default.jwtSecret);
        var updateDoc = {};
        if (req.body.device && req.body.device.token) {
          user.loggedInDevices = [{ token: req.body.device.token, type: req.body.device.type }];
          // userToUpdate = {...user};
          // delete userToUpdate.loggedInDevices;
          // console.log("usertoudpate", userToUpdate);
          // updateDoc['$addToSet'] = {
          //   loggedInDevices: {token: req.body.device.token, type: req.body.device.type}
          // }
        }
        updateDoc['$set'] = user;
        _user2.default.findOneAndUpdateAsync({ _id: user._id }, updateDoc, { new: true }) // eslint-disable-line no-underscore-dangle
        .then(function (updatedUser) {
          _trip2.default.findOne({ 'driver._id': user._id, activeStatus: true }).populate('shuttleId').exec().then(function (result) {
            if (result) {
              var shuttle = result.shuttleId && result.shuttleId._id ? result.shuttleId : [];
              result.shuttleId = result.shuttleId && result.shuttleId._id ? result.shuttleId._id : "";
              var returnObj = {
                success: true,
                message: 'User successfully logged in',
                data: {
                  jwtAccessToken: 'JWT ' + token,
                  user: updatedUser,
                  response: result,
                  driverRoute: result.driver && result.driver.route && result.driver.route.terminals || [],
                  shuttle: shuttle
                }
              };
              res.json(returnObj);
            } else {
              var _returnObj = {
                success: true,
                message: 'User successfully logged in',
                data: {
                  jwtAccessToken: 'JWT ' + token,
                  user: updatedUser,
                  response: null,
                  driverRoute: []
                }
              };
              res.json(_returnObj);
            }
          }).catch(function (err123) {
            var err = new _APIError2.default('error in updating user details while login ' + err123, _httpStatus2.default.INTERNAL_SERVER_ERROR);
            next(err);
          });
        }).catch(function (err123) {
          var err = new _APIError2.default('error in updating user details while login ' + err123, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          next(err);
        });
      });
    }
  }).error(function (e) {
    var err = new _APIError2.default('erro while finding user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function loginDriverAccessCode(req, res, next) {
  var userObj = {
    email: req.user.email.toLowerCase(),
    userType: req.body.userType, // access
    accessCode: req.body.accessCode,
    isDeleted: false
  };

  _user2.default.findOneAsync(userObj, '+password')
  // eslint-disable-next-line consistent-return
  .then(function (user) {
    if (!user) {
      var err = new _APIError2.default('Invalid access code', _httpStatus2.default.NOT_FOUND, true);
      return next(err);
    } else if (!user.isActive) {
      var _err7 = new _APIError2.default('Your account is not active, Please contact admin.', _httpStatus2.default.NOT_FOUND, true);
      return next(_err7);
    } else {
      _user2.default.findOneAndUpdateAsync({ _id: user._id }, { $set: { accessCodeVerified: true } }, { new: true }) // eslint-disable-line no-underscore-dangle
      .then(function (updatedUser) {
        var returnObj = {
          success: true,
          message: 'Access Code Verified',
          data: {
            user: updatedUser
          }
        };
        res.json(returnObj);
      }).error(function (err123) {
        var err = new _APIError2.default('error in updating access code verification ' + err123, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    }
  }).error(function (e) {
    var err = new _APIError2.default('erro while finding user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function login(req, res, next) {
  var userObj = {
    email: req.body.email.toLowerCase(),
    userType: req.body.userType,
    isDeleted: false
  };

  _user2.default.findOneAsync(userObj, '+password')
  // eslint-disable-next-line consistent-return
  .then(function (user) {
    if (!user) {
      var err = new _APIError2.default('Invalid credentials', _httpStatus2.default.NOT_FOUND, true);
      return next(err);
    } else if (!user.isActive) {
      var _err8 = new _APIError2.default('Your account is not active, Please contact admin.', _httpStatus2.default.NOT_FOUND, true);
      return next(_err8);
    } else {
      // eslint-disable-next-line consistent-return
      user.comparePassword(req.body.password, function (passwordError, isMatch) {
        if (passwordError || !isMatch) {
          var _err9 = new _APIError2.default('Incorrect Username/Password', _httpStatus2.default.UNAUTHORIZED, true);
          return next(_err9);
        }
        var numberunique = user._id;
        user.jwtAccessToken = numberunique;
        user.loginStatus = true;
        if (req.body.gpsLoc) {
          user.gpsLoc = req.body.gpsLoc;
        }

        var jwtTokenAuth = {
          _id: user._id,
          userType: user.userType,
          email: user.email,
          fname: user.fname,
          accessCode: user.accessCode,
          numberunique: numberunique
        };
        var token = _jsonwebtoken2.default.sign(jwtTokenAuth, _env2.default.jwtSecret);
        var updateDoc = {};
        // console.log("req body", req.body);
        if (req.body.device && req.body.device.token) {
          user.loggedInDevices = [{ token: req.body.device.token, type: req.body.device.type }];
          // userToUpdate = {...user};
          // delete userToUpdate.loggedInDevices;
          // console.log("usertoudpate", userToUpdate);
          // updateDoc['$addToSet'] = {
          //   loggedInDevices: {token: req.body.device.token, type: req.body.device.type}
          // }
        }
        updateDoc['$set'] = user;
        // console.log("udpated doc", updateDoc);
        _user2.default.findOneAndUpdateAsync({ _id: user._id }, updateDoc, { new: true }) // eslint-disable-line no-underscore-dangle
        .then(function (updatedUser) {
          var returnObj = {
            success: true,
            message: 'User successfully logged in',
            data: {
              jwtAccessToken: 'JWT ' + token,
              user: updatedUser
            }
          };
          res.json(returnObj);
        }).error(function (err123) {
          var err = new _APIError2.default('error in updating user details while login ' + err123, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          next(err);
        });
      });
    }
  }).error(function (e) {
    var err = new _APIError2.default('erro while finding user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

/** This is a protected route. Change login status to false and send success message.
 * @param req
 * @param res
 * @param next
 * @returns success message
 */
function logout(req, res, next) {
  var userObj = req.user;
  if (userObj === undefined || userObj === null) {
    console.log('user obj is null or undefined inside logout function'); // eslint-disable-line no-console
  }
  userObj.loginStatus = false;
  // eslint-disable-next-line no-underscore-dangle
  var updateDoc = {};
  userObj.loggedInDevices = [];
  // if(req.body.device && req.body.device.token) {
  // userToUpdate = {...userObj};
  // delete userToUpdate.loggedInDevices;
  // console.log("usertoudpate", userToUpdate);
  // updateDoc['$pull'] = {
  //   loggedInDevices: {token: req.body.device.token, type: req.body.device.type}
  // }
  // }
  updateDoc['$set'] = userObj;
  // temporarily remove condtion from query object: loginStatus: true
  _user2.default.findOneAndUpdate({ _id: userObj._id }, updateDoc, { new: true }, function (err, userDoc) {
    if (err) {
      var error = new _APIError2.default('error while updateing login status', _httpStatus2.default.INTERNAL_SERVER_ERROR);
      next(error);
    }
    if (userDoc) {
      var returnObj = {
        success: true,
        message: 'User logout successfully'
      };
      res.json(returnObj);
    } else {
      var _error = new _APIError2.default('User not found', _httpStatus2.default.NOT_FOUND);
      next(_error);
    }
  });
}
// { $or: [{ email: req.body.email }, { phoneNo: req.body.phoneNo }] }
function checkUser(req, res) {
  _user2.default.findOneAsync({ email: req.body.email.toLowerCase() }).then(function (foundUser) {
    if (foundUser !== null) {
      var jwtTokenAuth = {
        _id: foundUser._id,
        userType: foundUser.userType,
        email: foundUser.email,
        fname: foundUser.fname,
        accessCode: foundUser.accessCode
      };
      var jwtAccessToken = _jsonwebtoken2.default.sign(jwtTokenAuth, _env2.default.jwtSecret);
      var returnObj = {
        success: true,
        message: 'User Exist',
        data: {}
      };
      returnObj.data = {
        user: foundUser,
        jwtAccessToken: 'JWT ' + jwtAccessToken
      };
      return res.send(returnObj);
    } else {
      var _returnObj2 = {
        success: true,
        message: 'New User'
      };
      return res.send(_returnObj2);
    }
  }).catch(function (error) {
    console.log(error); // eslint-disable-line no-console
  });
}

function clearSession(req, res, next) {
  var userObj = {
    email: req.body.email.toLowerCase(),
    userType: _userTypes.USER_TYPE_DRIVER,
    isDeleted: false
  };
  _user2.default.findOneAsync(userObj, '+password')
  // eslint-disable-next-line consistent-return
  .then(function (user) {
    if (!user) {
      var err = new _APIError2.default("User not found", _httpStatus2.default.NOT_FOUND, true);
      return next(err);
    } else if (!user.isActive) {
      var _err10 = new _APIError2.default('Your account is not active, Please contact admin.', _httpStatus2.default.NOT_FOUND, true);
      return next(_err10);
    } else if (!user.loginStatus) {
      var _err11 = new _APIError2.default('Your session expired', _httpStatus2.default.NOT_FOUND, true);
      return next(_err11);
    } else if (user.accessCode != req.body.accessCode) {
      var _err12 = new _APIError2.default('Invalid access code', _httpStatus2.default.NOT_FOUND, true);
      return next(_err12);
    } else {
      // eslint-disable-next-line consistent-return
      user.comparePassword(req.body.password, function (passwordError, isMatch) {
        if (passwordError || !isMatch) {
          var _err13 = new _APIError2.default('Incorrect Username/Password', _httpStatus2.default.UNAUTHORIZED, true);
          return next(_err13);
        }

        var unixTimestamp = Math.round(new Date().getTime() / 1000);
        var randomNumber = randomstring.generate({
          length: 8
        });
        var numberunique = randomNumber + unixTimestamp + user._id;
        user.jwtAccessToken = numberunique;

        user.loginStatus = true;
        if (req.body.gpsLoc) {
          user.gpsLoc = req.body.gpsLoc;
        }
        var jwtTokenAuth = {
          _id: user._id,
          userType: user.userType,
          email: user.email,
          fname: user.fname,
          accessCode: user.accessCode,
          numberunique: numberunique
        };
        var token = _jsonwebtoken2.default.sign(jwtTokenAuth, _env2.default.jwtSecret);
        var updateDoc = {};
        if (req.body.device && req.body.device.token) {
          user.loggedInDevices = [{ token: req.body.device.token, type: req.body.device.type }];
        }
        updateDoc['$set'] = user;
        _user2.default.findOneAndUpdateAsync({ _id: user._id }, updateDoc, { new: true }) // eslint-disable-line no-underscore-dangle
        .then(function (updatedUser) {
          _trip2.default.findOne({ 'driver._id': user._id, activeStatus: true }).populate('shuttleId').exec().then(function (result) {
            if (result) {
              var shuttle = result.shuttleId && result.shuttleId._id ? result.shuttleId : [];
              result.shuttleId = result.shuttleId && result.shuttleId._id ? result.shuttleId._id : "";
              var returnObj = {
                success: true,
                message: 'User successfully logged in',
                data: {
                  jwtAccessToken: 'JWT ' + token,
                  user: updatedUser,
                  response: result,
                  driverRoute: result.driver && result.driver.route && result.driver.route.terminals || [],
                  shuttle: shuttle
                }
              };
              var socketUser = _socketStore2.default.getByUserId(user._id);
              _socketStore2.default.removeByUserId(user._id, socketUser);
              res.json(returnObj);
            } else {
              var _returnObj3 = {
                success: true,
                message: 'User successfully logged in',
                data: {
                  jwtAccessToken: 'JWT ' + token,
                  user: updatedUser,
                  response: null,
                  driverRoute: []
                }
              };
              res.json(_returnObj3);
            }
          }).catch(function (err123) {
            console.log(err123);
            var err = new _APIError2.default('error in updating user details while login 23434' + err123, _httpStatus2.default.INTERNAL_SERVER_ERROR);
            next(err);
          });
        }).catch(function (err123) {
          console.log(err123);
          var err = new _APIError2.default('error in updating user details while login ' + err123, _httpStatus2.default.INTERNAL_SERVER_ERROR);
          next(err);
        });
      });
    }
  }).error(function (e) {
    var err = new _APIError2.default('erro while finding user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

exports.default = {
  login: login,
  logout: logout,
  checkUser: checkUser,
  loginAdmin: loginAdmin,
  loginDriver: loginDriver,
  loginDriverAccessCode: loginDriverAccessCode,
  clearSession: clearSession
};
module.exports = exports.default;
//# sourceMappingURL=auth.js.map
