import httpStatus from 'http-status';
import ServerConfig from '../models/serverConfig'; //eslint-disable-line
import User from '../models/user';
import APIError from '../helpers/APIError';
import {USER_TYPE_ADMIN } from '../constants/user-types';
var randomstring = require("randomstring");
import Utilities from '../helpers/util';
import bcrypt from 'bcrypt';
import sendEmail from '../service/emailApi';
import { sendSmsBeforeRegister } from '../service/smsApi';
export const mobileVerify = (req, res, next) => {
  const { userId, otpValue } = req.body;
  User.findOneAsync({ _id: userId })
    .then((user) => {
      if (user) {
        var updateData = {
          mobileVerified: true,
          isDeleted:false
        }
        if (user.updatePhoneDetails && user.updatePhoneDetails.phoneNo) {
          user.phoneNo =  user.updatePhoneDetails.phoneNo;
          user.countryCode = user.updatePhoneDetails.countryCode;
          user.isdCode = user.updatePhoneDetails.isdCode;
          user.updatePhoneDetails = null;
        }
        if ((user.otp === otpValue) || (otpValue === 5555)) { //if client mobile verifies, replace 1234 by user.otp
          User.findOneAndUpdateAsync(
            { _id: userId },
            { $set: updateData},
            { new: true }
          ).then((updatedUser) => {
            res.send({
              success: true,
              code: 200,
              message: 'Phone No. verified successfully',
              data: updatedUser
            });
          }).catch((err)=>{
            next(err);
          });
        } else {
          res.send({ success: false, code: 400, message: 'Verification code is invalid' });
        }
      } else {
        res.send({ success: false, code: 400, message: 'User not found!' });
      }
    })
    .error((e) => {
      next(e);
    });
};


export const mobileVerifyWeb = (req, res, next) => {
  const { userId, otpValue } = req.body;
  User.findOneAsync({ _id: userId })
    .then((user) => {
      if (user) {
        if (user.updatePhoneDetails && user.updatePhoneDetails.phoneNo) {
          user.phoneNo =  user.updatePhoneDetails.phoneNo;
          user.countryCode = user.updatePhoneDetails.countryCode;
          user.isdCode = user.updatePhoneDetails.isdCode;
          user.updatePhoneDetails = null;
        }
        if ((user.otp === otpValue) || (otpValue === 5555)) { //if client mobile verifies, replace 1234 by user.otp
          const accessCode = Utilities.generateAccessCode();
          const newPassword = randomstring.generate({
            length: 6,
            // charset: 'alphanumeric'
          });
          getPassword(newPassword).then((passwordNew) => {
            var user = {
              mobileVerified: true,
              isDeleted:false,
              isActive:false,
              password:passwordNew,
              accessCode:accessCode
            }
            User.findOneAndUpdateAsync(
              { _id: userId },
              { $set: user},
              { new: true }
            ).then((updatedUser) => {
              if(updatedUser.userType == USER_TYPE_ADMIN) {
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

                let smsText=`Credentials for login  email: ${updatedUser.email} password: ${newPassword} accesscode: ${accessCode} Anroid app link : https://bit.ly/2SXLD3H,  ios link : https://apple.co/2Tn7OiW `

                sendEmail(updatedUser._id, userObj, 'createAdmin');
                sendEmail(updatedUser._id, managerObj, 'sendEmailToManager');
                sendSmsBeforeRegister(managerPhoneDetails, smsText, (err /* , data */) => {
                  if (err) {
                    let returnObj = {};
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
                })
              }

            }).catch((err)=>{
              next(err);
            });

          }).catch(e => {
          const err = new APIError(`Error in creating user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(err);
        });
        } else {
          res.send({ success: false, code: 400, message: 'Verification code is invalid' });
        }
      } else {
        res.send({ success: false, code: 400, message: 'User not found!' });
      }
    })
    .error((e) => {
      next(e);
    });
};

export const emailVerify = (req, res, next) => {
  User.findOneAsync({ email: req.query.email })
    // eslint-disable-next-line
    .then(foundUser => {
      if (foundUser) {
        const host = req.get('host');
        const url = `${req.protocol}://${req.get('host')}`;
        console.log(url);
        if (url === `http://${host}`) {
          console.log('Domain is matched. Information is from authentic email');
          if (req.query.check === foundUser.otp) {
            User.findOneAndUpdateAsync({ email: req.query.email }, { $set: { emailVerified: true } }, { new: true }) //eslint-disable-line
              // eslint-disable-next-line
              .then(updateUserObj => {
                if (updateUserObj) {
                  const returnObj = {
                    success: true,
                    message: 'Email verified',
                    data: {},
                  };
                  // returnObj.data.user = updateUserObj;
                  returnObj.success = true;
                  return res.send(returnObj);
                }
              })
              .error((e) => {
                const err = new APIError(`error in updating user details while login ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
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

export const mobileUpdateByPartner = (req, res, next) => {
  const { userId, otpValue } = req.body;
  User.findOneAsync({ _id: userId})
    .then((user) => {
      if (user) {
        if ((user.otp === otpValue) || (otpValue === 5555)) { //if client mobile verifies, replace 1234 by user.otp
          if (user.updatePhoneDetails && user.updatePhoneDetails.phoneNo) {
            var updateData={
              phoneNo :  user.updatePhoneDetails.phoneNo,
              countryCode : user.updatePhoneDetails.countryCode,
              isdCode : user.updatePhoneDetails.isdCode,
              updatePhoneDetails : null,
            }
          }
            User.findOneAndUpdateAsync(
              { _id: userId },
              { $set: updateData},
              { new: true }
            ).then((updatedUser) => {
              res.send({
                success: true,
                code: 200,
                message: 'Phone No. verified successfully',
                data: updatedUser
              });
            }).catch((err)=>{
              console.log(err)
              next(err);
            });
        } else {
          res.send({ success: false, code: 400, message: 'Verification code is invalid' });
        }
      } else {
        res.send({ success: false, code: 400, message: 'User not found!' });
      }
    })
    .error((e) => {
      next(e);
    });
};
