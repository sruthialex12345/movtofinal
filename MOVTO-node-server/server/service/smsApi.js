import Twilio from 'twilio';
import ServerConfig from '../models/serverConfig';
import UserSchema from '../models/user';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER, USER_TYPE_ADMIN } from '../constants/user-types';

function getSmsApiDetails() {
  return new Promise((resolve, reject) => {
    ServerConfig.findOneAsync({ key: 'smsConfig' })
      .then((foundDetails) => {
        resolve(foundDetails.value);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function sendSmsBeforeRegister(phoneDetails, smsText, cb) {
  getSmsApiDetails().then((details) => {
    console.log("sms api details", details);
    const twilio = new Twilio(details.accountSid, details.token);
    if(phoneDetails.phoneNo) {
      var phoneNO = null;
      phoneNO = `+${phoneDetails.isdCode}${phoneDetails.phoneNo}`;
      console.log('sending message to:', phoneNO);
      twilio.messages.create(
        {
          from: details.from,
          to: phoneNO,
          body: smsText,
        },
        (err, result) => {
          if (err) {
            console.log('Error', err);
            cb(err, null);
          } else {
            cb(null, result);
          }
        }
      );
    } else {
      cb(new Error("Country code or phone no is invalid!"), null);
    }
  });
}

export function sendSmsUpdateMobile(phoneDetails, smsText, cb) {
  getSmsApiDetails().then((details) => {
    const twilio = new Twilio(details.accountSid, details.token);
    if(phoneDetails.isdCode && phoneDetails.phoneNo) {
      var phoneNO = null;
      phoneNO = `+${phoneDetails.isdCode}${phoneDetails.phoneNo}`;
      console.log('sending message to:', phoneNO);
      twilio.messages.create(
        {
          from: details.from,
          to: phoneNO,
          body: smsText,
        },
        (err, result) => {
          if (err) {
            console.log('Error', err);
            cb(err, null);
          } else {
            // console.log('Result', result);
            cb(null, result);
          }
        }
      );
    } else {
      cb(new Error("Country code or phone no is invalid!"), null);
    }
  });
}

export function sendSms(userId, smsText, cb) {
  UserSchema.findOneAsync({ _id: userId }).then((userObj) => {
    getSmsApiDetails().then((details) => {
      const twilio = new Twilio(details.accountSid, details.token);
      if(userObj.isdCode && userObj.phoneNo) {
        var phoneNO = null;
        if(userObj.userType === USER_TYPE_RIDER) {
          phoneNO = `+${userObj.isdCode}${userObj.phoneNo}`;
        } else {
          phoneNO = userObj.phoneNo;
        }
        console.log('sending message to:', phoneNO);
        twilio.messages.create(
          {
            from: details.from,
            to: phoneNO,
            body: smsText,
          },
          (err, result) => {
            if (err) {
              console.log('Error sending sms', err);
              cb(err, null);
            } else {
              console.log('sms sent Result', result);
              cb(null, result);
            }
          }
        );
      } else {
        cb(new Error("Country code or phone no is invalid!"), null);
      }
    });
  });
}
// export default sendSms;
