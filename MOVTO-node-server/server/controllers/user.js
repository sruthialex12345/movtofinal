import bcrypt from 'bcrypt';
import mongoose, { mongo } from 'mongoose';
import cloudinary from 'cloudinary';
import httpStatus from 'http-status';
import formidable from 'formidable';
import jwt from 'jsonwebtoken';
import { utils } from 'mocha';
import APIError from '../helpers/APIError';
import AppConfig from '../models/appConfig';
import config from '../../config/env';
import sendEmail from '../service/emailApi';
import { sendSms, sendSmsUpdateMobile, sendSmsBeforeRegister } from '../service/smsApi';
import ServerConfig from '../models/serverConfig'; //eslint-disable-line
import User from '../models/user';
import DriverRouteTerminalSchema from '../models/driverRouteTerminal';
import Location from '../models/location';
import ReviewSchema from '../models/review';
import CountryCode from '../models/countryCode';
import Utilities from '../helpers/util';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER, USER_TYPE_ADMIN, USER_TYPE_SUPER_ADMIN } from '../constants/user-types';
import AdminDriverschema from '../models/adminDriver';
import AdminVehicleSchema from '../models/adminVehicle';
var randomstring = require("randomstring");
import tripRequestSchema from '../models/tripRequest';
import tripSchema from '../models/trip';
import * as TRIP_REQUEST_STATUS from '../constants/trip-request-statuses';
var ObjectId = require('mongoose').Types.ObjectId;
import SocketStore from '../service/socket-store';
import { TRIP_CIRCULAR_STATIC } from '../constants/trip-type';
import { json } from 'body-parser';
import { MASTER_PASSWORD } from '../constants/global'
const multer  = require('multer');
const mime = require('mime');
const fs = require('fs');
const debug = require('debug')('MGD-API: admin-user');
import AdminLocationSchema from '../models/adminLocation';

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    var validExts = ['jpeg', 'jpg', 'png'];
    if(validExts.indexOf(mime.getExtension(file.mimetype))<0){
      console.log('wrong format uploading file');
      return cb(new Error("Wrong format"), null);
    }
    cb(null, __dirname+'/../../uploads/avtars');
  },
  filename: function (req, file, cb) {
    console.log('format..', file);
    let fileName = `${file.fieldname}-${Date.now()}${'.'+mime.getExtension(file.mimetype)}`;
    file.newName = fileName;
    req.file = file;
    console.log('file name', req.file, file);
    cb(null, fileName)
  }
})

export const upload = multer({ storage: storage }).single('avtar');

export const uploadImageHandler = (req, res, next) => {
  console.log('uploading image', req);
  upload(req, res, function (err) {
    if (err) {
      console.log('err', err);
      const err = new APIError(`error in uploading image ${err}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    } else {
      const returnObj = {
        success: true,
        message: 'file uploaded successfully',
        data: req.file
      };
      res.send(returnObj);
    }

    // Everything went fine
  })
}

export const uploadBaseImageHandler = (req, res, next) => {
  var outputJSON = "";
  var photoname = `avtar_${Date.now()+'.png'}`;
  var imagename = __dirname + "/../../uploads/avtars/" + photoname;
  if (req.body.avtar.indexOf("base64,") != -1) {
    var Data = req.body.avtar.split('base64,');
    var base64Data = Data[1];
    fs.writeFile(imagename, base64Data, 'base64', function(err) {
      if (err) {
        console.log('err', err);
        const err = new APIError(`error in uploading image ${err}`, httpStatus.INTERNAL_SERVER_ERROR);
        next(err);
      } else {
        let profileImageUrl = `${Utilities.getUploadsAvtarsUrl(req)}/${photoname}`
        const {user} = req;
        user.profileUrl = profileImageUrl;
        const userObj = new User(user);
        User.findOneAndUpdateAsync(
          { _id: user._id },
          { $set: { profileUrl:  profileImageUrl}}, { new: true }
        ).then((savedUser) => {
          const returnObj = {
            success: true,
            message: 'File uploaded successfully',
            data: savedUser
          };
          res.send(returnObj);
        })
        .error(e => {
          const err = new APIError(`error in saving image ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(err)
        });
      }
    });
  } else {
    const returnObj = {
      success: false,
      message: 'Inavalid Image',
      code: 400
    };
    res.send(returnObj);
  }
}

/**
 * Get user
 * @returns {User}
 */
export const getUser = (req, res) => res.send({ success: true, message: 'user found', data: req.user });

const saveVerificationCode = (userId, verificationCode) => User.findByIdAndUpdateAsync({ _id: userId }, { $set: { otp: verificationCode } }, { new: true });

const sendVerificationCode = (userId, verificationCode) =>
  new Promise((resolve, reject) => {
    sendSms(userId, `Your verification code is ${verificationCode}`, (err , data ) => {
      if (err) {
        console.log('error sending sms', err);
        const errResp = new APIError('Error: Sending mobile verification code.', httpStatus.INTERNAL_SERVER_ERROR, true);
        reject(errResp);
      } else {
        console.log("message sent successfully")
        resolve({});
      }
    });
  });

function createVerificationCode(userId) {
  const verificationCode = Utilities.generateVerificationCode();
  return new Promise((resolve, reject) => {
    saveVerificationCode(userId, verificationCode)
      .then((updatedUser) => {
        if (updatedUser) {
          sendVerificationCode(userId, verificationCode)
            .then((res) => {
              console.log('send verification resolved', res);
              resolve(res);
            })
            .catch((e) => {
              reject(e);
            });
        } else {
          const err = new APIError('Rider not found', httpStatus.INTERNAL_SERVER_ERROR, true);
          reject(err);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * Get getCloudinaryDetails
 * @returns {getCloudinaryDetails}
 */
function getCloudinaryDetails() {
  return new Promise((resolve, reject) => {
    ServerConfig.findOneAsync({ key: 'cloudinaryConfig' })
      .then((foundDetails) => {
        resolve(foundDetails.value);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Get appConfig
 * @returns {appConfig}
 */
function getConfig() {
  return new Promise((resolve, reject) => {
    AppConfig.findOneAsync({ key: 'sendConfig' })
      .then((foundDetails) => {
        resolve(foundDetails.value);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
function getApproveConfig() {
  return new Promise((resolve, reject) => {
    AppConfig.findOneAsync({ key: 'approveConfig' })
      .then((foundDetails) => {
        resolve(foundDetails && foundDetails.value);
      })
      .catch((err) => {
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
export const createUser = (req, res, next) => {
  User.findOneAsync({
    $or: [{email: req.body.email.toLowerCase(), userType: req.body.userType ? req.body.userType : USER_TYPE_RIDER,isDeleted:false},
      {userType: req.body.userType ? req.body.userType : USER_TYPE_RIDER, phoneNo: req.body.phoneNo,isDeleted:false}]
  }).then((foundUser) => {
    if (foundUser !== null && foundUser.userType === (req.body.userType ? req.body.userType : USER_TYPE_RIDER)) {
      let numberunique=foundUser._id;
      User.findOneAndUpdateAsync({ _id: foundUser._id }, { $set: { loginStatus: true,jwtAccessToken:numberunique } }, { new: true })
        .then(updateUserObj => {
          if (updateUserObj) {
            var jwtTokenAuth={
              _id:updateUserObj._id,
              userType:updateUserObj.userType,
              email:updateUserObj.email,
              fname:updateUserObj.fname,
              accessCode:updateUserObj.accessCode,
              numberunique:numberunique
            }
            const jwtAccessToken = jwt.sign(jwtTokenAuth, config.jwtSecret);
            const returnObj = {
              success: true,
              message: '',
              data: {},
            };
            if(updateUserObj.email==req.body.email.toLowerCase() && updateUserObj.phoneNo==req.body.phoneNo){
              var msg="User already registered with same email address and mobile number"
            }else if(updateUserObj.email==req.body.email.toLowerCase()){
              var msg="User already registered with same email address"
            }else{
              var msg="User already registered with same mobile number";
            }

            returnObj.data.jwtAccessToken = `JWT ${jwtAccessToken}`;
            returnObj.data.user = updateUserObj;
            returnObj.message = msg;
            returnObj.success = false;
            return res.send(returnObj);
          }
        })
        .error((e) => {
          const err = new APIError(`Error in updating user details while login ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(err);
        });
    } else {
      CountryCode.findOneAsync({ dial_code: req.body.isdCode }).then((CountryCodeDetails) => {
        getApproveConfig().then((values) => {
          const otpValue = Utilities.generateVerificationCode();
          const accessCode = Utilities.generateAccessCode();
          const reservationCode = Utilities.generateUniueReservationCode();
          const newPassword = randomstring.generate({
            length: 6,
            // charset: 'alphanumeric'
          });
          let newUser = {
            tripType: req.body.tripType ? req.body.tripType : TRIP_CIRCULAR_STATIC,
            email: req.body.email.toLowerCase(),
            reservationCode:reservationCode,
            userType: req.body.userType ? req.body.userType : USER_TYPE_RIDER,
            name: req.body.name,
            phoneNo: req.body.phoneNo,
            isdCode: req.body.isdCode,
            adminTripTypes:req.body.adminTripTypes,
            managerDetails: req.body.managerDetails,
            isDeleted:req.body.isDeleted?req.body.isDeleted:false,
            countryCode: req.body.countryCode,
            gpsLoc: [19.02172902354515, 72.85368273308545],
            carDetails: req.body.userType === USER_TYPE_DRIVER ? { type: 'sedan' } : {},
            mapCoordinates: [0, 0],
            isApproved: req.body.userType === USER_TYPE_DRIVER ?
            (values && values.autoApproveDriver ? values.autoApproveDriver: true) :
            (values && values.autoApproveRider ? values.autoApproveRider : true),
            loginStatus: false,
            country: req.body.country?req.body.country:'',
            otp: otpValue,
          };
           if(req.body.userType == USER_TYPE_ADMIN) {
            newUser["accessCode"] = accessCode;
            newUser["password"] = newPassword;
            newUser["isDeleted"] = true;
            newUser['profileUrl']=Utilities.getUploadsAvtarsUrl(req)+"/provider_default.png";
            newUser['address']= req.body.address?req.body.address:"";
            var phoneDetails = {
              isdCode: req.body.managerDetails.isdCode,
              // countryCode: req.body.managerDetails.countryCode,
              phoneNo: req.body.managerDetails.phoneNo,
              // countryCode:(CountryCodeDetails && CountryCodeDetails.code)?CountryCodeDetails.code:'',
              // userType:req.body.userType
           }
           }
           if(req.body.userType == USER_TYPE_RIDER) {
            newUser['profileUrl']=Utilities.getUploadsAvtarsUrl(req)+"/default_user.png",
            newUser["isDeleted"] = true;
            newUser["password"] = req.body.password;
            var phoneDetails = {
              isdCode: req.body.isdCode,
              countryCode: req.body.countryCode,
              phoneNo: req.body.phoneNo,
              countryCode:(CountryCodeDetails && CountryCodeDetails.code)?CountryCodeDetails.code:'',
              userType:req.body.userType
            }
           }
          const user = new User(newUser);
          if(req.body.profileImageUrl) {
            user.profileUrl = req.body.profileImageUrl
          }
          /**
           * 2. send verification code to the mobile number
           */
          sendSmsBeforeRegister(phoneDetails, `Your verification code is  ${otpValue}`, (err /* , data */) => {
            if (err) {
              let returnObj = {};
              returnObj.success = false;
              returnObj.message = `Something went wrong while sending otp on mobile number`;
              res.send(returnObj);
            } else {
              user
              .saveAsync()
              .then((savedUser) => {
                let numberunique=savedUser._id;
                User.findOneAndUpdateAsync({ _id: savedUser._id }, { $set: { jwtAccessToken:numberunique } })
                    .then(updateUserObj => {
                      const returnObj = {
                        success: true,
                        message: '',
                        data: {},
                      };
                      var jwtTokenAuth={
                        _id:savedUser._id,
                        userType:savedUser.userType,
                        email:savedUser.email,
                        fname:savedUser.fname,
                        accessCode:savedUser.accessCode,
                        numberunique:numberunique
                      }
                      const jwtAccessToken = jwt.sign(jwtTokenAuth, config.jwtSecret);
                      returnObj.data.jwtAccessToken = `JWT ${jwtAccessToken}`;
                      returnObj.data.user = savedUser;
                      returnObj.message = 'Verification code sent successfully to your mobile';
                      res.send(returnObj);
                      getConfig().then((data) => {
                        if (data.email.emailVerify) {
                          sendEmail(savedUser._id, savedUser, 'emailVerify'); //eslint-disable-line
                        }
                        if (data.email.onRegistrationRider && savedUser.userType === USER_TYPE_RIDER) {
                          sendEmail(savedUser._id, savedUser, 'register'); //eslint-disable-line
                        }
                        if (data.email.onRegistrationDriver && savedUser.userType === USER_TYPE_DRIVER) {
                          sendEmail(savedUser._id, savedUser, 'register'); //eslint-disable-line
                        }
                      })
                      .catch((err) => {
                        console.log('error getting app config', err);
                        returnObj.status = 200;
                        returnObj.message = 'Something went wrong';

                        res.send(returnObj);
                      });
                    }) .error(e => next(e));
              })
              .error(e => next(e));
            }
          });

        }).catch(e => {
          const err = new APIError(`Error in creating user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(err);
        });
      }).catch(e => {
          const err = new APIError(`Error in creating user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(err);
        });

    }
  });
};

// function to resend OTP to user
export const resendMobileVerificationCode = (req, res /* , next */) => {
  const { userId } = req.body;
  var returnObj = {};

  createVerificationCode(userId).then((result) => {
    returnObj.status = true;
    returnObj.message = 'Verification code has been sent.';
    console.log("createverication resolved", result);
    res.send(returnObj);
  })
  .catch((err) => {
    returnObj.status = false;
    returnObj.message = 'Error: Unable to send verification code.';
    res.send(returnObj);
  });
};

// function to edit phone no in otp screen
export const updateMobileNumber = (req, res /* , next */) => {
  // console.log("user", req.user);
  const { isdCode, countryCode, phoneNo } = req.body;
  const userId = req.user._id;
  const returnObj = {};
  const otpValue = Utilities.generateVerificationCode();
  /**
   * 1. check if user exists
   * 2. check if user exist with the update mobile number and the same user type
   * 3. send verification code to the mobile number
   * 4. if otp sent successfully and verified update the mobile number
   */


  /**
   * 1. check if user exists
   */
  User.findOneAsync({ _id: userId })
  .then((user) => {
    if (user) {
      /**
       * 2. check if user exist with the update mobile number and the same user type
       */
      User.findOneAsync({ phoneNo: phoneNo, userType: user.userType })
      .then((userExists)=>{
        if(userExists) {
          returnObj.success = false;
          returnObj.message = 'Mobile number already exists';
          return res.send(returnObj);
        }

        let phoneDetails = {
          isdCode: isdCode,
          countryCode: countryCode,
          phoneNo: phoneNo
        }
        let updateData = {otp: otpValue, updatePhoneDetails: phoneDetails};
        /**
         * 3. send verification code to the mobile number
         */
        sendSmsUpdateMobile(phoneDetails, `Your verification code is ${otpValue}`, (err /* , data */) => {
          if (err) {
            returnObj.success = false;
            returnObj.message = (err && err.message)?err.message:`Something went wrong while updating mobile number`;
            res.send(returnObj);
          } else {
            returnObj.success = true;
            returnObj.message = 'Phone no is updated, a verification code has been sent to the mobile number provided.';
            /**
             * 4. if otp sent successfully update the mobile number
             */
            User.findOneAndUpdateAsync({ _id: userId }, { $set: updateData }, { new: true })
            .then((updatedUser) => {
              if (updatedUser) {
                returnObj.success = true;
                returnObj.message = 'Phone no is updated, a verification code has been sent to the mobile number provided.';
                res.send(returnObj);
              } else {
                returnObj.success = false;
                returnObj.message = 'Phone no is not updated';
                res.send(returnObj);
              }
            })
            .catch((error) => {
              console.log(error);
              returnObj.success = false;
              returnObj.message = 'server error to update phone no';
              res.send(returnObj);
            });
          }
        });
      })
      .catch((err)=>{
        next(e);
      })
    } else {
      returnObj.success = false;
      returnObj.message = 'User does not exist';
      res.send(returnObj);
    }
  })
  .catch((error) => {
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
export const updateUser = (req, res, next) => {
  const { user } = req;

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

  user
    .saveAsync()
    .then((savedUser) => {
      const returnObj = {
        success: true,
        message: 'user details updated successfully',
        data: savedUser,
      };
      res.send(returnObj);
    })
    .error(e => next(e));
};

export const updateUserName = (req, res, next) => {
  const { user } = req;

  user.name = req.body.name ? req.body.name : user.name;

  user
    .saveAsync()
    .then((savedUser) => {
      const returnObj = {
        success: true,
        message: 'user name updated successfully',
        data: savedUser,
      };
      res.send(returnObj);
    })
    .error(e => next(e));
};

/**
 * function  to upload pic
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */
export const uploadUserImage = (req, res, next) => {
  getCloudinaryDetails().then((value) => {
    if (value) {
      cloudinary.config({
        cloud_name: value.cloud_name,
        api_key: value.api_key,
        api_secret: value.api_secret,
      });
      const form = new formidable.IncomingForm();
      form.on('error', (err) => {
        console.error(err); //eslint-disable-line
      });

      form.parse(req, (err, fields, files) => {
        const imgpath = files.image;
        cloudinary.v2.uploader.upload(
          imgpath.path,
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
          (error, results) => {
            if (results) {
              const { user } = req;
              if (req.headers.updatetype === 'profile') {
                user.profileUrl = results.url;
                User.findOneAndUpdateAsync(
                  { _id: user._id }, //eslint-disable-line
                  { $set: { profileUrl: results.url } },
                  { new: true }
                )
                  .then((savedUser) => {
                    const returnObj = {
                      success: true,
                      message: 'user pic updated successfully',
                      data: savedUser,
                    };
                    res.send(returnObj);
                  })
                  .error(e => next(e));
              }
              if (req.headers.updatetype === 'licence') {
                user.profileUrl = results.url;
                User.findOneAndUpdateAsync(
                  { _id: user._id }, //eslint-disable-line
                  { $set: { licenceUrl: results.url } },
                  { new: true }
                )
                  .then((savedUser) => {
                    const returnObj = {
                      success: true,
                      message: 'user licenceDetails updated successfully',
                      data: savedUser,
                    };
                    res.send(returnObj);
                  })
                  .error(e => next(e));
              }
              if (req.headers.updatetype === 'permit') {
                user.profileUrl = results.url;
                User.findOneAndUpdateAsync(
                  { _id: user._id }, //eslint-disable-line
                  { $set: { vechilePaperUrl: results.url } },
                  { new: true }
                )
                  .then((savedUser) => {
                    const returnObj = {
                      success: true,
                      message: 'user vechilePaperUrl updated successfully',
                      data: savedUser,
                    };
                    res.send(returnObj);
                  })
                  .error(e => next(e));
              }
              if (req.headers.updatetype === 'insurance') {
                user.profileUrl = results.url;
                User.findOneAndUpdateAsync(
                  { _id: user._id }, //eslint-disable-line
                  { $set: { insuranceUrl: results.url } },
                  { new: true }
                )
                  .then((savedUser) => {
                    const returnObj = {
                      success: true,
                      message: 'user insuranceUrl updated successfully',
                      data: savedUser,
                    };
                    res.send(returnObj);
                  })
                  .error(e => next(e));
              }
              if (req.headers.updatetype === 'registration') {
                user.profileUrl = results.url;
                User.findOneAndUpdateAsync(
                  { _id: user._id }, //eslint-disable-line
                  { $set: { rcBookUrl: results.url } },
                  { new: true }
                )
                  .then((savedUser) => {
                    const returnObj = {
                      success: true,
                      message: 'user rcBookUrl updated successfully',
                      data: savedUser,
                    };
                    res.send(returnObj);
                  })
                  .error(e => next(e));
              }
            }
          }
        );
      });
    } else {
      const returnObj = {
        success: false,
        message: 'Problem in updating',
        data: req.user,
      };
      res.send(returnObj);
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
export const removeUser = (req, res, next) => {
  const { user } = req;
  user
    .removeAsync()
    .then((deletedUser) => {
      const returnObj = {
        success: true,
        message: 'user deleted successfully',
        data: deletedUser,
      };
      res.send(returnObj);
    })
    .error(e => next(e));
};

/**
 * Load user and append to req.
 */
export const loadUser = (req, res, next, id) => {
  User.get(id)
    .then((user) => {
      req.user = user; // eslint-disable-line no-param-reassign
      return next();
    })
    .error(e => next(e));
};

function hashed(password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        reject(err);
      }
      bcrypt.hash(password, salt, (hashErr, hash) => {
        if (hashErr) {
          reject(hashErr);
        }
        console.log(hash); //eslint-disable-line
        resolve(hash);
      });
    });
  });
}

export const forgotPassword = (req, res, next) => {
  console.log("Request Body", req.body);
  var userType=USER_TYPE_RIDER;
  req.body.userType=req.body.userType?req.body.userType:userType
  console.log("Request Body updated", req.body);
  User.findOneAsync({ email: req.body.email.toLowerCase(),userType: req.body.userType })
    // eslint-disable-next-line
    .then(foundUser => {
      if (foundUser) {
        // const newPassword = Math.random()
        //   .toString(36)
        //   .substr(2, 6);
        const newPassword=  randomstring.generate({
          length: 6,
          // charset: 'alphanumeric'
        });
        hashed(newPassword).then((result) => {
          const hashPassword = result;
          User.findOneAndUpdateAsync({ _id: foundUser._id }, { $set: { password: hashPassword } }) //eslint-disable-line
            // eslint-disable-next-line
            .then(updateUserObj => {
              if (updateUserObj) {
                getConfig().then((data) => {
                  if (data.email.onForgotPassword) {
                    const userObj = Object.assign(updateUserObj, { newpass: newPassword,accessCode: foundUser.accessCode });
                    sendEmail(updateUserObj._id, userObj, 'forgot'); //eslint-disable-line
                  }
                });
                const returnObj = {
                  success: true,
                  message: '',
                  data: {},
                };
                // returnObj.data.jwtAccessToken = `JWT ${jwtAccessToken}`;
                // returnObj.data.user = updateUserObj;`
                returnObj.message = 'Check your Email Please';
                returnObj.success = true;
                return res.send(returnObj);
              }
            })
            .error((e) => {
              const err = new APIError(`error in updating user details while login ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              return res.send(err);
            });
        });
      } else {
        const returnObj = {
          success: true,
          message: '',
          data: {},
        };
        returnObj.message = 'No user exist with this email';
        returnObj.success = false;
        return res.send(returnObj);
      }
    })
    .error(e => next(e));
};

export const resetPassword = (req, res, next) => {
  User.findOneAsync({ email: req.body.email.toLowerCase(), userType: req.body.userType }, '+password')
    // eslint-disable-next-line
  .then(foundUser => {
    if (foundUser) {
      console.log(foundUser)
      // check if old password is correct
      foundUser.comparePassword(req.body.oldPassword, (passwordError, isMatch) => {
        if (passwordError || !isMatch) {
          const returnObj = {
            success: false,
            message: 'Incorrect Old password, Please try Again',
            data: {},
          };
          return res.send(returnObj);
          // const err = new APIError('Incorrect password', httpStatus.UNAUTHORIZED);
          // return next(err);
        }
        // set new password
        const newPassword = req.body.newPassword;
        hashed(newPassword).then((result) => {
          const hashPassword = result;
          User.findOneAndUpdateAsync({ _id: foundUser._id }, { $set: { password: hashPassword } }) //eslint-disable-line
            // eslint-disable-next-line
          .then(updateUserObj => {
            if (updateUserObj) {
              const returnObj = {
                success: true,
                message: 'Password reset successfully',
                data: {},
              };
              return res.send(returnObj);
            }
          })
          .error((e) => {
            const err = new APIError(`Error in updating user password`, httpStatus.INTERNAL_SERVER_ERROR);
            return res.send(err);
          });
        });
      });
    } else {
      const returnObj = {
        success: false,
        message: 'No user exists',
        data: {},
      };
      return res.send(returnObj);
    }
  })
  .error(e => next(e));
};

export const createRiderLocation = (req, res) => {
  const { userId, address, name } = req.body;
  const location = new Location({
    userId,
    address,
    name,
  });

  location
    .saveAsync()
    .then((locationData) => {
      if (locationData) {
        res.send({ status: true, message: 'Location successfully added', data: locationData });
      } else {
        res.send({ status: false, message: 'Internal server error.' });
      }
    })
    .catch(() => {
      res.send({ status: false, message: 'Internal server error.' });
    });
};

export const getRiderLocations = (req, res) => {
  const { userId } = req.body;
  Location.findAsync({ userId })
    .then((locations) => {
      if (locations) {
        return res.send({
          success: true,
          data: [locations],
        });
      } else {
        return res.send({
          success: false,
          message: 'No locations exist',
          data: {},
        });
      }
    })
    .catch(() =>
      res.send({
        success: false,
        message: 'Server error fetching locations',
        data: {},
      }));
};

/**
 * Flags a location as removed
 * @property {Object} req.body.user - user object containing all fields.
 * @returns {User}
 */
export const removeRiderLocation = (req, res) => {
  // eslint-disable-next-line
  const userId = req.user._id;
  const { locationId } = req.body;

  Location.findOneAndUpdateAsync(
    { _id: user._id, locationId }, //eslint-disable-line
    { $set: { isDeleted: true, deletedAt: new Date().toISOString() } },
    { new: true }
  )
    .then((locationData) => {
      res.send({ data: locationData, message: 'Location successfully removed' });
    })
    .catch((err) => {
      res.send({ data: err, message: 'Unable to delete location' });
    });
};

/** Driver controllers */
/**
 * @param  {user, accessCode} req
 * @param  {} res
 * @returns {Shuttles}
 */
export const driverShuttleList = (req, res)=> {
    /**
     * 1. find driver admin
     * 2. lookup for the vehicles under the same admin which are available
     */
    // console.log('req user', req.user);
    const { pageNo, limit = config.limit } = req.query;
    const skip = pageNo ? (pageNo - 1) * limit : config.skip;
    debug(`skip value: ${req.query.pageNo}`);
    // find all driver under the same admin
    AdminVehicleSchema.countAsync({ "userIdAdmin": (req.user.userType == USER_TYPE_ADMIN) ? req.user._id : req.user.adminId, isDeleted:false, activeStatus:false,locationId:req.user.locationId})
    // eslint-disable-next-line
    .then(totalVehicleRecord => {
      const returnObj = {
        success: true,
        message: `No vehicles found`, // `no of active vehicles are ${returnObj.data.length}`;
        data: null,
        meta: {
          totalNoOfPages: Math.ceil(totalVehicleRecord / limit),
          limit,
          currPageNo: pageNo,
          currNoOfRecord: 0,
        },
      };
      if (totalVehicleRecord < 1) {
        return res.send(returnObj);
      }
      if (skip > totalVehicleRecord) {
        const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
        return next(err);
      }
      AdminVehicleSchema.find({ "userIdAdmin": (req.user.userType == USER_TYPE_ADMIN) ? req.user._id : req.user.adminId, isDeleted:false, activeStatus:false,locationId:req.user.locationId })
      .limit(limit)
      .skip(skip)
      .then((vehicleData) => {
        returnObj.data = vehicleData;
        returnObj.message = `vehicles found`;
        returnObj.meta.currNoOfRecord = returnObj.data.length;
        debug(`no of records are ${returnObj.meta.currNoOfRecord}`);
        return res.send(returnObj);
      })
      .catch((err) => {
        var err = new APIError(`Error finding vehicles`, httpStatus.INTERNAL_SERVER_ERROR, true);
        res.send('Error', err);
      });
    })
    .error((e) => {
      const err = new APIError(`error occured while counting the no of users ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      debug('error inside getAllDrivers records');
      next(err);
    });

}

export const nearByPickupPoints = (req, res, next)=>{
  // const { adminId,name } = req.query;
  const adminId  = req.query.adminId;
  const name  = req.query.name?req.query.name:'';
  let query = {adminId:adminId, isDeleted:false,$or:[{"name":{$regex:name,$options:'i'}},{"address":{$regex:name,$options:'i'}}]}
  DriverRouteTerminalSchema.findAsync(query)
  .then((doc) => {
      const returnObj = {
      success: true,
      message: 'No pickup point available',
      data: null,
      meta: null,
    };
    if (doc && doc.length) {
      const returnObj = {
        success: true,
        message: `Pickup points are available`,
        data: {
          locations: doc
        }
      };
      res.send(returnObj);
    } else {
      returnObj.data = {locations: []};
      res.send(returnObj);
    }
  })
  .error((e) => {
    const err = new APIError(`Error occured while searching for pickup points ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

export const nearByDropOffPoints = (req, res, next)=>{
  const source = JSON.parse(req.query.source);
  const adminId  = req.query.adminId;
  const name  = req.query.name?req.query.name:'';
  const query = {adminId: adminId,isDeleted:false, loc: {$ne: source},$or:[{"name":{$regex:name,$options:'i'}},{"address":{$regex:name,$options:'i'}}]};
  DriverRouteTerminalSchema.findAsync(query)
  .then((doc) => {
    const returnObj = {
      success: true,
      message: 'No location available',
      data: null,
      meta: null,
    };
    if (doc && doc.length) {
      const returnObj = {
        success: true,
        message: `Dropoff points are available`,
        data: {
          locations: doc
        }
      };
      res.send(returnObj);
    } else {
      returnObj.data = {locations: []};
      res.send(returnObj);
    }
  })
  .error((e) => {
    const err = new APIError(`Error occured while searching for dropoffs ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

export const riderAdminList = (req, res, next) => {

  var filter = {userType: 'admin',isActive:true,isDeleted:false};
  if(req.query.name) {
    let text = req.query.name;
    // var regex = new RegExp('[\\?&]' + text + '=([^&#]*)', 'i');
    filter.name = { $regex: text, $options: 'i' }
  }

  console.log("filter provider list>>>>>>>", JSON.stringify(filter));

  User.adminList(filter)
  .then((adminNewArr) => {
    console.log("filter providers admins>>>>>>>", JSON.stringify(filter));
    getShuttleListByAdmin(adminNewArr)
    .then((admins) => {
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
          console.log("filter provider list returned>>>>>>>", JSON.stringify(returnObj));
      res.send(returnObj);
      })
    .catch((err) => {
      next(err);
    });

  })
  .error((e) => {
    const err = new APIError(`Error occured while retreiving list`, httpStatus.INTERNAL_SERVER_ERROR, true);
    next(err);
  });
}

function getShuttleListByAdmin(returnObj) {
  return new Promise((resolve, reject) => {
    Promise.all(returnObj.map((objVehicle, index) =>
    AdminVehicleSchema.findOneAsync({ userIdAdmin:mongoose.Types.ObjectId(objVehicle._id),isDeleted:false,activeStatus:true,isAvailable:true,
    },{userIdAdmin:1}).then((result) => {
        returnObj[index] = Object.assign({}, returnObj[index], { shuttelStatus: result?true:false });
        return Promise.resolve(returnObj[index]);
      })))
      .then((adminList) => {
        if (adminList) {
          adminList.map((vehicle, i)=>{
            vehicle._doc.shuttelStatus=vehicle.shuttelStatus;
            returnObj[i]=vehicle._doc;
          });
        }

        console.log("filter provider list getShuttleListByAdmin>>>>>>>", JSON.stringify(returnObj));
        return resolve(returnObj);
      })
      .catch((err) => {
        if (err) {
          console.log('err', err); // eslint-disable-line no-console
        }
        return reject(returnObj);
      });
  });
}

function getCountryCodeByIsdCode(isdCode=null) {
  return new Promise((resolve, reject) => {
    CountryCode.findOneAsync({ dial_code: isdCode })
      .then((CountryCodeDetals) => {
        resolve(CountryCodeDetals);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function getTotalSeatsBookedDriverTerminalAsync(tripId, terminalId){
  return tripRequestSchema.aggregateAsync([
    {$match: {
      tripId: mongoose.Types.ObjectId(tripId),
      "srcLoc._id": mongoose.Types.ObjectId(terminalId),
      "tripRequestStatus": TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE
    }},
    {$lookup:{
       from: "trips",
       localField: "tripId",
       foreignField: "_id",
       as: "tripData"
     }
    },
    {$unwind : "$tripData"},
    {$match: {"tripData.activeStatus": true}},
    {
      $group: {
        "_id": "$tripId",
        "totalSeatsBooked": {"$sum": "$seatBooked"}
      }
    }
  ])
}

function getDriverTerminalRequestsAsync(tripId, terminalId) {
  return new Promise((resolve, reject)=>{
    tripRequestSchema.aggregateAsync([
      {
        $match: {
          tripId: mongoose.Types.ObjectId(tripId),
          "srcLoc._id": mongoose.Types.ObjectId(terminalId)
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
      },
      {$sort: {"requestTime": -1, "requestUpdatedTime":-1}}
    ])
    .then(result=>{
      if(result && Array.isArray(result)){
        return resolve(result.map(request=>{
          request.riderDetails && request.riderDetails.password && (delete request.riderDetails.password)
          return request;
        }))
      }
      return resolve(result)
    }).catch(err=>{
      return reject(err);
    })
  })
}

function getTerminalNewRequestsCountAsync(tripId, terminalId){
  return new Promise((resolve, reject)=>{
    tripRequestSchema.aggregateAsync([
      {
        $match: {
          tripId: mongoose.Types.ObjectId(tripId),
          "srcLoc._id": mongoose.Types.ObjectId(terminalId),
          "tripRequestStatus": TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT
        }
      }
    ])
    .then(result=>{
      resolve(result)
    }).catch(err=>{
      reject(err);
    })
  })
}

function getTotalTripSeatsBookedAsync(tripId){
  return tripRequestSchema.aggregateAsync([
    {$match: {tripId: mongoose.Types.ObjectId(tripId), "tripRequestStatus": TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE}},
    {$lookup:{
       from: "trips",
       localField: "tripId",
       foreignField: "_id",
       as: "tripData"
     }
    },
    {$unwind : "$tripData"},
    {$match: {"tripData.activeStatus": true}},
    {
      $group: {
        "_id": "$tripId",
        "totalSeatsBooked": {"$sum": "$seatBooked"}
      }
    }
  ])
}

function getAllTripRequestsAsync(tripId) {
  return new Promise((resolve, reject)=>{
    tripRequestSchema.aggregateAsync([
      {
        $match: {
          tripId: mongoose.Types.ObjectId(tripId),
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
      }, {$sort: {"requestTime": -1, "requestUpdatedTime":-1}}
      // not supported on staging server mongo error only _id can be excluded
      // {
      //   $project: {'riderDetails.password': 0}
      // }
    ])
    .then(result=>{
      if(result && Array.isArray(result)){
        return resolve(result.map(request=>{
          request.riderDetails && request.riderDetails.password && (delete request.riderDetails.password)
          return request;
        }))
      }
      return resolve(result)
    }).catch(err=>{
      reject(err);
    })
  })
}

function getTripNewRequestsCountAsync(tripId){
  return new Promise((resolve, reject)=>{
    tripRequestSchema.aggregateAsync([
      {
        $match: {
          tripId: mongoose.Types.ObjectId(tripId),
          "tripRequestStatus": TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT
        }
      }
    ])
    .then(result=>{
      resolve(result)
    }).catch(err=>{
      reject(err);
    })
  })
}

export const tripRideRequests = (req, res, next) => {
  let terminalID = req.query.terminalId;
  let tripID = req.query.tripId;
  let returnObj = {
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
  if(req.query.terminalId) {
    var promises = [
      getTotalSeatsBookedDriverTerminalAsync(tripID, terminalID),
      getTerminalNewRequestsCountAsync(tripID, terminalID),
      getDriverTerminalRequestsAsync(tripID, terminalID)
    ]
  } else {
    var promises = [
      getTotalTripSeatsBookedAsync(tripID),
      getTripNewRequestsCountAsync(tripID),
      getAllTripRequestsAsync(tripID)
    ]
  }


  Promise.all(promises).then(results=>{
    let resultOnboardCount = results && results[0] || 0;
    // let resultNewRequestsCount = results && results[1] || 0;
    let resultNewRequests = results && results[2] || [];
    returnObj.success = true;
    returnObj.message = 'Terminal requests found';
    returnObj.data = {
      meta: {
        onBoardCount: (resultOnboardCount[0] && resultOnboardCount[0].totalSeatsBooked) ? resultOnboardCount[0].totalSeatsBooked : 0,
        newRequestsCount: results[1] && results[1].length || 0
      },
      rides: resultNewRequests || []
    }
    res.send(returnObj);
  }).catch(error=>{
    console.log("error while getting terminal rides", error);
    let customError = new APIError(`Something went wrong`, httpStatus.INTERNAL_SERVER_ERROR, true);
    next(customError);
  })
}

export const rideHistory = (req, res, next) => {
  const {id, pageNo, limit = 20 } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  tripRequestSchema.countAsync({ riderId: id })
    .then(response => {
      const returnObj = {
        success: true,
        message: `no of rides are zero`, // `no of active vehicles are ${returnObj.data.length}`;
        data: {
          rides:[],
          meta: {
            totalNoOfPages: Math.ceil(response / limit),
            limit,
            currPageNo: pageNo,
            currNoOfRecord: 0,
          }
        }
      };
      if (response < 1) {
        return res.send(returnObj);
      }
      if (skip > response) {
        const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
        return next(err);
      }
      tripRequestSchema.find({ riderId: id })
        .populate({path:'adminId',select:'name fname lname email'})
        .sort({requestTime: -1, requestUpdatedTime:-1})
        .limit(limit)
        .skip(skip)
        .then((records) => {
          returnObj.data.rides = records;
          returnObj.message = `Rides found`;
          returnObj.data.meta.currNoOfRecord = records.length;
          return res.send(returnObj);
        })
        .catch((err) => {
          res.send('Error', err);
        });
    })
    .error((e) => {
      const returnObj = {
        success: true,
        message: `no of rides are zero`,
        data:{
          rides:[],
          meta: {
            totalNoOfPages: 0,
            limit,
            currPageNo: 0,
            currNoOfRecord: 0,
          }
        }

      };
      return res.send(returnObj);
      /*const err = new APIError(`error occured while counting the no of rides ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      debug('error inside rideHistory records');
      next(err);*/
    });
}

export const driverHistory = (req, res, next) => {
  const {id, pageNo, limit = 20 } = req.query;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  debug(`skip value: ${req.query.pageNo}`);
  tripSchema.countAsync({ driverId: id })
    // eslint-disable-next-line
    .then(response => {
      const returnObj = {
        success: true,
        message: `no of rides are zero`, // `no of active vehicles are ${returnObj.data.length}`;
        data: {
          rides:[],
          meta: {
            totalNoOfPages: response<limit?1:Math.ceil(response / limit),
            limit,
            currPageNo: pageNo,
            currNoOfRecord: 0,
          }
        }
      };
      if (response.length < 1) {
        return res.send(returnObj);
      }
      if (skip > response.length) {
        const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
        return next(err);
      }
      tripSchema.find({ driverId: id })
        .populate({path:'shuttleId'})
        .sort({tripStartAt:-1})
        .limit(limit)
        .skip(skip)
        .then((records) => {
          returnObj.data.rides = records;
          returnObj.message = `Rides found`;
          returnObj.data.meta.currNoOfRecord = records.length;
          returnObj.data.meta.totalNoOfRecord = response;
          // returnObj.data.meta.totalNoOfPages = returnObj.meta.totalNoOfPages;
          // returnObj.data.meta.currNoOfRecord = records.length;
          debug(`no of records are ${returnObj.data.meta.currNoOfRecord}`);
          return res.send(returnObj);
        })
        .catch((err) => {
          res.send('Error', err);
        });
    })
    .error((e) => {
      const returnObj = {
        success: true,
        message: `no of rides are zero`,
        data: {
          rides:[],
          meta: {
            totalNoOfPages: 0,
            limit,
            currPageNo: 0,
            currNoOfRecord: 0,
          },
        }
      };
      return res.send(returnObj);
      const err = new APIError(`error occured while counting the no of rides ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      debug('error inside rideHistory records');
      next(err);
    });
}

export function driverRoutes(req, res, next) {
  const updateUserObj = Object.assign({}, req.body);
  User.findOneAsync({ _id: req.query.driverId })
  .then((userDoc) => {
    const returnObj = {
      success: false,
      message: 'Unable to find the driver route',
      data: null,
      meta: null,
    };
    if (userDoc) {
      DriverRouteTerminalSchema.findAsync({ driverId: userDoc._id , isDeleted:false})
      .then((driverData) => {
        if (driverData.length > 0) {
          returnObj.success = true;
          returnObj.message = 'Driver route found';
          returnObj.data = driverData
          res.send(returnObj);
        } else {
          res.send(returnObj);
        }
      })
      .error((err)=>{
        var err = new APIError(`Error occured while searching for the route ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        next(err);
      })
    } else {
      res.send(returnObj);
    }
  })
  .error((e) => {
    const err = new APIError(`Error occured while searching for the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

export const updateShuttleStatus = (req, res, next) => {
  if(req.user.userType == USER_TYPE_ADMIN) {
    var err = new APIError(`You are not authorized to activate trip`, httpStatus.UNAUTHORIZED, true);
    return next(err);
  }
  const {activeStatus,shuttleId,driverId,id} = req.query

  if(activeStatus == 'true') {
    const tripUpdateData = {
      shuttleId: shuttleId,
      driverId: driverId,
      activeStatus: true
    };

    tripSchema.findOne({driverId: driverId, activeStatus: true})
    .populate('shuttleId')
    .exec()
    .then(result=>{
      if(result) {
        const returnObj = {
          success: false,
          message: 'Driver already activated another shuttle',
          data: {response: result, driverRoute: []},
        };
        if(result.shuttleId._id == shuttleId) {
          returnObj.success = true;
          returnObj.message = 'Shuttle is already activated';
          returnObj.data = {response: result, driverRoute: []};
          DriverRouteTerminalSchema.findAsync({ driverId: driverId,isDeleted: false})
          .then((driverData) => {
            if (driverData.length > 0) {
              returnObj.data = {response:result,driverRoute:driverData}
              return res.send(returnObj);
            } else {
              returnObj.data = {response:result,driverRoute:[]};
              return res.send(returnObj);
            }
          })
          .catch((err)=>{
            var err = new APIError(`Error occured while searching for the route`, httpStatus.INTERNAL_SERVER_ERROR, true);
            next(err);
          })
        } else {
          res.send(returnObj);
          return notifyDriverAdminTripStatus(driverId, result._id);
        }
      } else {
        updateDriverVehicleStatusAsync(driverId, shuttleId, true)
        .then(results=>{
          let newTrip = new tripSchema(tripUpdateData);
          newTrip
          .save()
          .then((response) => {
            User.findOneAsync({ _id: req.query.driverId })
            .then((userDoc) => {
              if (userDoc) {
                DriverRouteTerminalSchema.findAsync({ driverId: userDoc._id,isDeleted: false})
                .then((driverData) => {
                  if (driverData.length > 0) {
                    const returnObj = {
                      success: true,
                      message: 'Trip activated successfully',
                      data: {response:response,driverRoute:driverData},
                    };
                    res.send(returnObj);
                    return notifyDriverAdminTripStatus(driverId, response._id);
                  } else {
                    const returnObj = {
                      success: true,
                      message: 'Trip activated successfully',
                      data: {response:response,driverRoute:[]},
                    };
                    res.send(returnObj);
                    return notifyDriverAdminTripStatus(driverId, response._id);
                  }
                })
                .catch((err)=>{
                  console.log("occured while searching for the route", err);
                  var err = new APIError(`Error occured while searching for the route`, httpStatus.INTERNAL_SERVER_ERROR, true);
                  next(err);
                })
              } else {
                return res.send(returnObj);
              }
            })
            .error((e) => {
              const err = new APIError(`Error occured while searching for the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            });
          })
          .catch(e => next(e));
        })
        .catch(error=>{
          next(error)
        })
      }
    })
    .catch(e => next(e));

  } else if(activeStatus == 'false'){
    tripSchema.findOneAndUpdateAsync({ _id: id, activeStatus: true }, { $set: { activeStatus: false, tripEndTime: (new Date()).toISOString()} }, {new: true})
    // eslint-disable-next-line
    .then(updatedTripObj => {
      const returnObj = {
        success: true,
        message: '',
        data: {},
      };
      if (updatedTripObj) {
        returnObj.message = 'Shuttle Deactived';
        updateDriverVehicleStatusAsync(updatedTripObj.driverId, updatedTripObj.shuttleId, false)
        .then(results=>{
          res.send(returnObj);
          return notifyDriverAdminTripStatus(updatedTripObj.driverId, updatedTripObj._doc._id);
        })
        .catch(error=>{
          next(e);
        })
      } else {
        returnObj.success = false;
        returnObj.message = 'No Active Shuttle';
        return res.send(returnObj);
      }
    }) .error((e) => {
      var err = new APIError(`Something went wrong`, httpStatus.INTERNAL_SERVER_ERROR, true);
      next(err);
    });

  }
}

const tripUpdateMessageToAdmin = {
  true: "New Trip started",
  false: "Trip deactivated",
}

const tripUpdateEventToAdmin = {
  true: "tripCreated",
  false: "tripDeactivated",
}

function notifyDriverAdminTripStatus(driverId, tripId) {
  let query = {
    userIdDriver: driverId,
    isDeleted: false
  }
  AdminDriverschema.findOne(query)
  .populate([
    {path:'userIdDriver',select:'name email'},
    {path:'userIdAdmin',select:'name email'}
  ])
  .then(result=>{
    if(result) {
      tripSchema.findOne({_id: tripId}, {gpsLoc: 1, activeStatus:1, visitedTerminal:1})
      .populate([
        {path:'driverId',select:'email activeStatus profileUrl name gpsLoc'},
        {path:'shuttleId',select:'name activeStatus'}
      ])
      .then(trip=>{
        let payload = {
          success: false,
          message: "Trip not found",
          data: {}
        }
        if(trip) {
          let data = Object.assign({}, trip);
          if(!data._doc.gpsLoc || (!data._doc.gpsLoc.length)) {
            data._doc.gpsLoc = data._doc.driverId && data._doc.driverId.gpsLoc;
          }
          payload.success = true;
          payload.message = tripUpdateMessageToAdmin[trip.activeStatus]
          payload.data = data._doc;

          SocketStore.emitByUserId(
            result.userIdAdmin._id,
            tripUpdateEventToAdmin[trip.activeStatus],
            payload
          )
        }
      })
      .catch(err=>{
        console.log("error while sending notification to the admin", err);
      })
    }
  })
}

function updateDriverVehicleStatusAsync(driverId, vehicleId, status){
  return new Promise((resolve, reject)=>{

    let promises = [
      AdminVehicleSchema.updateAsync({_id: vehicleId, isDeleted: false}, {$set: {activeStatus: status}}, {new: true}),
      User.updateAsync({_id: driverId, isDeleted: false}, {$set: {activeStatus: status}}, {new: true})
    ]

    Promise.all(promises)
    .then(results=>{
      if(results && !results[0]) {
        return reject(new Error("Something went wrong while updating trip vehicle"));
      } else if (results && !results[1]) {
        return reject(new Error("Something went wrong while updating trip driver"));
      } else if (results && results[0] && results[1]) {
        return resolve(results);
      } else {
        return reject(new Error("Something went wrong while updating trip driver and vehicle"));
      }
    })
    .catch(error=>{
      return reject(error);
    })
  })
}

export const ridesCompletingAtTerminal = (req, res, next) => {
  const {driverId, terminalId, tripId} = req.query;
  const returnObj = {
    success: false,
    message: 'Unable to find rides completing at terminal',
    data: []
  };

  // check if trip is active with provided trip details

  tripSchema.findOneAsync({_id: tripId, driverId: driverId, activeStatus: true })
  .then(trip=>{
    if(trip) {
      getAllRidersCompletingTripAtTerminal(tripId, terminalId)
      .then((rides) => {
        if (rides.length > 0) {
          returnObj.success = true;
          returnObj.message = 'Rides found';
          returnObj.data = rides;
          return res.send(returnObj);
        } else {
          return res.send(returnObj);
        }
      })
      .error((err)=>{
        var err = new APIError(`Error occured while searching for the route ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        return next(err);
      })
    } else {
      returnObj.message = 'Trip not found';
      return res.send(returnObj);
    }
  })
  .catch(error=>{
    var err = new APIError(`Error occured while searching for the trip ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
    return next(err);
  })

}

function getAllRidersCompletingTripAtTerminal(tripId, terminalId){
  let aggregateStages = [
    {
      $match: {
        tripId: mongoose.Types.ObjectId(tripId),
        "destLoc._id" : mongoose.Types.ObjectId(terminalId),
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
    }
  ];

  return TripRequestSchema.aggregateAsync(aggregateStages)
}

export function addReview(req, res, next) {
  // const { reviewerId, reviewToId, reviewType, message, rating } = req.body;

  const reviewObj = new ReviewSchema({
    reviewerId: req.body.reviewerId,
    reviewToId: req.body.reviewToId,
    reviewToType: req.body.reviewToType,
    message: req.body.message,
    adminId:req.body.adminId,
    rating: req.body.rating || 0
  });

  reviewObj
    .saveAsync()
    .then(newReviewObj => {
      if(req.body.reviewToType=='driver' || req.body.reviewToType=='admin'){
        ReviewSchema.aggregateAsync([
          { "$match": {"reviewToId" :ObjectId(req.body.reviewToId)}},
          { "$group": {
              "_id": null,
              "avg": { "$avg": "$rating" }
          }}
      ])
      .then(average => {
        User.updateAsync({ _id: ObjectId(req.body.reviewToId)}, { $set: { avgRating:average[0].avg} }, { multi: true }) // eslint-disable-line no-underscore-dangle
                .then(() => {
                  const returnObj = {
                    success: true,
                    message: "Review has been added successfully.",
                    data: average
                  };
                  return res.send(returnObj);
                })
                .error((e) => {
                  const err = new APIError(`Error occured while Updating Average ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                  next(err);
                });

      })
      .error(e => {
        console.log("error adding review1", e);
        const err = new APIError(
          `Error occured while computing revenue graph ${e}`,
          httpStatus.INTERNAL_SERVER_ERROR
        );
        next(err);
      });
      }else{
        const returnObj = {
          success: true,
          message: "Review has been added successfully.",
          data: newReviewObj
        };
        res.send(returnObj);
      }
    })
    .error(e => {
      console.log("error adding review1", e);
      const err = new APIError(
        `Error occured while saving trip object ${e}`,
        httpStatus.INTERNAL_SERVER_ERROR
      );
      next(err);
    });
}

export function getCurrentTripOrRequest(req, res, next){
  let returnObj = {success: false, message: 'no trip or request found', data: {response: {}, driverRoute: []}}
  if(req.user.userType == USER_TYPE_DRIVER) {
    tripSchema.findOne({driverId: req.user._id, activeStatus: true})
    .populate('shuttleId')
    .exec()
    .then(result=>{
      if(result) {
        returnObj = {
          success: false,
          message: 'Currently active trip',
          data: {response: result, driverRoute: []},
        };
        // get trip driver's route and terminals
        DriverRouteTerminalSchema.findAsync({ driverId: req.user._id, isDeleted: false})
        .then((driverData) => {
          if (driverData.length > 0) {
            returnObj.success = true;
            returnObj.data = {response:result,driverRoute:driverData}
            return res.send(returnObj);
          } else {
            returnObj.data = {response:result,driverRoute:[]};
            return res.send(returnObj);
          }
        })
        .catch((err)=>{
          console.log("occured while searching for the route", err);
          var err = new APIError(`Error occured while searching for the route`, httpStatus.INTERNAL_SERVER_ERROR, true);
          next(err);
        })
      } else {
        returnObj.message = 'No active trip found';
        return res.send(returnObj);
      }
    })
    .catch(e => next(e));
  } else if (req.user.userType == USER_TYPE_RIDER) {
    let tripRequestStatuses = [TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT, TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE];

    tripRequestSchema.find({ riderId: req.user._id, tripRequestStatus: {$in: tripRequestStatuses} })
    .populate([{path:'adminId',select:'name fname lname email'}, {path:'tripId',select:'driverId '}])
    .sort({requestTime: -1, requestUpdatedTime:-1}).limit(1)
    .then((tripRequests) => {
      let tripRequest = tripRequests && Array.isArray(tripRequests) && tripRequests[0] || null;
      if(tripRequest && tripRequest.tripId) {
        DriverRouteTerminalSchema.findAsync({ driverId: tripRequest.tripId.driverId, isDeleted: false})
        .then((driverData) => {
          if (driverData.length > 0) {
            returnObj.success = true;
            returnObj.message = "Trip request with active trip found"
            returnObj.data = {response:tripRequest,driverRoute:driverData}
            return res.send(returnObj);
          } else {
            returnObj.message = "Trip request found"
            returnObj.data = {response:tripRequest,driverRoute:[]};
            return res.send(returnObj);
          }
        })
        .catch((err)=>{
          console.log("occured while searching for the route", err);
          var err = new APIError(`Error occured while searching for the route`, httpStatus.INTERNAL_SERVER_ERROR, true);
          next(err);
        })
      } else if (tripRequest){
        returnObj.message = 'Trip request with no trip found'
        returnObj.data = {response:tripRequest,driverRoute:[]};
        return res.send(returnObj);
      } else {
        returnObj.message = "No trip request found"
        return res.send(returnObj);
      }
    })
    .catch((err) => {
      res.send('Error', err);
    });
  } else {
    returnObj.message = 'Not a valid user'
    res.send(returnObj);
  }
}

export function getRiderNotificationRequests(req, res, next){
  let returnObj = {success: false, message: 'no request found', data: []};
  let tripRequestStatuses = [
    TRIP_REQUEST_STATUS.TRIP_REQUEST_INIT,
    TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, TRIP_REQUEST_STATUS.TRIP_REQUEST_ENROUTE
  ]
  tripRequestSchema.aggregateAsync([
    {$match: {riderId: mongoose.Types.ObjectId(req.user._id), tripRequestStatus: {$in: tripRequestStatuses}}},
    {
      $lookup: {
        from: "trips",
        localField: "tripId",
        foreignField: "_id",
        as: "trip"
      }
    }, {$unwind: "$trip"},
    {
      $lookup: {
        from: "adminvehicles",
        localField: "trip.shuttleId",
        foreignField: "_id",
        as: "shuttle"
      }
    }, {$unwind: "$shuttle"},
    {
      $lookup: {
        from: "users",
        localField: "trip.driverId",
        foreignField: "_id",
        as: "driver"
      }
    }, {$unwind: "$driver"},
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
          "latitude": { $arrayElemAt: [ "$trip.gpsLoc", 1 ] },
          "longitude": { $arrayElemAt: [ "$trip.gpsLoc", 0 ] }
        },
        "driver": {$cond: { if: { $eq: [ "$tripRequestStatus", "request" ] }, then: {}, else: "$driver" }},
        "shuttle": {$cond: { if: { $eq: [ "$tripRequestStatus", "request" ] }, then: {}, else: "$shuttle" }},
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
    {$sort: {requestTime: -1, requestUpdatedTime:-1}}, {$limit: 1}
  ])
  .then(result=>{
    if(result && Array.isArray(result) && result.length) {
      returnObj.success = true;
      returnObj.message = "All requests found";
      returnObj.data = result[0];
      return res.send(returnObj);
    } else {
      returnObj.message = "No request found";
      return res.send(returnObj)
    }
  })
  .catch(error=>{
    var err = new APIError(`Something went wrong, while searching for rides`, httpStatus.INTERNAL_SERVER_ERROR, true);
    console.log("error is:", error);
    return next(err);
  })
}

export function validateReservationCode(req, res, next) {
  const returnObj = {};
  console.log("             ");
  console.log("req.body.reservationCode.length",req.body.reservationCode.length);
  console.log("             ");
    if (req.body.reservationCode.length!=4) {
      returnObj.success = false;
      returnObj.message = 'Please enter last 4 digits of reservation code.';
      return res.send(returnObj);
  }

  User.findOneAsync({_id:req.body.adminId,isDeleted:false})
    // eslint-disable-next-line consistent-return
    .then((user) => {
      console.log("             ");
      console.log("user",user);
      console.log("             ");
      if (!user) {
        const err = new APIError('Service provider not found', httpStatus.NOT_FOUND, true);
        return next(err);
      } else {
          var lastFourDigits= user.reservationCode.substr(user.reservationCode.length - 4);
          if (req.body.reservationCode != lastFourDigits) {
              returnObj.success = false;
              returnObj.message = 'Reservationcode not matched';
          }else{
              returnObj.success = true;
              returnObj.message = 'Reservationcode matched';
          }
          return res.send(returnObj);
      }
  }).catch((err123) => {
    const err = new APIError(`error in getting Reservation code ${err123}`, httpStatus.INTERNAL_SERVER_ERROR);
    next(err);
  });

}

export function listReview(req, res, next) {}


export function driverChangeVehicle(req,res,next){
  const  returnObj={success: false, message: '', data: null};
  const driverId=mongoose.Types.ObjectId(req.body.driverId);
  console.log("req.body --- >", req.body);
  tripSchema.findOneAsync({_id:req.body.tripId,activeStatus:true})
  .then(tripDetails=>{
    if(!tripDetails){
      console.log("in trip")
      returnObj.message="Trip not found";
      res.send(returnObj);
    }else{
    AdminVehicleSchema.findOneAsync({_id:req.body.vehicalId,isDeleted:false})
    .then(findVehical=>{
      if(!findVehical){
        console.log("in vehicle")
        returnObj.success=false;
        returnObj.message="Vehicle not found";
        returnObj.data=null;
        res.send(returnObj);
      }else{
        console.log("tripDetails.driver.locationId",tripDetails.driver.locationId);
        console.log("findVehical.locationId",findVehical.locationId);
        const bookedSeat=tripDetails.seatBooked;
        const totalSeat=findVehical.seats;
        console.log("bookedSeat",bookedSeat)
        console.log("totalSeat",totalSeat)
        if(!mongoose.Types.ObjectId(tripDetails.driver.locationId).equals(findVehical.locationId)) {
          console.log("RES ----> 1");
          returnObj.message="Vehicle not available for this location";
          return res.send(returnObj);
        } else if (totalSeat<bookedSeat) {
          console.log("RES ----> 2");
          returnObj.message="Vehicle does not have required seats available";
          return res.send(returnObj);
        } else if (!mongoose.Types.ObjectId(tripDetails.driver._id).equals(driverId)) {
          console.log("RES ----> 3");
          returnObj.message="Driver does not exist on this trip";
          return res.send(returnObj);
        } else if (!mongoose.Types.ObjectId(tripDetails.driver.adminId).equals(findVehical.userIdAdmin)) {
          console.log("RES ----> 4");
          returnObj.message="Vehicle or driver may have different service providers";
          return res.send(returnObj);
        }
        // updateDriverVehicleStatusAsync(driverId, tripDetails.shuttleId, false)
        AdminVehicleSchema.updateAsync({_id: tripDetails.shuttleId, isDeleted: false}, {$set: {activeStatus: false}}, {new: true})
        .then(updateVehicleStatus=>{
            tripSchema.findOneAndUpdateAsync({_id:req.body.tripId,activeStatus:true},{$set:{shuttleId:findVehical._id}},{one:true})
           .then(updatetrip=>{
          if(!updatetrip){
            console.log("in both matching step")
            returnObj.success=false;
            returnObj.message="Trip not found";
            returnObj.data=null;
            res.send(returnObj);
          }else{
            // updateDriverVehicleStatusAsync(driverId, tripDetails.shuttleId, false)
            AdminVehicleSchema.updateAsync({_id: req.body.vehicalId, isDeleted: false}, {$set: {activeStatus: true}}, {new: true})
            .then(updateVehicleStatus=>{
              tripRequestSchema.find({tripId: mongoose.Types.ObjectId(req.body.tripId)})
              .populate({path:'adminId', select:'name fname lname email'})
              .populate({path:'riderId', select: 'name fname lname email'})
              .then(result=>{
                console.log("result>>>>>>", JSON.stringify(result));
                if(!result){
                  returnObj.success=false;
                  returnObj.message="Trip requset not found";
                  returnObj.data=null;
                  res.send(returnObj);
                }else{
                  notifyRideVehicalChange(result,updatetrip);
                  returnObj.success=true;
                  returnObj.message="Vehicle Changed In Trip";
                  returnObj.data=result;
                  res.send(returnObj);
                }
              }).catch((err) => {
                // const err = new APIError(`error in getting TripRequestDetails ${err}`, httpStatus.INTERNAL_SERVER_ERROR);
                next(err);
              });
            }).catch((err)=>{
              next(err);
            })
            console.log("match>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
          }
           }).catch((err) => {
          let error = new APIError(`error in trip and vehicle details not match  ${err}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(error);
            })

        }).catch((err)=>{
          next(err);
        })
      }
    })
    .catch((err) => {
      let error = new APIError(`error in getting TripRequestDetails ${err}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(error);
    });
    }
  })
  .catch((err) => {
    let error = new APIError(`error in getting TripRequestDetails ${err}`, httpStatus.INTERNAL_SERVER_ERROR);
    next(error);
  });
};

function notifyRideVehicalChange(requests, data){
  let eventPayload = {
    success: true,
    message: 'Vehicle Changed By Driver',
    data: data
  }
  let eventPayload1 = {
    success: true,
    message: 'Vehicle Changed By Driver',
    data: data
  }

  requests.map((request, index)=>{
    SocketStore.emitByUserId(request.riderId._id, "vehicleChangedRider", eventPayload1);
  })


  SocketStore.emitByUserId(data.driver.adminId, "VehicleChangedAdmin", eventPayload);
}

export const signUpProvider = (req, res, next) => {
  User.findOneAsync({
    $or: [{email: req.body.email.toLowerCase(), userType: req.body.userType ? req.body.userType : USER_TYPE_RIDER,isDeleted:false},
      {userType: req.body.userType ? req.body.userType : USER_TYPE_RIDER, phoneNo: req.body.phoneNo,isDeleted:false}]
  }).then((foundUser) => {
    if (foundUser !== null && foundUser.userType === (req.body.userType ? req.body.userType : USER_TYPE_RIDER)) {
      let numberunique=foundUser._id;
      User.findOneAndUpdateAsync({ _id: foundUser._id }, { $set: { loginStatus: true,jwtAccessToken:numberunique } }, { new: true })
        .then(updateUserObj => {
          if (updateUserObj) {
            if(updateUserObj.email==req.body.email.toLowerCase() && updateUserObj.phoneNo==req.body.phoneNo){
              var msg="User already registered with same email address and mobile number"
            }else if(updateUserObj.email==req.body.email.toLowerCase()){
              var msg="User already registered with same email address"
            }else{
              var msg="User already registered with same mobile number";
            }
            const returnObj = {
              success: false,
              message: msg,
              data:{user: updateUserObj}
            };
            return res.send(returnObj);
          }
        })
        .error((e) => {
          const err = new APIError(`Error in updating user details while login ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(err);
        });
    } else {
      CountryCode.findOneAsync({ dial_code: req.body.isdCode }).then((CountryCodeDetails) => {
        getApproveConfig().then((values) => {
          const otpValue = Utilities.generateVerificationCode();
          const accessCode = Utilities.generateAccessCode();
          const reservationCode = Utilities.generateUniueReservationCode();
          const newPassword = randomstring.generate({
            length: 6,
            // charset: 'alphanumeric'
          });
          getPassword(MASTER_PASSWORD).then((masterPassWord) => {
          let newUser = {
            tripType: req.body.tripType ? req.body.tripType : TRIP_CIRCULAR_STATIC,
            email: req.body.email.toLowerCase(),
            reservationCode:reservationCode,
            userType: req.body.userType ? req.body.userType : USER_TYPE_RIDER,
            name: req.body.name,
            phoneNo: req.body.phoneNo,
            isdCode: req.body.isdCode,
            adminTripTypes:req.body.adminTripTypes,
            managerDetails: req.body.managerDetails,
            isDeleted:req.body.isDeleted?req.body.isDeleted:false,
            countryCode: req.body.countryCode,
            gpsLoc: [19.02172902354515, 72.85368273308545],
            carDetails: req.body.userType === USER_TYPE_DRIVER ? { type: 'sedan' } : {},
            mapCoordinates: [0, 0],
            isApproved: req.body.userType === USER_TYPE_DRIVER ?
            (values && values.autoApproveDriver ? values.autoApproveDriver: true) :
            (values && values.autoApproveRider ? values.autoApproveRider : true),
            loginStatus: false,
            country: req.body.country?req.body.country:'',
            otp: otpValue,
            accessCode: accessCode,
            password: newPassword,
            masterPassword:masterPassWord,
            isDeleted:false,
            isActive:false,
            profileUrl:Utilities.getUploadsAvtarsUrl(req)+"/provider_default.png",
            address:req.body.address?req.body.address:"",
            mobileVerified: true,
           }
          const user = new User(newUser);
            user
              .saveAsync()
              .then((savedUser) => {
                let numberunique=savedUser._id;
                User.findOneAndUpdateAsync({ _id: savedUser._id }, { $set: { jwtAccessToken:numberunique } })
                    .then(updatedUser => {
                      const userObj = Object.assign({}, {
                        newpass: newPassword,
                        accessCode:accessCode,
                        name: updatedUser.name,
                        email: updatedUser.email
                      });
                      const managerObj = Object.assign({}, {
                        newpass: newPassword,
                        accessCode:accessCode,
                        name: updatedUser.managerDetails[0].name,
                        email: updatedUser.email
                      });
                      let managerPhoneDetails = {
                        isdCode: updatedUser.managerDetails[0].isdCode,
                        countryCode: updatedUser.managerDetails[0].countryCode,
                        phoneNo: updatedUser.managerDetails[0].phoneNo,
                        userType:req.body.userType
                      }
                      let smsText=`Credentials for login  email: ${updatedUser.email} password: ${newPassword} accesscode: ${accessCode}`
                      sendEmail(updatedUser._id, userObj, 'createAdmin');
                      sendEmail(updatedUser._id, managerObj, 'sendEmailToManager');
                      sendSmsBeforeRegister(managerPhoneDetails, smsText, (err /* , data */) => {
                        const returnObj = {
                          success: true,
                          message: 'You Have Been Successfully Registered! Please login',
                          data:{user: savedUser}
                        };
                        if (err) {
                          returnObj.message = 'You Have Been Successfully Registered! Please login , Unable to send sms because ' + err.message;
                        }
                        if(req.body.locationObject){
                          const edges = req.body.radius ? req.body.radius * 3 : 32;
                          const adminLocationObj = new AdminLocationSchema({
                          "name": req.body.locationObject.name ? req.body.locationObject.name : "",
                          "zone": req.body.locationObject.zone,
                          "userIdAdmin": updatedUser._id,
                          "radius": req.body.locationObject.radius ? req.body.locationObject.radius : 0,
                          "polygons": Utilities.getCirclePolygons({ coordinates: req.body.locationObject.zone.location, radius: req.body.locationObject.radius, numberOfEdges: edges })
                        });
                        adminLocationObj
                          .saveAsync()
                          .then(savedUser => {
                            return res.send(returnObj);
                          })
                          .error(e => {
                            const err = new APIError(
                              `Error while adding new Address ${e}`,
                              httpStatus.INTERNAL_SERVER_ERROR
                            );
                            return next(returnObj);
                          });
                        }else{
                          return res.send(returnObj);
                        }


                        return res.send(returnObj);


                      })
                    }) .error(e => next(e));
              })
              .error(e => next(e));
            }).catch(e => {
              const err = new APIError(`Error in creating user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            });

        }).catch(e => {
          const err = new APIError(`Error in creating user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(err);
        });
      }).catch(e => {
          const err = new APIError(`Error in creating user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(err);
        });

    }
  });
};
function getPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        reject(err);
      }
      // eslint-disable-next-line
      bcrypt.hash(password, salt, (hashErr, hash) => {
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
