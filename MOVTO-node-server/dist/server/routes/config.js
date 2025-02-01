'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _appConfig = require('../controllers/appConfig');

var _appConfig2 = _interopRequireDefault(_appConfig);

var _user = require('../controllers/user');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.route('/forgot').post(_user.forgotPassword);

// /** GET /api/config/appConfig - Returns mobileApp config */

router.route('/appConfig').get(_appConfig2.default.getConfig).post(_appConfig2.default.updateConfig);

exports.default = router;
module.exports = exports.default;
//# sourceMappingURL=config.js.map
