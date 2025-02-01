'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.emailDriverWeekly = exports.cancelRideRequestAfter10Min = exports.notifyUserUnclaimedRides30MinBefore = exports.notifyUserUnclaimedRidesAtNine = exports.notifyUserUnclaimedRidesAtEight = exports.checkAndProcessScheduledRequests = exports.notifyRiderDriverBeforeAnHour = exports.notificationIfNoActiveTrip = undefined;

var _nodeCron = require('node-cron');

var _nodeCron2 = _interopRequireDefault(_nodeCron);

var _notifyUserCron = require('./notify-user-cron');

var notifyUser = _interopRequireWildcard(_notifyUserCron);

var _scheduleTrip = require('./schedule-trip');

var scheduleTrip = _interopRequireWildcard(_scheduleTrip);

var _weeklyDriverStats = require('./weekly-driver-stats');

var _weeklyDriverStats2 = _interopRequireDefault(_weeklyDriverStats);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// notify rider and driver on scheduled trips before an hour of scheduled time
var notificationIfNoActiveTrip = exports.notificationIfNoActiveTrip = function notificationIfNoActiveTrip() /* req, res */{
  // Cron runs every minute to check scheduled accepted requests after an hour and notify .
  _nodeCron2.default.schedule('*/1 * * * *', function () {
    console.log('checking shedule trips 30 before ride if driver has active trip');
    scheduleTrip.notifyIfDriverNotActive();
  });
};

// notify rider and driver on scheduled trips before an hour of scheduled time
var notifyRiderDriverBeforeAnHour = exports.notifyRiderDriverBeforeAnHour = function notifyRiderDriverBeforeAnHour() /* req, res */{
  // Cron runs every minute to check scheduled accepted requests after an hour and notify .
  _nodeCron2.default.schedule('*/1 * * * *', function () {
    console.log('checking and notify schedule trips 1hr before ride');
    scheduleTrip.notifyNextHourAcceptedRequest();
  });
};

// check and process scheduled trips every minute
var checkAndProcessScheduledRequests = exports.checkAndProcessScheduledRequests = function checkAndProcessScheduledRequests() /* req, res */{
  _nodeCron2.default.schedule('*/1 * * * *', function () {
    console.log('checking schedule trips');
    scheduleTrip.processScheduledRequests();
  });
};

// not being used
var notifyUserUnclaimedRidesAtEight = exports.notifyUserUnclaimedRidesAtEight = function notifyUserUnclaimedRidesAtEight() /* req, res */{
  _nodeCron2.default.schedule('* * 20 * *', function () {
    notifyUser.notifyUserUnclaimedRidesAtEight();
  });
};
// not being used
var notifyUserUnclaimedRidesAtNine = exports.notifyUserUnclaimedRidesAtNine = function notifyUserUnclaimedRidesAtNine() /* req, res */{
  _nodeCron2.default.schedule('* * 9 * *', function () {
    notifyUser.notifyUserUnclaimedRidesAtNine();
  });
};
// not being used
var notifyUserUnclaimedRides30MinBefore = exports.notifyUserUnclaimedRides30MinBefore = function notifyUserUnclaimedRides30MinBefore() /* req, res */{
  _nodeCron2.default.schedule('* * * * *', function () {
    notifyUser.notifyUserUnclaimedRides30MinBefore(); // Cron runs every minute to check unclaimed rides 30 minutes before.
  });
};
// not being used
var cancelRideRequestAfter10Min = exports.cancelRideRequestAfter10Min = function cancelRideRequestAfter10Min() /* req, res */{
  _nodeCron2.default.schedule('*/1 * * * *', function () {
    console.log('cancel ride');
    // notifyUser.notifyUserUnclaimedRides30MinBefore(); // Cron runs every minute to check unclaimed rides 30 minutes before.
  });
};

// not being used
var emailDriverWeekly = exports.emailDriverWeekly = function emailDriverWeekly() /* req, res */{
  _nodeCron2.default.schedule('* * * * Monday', function () {
    (0, _weeklyDriverStats2.default)(); // Cron runs every monday to email driver weekly stats.
  });
};
//# sourceMappingURL=index.js.map
