'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _expressValidation = require('express-validation');

var _expressValidation2 = _interopRequireDefault(_expressValidation);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _env = require('../../config/env');

var _env2 = _interopRequireDefault(_env);

var _paramValidation = require('../../config/param-validation');

var _paramValidation2 = _interopRequireDefault(_paramValidation);

var _authorization = require('../controllers/authorization');

var _authorization2 = _interopRequireDefault(_authorization);

var _user = require('../controllers/user');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

/** POST /api/users/register - create new user and return corresponding user object and token */
router.route('/register').post((0, _expressValidation2.default)(_paramValidation2.default.createUser), _user.createUser);
router.route('/registeradmin').post((0, _expressValidation2.default)(_paramValidation2.default.createUserAdmin), _user.createUser);
router.route('/signUpProvider').post((0, _expressValidation2.default)(_paramValidation2.default.createUserAdmin), _user.signUpProvider);

// Post location data for particular user

/** PUT /api/users/upload - Update user pic */
// router.route('/uploadProfileImage').post(uploadProfileImage);

router.route('/location')

/** POST /api/users/location */
.post(_user.createRiderLocation)

/** GET /api/users/location */
.get(_user.getRiderLocations)

/** DELETE /api/users/location */
.delete(_user.removeRiderLocation);

// location based shuttles pickup and dropoff points

/**api/users/location/fromterminals */
router.route('/location/fromterminals')

/** GET /api/users/fromterminals */
.get((0, _expressValidation2.default)(_paramValidation2.default.fromTerminalsValidate), _user.nearByPickupPoints);
/**api/users/location/toterminals */
router.route('/location/toterminals')

/** GET /api/users/location/toterminals */
.get((0, _expressValidation2.default)(_paramValidation2.default.toTerminalsValidate), _user.nearByDropOffPoints);

// Post- resend otp to the user
/** Post /api/users/resendOtp */

router.route('/resendOtp').post(_user.resendMobileVerificationCode);

// Post- edit phone no of user


// .get(userCtrl.list)

router.route('/admins')

/** GET /api/users/admins */
.get(_user.riderAdminList);

/**
 * Middleware for protected routes. All protected routes need token in the header in the form Authorization: JWT token
 */
router.use(function (req, res, next) {
  // eslint-disable-next-line
  _passport2.default.authenticate('jwt', _env2.default.passportOptions, function (error, userDtls, info) {
    if (error) {
      var err = new _APIError2.default('token not matched', _httpStatus2.default.INTERNAL_SERVER_ERROR);
      return next(err);
    } else if (userDtls) {
      req.user = userDtls;
      next();
    } else {
      var _err = new _APIError2.default('token not matched ' + info, _httpStatus2.default.UNAUTHORIZED);
      return next(_err);
    }
  })(req, res, next);
});

router.route('/mobile-phone').put((0, _expressValidation2.default)(_paramValidation2.default.updatePhoneNo), _user.updateMobileNumber);

router.route('/resetpassword')
/** GET /api/users - Get user */
.post(_user.resetPassword);

router.route('/')
/** GET /api/users - Get user */
.get(_user.getUser)

/** PUT /api/users - Update user */
.put(_user.updateUser);

/** PUT /api/users/name - Update user name */
router.route('/name').put(_user.updateUserName)

/** DELETE /api/users - Delete user */
.delete(_user.removeUser);

/** Load user when API with userId route parameter is hit */
router.param('userId', _user.loadUser);

router.route('/upload')
/** PUT /api/users/upload - Update user pic */
.put(_user.uploadUserImage);

router.route('/upload/local')
// .use(upload.single('avtar'))
/** PUT /api/users/upload - Update user pic */
.put(_user.uploadBaseImageHandler);

router.route('/currentTripRequest').get(_user.getCurrentTripOrRequest);

router.route('/ridernotificationrequests').get(_user.getRiderNotificationRequests);

/********************************************************************************
 * start: /api/users/drivers driver authorized routes with access code validation
 ********************************************************************************/
/**GET /api/users/drivers/rides/terminal/complete */
router.route('/drivers/rides/terminal/complete').get(_user.ridesCompletingAtTerminal);

/**GET /api/users/drivers/shuttles */
router.route('/drivers/shuttles').get(_authorization2.default.driverAccessCode, _user.driverShuttleList);

/**PUT /api/users/drivers/shuttles */
router.route('/drivers/updateShuttleStatus').put(_authorization2.default.driverAccessCode, _user.updateShuttleStatus);

router.route('/drivers/terminalRideRequests').get(_authorization2.default.driverAccessCode, (0, _expressValidation2.default)(_paramValidation2.default.tripRequests), _user.tripRideRequests);

router.route('/rideHistory').get(_user.rideHistory);
router.route('/drivers/driverHistory').get(_user.driverHistory);

router.route('/drivers/driverRoutes').get(_authorization2.default.driverAccessCode, _user.driverRoutes);
/** end: /api/users/drivers driver authorized routes with access code validation */
// router.route('/getCountryCode').get(getCountryCode);
router.route('/addReview').post((0, _expressValidation2.default)(_paramValidation2.default.addReview), _user.addReview).post(_user.listReview);
// .put(validate(paramValidation.updateTripObject), adminTrip.updateReview);

// /api/user/Reservation Code routes
router.route('/validateReservationCode').post(_user.validateReservationCode);

router.route('/vehiclechange').post(_user.driverChangeVehicle);

exports.default = router;
module.exports = exports.default;
//# sourceMappingURL=user.js.map
