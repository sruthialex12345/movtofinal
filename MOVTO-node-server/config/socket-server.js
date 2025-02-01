import jwt from 'jsonwebtoken';
import config from './env';
import sockeHandler from '../server/socketHandler';
import SocketStore from '../server/service/socket-store';
import { USER_TYPE_ADMIN } from '../server/constants/user-types';
import UserSchema from '../server/models/user';

const debug = require('debug')('MGD-API:socket-server');

function startSocketServer(server) {
  const io = require('socket.io').listen(server); //eslint-disable-line

  // debug('SocketServer started');
  io.on('connection', (socket) => {
    console.log("new socket client>>>>>>", socket.id);
    // debug('Client connected to socket', socket.id);
    const authToken = socket.handshake.query.token ? socket.handshake.query.token.replace('JWT ', '') : ""; // check for authentication of the socket
    jwt.verify(authToken, config.jwtSecret, (err, userDtls) => {
      if (err) {
        socket.disconnect();
      } else if (userDtls) {
           UserSchema.findOneAsync({ _id: userDtls._id,isDeleted:false,jwtAccessToken:userDtls.numberunique })
              .then((user) => {
                if(user){
                  socket.userId = userDtls._id; //eslint-disable-line
                  socket.userType = userDtls.userType;
                  socket.authToken = authToken;
                  let userId = ``;
                  if((userDtls.userType == USER_TYPE_ADMIN) && socket.handshake.query.tripID) {
                    socket.tripID = socket.handshake.query.tripID;
                    userId = `${authToken}/${socket.handshake.query.tripID}/`
                  } else {
                    userId = `${authToken}/${socket.userId}/`;
                  }
                  debug(`inside socket server \n\n ${userDtls._id} ${userDtls.email} ${userDtls.fname}`); //eslint-disable-line
                  // SocketStore.addByUserId(socket.userId, socket);
                  SocketStore.addByUserId(userId, socket);
                  sockeHandler(socket); // call socketHandler to handle different socket scenario
                }else{
                  socket.disconnect();
                }
            })
            .error((e) => {
              socket.disconnect();
            });
        }
    });
  });
}

export default { startSocketServer };
