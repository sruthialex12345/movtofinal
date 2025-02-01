import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import config from '../../config/env';
import TripSchema from '../models/trip';
import TripRequestSchema from '../models/tripRequest';
import UserSchema from '../models/user';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER } from '../constants/user-types';

function tripDetails(req, res, next) {
  const limit = req.query.limit ? req.query.limit : config.limit;
  const pageNo = req.query.pageNo ? req.query.pageNo : 1;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  const filter = req.query.filter ? req.query.filter : config.tripFilter;
  TripSchema.getCount(filter)
    // eslint-disable-next-line consistent-return
    .then((totalTripRecords) => {
      const returnObj = {
        success: false,
        message: 'no of trips are zero',
        data: null,
        meta: {
          totalNoOfPages: Math.ceil(totalTripRecords / limit),
          limit,
          currPageNo: pageNo,
          totalRecords: totalTripRecords.length,
        },
      };
      if (totalTripRecords < 1) {
        returnObj.success = true;
        returnObj.data = [];
        returnObj.meta.totalNoOfPages = 0;
        returnObj.meta.limit = limit;
        returnObj.meta.currPageNo = 0;
        returnObj.meta.totalRecords = 0;
        return res.send(returnObj);
      }
      if (skip > totalTripRecords) {
        const err = new APIError('Request Page does not exists', httpStatus.NOT_FOUND);
        return next(err);
      }

      TripSchema.list({ skip, limit, filter })
        .then((tripData) => {
          if (tripData.length !== 0) {
            const trips = tripData.map(transformReturnObj);
            returnObj.success = true;
            returnObj.message = 'trip object retrieved';
            returnObj.data = trips;
          } else {
            returnObj.success = true;
            returnObj.message = 'no trip details available';
          }
          res.send(returnObj);
        })
        .error((e) => {
          const err = new APIError(`Error occured while retreiving trip object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(err);
        });
    })
    .error((e) => {
      const err = new APIError(`Error occured while counting trip object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

function getOngoingTripDetails(req, res, next) {
  addDriverRider()
    .then((returnObj) => {
      returnObj.success = true;
      returnObj.message = `no of trips are ${returnObj.data.length}`;
      returnObj.meta.totalRecords = `${returnObj.data.length}`;
      res.send(returnObj);
    })
    .catch((err) => {
      next(err);
    });
}

function addDriverRider() {
  return new Promise((resolve, reject) => {
    TripSchema.find({ tripStatus: 'onTrip' })
      .then((ongoingTripRecords) => {
        const returnObj = {
          success: true,
          message: 'no of trips are zero',
          data: null,
          meta: {
            totalRecords: ongoingTripRecords.length,
          },
        };
        returnObj.data = ongoingTripRecords;
        const r1 = JSON.parse(JSON.stringify(returnObj));
        addRider(r1)
          .then(responseObj => addDriver(responseObj))
          .then(responseObj => resolve(responseObj))
          .catch((err) => {
            reject(err);
          });
      })
      .catch((err) => {
        reject(err);
      }); // find catch
  });
}

function getSpecificUserTripDetails(req, res, next) {
  const { userId } = req.params;
  const returnObj = {
    success: false,
    message: 'user Id is not defined',
    data: null,
  };
  if (userId) {
    TripSchema.find({ $or: [{ driverId: userId }, { riderId: userId }] })
      .then((tripData) => {
        if (tripData) {
          returnObj.success = true;
          returnObj.message = 'user found and its corresponding trip details';
          returnObj.data = tripData;
          const r1 = JSON.parse(JSON.stringify(returnObj));
          addRider(r1)
            .then(responseObj => addDriver(responseObj))
            .then((responseObj) => {
              responseObj.success = true;
              responseObj.message = `no of trips are ${responseObj.data.length}`;
              res.send(responseObj);
            })
            .catch((err) => {
              next(err);
            });
        } else {
          returnObj.success = false;
          returnObj.message = 'user trip details not found with the given id';
          returnObj.data = null;
          res.send(returnObj);
        }
        // res.send(returnObj);
      })
      .catch((err) => {
        next(err);
      });
  } else {
    res.send(returnObj);
  }
}

function getRecentReviewedTripDetails(req, res, next) {
  TripSchema.find({ tripStatus: 'endTrip' })
    .then((recentReviewedTripRecords) => {
      const returnObj = {
        success: true,
        message: 'no of trips are zero',
        data: null,
        meta: {
          totalRecords: recentReviewedTripRecords.length,
        },
      };
      returnObj.data = recentReviewedTripRecords;
      const r1 = JSON.parse(JSON.stringify(returnObj));
      addRider(r1)
        .then(responseObj => addDriver(responseObj))
        .then((responseObj) => {
          responseObj.success = true;
          responseObj.message = `no of trips are ${responseObj.data.length}`;
          responseObj.meta.totalRecords = `${responseObj.data.length}`;
          res.send(responseObj);
        })
        .catch((err) => {
          next(err);
        });
    })
    .catch((err) => {
      next(err);
    });
}

function addRider(returnObj) {
  return new Promise((resolve, reject) => {
    Promise.all(returnObj.data.map((item, index) =>
      UserSchema.findOneAsync({ _id: item.riderId }).then((result) => {
        returnObj.data[index] = Object.assign({}, returnObj.data[index], { profileUrl: result.profileUrl, riderName: result.fname + result.lname });
        return Promise.resolve(returnObj.data[index]);
      })))
      .then((rider) => {
        if (rider) {
          console.log('rider created', rider); // eslint-disable-line no-console
        }
        return resolve(returnObj);
      })
      .catch((err) => {
        if (err) {
          console.log('error', err); // eslint-disable-line no-console
        }
        return reject(returnObj);
      });
  });
}

function addDriver(returnObj) {
  return new Promise((resolve, reject) => {
    Promise.all(returnObj.data.map((item, index) =>
      UserSchema.findOneAsync({ _id: item.driverId }).then((result) => {
        returnObj.data[index] = Object.assign({}, returnObj.data[index], { driverName: result.fname + result.lname });
        return Promise.resolve(returnObj.data[index]);
      })))
      .then((driver) => {
        if (driver) {
          console.log('driver created', driver); // eslint-disable-line no-console
        }
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

function createNewTrip(req, res, next) {
  const { riderId, driverId } = req.body;

  UserSchema.findAsync({ $or: [{ $and: [{ userType: USER_TYPE_RIDER }, { _id: riderId }] }, { $and: [{ userType: USER_TYPE_DRIVER }, { _id: driverId }] }] })
    // eslint-disable-next-line consistent-return
    .then((foundUserData) => {
      if (foundUserData.length !== 2) {
        const err = new APIError('rider or driver does not exist', httpStatus.BAD_REQUEST);
        return next(err);
      }

      if (foundUserData[0].currTripId !== null || foundUserData[1].currTripId !== null) {
        let errMsg = '';
        if (foundUserData[0].userType === USER_TYPE_RIDER && foundUserData[0].currTripId === null) {
          errMsg += 'Rider is On Trip';
        }
        if (foundUserData[1].userType === USER_TYPE_DRIVER && foundUserData[1].currTripId === null) {
          errMsg += 'Driver is On Trip';
        }
        const err = new APIError(errMsg, httpStatus.BAD_REQUEST);
        return next(err);
      }
      const tripObj = new TripSchema({
        riderId: req.body.riderId,
        driverId: req.body.driverId,
        srcLoc: req.body.srcLoc ? req.body.srcLoc : [1, 2],
        destLoc: req.body.destLoc ? req.body.destLoc : [3, 4],
        pickUpAddress: req.body.pickUpAddress,
        destAddress: req.body.destAddress,
      });
      tripObj
        .saveAsync()
        .then((newTripObj) => {
          const returnObj = {
            success: true,
            message: 'trip object created',
            data: newTripObj,
            meta: null,
          };
          const tripRequest = new TripRequestSchema({
            riderId: newTripObj.riderId,
            driverId: newTripObj.driverId,
            tripId: newTripObj._id, // eslint-disable-line no-underscore-dangle
            srcLoc: newTripObj.srcLoc,
            destLoc: newTripObj.destLoc,
            pickUpAddress: newTripObj.pickUpAddress,
            destAddress: newTripObj.destAddress,
            tripRequestStatus: 'completed',
            tripRequestIssue: 'noIssue',
          });
          tripRequest
            .saveAsync()
            .then(() => {
              UserSchema.updateAsync({ $or: [{ _id: newTripObj.riderId }, { _id: newTripObj.driverId }] }, { $set: { currTripId: newTripObj._id, currTripState: 'trip' } }, { multi: true }) // eslint-disable-line no-underscore-dangle
                .then(() => {
                  res.send(returnObj);
                })
                .error((e) => {
                  const err = new APIError(`Error occured while Updating User Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                  next(err);
                });
            })
            .error((e) => {
              const err = new APIError(`Error occured while Saving Trip Request Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            });
        })
        .error((e) => {
          const err = new APIError(`Error occured while saving trip object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(err);
        });
    })
    .error((e) => {
      const err = new APIError(`Error occured while finding rider or driver ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

function updateTrip(req, res, next) {
  const tripId = req.body._id; // eslint-disable-line no-underscore-dangle
  const tripObj = {
    riderId: req.body.riderId,
    driverId: req.body.driverId,
    srcLoc: req.body.srcLoc ? req.body.srcLoc : [1, 2],
    destLoc: req.body.destLoc ? req.body.destLoc : [2, 2],
    pickUpAddress: req.body.pickUpAddress ? req.body.pickUpAddress : 'new Dehli',
    destAddress: req.body.destAddress ? req.body.destAddress : 'mumbai',
    tripAmt: req.body.tripAmt ? req.body.tripAmt : 0,
    tripIssue: req.body.tripIssue ? req.body.tripIssue : 'noIssue',
    tripStatus: req.body.tripStatus ? req.body.tripStatus : 'OnTrip',
    tripEndTime: req.body.tripEndTime ? req.body.tripEndTime : null,
    paymentMode: req.body.paymentMode ? req.body.paymentMode : 'cash',
    taxiType: req.body.taxiType ? req.body.taxiType : 'taxiMini',
    riderRatingByDriver: req.body.riderRatingByDriver ? req.body.riderRatingByDriver : 0,
    driverRatingByRider: req.body.driverRatingByRider ? req.body.driverRatingByRider : 0,
    riderReviewByDriver: req.body.riderReviewByDriver ? req.body.riderReviewByDriver : null,
    driverReviewByRider: req.body.driverReviewByRider ? req.body.driverReviewByRider : null,
    seatBooked: req.body.seatBooked ? req.body.seatBooked : 1,
  };

  TripSchema.findOneAndUpdateAsync({ _id: tripId }, { $set: tripObj }, { new: 1, runValidators: true })
    // eslint-disable-next-line consistent-return
    .then((updatedTripObj) => {
      const returnObj = {
        success: false,
        message: 'unable to update trip object as trip id provided didnt match',
        data: null,
        meta: null,
      };
      if (updatedTripObj) {
        returnObj.success = true;
        returnObj.message = 'trip object updated';
        returnObj.data = updatedTripObj;
        if (updatedTripObj.tripStatus === 'endTrip') {
          UserSchema.updateAsync({ $or: [{ _id: updatedTripObj.riderId }, { _id: updatedTripObj.driverId }] }, { $set: { currTripId: null, currTripState: null } }, { new: true, multi: true })
            .then(() => res.send(returnObj)) // sending the updated tripObj in the fronted
            .error((e) => {
              const err = new APIError(`Error occured while updatating User Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              return next(err);
            });
        }
      } else {
        const err = new APIError('Trip Id did not matched', httpStatus.BAD_REQUEST);
        return next(err);
      }
      // res.send(returnObj);
    })
    .error((e) => {
      const err = new APIError(`Error occured while updatating trip object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

function loadTripDetails(req, res, next) {
  const { tripId } = req.params;
  TripSchema.get(tripId)
    .then((tripData) => {
      const returnObj = {
        success: true,
        message: 'trip object found',
        data: transformReturnObj(tripData),
      };
      res.send(returnObj);
    })
    .error(e => next(e));
}

function tripRevenueGraph(req, res, next) {
  let lastYearDate = new Date().toISOString();
  lastYearDate.setDate(1);
  lastYearDate.setMonth(lastYearDate.getMonth() - 11);
  lastYearDate = new Date(lastYearDate);
  const returnObj = {
    success: false,
    message: 'no of trips avaliable',
    data: [],
    lastYearDate,
  };
  TripSchema.aggregateAsync([
    { $match: { bookingTime: { $gt: lastYearDate } } },
    {
      $project: {
        year: { $year: '$bookingTime' },
        month: { $month: '$bookingTime' },
        tripAmt: '$tripAmt',
        tripStatus: '$tripStatus',
      },
    },
    { $match: { tripStatus: 'endTrip' } },
    {
      $group: {
        _id: 'RevenueGraph',
        1: { $sum: { $cond: [{ $eq: ['$month', 1] }, '$tripAmt', 0] } },
        2: { $sum: { $cond: [{ $eq: ['$month', 2] }, '$tripAmt', 0] } },
        3: { $sum: { $cond: [{ $eq: ['$month', 3] }, '$tripAmt', 0] } },
        4: { $sum: { $cond: [{ $eq: ['$month', 4] }, '$tripAmt', 0] } },
        5: { $sum: { $cond: [{ $eq: ['$month', 5] }, '$tripAmt', 0] } },
        6: { $sum: { $cond: [{ $eq: ['$month', 6] }, '$tripAmt', 0] } },
        7: { $sum: { $cond: [{ $eq: ['$month', 7] }, '$tripAmt', 0] } },
        8: { $sum: { $cond: [{ $eq: ['$month', 8] }, '$tripAmt', 0] } },
        9: { $sum: { $cond: [{ $eq: ['$month', 9] }, '$tripAmt', 0] } },
        10: { $sum: { $cond: [{ $eq: ['$month', 10] }, '$tripAmt', 0] } },
        11: { $sum: { $cond: [{ $eq: ['$month', 11] }, '$tripAmt', 0] } },
        12: { $sum: { $cond: [{ $eq: ['$month', 12] }, '$tripAmt', 0] } },
      },
    },
  ])
    .then((revenueGraphDocs) => {
      returnObj.success = true;
      returnObj.message = 'revenue graph for the trip';
      returnObj.data = revenueGraphDocs;
      res.send(returnObj);
    })
    .error((e) => {
      const err = new APIError(`Error occured while computing revenue graph ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

function transformReturnObj(tripData) {
  if (tripData instanceof Object) {
    tripData = tripData.toObject();
    if (tripData.riderId) {
      tripData.rider = tripData.riderId;
      tripData.riderId = tripData.rider._id ? tripData.rider._id : null; // eslint-disable-line no-underscore-dangle
    }
    if (tripData.driverId) {
      tripData.driver = tripData.driverId;
      tripData.driverId = tripData.driver._id ? tripData.driver._id : null; // eslint-disable-line no-underscore-dangle
    }
  }
  return tripData;
}

export default {
  tripDetails,
  getOngoingTripDetails,
  getRecentReviewedTripDetails,
  createNewTrip,
  updateTrip,
  loadTripDetails,
  tripRevenueGraph,
  getSpecificUserTripDetails,
};
