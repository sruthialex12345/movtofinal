
// file not being used

import moment from 'moment';
import TripSchema from '../models/trip';
import { sendSms } from '../service/smsApi';

const findUnclaimedRides = (startDate, endDate) => {
  TripSchema.findAsync({ bookingTime: { $lte: startDate, $gte: endDate }, tripStatus: 'unclaimed' })
    .then((tripData) => {
      if (tripData.length > 0) {
        tripData.forEach((item) => {
          const smsText = '';
          sendSms(item.riderId, smsText, (err, data) => {
            if (err) {
              console.log(err);
            } else {
              console.log(data);
            }
          });
        });
      } else {
        console.log('No unclaimed rides available found ', startDate);
      }
    })
    .catch((error) => {
      console.log('Server error finding unclaimed rides', error);
    });
};

export const notifyUserUnclaimedRidesAtEight = () => {
  const currentDate = new Date().toISOString();
  const tomorrowEndDate = new Date(moment(currentDate).add(1, 'days'));
  tomorrowEndDate.setHours(23);
  tomorrowEndDate.setMinutes(59);
  tomorrowEndDate.setSeconds(59);
  const tomorrowStartDate = new Date(moment(currentDate).add(1, 'days'));
  tomorrowStartDate.setHours(0);
  tomorrowStartDate.setMinutes(0);
  tomorrowStartDate.setSeconds(0);
  findUnclaimedRides(tomorrowStartDate, tomorrowEndDate);
};

export const notifyUserUnclaimedRidesAtNine = () => {
  const currentDate = new Date().toISOString();
  const todayEndDate = new Date().toISOString();
  todayEndDate.setHours(23);
  todayEndDate.setMinutes(59);
  todayEndDate.setSeconds(59);
  findUnclaimedRides(currentDate, todayEndDate);
};

export const notifyUserUnclaimedRides30MinBefore = () => {
  const currentDate = new Date().toISOString();
  const thirtyBefore = new Date(moment(currentDate).subtract(30, 'minutes'));
  findUnclaimedRides(currentDate, thirtyBefore);
};
