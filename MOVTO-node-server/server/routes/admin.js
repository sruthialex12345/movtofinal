import express from 'express';
import httpStatus from 'http-status';
import passport from 'passport';
import validate from 'express-validation';
import adminTrip from '../controllers/admin-trip';
import adminTripUser from '../controllers/admin-trip-user';
import adminUser from '../controllers/admin-user';
import adminVehicle from '../controllers/admin-vehicle';
import APIError from '../helpers/APIError';
import config from '../../config/env';
import paramValidation from '../../config/param-validation';
import serverCtrl from '../controllers/server-config'; //eslint-disable-line
import staticPageCtrl from '../controllers/static-page';
import blogCtrl from '../controllers/blog';
import faqCtrl from '../controllers/faq.controller';

const router = express.Router();
router
  .route('/trip')
  .get(validate(paramValidation.tripList), adminTrip.tripDetails)
  .post(validate(paramValidation.createNewTrip), adminTrip.createNewTrip)
  .put(validate(paramValidation.updateTripObject), adminTrip.updateTrip);

router.route('/allusers').post(adminUser.getTotalUsers);
router.route('/ongoingtrips').get(adminTrip.getOngoingTripDetails);

router.route('/recentreviewedtrips').get(adminTrip.getRecentReviewedTripDetails);
router.route('/approvePendingUsers').get(validate(paramValidation.pending), adminUser.getApprovePendingUsers);
router.route('/approveUser').put(validate(paramValidation.approve), adminUser.approveUser);
router.route('/rejectUser').put(validate(paramValidation.reject), adminUser.rejectUser);
router.route('/activeDriverDetails').get(adminUser.getActiveDriverDetails);
router.route('/activeCustomerDetails').get(adminUser.getActiveCustomerDetails);

router.route('/specificusertrips/:userId').get(adminTrip.getSpecificUserTripDetails);

router.route('/serverConfigObj').get(serverCtrl.getConfig);

router.route('/serverConfig').post(serverCtrl.updateConfig);



router.route('/changepassword').post(adminUser.changePassword);

router.route('/newaccesscode').post(
  validate(paramValidation.requestNewAccessCode),
  adminUser.requestNewAccessCode
);

router.route('/getAvailableRides').post(adminUser.getAdminRides);

router.route('/getRidesUptoSevenDays').post(adminUser.getRidesUptoSevenDays);

router.use((req, res, next) => {
  // eslint-disable-next-line
  passport.authenticate('jwt', config.passportOptions, (error, userDtls, info) => {
    if (error) {
      const err = new APIError('token not matched', httpStatus.UNAUTHORIZED);
      return next(err);
    } else if (userDtls && userDtls.userType === 'admin') {
      req.user = userDtls;
      next();
    } else if (userDtls && userDtls.userType === 'superAdmin') {
      req.user = userDtls;
      next();
    }else {
      const err = new APIError(`token not matched and error msg ${info}`, httpStatus.UNAUTHORIZED);
      return next(err);
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
  router
  .route('/mobile/vehicles')
  .get(adminVehicle.getAllVehiclesMobile)

  router
  .route('/mobile/drivers')
  .get(adminUser.getAllDriversMobile)

  router
  .route('/mobile/rides')
  .get(adminUser.getAllRidesMobile)

  router
  .route('/mobile/activetrips')
  .get(adminUser.getAllActiveTrips)

  router
  .route('/trip/details/route')
  .get(adminUser.getSelectedTripRoute)

 /*****************************************
 * ***************************************
 * END: MOBILE ADMIN API's
 * ***************************************
 *****************************************/

// /api/admin/user
router
  .route('/user')
  .get(adminUser.getAllUsers)
  .post(validate(paramValidation.createNewAdminUser), adminUser.createNewUser)
  .put(validate(paramValidation.updateUserByAdmin), adminUser.updateUserDetails);

// /api/admin/drivers
router
  .route('/drivers')
  .get(adminUser.getAllDrivers)
  .put(validate(paramValidation.updateDriverByAdmin), adminUser.updateDriverDetails)
  .delete(validate(paramValidation.removeDriverByAdmin), adminUser.removeDriver);
router
  .route('/drivers/details').get(adminUser.getDriverDetails);
router
  // .route('/drivers/route').put(adminUser.updateDriverRoute);
  .route('/drivers/route')
  .get(adminUser.getDriverRoute)
  .put(adminUser.updateRouteTerminal)
  .post(adminUser.addRouteTerminals);

// /api/admin/vehicles
router
  .route('/vehicles')
  .post(adminVehicle.createNewVehicle)
  .get(adminVehicle.getAllVehicles)
  .put(adminVehicle.updateVehicleDetails)
  .delete(validate(paramValidation.removeVehicleByAdmin), adminVehicle.removeVehicle);
  router
  .route('/vehicles/details').get(adminVehicle.getVehicleDetails);
// server Config
router
  .route('/serverConfig')
  .get(serverCtrl.getConfig)
  .post(serverCtrl.updateConfig);

// /api/admin/allusers
router.route('/allusers').get(adminUser.getTotalUsers);

router.route('/userDetails/:userId').get(adminUser.getUsersDetails);

router.route('/user/userStatsChart').get(adminUser.userStats);

// /api/admin/trip

// .put(adminTrip.updateTrip);

router.route('/trip/charts').get(validate(paramValidation.tripRevenueGraph), adminTrip.tripRevenueGraph);

router.route('/trip/charts/:revenueYear').get(validate(paramValidation.tripRevenueGraph), adminTrip.tripRevenueGraph);

router.route('/trip/:tripId').get(validate(paramValidation.userTripRequestList), adminTrip.loadTripDetails);

router.route('/trip/user/:userId').get(validate(paramValidation.userTripRequestList), adminTripUser.userTripDetails);

router.route('/trip/user/charts/:userId').get(validate(paramValidation.userTripRequestList), adminTripUser.userTripRequestStatics);

// /api/admin/getLocationsLists
router.route('/getLocationsLists').get(adminUser.getLocationsLists);
router.route('/addLocation').post(adminUser.addLocation);// /api/admin/drivers
// /api/admin/getLocationById
router.route('/getLocationById').get(adminUser.getLocationById);
router.route('/updateLocation').put(adminUser.updateLocation);
router.route('/removeLocation').delete(adminUser.removeLocation);

/*****************************************
 * ***************************************
 * Super ADMin APi's
 * ***************************************
 *****************************************/

router.route('/getCount').get(adminUser.getCount);
router.route('/getDriverList').get(adminUser.getDriverList);
router.route('/getReports').post(adminUser.getReports);
router.route('/viewRiders').get(adminUser.viewRiders);
router.route('/viewRating').get(adminUser.viewRating);
router.route('/viewVehicles').get(adminUser.viewVehicles);
router.route('/viewDrivers').get(adminUser.viewDrivers);
router.route('/details').get(adminUser.getAdminDetails);
router.route('/createAdmin').post(validate(paramValidation.createAdmin), adminUser.createAdmin);
router.route('/updateAdmin').put(validate(paramValidation.createAdmin), adminUser.updateAdmin);
router.route('/updatePartner').put(validate(paramValidation.createAdmin), adminUser.updatePartner);
router.route('/updateStatus').put(adminUser.updateStatus);
router.route('/adminRemove').put(adminUser.adminRemove);
router.route('/exportexcel').post(adminUser.getReportToExcel);
router.route('/getRiderList').post(adminUser.getRiderList);
router.route('/getAvgWaitTime').post(adminUser.getAvgWaitTime);
router.route('/getPeakNLowTime').post(adminUser.getPeakNLowTime);

// router
//   .route('/superadmin')
//   .get(adminUser.getAllRiders)
//   .put(validate(paramValidation.updateDriverByAdmin), adminUser.updateDriverDetails)
//   .delete(validate(paramValidation.removeDriverByAdmin), adminUser.removeDriver);


// /api/admin/static-page routes
router.route('/staticPage').get(staticPageCtrl.list);
router.route('/staticPageDetails').get(staticPageCtrl.staticPageDetails);
router.route('/updateStaticPage').put(staticPageCtrl.updateStaticPage)

// /api/admin/Bog routes
router.route('/blogPageList').get(blogCtrl.list);
router.route('/createBlog').post(blogCtrl.createBlog);
router.route('/blogPageDetails').get(blogCtrl.blogPageDetails);
router.route('/updateBlogPage').put(blogCtrl.updateBlogPage);
router.route('/blogRemove').put(blogCtrl.blogRemove);
router.route('/updateBlogStatus').put(blogCtrl.updateBlogStatus);


// /api/admin/Contact routes
router.route('/contactList').get(staticPageCtrl.contactList);

// /api/admin/join Partner List
router.route('/joinPartnerList').get(staticPageCtrl.joinPartnerList);

router.route('/getcustomtemplate').get(adminUser.getAdminCustomTemplate);

// /api/admin/Contact routes
router.route('/faq').get(faqCtrl.faq);
router.route('/faqDetails').get(faqCtrl.faqDetails);
router.route('/createFaq').post(faqCtrl.createFaq);
router.route('/updateFaq').put(faqCtrl.updateFaq);
router.route('/updateFaqStatus').put(faqCtrl.updateFaqStatus);
router.route('/faqRemove').put(faqCtrl.faqRemove);


// /api/admin/Reservation Code routes
router.route('/getReservationCode').get(adminUser.getReservationCode);
router.route('/generateReservationCode').post(adminUser.generateReservationCode);
router.route('/shareReservationCode').post(adminUser.shareReservationCode);




// /api/admin/Messages routes
router.route('/sendOnDemandMessage').post(adminUser.sendOnDemandMessage);
router.route('/sendToCustomerMessage').post(adminUser.sendToCustomerMessage);
router.route('/saveToNotifyMessage').post(adminUser.saveToNotifyMessage);
router.route('/getNotifyMessage').get(adminUser.getNotifyMessage);
router.route('/updateToNotifyMessage').post(adminUser.updateToNotifyMessage);
router.route('/getCustomMessage').get(adminUser.getCustomMessage);
router.route('/updateCustomMessage').post(adminUser.updateCustomMessage);

//Change Password

router.route('/checkCurrentPassword').post(adminUser.checkCurrentPassword);
router.route('/changePasswordAdmin').post(adminUser.changePasswordAdmin);

//  /api/admin/driverlist
router.route('/availabledriverlist').post(adminUser.available_drivers);
router.route('/settings').get(adminUser.getSettings);
router.route('/settings').put(adminUser.updateSettings);
router.route('/settings/holiday').put(adminUser.addUpdateHoliday);
router.route('/settings/removeholiday').put(adminUser.removeHoliday);






export default router;
