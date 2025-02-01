'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _env = require('../../config/env');

var _env2 = _interopRequireDefault(_env);

var _passenger = require('../controllers/passenger');

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
      var _err = new _APIError2.default('token is valid but no user found ' + info, _httpStatus2.default.UNAUTHORIZED);
      return next(_err);
    }
  })(req, res, next);
});

router.route('/')

/** POST /api/passenger */
.post(_passenger.addPassenger)

/** PUT /api/passenger */
.put(_passenger.updatePassenger)

/** DELETE /api/passenger */
.delete(_passenger.removePassenger);

router.route('/addPassengerTrip').post(_passenger.addPassengerTrip);

router.route('/:passengerId/image')

/** PUT /api/passenger/5/image - Update user pic */
.put(_passenger.uploadImage);

exports.default = router;
module.exports = exports.default;
//# sourceMappingURL=passenger.js.map
