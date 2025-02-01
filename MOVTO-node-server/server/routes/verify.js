import express from 'express';
import { mobileVerify, emailVerify ,mobileUpdateByPartner,mobileVerifyWeb} from '../controllers/verify';

const router = express.Router();

router
  .route('/email')
  .post(emailVerify)
  .put(emailVerify)
  .get(emailVerify);

// /** GET /api/verify/mobileVerify -  */

  router
  .route('/mobile')
  .get(mobileVerify)
  .post(mobileVerify);

  router
  .route('/mobileVerifyWeb')
  .post(mobileVerifyWeb);

  router
  .route('/mobileUpdateByPartner')
  .put(mobileUpdateByPartner)

export default router;
