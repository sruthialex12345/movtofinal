import moment from 'moment';

import TripSchema from '../../models/trip';
import SocketStore from '../../service/socket-store';

function fetchRidesUptoSevenDays(socket) {
  /**
   * updateLocation event is fired by rider or driver whenever their location is changed. also it send location update to corresponding rider or driver if they are in any tripRequest or trip.
   * @param userObj - user whose location has to be updated
   * @returns emit an updateDriverLocation or updateRiderLocation event based on userType.
   */

  socket.on('availableRides', (driverId) => {
    const currentDate = new Date().toISOString();
    const sevenDaysDate = new Date(moment(currentDate).add(7, 'days'));
    TripSchema.aggregateAsync([{ $match: { bookingTime: { $gt: currentDate, $lt: sevenDaysDate }, tripStatus: 'unclaimed' } }])
      .then((ridesData) => {
        if (ridesData.length > 0) {
          SocketStore.emitByUserId(driverId, 'Seven days rides', ridesData);
        } else {
          SocketStore.emitByUserId(driverId, 'No rides are available', ridesData);
        }
      })
      .catch(() => {
        const ridesData = [];
        SocketStore.emitByUserId(driverId, 'server error while finding available rides  ', ridesData);
      });
  });
}

export default fetchRidesUptoSevenDays;
