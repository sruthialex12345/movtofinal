import express from 'express';
import httpStatus from 'http-status';
import passport from 'passport';

import APIError from '../../helpers/APIError';
import config from '../../../config/env';
import Authorization from '../../controllers/authorization';
import {updateShuttleStatus, regenerateAccessCode} from '../../controllers/v3/user';

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
      const err = new APIError(`token not matched ${info}`, httpStatus.UNAUTHORIZED);
      return next(err);
    }
  })(req, res, next);
});

// patch updates
router.route('/accesscode').patch(regenerateAccessCode);

/**PUT /api/users/drivers/shuttles */
router.route('/drivers/updateShuttleStatus')
.put(Authorization.driverAccessCode, updateShuttleStatus);
export default router;
