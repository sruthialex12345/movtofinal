import express from 'express';
import adminRoutes from './admin';
import authRoutes from './auth';
import configRoutes from './config';
import paymentRoutes from './payment';
import syncDataRoute from './sync-data';
import tripRoutes from './trip';
import scheduleTripRequests from './scheduleTripRequest';
import userRoutes from './user';
import passengerRoutes from './passenger';
import verifyRoutes from './verify';
import homeRoutes from './home';
import userRoutes_v1 from './v1/user';
import adminRoutes_v1 from './v1/admin';

import userRoutes_v2 from './v2/user';
import userRoutes_v3 from './v3/user';

const router = express.Router();

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) => res.send('OK'));

router.get('/', (req, res) => res.send('OK'));
// mount user routes at /verify
router.use('/verify', verifyRoutes);

// mount user routes at /users
router.use('/users', userRoutes);
router.use('/v1/users/', userRoutes_v1);
router.use('/v2/users/', userRoutes_v2);
router.use('/v3/users/', userRoutes_v3);

// mount passenger routes at /passenger
router.use('/passenger', passengerRoutes);

// mount user routes at /users
router.use('/config', configRoutes);

// mount auth routes at /auth
router.use('/auth', authRoutes);

// mount trip routes at /trips
router.use('/trips', tripRoutes);

// mount scheduledtriprequests routes at /trips
router.use('/schedulerequests', scheduleTripRequests);

// mount sync data route at /sync-data
router.use('/syncData', syncDataRoute);

// mount admin routes at /admin
router.use('/admin', adminRoutes);
router.use('/v1/admin', adminRoutes_v1);

// mount payment routes at /payment
router.use('/payment', paymentRoutes);

// mount payment routes at /payment
router.use('/home', homeRoutes);

export default router;
