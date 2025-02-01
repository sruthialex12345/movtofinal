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

var _expressValidation = require('express-validation');

var _expressValidation2 = _interopRequireDefault(_expressValidation);

var _adminTrip = require('../controllers/admin-trip');

var _adminTrip2 = _interopRequireDefault(_adminTrip);

var _adminTripUser = require('../controllers/admin-trip-user');

var _adminTripUser2 = _interopRequireDefault(_adminTripUser);

var _adminUser = require('../controllers/admin-user');

var _adminUser2 = _interopRequireDefault(_adminUser);

var _adminVehicle = require('../controllers/admin-vehicle');

var _adminVehicle2 = _interopRequireDefault(_adminVehicle);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _env = require('../../config/env');

var _env2 = _interopRequireDefault(_env);

var _paramValidation = require('../../config/param-validation');

var _paramValidation2 = _interopRequireDefault(_paramValidation);

var _serverConfig = require('../controllers/server-config');

var _serverConfig2 = _interopRequireDefault(_serverConfig);

var _staticPage = require('../controllers/static-page');

var _staticPage2 = _interopRequireDefault(_staticPage);

var _blog = require('../controllers/blog');

var _blog2 = _interopRequireDefault(_blog);

var _faq = require('../controllers/faq.controller');

var _faq2 = _interopRequireDefault(_faq);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router(); //eslint-disable-line

router.route('/trip').get((0, _expressValidation2.default)(_paramValidation2.default.tripList), _adminTrip2.default.tripDetails).post((0, _expressValidation2.default)(_paramValidation2.default.createNewTrip), _adminTrip2.default.createNewTrip).put((0, _expressValidation2.default)(_paramValidation2.default.updateTripObject), _adminTrip2.default.updateTrip);

router.route('/allusers').post(_adminUser2.default.getTotalUsers);
router.route('/ongoingtrips').get(_adminTrip2.default.getOngoingTripDetails);

router.route('/recentreviewedtrips').get(_adminTrip2.default.getRecentReviewedTripDetails);
router.route('/approvePendingUsers').get((0, _expressValidation2.default)(_paramValidation2.default.pending), _adminUser2.default.getApprovePendingUsers);
router.route('/approveUser').put((0, _expressValidation2.default)(_paramValidation2.default.approve), _adminUser2.default.approveUser);
router.route('/rejectUser').put((0, _expressValidation2.default)(_paramValidation2.default.reject), _adminUser2.default.rejectUser);
router.route('/activeDriverDetails').get(_adminUser2.default.getActiveDriverDetails);
router.route('/activeCustomerDetails').get(_adminUser2.default.getActiveCustomerDetails);

router.route('/specificusertrips/:userId').get(_adminTrip2.default.getSpecificUserTripDetails);

router.route('/serverConfigObj').get(_serverConfig2.default.getConfig);

router.route('/serverConfig').post(_serverConfig2.default.updateConfig);

router.route('/changepassword').post(_adminUser2.default.changePassword);

router.route('/newaccesscode').post((0, _expressValidation2.default)(_paramValidation2.default.requestNewAccessCode), _adminUser2.default.requestNewAccessCode);

router.route('/getAvailableRides').post(_adminUser2.default.getAdminRides);

router.route('/getRidesUptoSevenDays').post(_adminUser2.default.getRidesUptoSevenDays);

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

/*****************************************
 * ***************************************
 * AUTHENTICATED APi's
 * ***************************************
 *****************************************/

/*****************************************
* ***************************************
* START: MOBILE ADMIN API's
* ***************************************
*****************************************/
/* /api/admin/mobile/vehicles */
router.route('/mobile/vehicles').get(_adminVehicle2.default.getAllVehiclesMobile);

router.route('/mobile/drivers').get(_adminUser2.default.getAllDriversMobile);

router.route('/mobile/rides').get(_adminUser2.default.getAllRidesMobile);

router.route('/mobile/activetrips').get(_adminUser2.default.getAllActiveTrips);

router.route('/trip/details/route').get(_adminUser2.default.getSelectedTripRoute);

/*****************************************
* ***************************************
* END: MOBILE ADMIN API's
* ***************************************
*****************************************/

// /api/admin/user
router.route('/user').get(_adminUser2.default.getAllUsers).post((0, _expressValidation2.default)(_paramValidation2.default.createNewAdminUser), _adminUser2.default.createNewUser).put((0, _expressValidation2.default)(_paramValidation2.default.updateUserByAdmin), _adminUser2.default.updateUserDetails);

// /api/admin/drivers
router.route('/drivers').get(_adminUser2.default.getAllDrivers).put((0, _expressValidation2.default)(_paramValidation2.default.updateDriverByAdmin), _adminUser2.default.updateDriverDetails).delete((0, _expressValidation2.default)(_paramValidation2.default.removeDriverByAdmin), _adminUser2.default.removeDriver);
router.route('/drivers/details').get(_adminUser2.default.getDriverDetails);
router
// .route('/drivers/route').put(adminUser.updateDriverRoute);
.route('/drivers/route').get(_adminUser2.default.getDriverRoute).put(_adminUser2.default.updateRouteTerminal).post(_adminUser2.default.addRouteTerminals);

// /api/admin/vehicles
router.route('/vehicles').post(_adminVehicle2.default.createNewVehicle).get(_adminVehicle2.default.getAllVehicles).put(_adminVehicle2.default.updateVehicleDetails).delete((0, _expressValidation2.default)(_paramValidation2.default.removeVehicleByAdmin), _adminVehicle2.default.removeVehicle);
router.route('/vehicles/details').get(_adminVehicle2.default.getVehicleDetails);
// server Config
router.route('/serverConfig').get(_serverConfig2.default.getConfig).post(_serverConfig2.default.updateConfig);

// /api/admin/allusers
router.route('/allusers').get(_adminUser2.default.getTotalUsers);

router.route('/userDetails/:userId').get(_adminUser2.default.getUsersDetails);

router.route('/user/userStatsChart').get(_adminUser2.default.userStats);

// /api/admin/trip

// .put(adminTrip.updateTrip);

router.route('/trip/charts').get((0, _expressValidation2.default)(_paramValidation2.default.tripRevenueGraph), _adminTrip2.default.tripRevenueGraph);

router.route('/trip/charts/:revenueYear').get((0, _expressValidation2.default)(_paramValidation2.default.tripRevenueGraph), _adminTrip2.default.tripRevenueGraph);

router.route('/trip/:tripId').get((0, _expressValidation2.default)(_paramValidation2.default.userTripRequestList), _adminTrip2.default.loadTripDetails);

router.route('/trip/user/:userId').get((0, _expressValidation2.default)(_paramValidation2.default.userTripRequestList), _adminTripUser2.default.userTripDetails);

router.route('/trip/user/charts/:userId').get((0, _expressValidation2.default)(_paramValidation2.default.userTripRequestList), _adminTripUser2.default.userTripRequestStatics);

// /api/admin/getLocationsLists
router.route('/getLocationsLists').get(_adminUser2.default.getLocationsLists);
router.route('/addLocation').post(_adminUser2.default.addLocation); // /api/admin/drivers
// /api/admin/getLocationById
router.route('/getLocationById').get(_adminUser2.default.getLocationById);
router.route('/updateLocation').put(_adminUser2.default.updateLocation);
router.route('/removeLocation').delete(_adminUser2.default.removeLocation);

/*****************************************
 * ***************************************
 * Super ADMin APi's
 * ***************************************
 *****************************************/

router.route('/getCount').get(_adminUser2.default.getCount);
router.route('/getDriverList').get(_adminUser2.default.getDriverList);
router.route('/getReports').post(_adminUser2.default.getReports);
router.route('/viewRiders').get(_adminUser2.default.viewRiders);
router.route('/viewRating').get(_adminUser2.default.viewRating);
router.route('/viewVehicles').get(_adminUser2.default.viewVehicles);
router.route('/viewDrivers').get(_adminUser2.default.viewDrivers);
router.route('/details').get(_adminUser2.default.getAdminDetails);
router.route('/createAdmin').post((0, _expressValidation2.default)(_paramValidation2.default.createAdmin), _adminUser2.default.createAdmin);
router.route('/updateAdmin').put((0, _expressValidation2.default)(_paramValidation2.default.createAdmin), _adminUser2.default.updateAdmin);
router.route('/updatePartner').put((0, _expressValidation2.default)(_paramValidation2.default.createAdmin), _adminUser2.default.updatePartner);
router.route('/updateStatus').put(_adminUser2.default.updateStatus);
router.route('/adminRemove').put(_adminUser2.default.adminRemove);
router.route('/exportexcel').post(_adminUser2.default.getReportToExcel);
router.route('/getRiderList').post(_adminUser2.default.getRiderList);
router.route('/getAvgWaitTime').post(_adminUser2.default.getAvgWaitTime);
router.route('/getPeakNLowTime').post(_adminUser2.default.getPeakNLowTime);

// router
//   .route('/superadmin')
//   .get(adminUser.getAllRiders)
//   .put(validate(paramValidation.updateDriverByAdmin), adminUser.updateDriverDetails)
//   .delete(validate(paramValidation.removeDriverByAdmin), adminUser.removeDriver);


// /api/admin/static-page routes
router.route('/staticPage').get(_staticPage2.default.list);
router.route('/staticPageDetails').get(_staticPage2.default.staticPageDetails);
router.route('/updateStaticPage').put(_staticPage2.default.updateStaticPage);

// /api/admin/Bog routes
router.route('/blogPageList').get(_blog2.default.list);
router.route('/createBlog').post(_blog2.default.createBlog);
router.route('/blogPageDetails').get(_blog2.default.blogPageDetails);
router.route('/updateBlogPage').put(_blog2.default.updateBlogPage);
router.route('/blogRemove').put(_blog2.default.blogRemove);
router.route('/updateBlogStatus').put(_blog2.default.updateBlogStatus);

// /api/admin/Contact routes
router.route('/contactList').get(_staticPage2.default.contactList);

// /api/admin/join Partner List
router.route('/joinPartnerList').get(_staticPage2.default.joinPartnerList);

router.route('/getcustomtemplate').get(_adminUser2.default.getAdminCustomTemplate);

// /api/admin/Contact routes
router.route('/faq').get(_faq2.default.faq);
router.route('/faqDetails').get(_faq2.default.faqDetails);
router.route('/createFaq').post(_faq2.default.createFaq);
router.route('/updateFaq').put(_faq2.default.updateFaq);
router.route('/updateFaqStatus').put(_faq2.default.updateFaqStatus);
router.route('/faqRemove').put(_faq2.default.faqRemove);

// /api/admin/Reservation Code routes
router.route('/getReservationCode').get(_adminUser2.default.getReservationCode);
router.route('/generateReservationCode').post(_adminUser2.default.generateReservationCode);
router.route('/shareReservationCode').post(_adminUser2.default.shareReservationCode);

// /api/admin/Messages routes
router.route('/sendOnDemandMessage').post(_adminUser2.default.sendOnDemandMessage);
router.route('/sendToCustomerMessage').post(_adminUser2.default.sendToCustomerMessage);
router.route('/saveToNotifyMessage').post(_adminUser2.default.saveToNotifyMessage);
router.route('/getNotifyMessage').get(_adminUser2.default.getNotifyMessage);
router.route('/updateToNotifyMessage').post(_adminUser2.default.updateToNotifyMessage);
router.route('/getCustomMessage').get(_adminUser2.default.getCustomMessage);
router.route('/updateCustomMessage').post(_adminUser2.default.updateCustomMessage);

//Change Password

router.route('/checkCurrentPassword').post(_adminUser2.default.checkCurrentPassword);
router.route('/changePasswordAdmin').post(_adminUser2.default.changePasswordAdmin);

//  /api/admin/driverlist
router.route('/availabledriverlist').post(_adminUser2.default.available_drivers);
router.route('/settings').get(_adminUser2.default.getSettings);
router.route('/settings').put(_adminUser2.default.updateSettings);
router.route('/settings/holiday').put(_adminUser2.default.addUpdateHoliday);
router.route('/settings/removeholiday').put(_adminUser2.default.removeHoliday);

exports.default = router;
module.exports = exports.default;
//# sourceMappingURL=admin.js.map
