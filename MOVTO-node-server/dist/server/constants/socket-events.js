"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  // rider add new request
  "schedule_request_added_admin": "newScheduleRequestAdmin",
  // admn assign/reassign request to driver
  "schedule_request_assign_driver": "requestAssignedDriver",
  "driver_assigned_request_rider": "driverAssignedRequestRider",
  // driver accept/reject request
  "schedule_request_updated_admin": "scheduleReqUpdatedAdmin",
  "schedule_request_updated_rider": "scheduleReqUpdatedRider",
  "schedule_request_updated_driver": "scheduleReqUpdatedDriver",
  // schedule trip socket notification 1 hr before rider and driver
  "scheduled_trip_notification": "scheduledTripNotification",
  // notify driver and admin if no active trip found
  "no_active_trip": "noActiveTrip"
};
module.exports = exports.default;
//# sourceMappingURL=socket-events.js.map
