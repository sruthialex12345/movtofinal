// file not being used

import moment from 'moment';
import User from '../models/user';
import TripSchema from '../models/trip';
import sendEmail from '../service/emailApi';
import { USER_TYPE_DRIVER } from '../constants/user-types';

function getPreviousWeekTrips(driverId) {
  const currenDate = new Date().toISOString();
  const prevMondayDate = new Date(moment(currenDate).subtract(7, 'days'));
  const prevSundayDate = new Date(moment(currenDate).subtract(1, 'days'));

  TripSchema.aggregateAsync([
    { $match: { driverId, pickUpTime: { $gte: prevMondayDate, $lte: prevSundayDate } } },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        totalFare: { $sum: '$tripAmt' },
        onArrivalRate: {
          $sum: {
            $cond: {
              if: { $lte: ['$arrivalTime', '$pickUpTime'] },
              then: 0,
              else: { $divide: [{ $multiply: [1, { $divide: [100, { $sum: 1 }] }] }, { $sum: 1 }] },
            },
          },
        },
        cancellationRate: {
          $sum: {
            $cond: {
              if: { $eq: ['$tripStatus', 'cancelled'] },
              then: { $divide: [{ $multiply: [1, { $divide: [100, { $sum: 1 }] }] }, { $sum: 1 }] },
              else: 0,
            },
          },
        },
        extremelyLateArrivals: {
          $sum: {
            $cond: {
              if: { $lte: [{ $subtract: ['$arrivalTime', '$pickUpTime'] }, 900000] },
              then: 1,
              else: 0,
            },
          },
        },
        ridesCancelledLastMin: {
          $sum: {
            $cond: {
              if: { $and: [{ $eq: ['$tripStatus', 'cancelled'] }, { $lte: [{ $subtract: ['$pickUpTime', '$tripStatusAt'] }, 86400000] }] },
              then: 1,
              else: 0,
            },
          },
        },
      },
    },
  ]).then((tripData) => {
    if (tripData.length > 0) {
      console.log('Send Email');
      sendEmail(driverId, tripData[0], 'weeklyStatsDriver');
    } else {
      console.log('No weekly stats found');
    }
  });
}

const emailDriverWeekly = () => {
  User.findAsync({ userType: USER_TYPE_DRIVER, isApproved: true, verified: true }).then((driverData) => {
    if (driverData.length > 0) {
      driverData.forEach((element) => {
        getPreviousWeekTrips(element._id);
      });
    } else {
      console.log('No drivers found');
    }
  });
};

export default emailDriverWeekly;
