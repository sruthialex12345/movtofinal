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

var _APIError = require('../../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _env = require('../../../config/env');

var _env2 = _interopRequireDefault(_env);

var _authorization = require('../../controllers/authorization');

var _authorization2 = _interopRequireDefault(_authorization);

var _user = require('../../controllers/v1/user');

var _paramValidation = require('../../../config/param-validation');

var _paramValidation2 = _interopRequireDefault(_paramValidation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

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

router.route('/admins')

/** GET /api/users/admins */
.get(_user.riderAdminList);

/**PUT /api/users/drivers/shuttles */
router.route('/drivers/updateShuttleStatus').put(_authorization2.default.driverAccessCode, _user.updateShuttleStatus);

// location based shuttles pickup and dropoff points

/**api/users/location/fromterminals */
router.route('/location/fromterminals')

/** GET /api/users/fromterminals */
.get((0, _expressValidation2.default)(_paramValidation2.default.fromTerminalsValidate), _user.nearByPickupPoints);
/**api/users/location/toterminals */
router.route('/location/toterminals')

/** GET /api/users/location/toterminals */
.get((0, _expressValidation2.default)(_paramValidation2.default.toTerminalsValidate), _user.nearByDropOffPoints);

router.route('/drivers/driverRoutes').get(_authorization2.default.driverAccessCode, _user.driverRoutes);

router.route('/drivers/driverHistory').get(_user.driverHistory);

router.route('/drivers/rides/terminal/complete').get(_user.ridesCompletingAtTerminal);

router.route('/currentTripRequest').get(_user.getCurrentTripOrRequest);

router.route('/ridernotificationrequests').get(_user.getRiderNotificationRequests);

// Driver Current Trip pickup and dropoff points
// @PARAMS Required  : tripId

/**api/users/location/driverCurrentFromTerminals */
router.route('/location/driverCurrentFromTerminals').get(_user.driverCurrentFromTerminals);

/**api/users/location/driverCurrentToTerminals */
router.route('/location/driverCurrentToTerminals').get(_user.driverCurrentToTerminals);

/**api/users/location/driverCurrentToTerminals */
router.route('/location/driverAddRider').post(_user.driverAddRider);

/**api/users/location/driverCurrentToTerminals */
router.route('/location/driverAddDynamicRider').post(_user.driverAddDynamicRider);

exports.default = router;
module.exports = exports.default;
//# sourceMappingURL=user.js.map
