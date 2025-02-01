import Expo from 'expo-server-sdk';
import UserSchema from '../models/user';
// To check if something is a push token
// const isPushToken = Exponent.isExponentPushToken(somePushToken);
const expo = new Expo();

function sendNotification(userId, notification) {
  // eslint-disable-next-line
  UserSchema.findOneAsync({ _id: userId }).then(userObj => {
    try {
      const isPushToken = Expo.isExponentPushToken(userObj.pushToken);
      if (isPushToken) {
        const receipts = expo.sendPushNotificationsAsync([
          {
            to: userObj.pushToken,
            sound: 'default',
            body: notification,
            data: { withSome: notification },
          },
        ]);
        // console.log(receipts);
        return receipts;
      }
    } catch (error) {
      return error;
      // console.error(error);
    }
  });
}
export default sendNotification;
