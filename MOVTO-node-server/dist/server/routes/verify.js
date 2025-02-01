'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _verify = require('../controllers/verify');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.route('/email').post(_verify.emailVerify).put(_verify.emailVerify).get(_verify.emailVerify);

// /** GET /api/verify/mobileVerify -  */

router.route('/mobile').get(_verify.mobileVerify).post(_verify.mobileVerify);

router.route('/mobileVerifyWeb').post(_verify.mobileVerifyWeb);

router.route('/mobileUpdateByPartner').put(_verify.mobileUpdateByPartner);

exports.default = router;
module.exports = exports.default;
//# sourceMappingURL=verify.js.map
