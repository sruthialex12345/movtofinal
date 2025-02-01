import express from 'express';
import validate from 'express-validation';
import httpStatus from 'http-status';
import passport from 'passport';

import APIError from '../helpers/APIError';
import config from '../../config/env';
import paramValidation from '../../config/param-validation';
import Authorization from '../controllers/authorization';
import {
  loadUser, createUser,signUpProvider, getUser, updateUser, updateUserName, removeUser, uploadUserImage, getRiderNotificationRequests,
  getRiderLocations, createRiderLocation, removeRiderLocation,getCurrentTripOrRequest,
  resendMobileVerificationCode, updateMobileNumber, uploadImageHandler, resetPassword,
  uploadBaseImageHandler, driverShuttleList, nearByPickupPoints, nearByDropOffPoints, riderAdminList,updateShuttleStatus,
  addReview,listReview, tripRideRequests,rideHistory,driverHistory,driverRoutes, ridesCompletingAtTerminal,uploadProfileImage,validateReservationCode
  , driverChangeVehicle
} from '../controllers/user';



const router = express.Router();

/** POST /api/users/register - create new user and return corresponding user object and token */
router.route('/register').post(validate(paramValidation.createUser), createUser);
router.route('/registeradmin').post(validate(paramValidation.createUserAdmin), createUser);
router.route('/signUpProvider').post(validate(paramValidation.createUserAdmin), signUpProvider);

// Post location data for particular user

  /** PUT /api/users/upload - Update user pic */
// router.route('/uploadProfileImage').post(uploadProfileImage);

router
  .route('/location')

  /** POST /api/users/location */
  .post(createRiderLocation)

  /** GET /api/users/location */
  .get(getRiderLocations)

  /** DELETE /api/users/location */
  .delete(removeRiderLocation);

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

// Post- resend otp to the user
/** Post /api/users/resendOtp */

router.route('/resendOtp').post(resendMobileVerificationCode);

// Post- edit phone no of user


// .get(userCtrl.list)

router
  .route('/admins')

  /** GET /api/users/admins */
  .get(riderAdminList)

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

router.route('/mobile-phone').put(validate(paramValidation.updatePhoneNo),updateMobileNumber);

router
  .route('/resetpassword')
  /** GET /api/users - Get user */
  .post(resetPassword)



router
  .route('/')
  /** GET /api/users - Get user */
  .get(getUser)

  /** PUT /api/users - Update user */
  .put(updateUser)

  /** PUT /api/users/name - Update user name */
  router
  .route('/name').put(updateUserName)

  /** DELETE /api/users - Delete user */
  .delete(removeUser);

/** Load user when API with userId route parameter is hit */
router.param('userId', loadUser);

router
  .route('/upload')
  /** PUT /api/users/upload - Update user pic */
  .put(uploadUserImage);

router
  .route('/upload/local')
  // .use(upload.single('avtar'))
  /** PUT /api/users/upload - Update user pic */
  .put(uploadBaseImageHandler);

router
  .route('/currentTripRequest')
  .get(getCurrentTripOrRequest)

router
  .route('/ridernotificationrequests')
  .get(getRiderNotificationRequests)

  /********************************************************************************
   * start: /api/users/drivers driver authorized routes with access code validation
   ********************************************************************************/
  /**GET /api/users/drivers/rides/terminal/complete */
  router.route('/drivers/rides/terminal/complete')
  .get(ridesCompletingAtTerminal);

/**GET /api/users/drivers/shuttles */
router.route('/drivers/shuttles')
.get(Authorization.driverAccessCode, driverShuttleList);

/**PUT /api/users/drivers/shuttles */
router.route('/drivers/updateShuttleStatus')
.put(Authorization.driverAccessCode, updateShuttleStatus);

router.route('/drivers/terminalRideRequests')
.get(Authorization.driverAccessCode, validate(paramValidation.tripRequests), tripRideRequests)

router.route('/rideHistory').get(rideHistory)
router.route('/drivers/driverHistory')
.get(driverHistory)

router.route('/drivers/driverRoutes')
.get(Authorization.driverAccessCode, driverRoutes);
/** end: /api/users/drivers driver authorized routes with access code validation */
// router.route('/getCountryCode').get(getCountryCode);
router
  .route('/addReview')
  .post(validate(paramValidation.addReview), addReview)
  .post(listReview)
  // .put(validate(paramValidation.updateTripObject), adminTrip.updateReview);

  // /api/user/Reservation Code routes
router.route('/validateReservationCode').post(validateReservationCode);

router.route('/vehiclechange').post(driverChangeVehicle);

export default router;
