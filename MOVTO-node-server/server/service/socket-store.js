/**
 * SocketStore class is used to add socket to store, remove socket from store and emit socket event.
 */
/* eslint-disable */

const store = []; // Store keep tracks of userId and its corresponding socket.
class SocketStore {
  /**
   * Add socket object to the store.
   * @param userId - unique user id of the user.
   * @param socketObj- socketObj to which user is connected to.
   * @returns {success, message, data}
   */

  static addByUserId(userId, socketObj) {
    console.log("adding new socket");
    if (userId === 'undefined' || userId === null || socketObj === null || socketObj === 'undefined') {
      return returnFunc(false, 'userId or socketObj is undefine', '');
    } else {
      const newObj = {
        id: userId,
        socket: [socketObj],
      };
      if (store.length === 0) {
        store.push(newObj);
        displaySockets();
      } else {
        for (let i = 0; i < store.length; i++) {
          console.log('adding new socket for same client')
          if (store[i].id.toString() === userId.toString()) {
            // uncomment if need socket events to be fired on multile socket for same user
            // store[i].socket.push(socketObj);
            store[i].socket.splice(0,1,socketObj);
            displaySockets();
            // store[i].socket.splice(0, 1, socketObj);
            return returnFunc(true, `user Id and other socket is successfully stored, sockets for same client ${store[i].socket.length}`, '');
          }
        }
        store.push(newObj);
        displaySockets();
        return returnFunc(true, 'user Id and socket is successfully stored', '');
      }
    }
  }

  /**
   * Return socket object for the given user ID.
   * @param userId - unique user id of the user.
   * @returns {success, message, data}
   */

  static getByUserId(userId) {
    if (userId === undefined || userId === null) {
      return returnFunc(false, 'userId is undefined or null', '');
    } else if (store.length === 0) {
      return returnFunc(false, 'socket store is empty', '');
    } else {
      for (let i = 0; i < store.length; i++) {
        if (store[i].id.toString() === userId.toString()) {
          return returnFunc(true, 'userId and its corresponding socket found', store[i].socket);
        }
      }
      return returnFunc(false, 'userId and its corresponding socket not found in the store', '');
    }
  }

  /**
   * Return socket object for the given user ID.
   * @param userId - unique user id of the user.
   * @returns {success, message, data}
   */

  static removeByUserId(userId, socketObj) {
    console.log("removing socket");
    if (userId === null || userId === undefined || socketObj === null || socketObj === undefined) {
      return returnFunc(false, 'userId or socket obj is undefined or null');
    } else if (store.length === 0) {
      return returnFunc(false, 'socket store is empty', '');
    } else {
      for (let i = 0; i < store.length; i++) {
        // if (store[i].id.toString() === userId.toString()) {
        if (store[i].id.toString().indexOf(`/${userId.toString()}/`)>=0) {
          const socketObjectIndex = store[i].socket.indexOf(socketObj);
          if (socketObjectIndex !== -1) {
            store[i].socket.splice(socketObjectIndex, 1);
            displaySockets();
            return returnFunc(true, `removing userId and its corresponding socket obj remaining ${store[i].socket.length}`, store[i]);
          } else {
            return returnFunc(false, 'socketObj not found', '');
          }
        }
      }
      return returnFunc(false, 'userId not found', '');
    }
  }

  /**
   * Emit socket event to the given user ID.
   * @param userId - unique user id of the user.
   * @param eventName - event name to be emitted.
   * @param payload - data to be send to the user.
   * @returns {success, message, data}
   */

  static emitByUserId(userId, eventName, payload) {
    console.log('event to emit', userId, eventName);
    if (userId === undefined || userId === null) {
      return returnFunc(false, 'userId is undefined or null', '');
    } else if (store.length === 0) {
      return returnFunc(false, 'socket store is empty', '');
    } else {
      for (let i = 0; i < store.length; i++) {
        // if (store[i].id.toString() === userId.toString()) {
        if ( store[i].id.toString().indexOf(`/${userId.toString()}/`)>=0 ) {
          const socketArrayObject = store[i].socket;
          for (let j = 0; j < socketArrayObject.length; j++) {
            console.log("                                   ");
            console.log("****************** Start : emitByUserId ************************");
            console.log("                                   ");
            console.log("userId",userId);
            console.log("emitevent",eventName);
            console.log("                                   ");
            console.log("****************** END : emitByUserId ************************");

            socketArrayObject[j].emit(eventName, payload);
            returnFunc(true, `evenet emitted to socket no with same userid${j}`, '');
          }
        }
      }
      return returnFunc(false, 'no user found with the id.', store);
    }
  }

  /**
   * Emit socket event to the given user ID.
   * @param userId - unique user id of the user.
   * @param eventName - event name to be emitted.
   * @param payload - data to be send to the user.
   * @returns {success, message, data}
   */

  static emitToAll(eventName, payload) {
    if (store.length === 0) {
      return returnFunc(false, 'socket store is empty', '');
    } else {
      for (let i = 0; i < store.length; i++) {
        // store.socket.emit(eventName, payload);
        const socketArrayObject = store[i].socket;
        for (let j = 0; j < socketArrayObject.length; j++) {
          socketArrayObject[j].emit(eventName, payload);
        }
        return returnFunc(true, 'evenet emitted successfully', payload);
      }
      return returnFunc(false, 'no user found with the id.', store);
    }
  }

  static display() {
    console.log('********************sockets***********************')
    for (let i = 0; i < store.length; i++) {
      // console.log('--------->\nuserId', store[i].id, '\nsocketId\n');
      for (let j = 0; j < store[i].socket.length; j++) {
        console.log('\t', store[i].id, store[i].socket[j].id);
      }
      // console.log('\n\n');
    }
    console.log('****************************************************')
  }
}

function displaySockets() {
  console.log('********************sockets***********************')
  for (let i = 0; i < store.length; i++) {
    // console.log('--------->\nuserId', store[i].id, '\nsocketId\n');
    for (let j = 0; j < store[i].socket.length; j++) {
      console.log('\t', store[i].socket[j].id);
    }
    // console.log('\n\n');
  }
  console.log('****************************************************')
}

/**
 * Transform return Object
 */
function returnFunc(successStatus, msg, resultData) {
  // console.log("event returnfunc", successStatus, msg, resultData);
  return { success: successStatus, message: msg, data: resultData };
}

export default SocketStore;
