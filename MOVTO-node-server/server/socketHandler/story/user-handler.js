import SocketStore from '../../service/socket-store.js'; //eslint-disable-line
import UserSchema from '../../models/user';

/**
 * user handler, handle update of the driver availability and send to riders
 * * @param socket object
 * @returns {*}
 */
function userHandler(socket) {
  socket.on('updateAvailable', (userObj) => {
    console.log('update available', userObj);
    // eslint-disable-next-line
    const userID = userObj._id;
    UserSchema.findOneAndUpdateAsync({ _id: userID }, { $set: { isAvailable: userObj.isAvailable } }, { new: true })
      .then((updatedUser) => {
        // SocketStore.emitByUserId(userID, 'updateAvailable', updatedUser);
        SocketStore.emitToAll('updateAvailable', updatedUser);
      })
      .error((e) => {
        SocketStore.emitByUserId(userID, 'socketError', e);
      });
  });
}

export default userHandler;
