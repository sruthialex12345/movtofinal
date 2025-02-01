import express from 'express';
import httpStatus from 'http-status';
import passport from 'passport';
import APIError from '../helpers/APIError';
import config from '../../config/env';
import { getHistory, acceptARide, getClaimedRides } from '../controllers/trip';

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
router.route('/history').get(getHistory);

router.route('/acceptARide').post(acceptARide);

router.route('/getClaimedRides').post(getClaimedRides);

export default router;
