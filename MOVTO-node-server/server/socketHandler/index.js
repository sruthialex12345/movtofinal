import dashboardHandler from './story/admin-socket';
import nearbyDriverHandler from './story/nearby-driver-handler';
import requestTripHandler from './story/request-trip';
import requestTripHandler_v1 from './story_v1/request-trip';
import updateTripRequestHandler_v1 from './story_v1/update-trip-request';
import SocketStore from '../service/socket-store';
import startTripHandler from './story/start-trip';
import updateLocationHandler from './story/update-location';
import userHandler from './story/user-handler';
import fetchRidesUptoSevenDays from './story/fetchrides';
import cancelTripHandler from './story/cancel-trip';
import updateTripRequestHandler from './story/update-trip-request';
import { USER_TYPE_ADMIN } from '../constants/user-types';
import updateTripLocationHandler_v1 from './story_v1/update-location';
import requestTripHandler_v2 from './story_v2/request-trip';

const socketHandler = (socket) => {
  requestTripHandler(socket);
  requestTripHandler_v1(socket);
  requestTripHandler_v2(socket);
  startTripHandler(socket);
  updateLocationHandler(socket);
  updateTripLocationHandler_v1(socket);
  nearbyDriverHandler(socket);
  dashboardHandler(socket);
  userHandler(socket);
  fetchRidesUptoSevenDays(socket);
  cancelTripHandler(socket);
  updateTripRequestHandler(socket);
  updateTripRequestHandler_v1(socket);

  socket.on('hello', (data) => {
    console.log('listen to hello', data);
    socket.emit('helloResponse', 'hello everyone');
  });

  socket.on('disconnect', () => {
    console.log('disconnecting socket, userType, id, tripid', socket.userType, socket.userId, socket.tripID);
    let userId = ``;

    if((socket.userType == USER_TYPE_ADMIN) && socket.tripID) {
      userId = `${socket.authToken}/${socket.tripID}/`
    } else {
      userId = `${socket.authToken}/${socket.userId}/`;
    }
    SocketStore.removeByUserId(userId, socket);
  });
};

export default socketHandler;
