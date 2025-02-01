import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import { fetchReturnObj } from '../service/transform-response';
import TripSchema from '../models/trip';
import TripRequestSchema from '../models/tripRequest';

/**
 * Return the trip details of the user.
 * @param req
 * @param res
 * @param next
 * @returns { trip: historyObjArray[{ tripObj }]  }
 */

function getSyncData(req, res, next) {
  // const userID = req.user._id;
  const { currTripId, currTripState } = req.user;
  const returnObj = {
    success: true,
    message: 'user is not in any trip or tripRequest',
    data: {
      tripRequest: null,
      trip: null,
    },
  };
  if (currTripId === null || currTripId === undefined || currTripState === null || currTripState === undefined) {
    res.send(returnObj);
  }
  if (currTripState === 'tripRequest') {
    TripRequestSchema.findOneAsync({ $and: [{ _id: currTripId }, { $or: [{ tripRequestStatus: 'enRoute' }, { tripRequestStatus: 'arriving' }, { tripRequestStatus: 'arrived' }] }] })
      .then((tripRequestObj) => {
        if (tripRequestObj) {
          fetchReturnObj(tripRequestObj)
            .then((transformedTripRequestObj) => {
              returnObj.message = 'user is in tripRequest state';
              returnObj.data.tripRequest = transformedTripRequestObj;
              res.send(returnObj);
            })
            .error((e) => {
              const err = new APIError(`error occurred when transforming tripRequestObj ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              return next(err);
            });
        } else {
          returnObj.message = 'no trip request object found for the current tripRequest state for the corresponding user';
          res.send(returnObj);
        }
      })
      .error((e) => {
        const err = new APIError(`error occurred when feteching user data from tripRequest schema ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        return next(err);
      });
  }
  if (currTripState === 'trip') {
    TripSchema.findOneAsync({ $and: [{ _id: currTripId }, { tripStatus: 'onTrip' }] })
      .then((tripObj) => {
        if (tripObj) {
          fetchReturnObj(tripObj)
            .then((transformedTripObj) => {
              returnObj.message = 'user is in trip state';
              returnObj.data.trip = transformedTripObj;
              returnObj.data.tripRequest = null;
              res.send(returnObj);
            })
            .error((e) => {
              const err = new APIError(`error occurred when feteching user data from trip schema ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              return next(err);
            });
        } else {
          returnObj.message = 'no trip object found for the current trip state for the corresponding user';
          res.send(returnObj);
        }
      })
      .error((e) => {
        const err = new APIError(`error occurred when feteching user data from trip schema ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        return next(err);
      });
  }
}

export default { getSyncData };
