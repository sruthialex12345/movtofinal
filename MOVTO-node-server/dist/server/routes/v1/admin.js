'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _expressValidation = require('express-validation');

var _expressValidation2 = _interopRequireDefault(_expressValidation);

var _adminUser = require('../../controllers/v1/admin-user');

var _adminUser2 = _interopRequireDefault(_adminUser);

var _paramValidation = require('../../../config/param-validation');

var _paramValidation2 = _interopRequireDefault(_paramValidation);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _env = require('../../../config/env');

var _env2 = _interopRequireDefault(_env);

var _APIError = require('../../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.use(function (req, res, next) {
  // eslint-disable-next-line
  _passport2.default.authenticate('jwt', _env2.default.passportOptions, function (error, userDtls, info) {
    if (error) {
      var err = new _APIError2.default('token not matched', _httpStatus2.default.UNAUTHORIZED);
      return next(err);
    } else if (userDtls && userDtls.userType === 'admin') {
      req.user = userDtls;
      next();
    } else if (userDtls && userDtls.userType === 'superAdmin') {
      req.user = userDtls;
      next();
    } else {
      var _err = new _APIError2.default('token not matched and error msg ' + info, _httpStatus2.default.UNAUTHORIZED);
      return next(_err);
    }
  })(req, res, next);
});

// /api/admin/user
router.route('/user').post((0, _expressValidation2.default)(_paramValidation2.default.createNewAdminUser), _adminUser2.default.createNewUser);

// /api/admin/drivers
router.route('/drivers').get(_adminUser2.default.getAllDrivers).put((0, _expressValidation2.default)(_paramValidation2.default.updateDriverByAdmin), _adminUser2.default.updateDriverDetails).delete((0, _expressValidation2.default)(_paramValidation2.default.removeDriverByAdmin), _adminUser2.default.removeDriver);

router.route('/uploadProfileImage').post(_adminUser2.default.uploadImage);

router.route('/newaccesscode').post((0, _expressValidation2.default)(_paramValidation2.default.requestNewAccessCode), _adminUser2.default.requestNewAccessCode);

// /api/admin/drivers/route
router.route('/drivers/route').get(_adminUser2.default.getDriverRoute);

router.route('/drivers/onlineOffline').put((0, _expressValidation2.default)(_paramValidation2.default.onlineOffline), _adminUser2.default.onlineOffline);

router.route('/getRouteById').get(_adminUser2.default.getRouteById);

/*****************************************
 * ***************************************
 * Super ADMin APi's
 * ***************************************
 *****************************************/
router.route('/viewDrivers').get(_adminUser2.default.viewDrivers);

/*****************************************
* ***************************************
* START: MOBILE ADMIN API's
* ***************************************
*****************************************/

router.route('/trip/details/route').get(_adminUser2.default.getSelectedTripRoute);

router.route('/mobile/drivers').get(_adminUser2.default.getAllDriversMobile);

router.route('/mobile/activetrips').get(_adminUser2.default.getAllActiveTrips);

router.route('/mobile/rides').put(_adminUser2.default.getAllRidesMobile);

/*****************************************
* ***************************************
* END: MOBILE ADMIN API's
* ***************************************
*****************************************/

/*****************************************
 * START: Admin Routes API's
 *****************************************/
router.route('/routes').get(_adminUser2.default.getAllRoutes).put((0, _expressValidation2.default)(_paramValidation2.default.updateRoute), _adminUser2.default.updateRoute).delete((0, _expressValidation2.default)(_paramValidation2.default.removeRoute), _adminUser2.default.removeRoute);

router.route('/routes/route').get((0, _expressValidation2.default)(_paramValidation2.default.getRouteDetails), _adminUser2.default.getRouteDetails);

router.route('/routes/add').put((0, _expressValidation2.default)(_paramValidation2.default.addRoute), _adminUser2.default.addRoute);

router.route('/routes/getDistanceByOriginDestination').get(_adminUser2.default.getDistanceByOriginDestination);

router.route('/route/terminals').put((0, _expressValidation2.default)(_paramValidation2.default.updateTerminal), _adminUser2.default.updateTerminal).delete((0, _expressValidation2.default)(_paramValidation2.default.removeTerminal), _adminUser2.default.removeTerminal);

router.route('/route/terminals/add').put((0, _expressValidation2.default)(_paramValidation2.default.addTerminal), _adminUser2.default.addTerminal);

/*****************************************
 * END: Admin Routes API's
 *****************************************/

exports.default = router;
module.exports = exports.default;
//# sourceMappingURL=admin.js.map
