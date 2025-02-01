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

var _payment = require('../controllers/payment');

var _payment2 = _interopRequireDefault(_payment);

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

/** GET /api/payment - Returns wallet balance details for the user */
// router.route('/')
//   .post(paymentCtrl.payAll);

/** GET /api/payment/wallet - Returns wallet balance details for the rider driver and owner */
router.route('/wallet').post(_payment2.default.addBalance);

/** GET /api/payment/amount - Returns wallet balance details for the user */
router.route('/amount').post(_payment2.default.getBalance);

router.route('/checkSaveCard').post(_payment2.default.checkSaveCard);

router.route('/removeCard').post(_payment2.default.removeCard);

router.route('/addCard').post(_payment2.default.addCard);

router.route('/cardPayment').post(_payment2.default.cardPayment);

router.route('/updateCard').post(_payment2.default.updateCard);

exports.default = router;
module.exports = exports.default;
//# sourceMappingURL=payment.js.map
