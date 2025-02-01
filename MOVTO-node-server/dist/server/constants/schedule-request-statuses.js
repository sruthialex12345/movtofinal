'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var TRIP_REQUEST_INIT = exports.TRIP_REQUEST_INIT = 'request'; // new request
var TRIP_REQUEST_WAITING = exports.TRIP_REQUEST_WAITING = 'waiting'; // not being used
var TRIP_REQUEST_APPROVED = exports.TRIP_REQUEST_APPROVED = 'approved'; // not being used
var TRIP_REQUEST_CANCELLED = exports.TRIP_REQUEST_CANCELLED = 'cancelled'; // admin or rider cancel it's own created request
var TRIP_REQUEST_ACCEPTED = exports.TRIP_REQUEST_ACCEPTED = 'accepted'; // driver accepte request
var TRIP_REQUEST_REJECTED = exports.TRIP_REQUEST_REJECTED = 'rejected'; // driver reject request
var TRIP_REQUEST_ASSIGNED = exports.TRIP_REQUEST_ASSIGNED = 'assigned'; // admin assign driver on request
var TRIP_REQUEST_COMPLETED = exports.TRIP_REQUEST_COMPLETED = 'completed'; // driver completes the trip
//# sourceMappingURL=schedule-request-statuses.js.map
