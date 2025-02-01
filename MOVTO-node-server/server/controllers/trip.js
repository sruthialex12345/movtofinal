import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import { fetchReturnObj } from '../service/transform-response';
import TripSchema from '../models/trip';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER } from '../constants/user-types';
import { sendSms } from '../service/smsApi';
import User from '../models/user';

const moment = require('moment');

/**
 * Return the trip details of the user.
 * @param req
 * @param res
 * @param next
 * @returns { trip: historyObjArray[{ tripObj }]  }
 */

export const getHistory = (req, res, next) => {
  const historyObjArray = [];
  const userID = req.user._id; //eslint-disable-line
  const { userType } = req.user;
  const searchObj = {};
  if (userType === USER_TYPE_RIDER) {
    searchObj.riderId = userID;
  } else if (userType === USER_TYPE_DRIVER) {
    searchObj.driverId = userID;
  }

  // eslint-disable-next-line
  TripSchema.find({ $and: [searchObj, { tripStatus: 'endTrip' }] }, null, { sort: { bookingTime: -1 } }, (tripErr, tripObj) => {
    //eslint-disable-line
    if (tripErr) {
      const err = new APIError(`error while finding trip history for the user  ${tripErr}`, httpStatus.INTERNAL_SERVER_ERROR);
      return next(err);
    }
    if (tripObj.length !== 0) {
      tripObj.forEach((obj, index) => {
        fetchReturnObj(obj).then((transformedReturnObj) => {
          historyObjArray.push(transformedReturnObj);
          if (index === tripObj.length - 1) {
            const returnObj = {
              success: true,
              message: 'user trip history',
              data: historyObjArray,
            };
            res.send(returnObj);
          }
        });
      });
    } else {
      const returnObj = {
        success: true,
        message: 'no history available',
        data: [],
      };
      res.send(returnObj);
    }
  });
};

export const acceptARide = (req, res /* , next */) => {
  const { tripId } = req.body;
  TripSchema.findOneAsync({ _id: tripId })
    .then((tripData) => {
      if (tripData) {
        tripData.tripStatus = 'claimed';
        tripData.saveAsync().then((newTripData) => {
          if (newTripData) {
            res.send({ status: true, message: 'ride is successfully accepted' });
            NotifyRiderSms(newTripData);
          } else {
            res.send({ status: false, message: 'server error while accepting ride' });
          }
        });
      } else {
        res.send({ status: false, message: 'No trip data found.' });
      }
    })
    .catch(() => {
      res.send({ status: false, message: 'server error while accepting ride' });
    });
};

function NotifyRiderSms(tripObj) {
  User.findOneAsync({ _id: tripObj.riderId })
    .then(userObj => {
      if (userObj) {
        let pickupDate = moment(tripObj.pickUpTime).format('MMMM Do YYYY, h:mm:ss a');
        let passengerName = "";
        let smsText = "";
        if (tripObj.passengerIds.length > 0) {
          tripObj.passengerIds.forEach(item => {
            userObj.passengerList.forEach(element => {
              if (item == element._id) {
                if (tripObj.passengerIds.length == 1) {
                  passengerName = element.fname;
                } else if (tripObj.passengerIds.length == 2) {
                  if (index == 1) {
                    passengerName = passengerName + " and " + element.fname;
                  }
                  else {
                    passengerName = element.fname;
                  }
                }
                else {
                  if (index == (tripObj.passengerIds.length - 1)) {
                    passengerName = passengerName.slice(0, -2);
                    passengerName = passengerName + " and " + element.fname;
                  }
                  else {
                    passengerName = passengerName + element.fname + ", ";
                  }
                }
              }
            })
          })
          smsText = `Your Merry Go Drive driver is now confirmed for your upcoming ride on ${pickupDate} with ${passengerName}. Check the app for details.`
        }
        else {
          smsText = `Your Merry Go Drive driver is now confirmed for your upcoming ride on ${pickupDate}. Check the app for details.`
        }
        sendSms(tripObj.riderId, smsText, function (err, data) {
          if (err) {
            console.log(`server error while sending sms to rider ${err}`);
          }
          else {
            console.log("Sms is successfully sent to rider");
          }
        })
      }
      else {
        console.log("No user found");
      }
    })
}

// an endpoint to retrieve the driver's claimed rides.
export const getClaimedRides = (req, res, next) => {
  const { driverId } = req.body;
  const currentDate = new Date().toISOString();
  const sevenDaysDate = new Date(moment(currentDate).add(7, 'days'));
  TripSchema.findAsync({ driverId, tripStatus: 'claimed', bookingTime: { $gt: currentDate, $lt: sevenDaysDate } }, {}, { sort: { pickUpTime: 1 } })
    .then((tripData) => {
      if (tripData) {
        if (tripData.length > 0) {
          const returnObj = {
            success: true,
            message: 'Successfully fetched claimed rides',
            data: tripData,
          };
          res.send(returnObj);
        } else {
          const returnObj = {
            success: true,
            message: 'No claimed rides',
            data: [],
          };
          res.send(returnObj);
        }
      }
    })
    .catch((tripErr) => {
      const err = new APIError(`error while finding claimed rides of driver  ${tripErr}`, httpStatus.INTERNAL_SERVER_ERROR);
      return next(err);
    });
};
