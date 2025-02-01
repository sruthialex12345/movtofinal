import config from '../../../config/env';
import SocketStore from '../../service/socket-store.js'; //eslint-disable-line
import UserSchema from '../../models/user';
import { USER_TYPE_DRIVER } from '../../constants/user-types';

function nearbyDriverHandler(socket) {
  socket.on('updatePickupRegion', (userRegion) => {
    // get the rider id
    // update the coordinates in database
    // for simulation emit coordinates to all connected drivers
    // fire query to get nearby drivers from database
    // emit the resultant array in callback
    const coordinates = [userRegion.region.latitude, userRegion.region.longitude];
    // eslint-disable-next-line
    const userId = userRegion.user._id;
    console.log(userId);
    // for simulation only
    // socket.broadcast.emit('riderMapCoordinates', coordinates);
    // simulation ends
    UserSchema.findOneAndUpdateAsync({ _id: userId }, { $set: { mapCoordinates: coordinates } }, { new: true })
      .then(updatedUser =>
        UserSchema.findAsync({
          $and: [{ gpsLoc: { $geoWithin: { $centerSphere: [updatedUser.mapCoordinates, config.radius] } } }, { currTripId: null, currTripState: null }, { loginStatus: true }, { userType: USER_TYPE_DRIVER }, { isAvailable: true }],
        }))
      .then((driverArray) => {
        if (driverArray) {
          console.log(driverArray.length, 'driverArray');
          SocketStore.emitByUserId(userId, 'nearByDriversList', driverArray);
        }
      });
  });
}

export default nearbyDriverHandler;
