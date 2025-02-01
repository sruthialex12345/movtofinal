import express from 'express';
import httpStatus from 'http-status';
import passport from 'passport';

import APIError from '../helpers/APIError';
import config from '../../config/env';
import paymentCtrl from '../controllers/payment';

const router = express.Router();

/**
 * Middleware for protected routes. All protected routes need token in the header in the form Authorization: JWT token
 */
router.use((req, res, next) => {
  // eslint-disable-next-line
  passport.authenticate('jwt', config.passportOptions, (error, userDtls, info) => {
    if (error) {
      const err = new APIError('token not matched', httpStatus.INTERNAL_SERVER_ERROR);
      return next(err);
    } else if (userDtls) {
      req.user = userDtls;
      next();
    } else {
      const err = new APIError(`token is valid but no user found ${info}`, httpStatus.UNAUTHORIZED);
      return next(err);
    }
  })(req, res, next);
});

/** GET /api/payment - Returns wallet balance details for the user */
// router.route('/')
//   .post(paymentCtrl.payAll);

/** GET /api/payment/wallet - Returns wallet balance details for the rider driver and owner */
router.route('/wallet').post(paymentCtrl.addBalance);

/** GET /api/payment/amount - Returns wallet balance details for the user */
router.route('/amount').post(paymentCtrl.getBalance);

router.route('/checkSaveCard').post(paymentCtrl.checkSaveCard);

router.route('/removeCard').post(paymentCtrl.removeCard);

router.route('/addCard').post(paymentCtrl.addCard);

router.route('/cardPayment').post(paymentCtrl.cardPayment);

router.route('/updateCard').post(paymentCtrl.updateCard);

export default router;
