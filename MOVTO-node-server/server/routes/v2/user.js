import express from 'express';
import validate from 'express-validation';
import httpStatus from 'http-status';
import passport from 'passport';

import APIError from '../../helpers/APIError';
import config from '../../../config/env';
import Authorization from '../../controllers/authorization';
import {
  riderAdminList, updateShuttleStatus,nearByPickupPoints, nearByDropOffPoints, driverRoutes,getCurrentTripOrRequest,driverHistory,ridesCompletingAtTerminal,getRiderNotificationRequests,driverCurrentFromTerminals,driverCurrentToTerminals,driverAddRider
} from '../../controllers/v2/user';
import paramValidation from '../../../config/param-validation';

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

router
  .route('/admins')

  /** GET /api/users/admins */
  .get(riderAdminList)

/**PUT /api/users/drivers/shuttles */
router.route('/drivers/updateShuttleStatus')
.put(Authorization.driverAccessCode, updateShuttleStatus);


// location based shuttles pickup and dropoff points

  /**api/users/location/fromterminals */
  router
  .route('/location/fromterminals')

  /** GET /api/users/fromterminals */
  .get(validate(paramValidation.fromTerminalsValidate),nearByPickupPoints)
  /**api/users/location/toterminals */
router
  .route('/location/toterminals')

  /** GET /api/users/location/toterminals */
  .get(validate(paramValidation.toTerminalsValidate),nearByDropOffPoints)

router.route('/drivers/driverRoutes')
.get(Authorization.driverAccessCode, driverRoutes);

router.route('/drivers/driverHistory')
.get(driverHistory)

router.route('/drivers/rides/terminal/complete')
  .get(ridesCompletingAtTerminal);

router
  .route('/currentTripRequest')
  .get(getCurrentTripOrRequest)

  router
  .route('/ridernotificationrequests')
  .get(getRiderNotificationRequests)


  // Driver Current Trip pickup and dropoff points
  // @PARAMS Required  : tripId

  /**api/users/location/driverCurrentFromTerminals */
  router
  .route('/location/driverCurrentFromTerminals')
  .get(driverCurrentFromTerminals)

  /**api/users/location/driverCurrentToTerminals */
  router
  .route('/location/driverCurrentToTerminals')
  .get(driverCurrentToTerminals)

   /**api/users/location/driverCurrentToTerminals */
   router
   .route('/location/driverAddRider')
   .post(driverAddRider)

export default router;
