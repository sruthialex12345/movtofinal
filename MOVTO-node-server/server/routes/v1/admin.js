import express from 'express';
import validate from 'express-validation';
import adminUser from '../../controllers/v1/admin-user';
import paramValidation from '../../../config/param-validation';
import passport from 'passport';
import config from '../../../config/env';
import APIError from '../../helpers/APIError';
import httpStatus from 'http-status';

const router = express.Router();

router.use((req, res, next) => {
  // eslint-disable-next-line
  passport.authenticate('jwt', config.passportOptions, (error, userDtls, info) => {
    if (error) {
      const err = new APIError('token not matched', httpStatus.UNAUTHORIZED);
      return next(err);
    } else if (userDtls && userDtls.userType === 'admin') {
      req.user = userDtls;
      next();
    } else if (userDtls && userDtls.userType === 'superAdmin') {
      req.user = userDtls;
      next();
    }else {
      const err = new APIError(`token not matched and error msg ${info}`, httpStatus.UNAUTHORIZED);
      return next(err);
    }
  })(req, res, next);
});

// /api/admin/user
router
  .route('/user')
  .post(validate(paramValidation.createNewAdminUser), adminUser.createNewUser)

// /api/admin/drivers
router
  .route('/drivers')
  .get(adminUser.getAllDrivers)
  .put(validate(paramValidation.updateDriverByAdmin), adminUser.updateDriverDetails)
  .delete(validate(paramValidation.removeDriverByAdmin), adminUser.removeDriver);

  router
  .route('/uploadProfileImage')
  .post(adminUser.uploadImage);

router.route('/newaccesscode').post(validate(paramValidation.requestNewAccessCode),
  adminUser.requestNewAccessCode);

// /api/admin/drivers/route
router
  .route('/drivers/route')
  .get(adminUser.getDriverRoute)

  router
  .route('/drivers/onlineOffline')
  .put(validate(paramValidation.onlineOffline),adminUser.onlineOffline)

router.route('/getRouteById').get(adminUser.getRouteById);

/*****************************************
 * ***************************************
 * Super ADMin APi's
 * ***************************************
 *****************************************/
router.route('/viewDrivers').get(adminUser.viewDrivers);


 /*****************************************
 * ***************************************
 * START: MOBILE ADMIN API's
 * ***************************************
 *****************************************/

router
  .route('/trip/details/route')
  .get(adminUser.getSelectedTripRoute)

router
.route('/mobile/drivers')
.get(adminUser.getAllDriversMobile)

router
.route('/mobile/activetrips')
.get(adminUser.getAllActiveTrips)

router
.route('/mobile/rides')
.put(adminUser.getAllRidesMobile)

/*****************************************
* ***************************************
* END: MOBILE ADMIN API's
* ***************************************
*****************************************/

/*****************************************
 * START: Admin Routes API's
 *****************************************/
router
  .route('/routes')
  .get(adminUser.getAllRoutes)
  .put(validate(paramValidation.updateRoute),adminUser.updateRoute)
  .delete(validate(paramValidation.removeRoute),adminUser.removeRoute);

router
  .route('/routes/route')
  .get(validate(paramValidation.getRouteDetails),adminUser.getRouteDetails)

router
  .route('/routes/add')
  .put(validate(paramValidation.addRoute),adminUser.addRoute)

  router
  .route('/routes/getDistanceByOriginDestination')
  .get(adminUser.getDistanceByOriginDestination)

router
  .route('/route/terminals')
  .put(validate(paramValidation.updateTerminal),adminUser.updateTerminal)
  .delete(validate(paramValidation.removeTerminal),adminUser.removeTerminal);

router
  .route('/route/terminals/add')
  .put(validate(paramValidation.addTerminal),adminUser.addTerminal)

/*****************************************
 * END: Admin Routes API's
 *****************************************/

export default router;

