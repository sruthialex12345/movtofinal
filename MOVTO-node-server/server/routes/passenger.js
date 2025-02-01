import express from 'express';
import httpStatus from 'http-status';
import passport from 'passport';

import APIError from '../helpers/APIError';
import config from '../../config/env';
import { addPassenger, updatePassenger, removePassenger, uploadImage, addPassengerTrip } from '../controllers/passenger';

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

router
  .route('/')

  /** POST /api/passenger */
  .post(addPassenger)

  /** PUT /api/passenger */
  .put(updatePassenger)

  /** DELETE /api/passenger */
  .delete(removePassenger);

router.route('/addPassengerTrip').post(addPassengerTrip);

router
  .route('/:passengerId/image')

  /** PUT /api/passenger/5/image - Update user pic */
  .put(uploadImage);

export default router;
