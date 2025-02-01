import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER } from '../constants/user-types';

/** check if driver has access code verified */

function driverAccessCode(req, res, next) {
  if(req.user.accessCodeVerified) {
    next();
  } else {
    const err = new APIError('Access Denied', httpStatus.UNAUTHORIZED, true);
    return next(err);
  }
}

function isDriver(req, res, next) {  
  if(req.user.userType === USER_TYPE_DRIVER ) {
    next();
  } else {
    const err = new APIError('Access Denied', httpStatus.UNAUTHORIZED, true);
    return next(err);
  }
}

export default {
  driverAccessCode,
  isDriver
};
