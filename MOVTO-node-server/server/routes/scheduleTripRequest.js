import express from 'express';
import httpStatus from 'http-status';
import passport from 'passport';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import APIError from '../helpers/APIError';
import config from '../../config/env';
import {
  getScheduledTripRequests,
  saveScheduleTripRequest ,
  updateCancelRide,
  adminDriversList,
  assignDriver, acceptRequest, rejectRequest
} from '../controllers/schedule-trip-request';

const router = express.Router();

/**
 * Middleware for protected routes. All protected routes need token in the header in the form Authorization: JWT token
 */
router.use((req, res, next) => {
  // eslint-disable-next-line
  passport.authenticate('jwt', config.passportOptions, (error, userDtls, info) => {
    if (error) {
      const err = new APIError('token not matched', httpStatus.INTERNAL_SERVER_ERROR);
      return next(err);
    } else if (userDtls) {
      req.user = userDtls;
      next();
    } else {
      const err = new APIError(`token is valid but no user found ${info}`, httpStatus.UNAUTHORIZED);
      return next(err);
    }
  })(req, res, next);
});

/** GET /api/trips/history - Returns trip history details for the user */
router.route('/').get(getScheduledTripRequests);
router.route('/admin/drivers').get(adminDriversList);

router.route('/').post(saveScheduleTripRequest);

router.route('/cancel').put(validate(paramValidation.cancelScheduleRequest), updateCancelRide);
router.route('/assignDriver').put(validate(paramValidation.assignDriver), assignDriver);
router.route('/reject').put(rejectRequest);
router.route('/accept').put(acceptRequest);

export default router;
