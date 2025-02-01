import express from 'express';
import appConfigCtrl from '../controllers/appConfig';
import { forgotPassword } from '../controllers/user';

const router = express.Router();

router.route('/forgot').post(forgotPassword);

// /** GET /api/config/appConfig - Returns mobileApp config */

router
  .route('/appConfig')
  .get(appConfigCtrl.getConfig)

  .post(appConfigCtrl.updateConfig);

export default router;
