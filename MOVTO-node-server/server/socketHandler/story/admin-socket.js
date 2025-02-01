/* eslint-disable */
import SocketStore from '../../service/socket-store.js';

function dashboardHandler() {
  // console.log(socket, 'socket in dashboardHandler');
  // SocketStore.display();
  // SocketStore.emitByUserId(
  //   '59428b1bb0c3cc0f554fd52a',
  //   'getDriverDetails',
  //   'test'
  // );
  // const data = {
  //   name: 'admin',
  // };
  console.log(SocketStore);
  // socket.emit('getDriverDetails', data);
  // SocketStore.emitByUserId(
  //   '59428b1bb0c3cc0f554fd52a',
  //   'getDriverDetails',
  //   data
  // );
  // SocketStore.emitByUserId(tripRequestObj.riderId, 'socketError', { message: 'error while updating tripRequestStatus based on distance', data: err });
  // SocketStore.emitByUserId(tripRequestObj.driverId, 'socketError', { message: 'error while updating tripRequestStatus based on distance', data: err });
}
export default dashboardHandler;
