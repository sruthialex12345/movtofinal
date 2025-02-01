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

var _paramValidation = require('../../config/param-validation');

var _paramValidation2 = _interopRequireDefault(_paramValidation);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _auth = require('../controllers/auth');

var _auth2 = _interopRequireDefault(_auth);

var _env = require('../../config/env');

var _env2 = _interopRequireDefault(_env);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

/** POST /api/auth/login - Returns token if correct email and password is provided */
router.route('/login').post((0, _expressValidation2.default)(_paramValidation2.default.login), _auth2.default.login);

router.route('/logindriver').post((0, _expressValidation2.default)(_paramValidation2.default.loginDriver), _auth2.default.loginDriver);
router.route('/clearSession').post((0, _expressValidation2.default)(_paramValidation2.default.loginDriver), _auth2.default.clearSession);

router.route('/loginadmin').post((0, _expressValidation2.default)(_paramValidation2.default.loginadmin), _auth2.default.loginAdmin);

router.route('/checkuser').post(_auth2.default.checkUser);

/**
 * Middleware for protected routes. All protected routes need token in the header in the form Authorization: JWT token
 */
router.use(function (req, res, next) {
  // eslint-disable-next-line
  _passport2.default.authenticate('jwt', _env2.default.passportOptions, function (error, userDtls, info) {
    if (error) {
      var err = new _APIError2.default('token not matched', _httpStatus2.default.UNAUTHORIZED);
      return next(err);
    } else if (userDtls) {
      req.user = userDtls;
      next();
    } else {
      var _err = new _APIError2.default('token not matched and error msg ' + info, _httpStatus2.default.UNAUTHORIZED);
      return next(_err);
    }
  })(req, res, next);
});

// router.route('/random-number')
//   .get(authCtrl.getRandomNumber);

router.route('/logindriver/accesscode').post(_auth2.default.loginDriverAccessCode);

router.route('/logout').put(_auth2.default.logout);

exports.default = router;
module.exports = exports.default;
//# sourceMappingURL=auth.js.map
