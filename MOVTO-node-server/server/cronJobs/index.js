import cron from 'node-cron';
import * as notifyUser from './notify-user-cron';
import * as scheduleTrip from './schedule-trip';
import emailWeeklyDriverStats from './weekly-driver-stats';

// notify rider and driver on scheduled trips before an hour of scheduled time
export const notificationIfNoActiveTrip = (/* req, res */) => {
  // Cron runs every minute to check scheduled accepted requests after an hour and notify .
  cron.schedule('*/1 * * * *', () => {
    console.log('checking shedule trips 30 before ride if driver has active trip');
    scheduleTrip.notifyIfDriverNotActive();
  });
};

// notify rider and driver on scheduled trips before an hour of scheduled time
export const notifyRiderDriverBeforeAnHour = (/* req, res */) => {
  // Cron runs every minute to check scheduled accepted requests after an hour and notify .
  cron.schedule('*/1 * * * *', () => {
    console.log('checking and notify schedule trips 1hr before ride');
    scheduleTrip.notifyNextHourAcceptedRequest();
  });
};

// check and process scheduled trips every minute
export const checkAndProcessScheduledRequests = (/* req, res */) => {
  cron.schedule('*/1 * * * *', () => {
    console.log('checking schedule trips');
    scheduleTrip.processScheduledRequests();
  });
};

// not being used
export const notifyUserUnclaimedRidesAtEight = (/* req, res */) => {
  cron.schedule('* * 20 * *', () => {
    notifyUser.notifyUserUnclaimedRidesAtEight();
  });
};
// not being used
export const notifyUserUnclaimedRidesAtNine = (/* req, res */) => {
  cron.schedule('* * 9 * *', () => {
    notifyUser.notifyUserUnclaimedRidesAtNine();
  });
};
// not being used
export const notifyUserUnclaimedRides30MinBefore = (/* req, res */) => {
  cron.schedule('* * * * *', () => {
    notifyUser.notifyUserUnclaimedRides30MinBefore(); // Cron runs every minute to check unclaimed rides 30 minutes before.
  });
};
// not being used
export const cancelRideRequestAfter10Min = (/* req, res */) => {
  cron.schedule('*/1 * * * *', () => {
    console.log('cancel ride');
    // notifyUser.notifyUserUnclaimedRides30MinBefore(); // Cron runs every minute to check unclaimed rides 30 minutes before.
  });
};

// not being used
export const emailDriverWeekly = (/* req, res */) => {
  cron.schedule('* * * * Monday', () => {
    emailWeeklyDriverStats(); // Cron runs every monday to email driver weekly stats.
  });
};
