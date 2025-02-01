import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import APIError from '../helpers/APIError';
import config from '../../config/env';
import UserSchema from '../models/user';
import { USER_TYPE_ADMIN, USER_TYPE_SUPER_ADMIN, USER_TYPE_DRIVER } from '../constants/user-types';
import tripSchema from '../models/trip';
var randomstring = require("randomstring");
import SocketStore from '../service/socket-store';
/**
 * Returns jwt token  and user object if valid email and password is provided
 * @param req (email, password, userType)
 * @param res
 * @param next
 * @returns {jwtAccessToken, user}
 */
function loginAdmin(req, res, next) {
  // console.log("Request-->", req);
  UserSchema.findOneAsync({ email: req.body.email.toLowerCase(),isDeleted:false, $or: [{ userType: USER_TYPE_ADMIN }, { userType: USER_TYPE_SUPER_ADMIN }] }, '+password')
    // eslint-disable-next-line consistent-return

    .then((user) => {
      // console.log("Request-->", user);
      if (!user) {
        const err = new APIError('User not found', httpStatus.NOT_FOUND, true);
        return next(err);
      } else if(!user.mobileVerified){
        const err = new APIError('Verification code not verified', httpStatus.NOT_FOUND, true);
        return next(err);
      } else if(!user.isActive){
        const err = new APIError('Your account is not active, Please contact admin.', httpStatus.NOT_FOUND, true);
        return next(err);
      } else {
        // eslint-disable-next-line consistent-return
        user.comparePassword(req.body.password, (passwordError, isMatch) => {
          if (passwordError || !isMatch) {
            const err = new APIError('Incorrect Username/Password', httpStatus.UNAUTHORIZED, true);
            return next(err);
          }
          let numberunique=user._id;
          user.jwtAccessToken=numberunique;
          user.loginStatus = true;
          var jwtTokenAuth={
            _id:user._id,
            userType:user.userType,
            email:user.email,
            fname:user.fname,
            accessCode:user.accessCode,
            numberunique:numberunique
          }
          user.gpsLoc = [19.02172902354515, 72.85368273308545];
          const token = jwt.sign(jwtTokenAuth, config.jwtSecret);
          let updateDoc = {};
          if(req.body.device && req.body.device.token) {
            user.loggedInDevices = [{token: req.body.device.token, type: req.body.device.type}];
            // userToUpdate = {...user};
            // delete userToUpdate.loggedInDevices;
            // console.log("usertoudpate", userToUpdate);
            // updateDoc['$addToSet'] = {
            //   loggedInDevices: {token: req.body.device.token, type: req.body.device.type}
            // }
          }
          updateDoc['$set'] = user;
          UserSchema.findOneAndUpdateAsync({ _id: user._id }, updateDoc, { new: true }) // eslint-disable-line no-underscore-dangle
          .then((updatedUser) => {
            const returnObj = {
              success: true,
              message: 'User successfully logged in',
              data: {
                jwtAccessToken: `JWT ${token}`,
                user: updatedUser,
              },
            };
            res.json(returnObj);
          })
          .error((err123) => {
            const err = new APIError(`error in updating user details while login ${err123}`, httpStatus.INTERNAL_SERVER_ERROR);
            next(err);
          });
        });
      }
    })
    .error((e) => {
      const err = new APIError(`erro while finding user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

function loginDriver(req, res, next) {
  const userObj = {
    email: req.body.email.toLowerCase(),
    userType: USER_TYPE_DRIVER,
    isDeleted:false
  };

  UserSchema.findOneAsync(userObj, '+password')
    // eslint-disable-next-line consistent-return
    .then((user) => {
      if (!user) {
        const err = new APIError('User not found with this email', httpStatus.NOT_FOUND, true);
        return next(err);
      } else if(!user.isActive){
        const err = new APIError('Your account is not active, Please contact admin.', httpStatus.NOT_FOUND, true);
        return next(err);
      } else {
        // eslint-disable-next-line consistent-return
        user.comparePassword(req.body.password, (passwordError, isMatch) => {
          if (passwordError || !isMatch) {
            const err = new APIError('Incorrect Username/Password', httpStatus.UNAUTHORIZED, true);
            return next(err);
          }
          if (user.loginStatus) {
             const err = new APIError('You are already logged into another device.', httpStatus.UNAUTHORIZED, true);
            return next(err);
          }
          var unixTimestamp = Math.round(new Date().getTime()/1000);
          const randomNumber = randomstring.generate({
            length: 8,
          });
          let numberunique=randomNumber+unixTimestamp+user._id;
          user.jwtAccessToken=numberunique;
          user.loginStatus = true;
          if(req.body.gpsLoc){
            user.gpsLoc = req.body.gpsLoc;
          }
          var jwtTokenAuth={
            _id:user._id,
            userType:user.userType,
            email:user.email,
            fname:user.fname,
            accessCode:user.accessCode,
            numberunique:numberunique
          }
          const token = jwt.sign(jwtTokenAuth, config.jwtSecret);
          let updateDoc = {};
          if(req.body.device && req.body.device.token) {
            user.loggedInDevices = [{token: req.body.device.token, type: req.body.device.type}];
            // userToUpdate = {...user};
            // delete userToUpdate.loggedInDevices;
            // console.log("usertoudpate", userToUpdate);
            // updateDoc['$addToSet'] = {
            //   loggedInDevices: {token: req.body.device.token, type: req.body.device.type}
            // }
          }
          updateDoc['$set'] = user;
          UserSchema.findOneAndUpdateAsync({ _id: user._id }, updateDoc, { new: true }) // eslint-disable-line no-underscore-dangle
            .then((updatedUser) => {
              tripSchema.findOne({ 'driver._id': user._id, activeStatus: true })
              .populate('shuttleId')
              .exec()
              .then(result => {
                if(result){
                  let shuttle=(result.shuttleId && result.shuttleId._id)?result.shuttleId:[]
                  result.shuttleId=(result.shuttleId && result.shuttleId._id)?result.shuttleId._id:"";
                  const returnObj = {
                    success: true,
                    message: 'User successfully logged in',
                    data: {
                      jwtAccessToken: `JWT ${token}`,
                      user: updatedUser,
                      response: result,
                      driverRoute: result.driver && result.driver.route && result.driver.route.terminals || [],
                      shuttle: shuttle
                    },
                  };
                  res.json(returnObj);
                }else{
                  const returnObj = {
                    success: true,
                    message: 'User successfully logged in',
                    data: {
                      jwtAccessToken: `JWT ${token}`,
                      user: updatedUser,
                      response: null,
                      driverRoute: []
                    },
                  };
                  res.json(returnObj);
                }
            })
            .catch((err123) => {
              const err = new APIError(`error in updating user details while login ${err123}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            });
            })
            .catch((err123) => {
              const err = new APIError(`error in updating user details while login ${err123}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            });
        });
      }
    })
    .error((e) => {
      const err = new APIError(`erro while finding user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

function loginDriverAccessCode(req, res, next) {
  const userObj = {
    email: req.user.email.toLowerCase(),
    userType: req.body.userType, // access
    accessCode: req.body.accessCode,
    isDeleted:false
  };

  UserSchema.findOneAsync(userObj, '+password')
    // eslint-disable-next-line consistent-return
  .then((user) => {
    if (!user) {
      const err = new APIError('Invalid access code', httpStatus.NOT_FOUND, true);
      return next(err);
    } else if(!user.isActive){
      const err = new APIError('Your account is not active, Please contact admin.', httpStatus.NOT_FOUND, true);
      return next(err);
    } else {
      UserSchema.findOneAndUpdateAsync({ _id: user._id }, { $set: {accessCodeVerified: true} }, { new: true }) // eslint-disable-line no-underscore-dangle
      .then((updatedUser) => {
        const returnObj = {
          success: true,
          message: 'Access Code Verified',
          data: {
            user: updatedUser
          }
        };
        res.json(returnObj);
      })
      .error((err123) => {
        const err = new APIError(`error in updating access code verification ${err123}`, httpStatus.INTERNAL_SERVER_ERROR);
        next(err);
      });
    }
  })
  .error((e) => {
    const err = new APIError(`erro while finding user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function login(req, res, next) {
  const userObj = {
    email: req.body.email.toLowerCase(),
    userType: req.body.userType,
    isDeleted:false
  };

  UserSchema.findOneAsync(userObj, '+password')
    // eslint-disable-next-line consistent-return
    .then((user) => {
      if (!user) {
        const err = new APIError('Invalid credentials', httpStatus.NOT_FOUND, true);
        return next(err);
      } else if(!user.isActive){
        const err = new APIError('Your account is not active, Please contact admin.', httpStatus.NOT_FOUND, true);
        return next(err);
      } else {
        // eslint-disable-next-line consistent-return
        user.comparePassword(req.body.password, (passwordError, isMatch) => {
          if (passwordError || !isMatch) {
            const err = new APIError('Incorrect Username/Password', httpStatus.UNAUTHORIZED, true);
            return next(err);
          }
          let numberunique=user._id;
          user.jwtAccessToken=numberunique;
          user.loginStatus = true;
          if(req.body.gpsLoc){
            user.gpsLoc = req.body.gpsLoc;
          }

          var jwtTokenAuth={
            _id:user._id,
            userType:user.userType,
            email:user.email,
            fname:user.fname,
            accessCode:user.accessCode,
            numberunique:numberunique
          }
          const token = jwt.sign(jwtTokenAuth, config.jwtSecret);
          let updateDoc = {};
          // console.log("req body", req.body);
          if(req.body.device && req.body.device.token) {
            user.loggedInDevices = [{token: req.body.device.token, type: req.body.device.type}];
            // userToUpdate = {...user};
            // delete userToUpdate.loggedInDevices;
            // console.log("usertoudpate", userToUpdate);
            // updateDoc['$addToSet'] = {
            //   loggedInDevices: {token: req.body.device.token, type: req.body.device.type}
            // }
          }
          updateDoc['$set'] = user;
          // console.log("udpated doc", updateDoc);
          UserSchema.findOneAndUpdateAsync({ _id: user._id },
            updateDoc, { new: true }) // eslint-disable-line no-underscore-dangle
            .then((updatedUser) => {
              const returnObj = {
                success: true,
                message: 'User successfully logged in',
                data: {
                  jwtAccessToken: `JWT ${token}`,
                  user: updatedUser,
                },
              };
              res.json(returnObj);
            })
            .error((err123) => {
              const err = new APIError(`error in updating user details while login ${err123}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            });
        });
      }
    })
    .error((e) => {
      const err = new APIError(`erro while finding user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
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
  const userObj = req.user;
  if (userObj === undefined || userObj === null) {
    console.log('user obj is null or undefined inside logout function'); // eslint-disable-line no-console
  }
  userObj.loginStatus = false;
  // eslint-disable-next-line no-underscore-dangle
  let updateDoc = {};
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
  UserSchema.findOneAndUpdate({ _id: userObj._id }, updateDoc, { new: true }, (err, userDoc) => {
    if (err) {
      const error = new APIError('error while updateing login status', httpStatus.INTERNAL_SERVER_ERROR);
      next(error);
    }
    if (userDoc) {
      const returnObj = {
        success: true,
        message: 'User logout successfully',
      };
      res.json(returnObj);
    } else {
      const error = new APIError('User not found', httpStatus.NOT_FOUND);
      next(error);
    }
  });
}
// { $or: [{ email: req.body.email }, { phoneNo: req.body.phoneNo }] }
function checkUser(req, res) {
  UserSchema.findOneAsync({ email: req.body.email.toLowerCase() })
    .then((foundUser) => {
      if (foundUser !== null) {
        var jwtTokenAuth={
          _id:foundUser._id,
          userType:foundUser.userType,
          email:foundUser.email,
          fname:foundUser.fname,
          accessCode:foundUser.accessCode
        }
        const jwtAccessToken = jwt.sign(jwtTokenAuth, config.jwtSecret);
        const returnObj = {
          success: true,
          message: 'User Exist',
          data: {},
        };
        returnObj.data = {
          user: foundUser,
          jwtAccessToken: `JWT ${jwtAccessToken}`,
        };
        return res.send(returnObj);
      } else {
        const returnObj = {
          success: true,
          message: 'New User',
        };
        return res.send(returnObj);
      }
    })
    .catch((error) => {
      console.log(error); // eslint-disable-line no-console
    });
}

function clearSession(req, res, next) {
  const userObj = {
    email: req.body.email.toLowerCase(),
    userType: USER_TYPE_DRIVER,
    isDeleted:false
  };
  UserSchema.findOneAsync(userObj, '+password')
    // eslint-disable-next-line consistent-return
    .then((user) => {
      if (!user) {
        const err = new APIError("User not found", httpStatus.NOT_FOUND, true);
        return next(err);
      } else if(!user.isActive){
        const err = new APIError('Your account is not active, Please contact admin.', httpStatus.NOT_FOUND, true);
        return next(err);
      } else if(!user.loginStatus){
        const err = new APIError('Your session expired', httpStatus.NOT_FOUND, true);
        return next(err);
      } else if(user.accessCode!=req.body.accessCode){
        const err = new APIError('Invalid access code', httpStatus.NOT_FOUND, true);
        return next(err);
      } else {
        // eslint-disable-next-line consistent-return
        user.comparePassword(req.body.password, (passwordError, isMatch) => {
          if (passwordError || !isMatch) {
            const err = new APIError('Incorrect Username/Password', httpStatus.UNAUTHORIZED, true);
            return next(err);
          }

          var unixTimestamp = Math.round(new Date().getTime()/1000);
          const randomNumber = randomstring.generate({
            length: 8,
          });
          let numberunique=randomNumber+unixTimestamp+user._id;
          user.jwtAccessToken=numberunique;

          user.loginStatus = true;
          if(req.body.gpsLoc){
            user.gpsLoc = req.body.gpsLoc;
          }
          var jwtTokenAuth={
            _id:user._id,
            userType:user.userType,
            email:user.email,
            fname:user.fname,
            accessCode:user.accessCode,
            numberunique:numberunique
          }
          const token = jwt.sign(jwtTokenAuth, config.jwtSecret);
          let updateDoc = {};
          if(req.body.device && req.body.device.token) {
            user.loggedInDevices = [{token: req.body.device.token, type: req.body.device.type}];
          }
          updateDoc['$set'] = user;
          UserSchema.findOneAndUpdateAsync({ _id: user._id }, updateDoc, { new: true }) // eslint-disable-line no-underscore-dangle
            .then((updatedUser) => {
              tripSchema.findOne({ 'driver._id': user._id, activeStatus: true })
              .populate('shuttleId')
              .exec()
              .then(result => {
                if(result){
                  let shuttle=(result.shuttleId && result.shuttleId._id)?result.shuttleId:[]
                  result.shuttleId=(result.shuttleId && result.shuttleId._id)?result.shuttleId._id:"";
                  const returnObj = {
                    success: true,
                    message: 'User successfully logged in',
                    data: {
                      jwtAccessToken: `JWT ${token}`,
                      user: updatedUser,
                      response: result,
                      driverRoute: result.driver && result.driver.route && result.driver.route.terminals || [],
                      shuttle: shuttle
                    },
                  };
                  var socketUser= SocketStore.getByUserId(user._id);
                  SocketStore.removeByUserId(user._id,socketUser);
                  res.json(returnObj);
                }else{
                  const returnObj = {
                    success: true,
                    message: 'User successfully logged in',
                    data: {
                      jwtAccessToken: `JWT ${token}`,
                      user: updatedUser,
                      response: null,
                      driverRoute: []
                    },
                  };
                  res.json(returnObj);
                }
            })
            .catch((err123) => {
              console.log(err123);
              const err = new APIError(`error in updating user details while login 23434${err123}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            });
            })
            .catch((err123) => {
              console.log(err123);
              const err = new APIError(`error in updating user details while login ${err123}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            });
        });
      }
    })
    .error((e) => {
      const err = new APIError(`erro while finding user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

export default {
  login,
  logout,
  checkUser,
  loginAdmin,
  loginDriver,
  loginDriverAccessCode,
  clearSession
};
