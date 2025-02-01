export const TRIP_REQUEST_INIT = 'request'; // new request
export const TRIP_REQUEST_WAITING = 'waiting'; // not being used
export const TRIP_REQUEST_APPROVED = 'approved'; // not being used
export const TRIP_REQUEST_CANCELLED = 'cancelled'; // admin or rider cancel it's own created request
export const TRIP_REQUEST_ACCEPTED = 'accepted';  // driver accepte request
export const TRIP_REQUEST_REJECTED = 'rejected';   // driver reject request
export const TRIP_REQUEST_ASSIGNED = 'assigned'; // admin assign driver on request
export const TRIP_REQUEST_COMPLETED = 'completed'; // driver completes the trip
