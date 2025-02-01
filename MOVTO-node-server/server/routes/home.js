import express from 'express';
import staticPageCtrl from '../controllers/static-page';
import faqCtrl from '../controllers/faq.controller';

const router = express.Router();


router.route('/').get(staticPageCtrl.list);
router.route('/contactus').post(staticPageCtrl.contactus);
router.route('/requestDemo').post(staticPageCtrl.requestDemo);
router.route('/faq').get(faqCtrl.faq);
router.route('/blogs').get(staticPageCtrl.blogs);
router.route('/blogDetails').get(staticPageCtrl.blogDetails);
router.route('/staticPageDetails').get(staticPageCtrl.staticPageDetails);
router.route('/joinOurPartner').post(staticPageCtrl.joinOurPartner);

export default router;
