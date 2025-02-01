import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import config from '../../config/env';
import TripRequestSchema from '../models/tripRequest';
import { transformReturnObj } from '../service/transform-return-object';
import UserSchema from '../models/user';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER } from '../constants/user-types';

const debug = require('debug')('MGD-API: admin-trip-user');

function userTripDetails(req, res, next) {
  const { userId } = req.params;
  debug(`user id ${userId}`);
  debug(`limit value ${req.query.limit}`);
  const limit = req.query.limit ? req.query.limit : config.limit;
  const pageNo = req.query.pageNo ? req.query.pageNo : 1;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  UserSchema.findByIdAsync(userId)
    // eslint-disable-next-line consistent-return
    .then((userObject) => {
      const returnObj = {
        success: false,
        message: 'user not found with the given id',
        data: [],
        meta: {
          totalNoOfPages: null,
          limit,
          currPageNo: pageNo,
          totalRecords: null,
        },
      };
      if (userObject === null || userObject === undefined) {
        return res.send(returnObj);
      }
      const { userType } = userObject;
      TripRequestSchema.getUserCount(userType, userId)
        // eslint-disable-next-line consistent-return
        .then((totalUserTripRequestRecords) => {
          returnObj.meta.totalNoOfPages = Math.ceil(totalUserTripRequestRecords / limit);
          returnObj.meta.totalRecords = totalUserTripRequestRecords;

          if (totalUserTripRequestRecords < 1) {
            returnObj.success = true;
            returnObj.message = 'user has zero trip Request records';
            return res.send(returnObj);
          }
          if (skip > totalUserTripRequestRecords) {
            const err = new APIError('Request Page No does not exists', httpStatus.NOT_FOUND);
            return next(err);
          }

          TripRequestSchema.userList({
            skip,
            limit,
            userId,
            userType,
          })
            .then((userTripRequestData) => {
              const users = userTripRequestData.map(transformReturnObj);
              returnObj.success = true;
              returnObj.message = 'user trip request records';
              returnObj.data = users;
              res.send(returnObj);
            })
            .error((e) => {
              const err = new APIError(`Error occured while fetching user trip Request records ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            });
        })
        .error((e) => {
          const err = new APIError(`Error occured counting user trip request records ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(err);
        });
    })
    .error((e) => {
      const err = new APIError(`Error occured searching for user object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}

function userTripRequestStatics(req, res, next) {
  const { userId } = req.params;
  debug(`user id ${userId}`);
  debug(`limit value ${req.query.limit}`);
  const limit = req.query.limit ? req.query.limit : config.limit;
  const { pageNo } = req.query;
  UserSchema.findByIdAsync(userId)
    // eslint-disable-next-line consistent-return
    .then((userObject) => {
      const returnObj = {
        success: false,
        message: 'user not found with the given id',
        data: null,
        meta: {
          totalNoOfPages: null,
          limit,
          currPageNo: pageNo,
          totalRecords: null,
        },
      };
      if (userObject === null || userObject === undefined) {
        return res.send(returnObj);
      }
      const { userType } = userObject;
      let searchObj = {};
      let groupBy = null;
      if (userType === USER_TYPE_RIDER) {
        searchObj = {};
        groupBy = 'riderId';
        searchObj.riderId = userObject._id; // eslint-disable-line no-underscore-dangle
      }
      if (userType === USER_TYPE_DRIVER) {
        groupBy = 'driverId';
        searchObj = {};
        searchObj.driverId = userObject._id; // eslint-disable-line no-underscore-dangle
      }
      TripRequestSchema.aggregateAsync([
        { $match: searchObj },
        {
          $group: {
            _id: `$${groupBy}`,
            completed: { $sum: { $cond: [{ $eq: ['$tripRequestStatus', 'completed'] }, 1, 0] } },
            inQueue: {
              $sum: {
                $cond: [
                  {
                    $anyElementTrue: {
                      $map: {
                        input: ['enRoute', 'arriving', 'arrived', 'request'],
                        as: 'status',
                        in: { $eq: ['$$status', '$tripRequestStatus'] },
                      },
                    },
                  },
                  1,
                  0,
                ],
              },
            },
            cancelled: { $sum: { $cond: [{ $or: [{ $eq: ['$tripRequestStatus', 'cancelled'] }, { $eq: ['$tripRequestStatus', 'rejected'] }] }, 1, 0] } },
            totalRequest: { $sum: 1 },
          },
        },
      ])
        .then((chartStats) => {
          returnObj.success = true;
          returnObj.message = 'user trip request statistic';
          returnObj.data = chartStats;
          res.send(returnObj);
        })
        .error((e) => {
          const err = new APIError(`Error occured while grouping the _id ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          next(err);
        });
    })
    .error((e) => {
      const err = new APIError(`Error occured searching for user object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
}
export default { userTripDetails, userTripRequestStatics };
