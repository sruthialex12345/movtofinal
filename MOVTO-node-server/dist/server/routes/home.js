'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _staticPage = require('../controllers/static-page');

var _staticPage2 = _interopRequireDefault(_staticPage);

var _faq = require('../controllers/faq.controller');

var _faq2 = _interopRequireDefault(_faq);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.route('/').get(_staticPage2.default.list);
router.route('/contactus').post(_staticPage2.default.contactus);
router.route('/requestDemo').post(_staticPage2.default.requestDemo);
router.route('/faq').get(_faq2.default.faq);
router.route('/blogs').get(_staticPage2.default.blogs);
router.route('/blogDetails').get(_staticPage2.default.blogDetails);
router.route('/staticPageDetails').get(_staticPage2.default.staticPageDetails);
router.route('/joinOurPartner').post(_staticPage2.default.joinOurPartner);

exports.default = router;
module.exports = exports.default;
//# sourceMappingURL=home.js.map
