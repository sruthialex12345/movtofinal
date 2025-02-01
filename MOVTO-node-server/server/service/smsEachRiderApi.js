import Twilio from 'twilio';
import ServerConfig from '../models/serverConfig';
import UserSchema from '../models/user';

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

function sendSmsEachRider(smsText, phoneNo, cb) {
    getSmsApiDetails().then((details) => {
        const twilio = new Twilio(details.accountSid, details.token);
        twilio.messages.create(
            {
                from: details.from,
                to: phoneNo,
                body: smsText,
            },
            (err, result) => {
                if (err) {
                    console.log('Error', err);
                    cb(err, null);
                } else {
                    console.log('Result', result);
                    cb(null, result);
                }
            }
        );
    });
}
export default sendSmsEachRider;
