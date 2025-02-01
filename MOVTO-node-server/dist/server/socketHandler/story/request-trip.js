'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _deferred = require('deferred');

var _deferred2 = _interopRequireDefault(_deferred);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _APIError = require('../../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _appConfig = require('../../models/appConfig');

var _appConfig2 = _interopRequireDefault(_appConfig);

var _env = require('../../../config/env');

var _env2 = _interopRequireDefault(_env);

var _transformResponse = require('../../service/transform-response');

var _emailApi = require('../../service/emailApi');

var _emailApi2 = _interopRequireDefault(_emailApi);

var _pushExpo = require('../../service/pushExpo');

var _pushExpo2 = _interopRequireDefault(_pushExpo);

var _pushNotification = require('../../service/pushNotification');

var PushNotification = _interopRequireWildcard(_pushNotification);

var _smsApi = require('../../service/smsApi');

var _socketStore = require('../../service/socket-store.js');

var _socketStore2 = _interopRequireDefault(_socketStore);

var _tripRequest = require('../../models/tripRequest');

var _tripRequest2 = _interopRequireDefault(_tripRequest);

var _user = require('../../models/user');

var _user2 = _interopRequireDefault(_user);

var _trip = require('../../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _driverRouteTerminal = require('../../models/driverRouteTerminal');

var _driverRouteTerminal2 = _interopRequireDefault(_driverRouteTerminal);

var _userTypes = require('../../constants/user-types');

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//eslint-disable-line
var watchIdObj = {};
var promObj = {};
/**
 * Get appConfig
 * @returns {appConfig}
 */
function getConfig() {
  return new _bluebird2.default(function (resolve, reject) {
    _appConfig2.default.findOneAsync({ key: 'sendConfig' }).then(function (foundDetails) {
      resolve(foundDetails.value);
    }).catch(function (err) {
      reject(err);
    });
  });
}

function requestTripHandler(socket) {
  socket.on('requestTrip', function (payload) {
    console.log("requestTrip payload", payload);
    /**
     * 1. lookup nearby drivers. preffered way is to lookup for the driver who has yet to reach the pickup point on it's way
     * 2. create new requestTrip on terminal selected as source by the rider
     * 2. notify the driver with event "requestDriver" and payload with created requestTrip obj
     * 3. wait for 10 minutes for driver response
     * 4. if driver accept the request notify the user with driver details along with vehicle details
     * 5. else if driver doesn't respond in 10 minutes or reject, respond with
     */
    var riderID = payload.rider._id;
    var sourceDestIds = [payload.request.sourceLoc, payload.request.destLoc];
    _bluebird2.default.all(sourceDestIds.map(function (id) {
      return _driverRouteTerminal2.default.findOneAsync({ _id: id }).then(function (result) {
        return result;
      });
    })).then(function (sourceDestterminals) {
      console.log('results of terminals', (0, _stringify2.default)(sourceDestterminals));
      // results is an array of source and destination terminals
      if (sourceDestterminals && sourceDestterminals.length) {
        payload.request.sourceLoc = sourceDestterminals[0];
        payload.request.destLoc = sourceDestterminals[1];
        // eslint-disable-next-line
        var quantum = 10;
        // eslint-disable-next-line
        nearByDriver(riderID, payload.request).then(function (result) {
          var nearByDriversDoc = result.foundDrivers;
          // add rider details to the payload on request to attach the riderdetails to the payload sent to the driver with event
          payload.request.riderDetails = result.riderDetails;

          if (nearByDriversDoc && nearByDriversDoc.length) {
            // send notification event to the driver
            sendRequestToDriver(payload, nearByDriversDoc[0].driver[0]).then(function (res) {
              if (res) {
                console.log('request sent to driver', res);
                _socketStore2.default.emitByUserId(res.tripRequest && res.tripRequest.riderId && res.tripRequest.riderId || riderID, 'rideRequestSentToDriver', { success: true,
                  message: 'Request Sent to the driver', data: res.tripRequest });
                var pushData = {
                  payload: { success: true, message: 'Request Sent to the driver', data: res.tripRequest },
                  body: 'Request has been sent to the driver: ' + res.driver.name,
                  title: 'New Request'
                };
                PushNotification.sendNotificationByUserIdAsync(riderID, pushData);
              } else {
                _socketStore2.default.emitByUserId(riderID, 'noDriverOnRequestRide', { success: false, message: 'No drivers around', data: null });
              }
            }).catch(function (err) {
              console.log('request to driver err', err);
              _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: 'Error while notifying driver', data: null });
            });
          } else {
            // SendNotification(riderID, 'No nearby drivers');
            _socketStore2.default.emitByUserId(riderID, 'noDriverOnRequestRide', { success: false, message: 'No drivers around', data: null });
          }
        }).catch(function (e) {
          console.log('error', e);
          _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: 'Something went wrong, while looking for nearby driver', data: null });
        });
      } else {
        _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: 'Something went wrong, terminals not found', data: null });
      }
    }).catch(function (e) {
      console.log("promise all error", e);
      _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: 'Something went wrong', data: null });
    });
  });
  socket.on('requestDriverResponse', function (tripRequest) {
    // eslint-disable-next-line
    clearInterval(watchIdObj[tripRequest._id]);
    // eslint-disable-next-line
    var driverId = tripRequest.driver._id;
    promObj[driverId].resolve(tripRequest); // or resolve promise
  });
  socket.on('tripRequestUpdate', function (payload) {
    // eslint-disable-next-line
    _tripRequest2.default.findOneAndUpdateAsync({ _id: payload._id }, { $set: payload }, { new: true }).then(function (updatedTripRequestObject) {
      if (updatedTripRequestObject.tripRequestStatus === 'cancelled') {
        _user2.default.updateAsync({ $or: [{ _id: payload.riderId }, { _id: payload.driverId }] }, { $set: { currTripId: null, currTripState: null } }, { new: true, multi: true }).then(function () {
          // updated user records
        }).error(function (e) {
          _socketStore2.default.emitByUserId(payload.riderId, 'socketError', { message: 'error while updating curTripId  to null in requestDriverResponse', data: e });
          _socketStore2.default.emitByUserId(payload.driverId, 'socketError', { message: 'error while updating curTripId to null in requestDriverResponse', data: e });
        });
      }
      (0, _transformResponse.fetchReturnObj)(updatedTripRequestObject).then(function (updatedTripRequestObj) {
        if (socket.userId.toString() === updatedTripRequestObj.riderId.toString()) {
          console.log('updatedTripRequestObj.riderId', updatedTripRequestObj.riderId);
          (0, _pushExpo2.default)(updatedTripRequestObj.riderId, updatedTripRequestObj.tripRequestStatus);
          (0, _pushExpo2.default)(updatedTripRequestObj.driver, updatedTripRequestObj.tripRequestStatus);
          _socketStore2.default.emitByUserId(updatedTripRequestObj.driverId, 'tripRequestUpdated', updatedTripRequestObj);
        } else if (socket.userId.toString() === updatedTripRequestObj.driverId.toString()) {
          _socketStore2.default.emitByUserId(updatedTripRequestObj.riderId, 'tripRequestUpdated', updatedTripRequestObj);
          (0, _pushExpo2.default)(updatedTripRequestObj.riderId, updatedTripRequestObj.tripRequestStatus);
          (0, _pushExpo2.default)(updatedTripRequestObj.driver, updatedTripRequestObj.tripRequestStatus);
        }
      });
    }).error(function (e) {
      // error occured while updating tripRequestObj
      _socketStore2.default.emitByUserId(payload.riderId, 'socketError', e);
      _socketStore2.default.emitByUserId(payload.driverId, 'socketError', e);
    });
  });
  // Round robin algorithm for driver dispatch:
  function roundRobinAsync(nearByDriversDoc, quantum, rider) {
    // returns promise which resolves in success and faliure boolean values
    // suppose 5 drivers
    // each driver will be sent request.
    // expect a response in quantum time.
    // if response is accept - assign that driver. break process and return
    // if response is reject - remove driver from the list and select next driver to request from queue
    // if no response - next driver please.
    // - no arrival time burst time concept.
    // - queue structure will be based on database query fetch.
    return new _bluebird2.default(function (resolve, reject) {
      var count = 0;
      var remain = nearByDriversDoc.length;
      var prom = (0, _deferred2.default)();
      dispatchHandlerAsync(nearByDriversDoc, quantum, remain, count, rider, prom).then(function (result) {
        return resolve(result);
      }).catch(function (error) {
        return reject(error);
      });
    });
  }
  function dispatchHandlerAsync(nearByDrivers, quantum, remain, count, rider, prom) {
    if (remain <= 0) {
      prom.resolve(false);
      return prom.promise;
    }
    // eslint-disable-next-line
    promObj[nearByDrivers[count]._id] = (0, _deferred2.default)();
    // eslint-disable-next-line
    sendRequestAsync(nearByDrivers[count], quantum, rider, promObj[nearByDrivers[count]._id]).then(function (tripRequest) {
      var response = tripRequest.tripRequestStatus;
      if (response === 'enRoute') {
        dispatchDriverAsync(tripRequest).then(function () {
          return prom.resolve(true);
        }).catch(function (error) {
          return prom.reject(error);
        });
        getConfig().then(function (data) {
          if (data.email.rideAcceptRider) {
            (0, _emailApi2.default)(tripRequest.riderId, tripRequest, 'rideAccept');
          }
          if (data.sms.rideAcceptRider) {
            (0, _smsApi.sendSms)(tripRequest.riderId, 'Your ride request is accepted .');
          }
        });
      } else if (response === 'rejected') {
        resetTripRequestAsync(nearByDrivers[count]) // driver rejected so update the database to clear tripRequest made
        .then(function () {
          nearByDrivers = removeDriverFromList(nearByDrivers, count);
          // nearByDrivers.forEach((driver) => console.log(driver.fname));
          count = 0;
          remain--;
          setTimeout(function () {
            dispatchHandlerAsync(nearByDrivers, quantum, remain, count, rider, prom);
          }, 1000);
        });
      }
    }, function () {
      console.log('noResponseFromDriver');
      nearByDrivers = removeDriverFromList(nearByDrivers, count);
      count = 0;
      remain--;
      setTimeout(function () {
        dispatchHandlerAsync(nearByDrivers, quantum, remain, count, rider, prom);
      }, 1000);
    });
    return prom.promise;
  }
  function sendRequestAsync(driver, timeout, rider, def) {
    // return tripRequest object which contain response
    console.log('inside sendRequestAsync', driver.fname);
    createTripRequestObjAsync(rider, driver).then(function (tripRequestObj) {
      // eslint-disable-next-line

      _socketStore2.default.emitByUserId(driver._id, 'requestDriver', tripRequestObj);
      notifyDriverAdminTripStatus(driver._id, 'requestAdmin', tripRequestObj);
      watchIdObj[tripRequestObj._id] = setInterval(function () {
        timeout--;
        if (timeout <= 0) {
          // eslint-disable-next-line
          clearInterval(watchIdObj[tripRequestObj._id]);
          resetTripRequestAsync(driver) // driver did not respond so update the database to clear tripRequest made.
          .then(function () {
            // eslint-disable-next-line
            _socketStore2.default.emitByUserId(driver._id, 'responseTimedOut'); // clear tripRequest object on driver side
            // flag = true;
            def.reject('noResponseFromDriver');
          });
        }
      }, 1000);
    }).catch(function (err) {
      return console.log('error', err);
    });
    return def.promise;
  }

  function sendRequestToDriver(payload, driver) {
    return new _bluebird2.default(function (resolve, reject) {
      createTripRequestAsync(payload, driver).then(function (tripRequestObj) {
        if (tripRequestObj) {
          // eslint-disable-next-line
          var resToDriver = (0, _extends3.default)({}, tripRequestObj._doc);
          resToDriver.riderDetails = payload.request.riderDetails;
          console.log("request sent to the driver here", tripRequestObj.driverId);
          _socketStore2.default.emitByUserId(driver._id, 'requestDriver', { success: true, message: "Request received", data: resToDriver });
          notifyDriverAdminTripStatus(driver._id, 'requestAdmin', { success: true, message: "Request received", data: resToDriver });
          var pushData = {
            payload: { success: true, message: 'Request Sent to the driver', data: resToDriver },
            body: 'New request received from the rider: ' + resToDriver.riderDetails.name,
            title: 'New Request received'
          };
          PushNotification.sendNotificationByUserIdAsync(driver._id, pushData);
          _trip2.default.findOneAndUpdateAsync({ driverId: tripRequestObj.driverId, activeStatus: true }, { $addToSet: { tripRequests: tripRequestObj } }, { new: true }).then(function (updatedTrip) {
            var resData = {
              tripRequest: tripRequestObj,
              driver: driver
            };
            return resolve(resData);
          }).catch(function (err) {
            return reject(err);
          });
        } else {
          resolve(null);
        }

        // watchIdObj[tripRequestObj._id] = setInterval(() => {
        //   // eslint-disable-next-line
        //   clearInterval(watchIdObj[tripRequestObj._id]);
        //   // resetTripRequestAsync(driver) // driver did not respond so update the database to clear tripRequest made.
        //   // .then(() => {
        //   //   // eslint-disable-next-line
        //   //   SocketStore.emitByUserId(driver._id, 'responseTimedOut'); // clear tripRequest object on driver side
        //   //   // flag = true;
        //   //   reject('noResponseFromDriver');
        //   // })
        //   // .catch((err)=>{
        //   //   reject(err);
        //   // });
        //   console.log('cleared interval');
        // }, 1000);
      }).catch(function (err) {

        console.log('error', err);
        return reject(err);
      });
    });
  }

  function dispatchDriverAsync(tripRequestObj) {
    return new _bluebird2.default(function (resolve) {
      // eslint-disable-next-line
      _tripRequest2.default.findOneAndUpdateAsync({ _id: tripRequestObj._id }, { $set: tripRequestObj }, { new: true }).then(function (updatedTripRequestObject) {
        return resolve((0, _transformResponse.fetchReturnObj)(updatedTripRequestObject).then(function (updatedTripRequestObj) {
          if (updatedTripRequestObj.tripRequestStatus === 'noNearByDriver') {
            updatedTripRequestObj.rider = null;
            updatedTripRequestObj.driver = null;
            updatedTripRequestObj.driverId = null;
          }
          _socketStore2.default.emitByUserId(tripRequestObj.riderId, 'tripRequestUpdated', updatedTripRequestObj);
        }));
      }).error(function (e) {
        _socketStore2.default.emitByUserId(tripRequestObj.driverId, 'socketError', e);
      });
    });
  }
  function removeDriverFromList(drivers, index) {
    // test passed
    return drivers.slice(0, index).concat(drivers.slice(index + 1));
  }
  function createTripRequestObjAsync(payload, driver) {
    console.log("createrequstobj", driver);
    return new _bluebird2.default(function (resolve, reject) {
      // eslint-disable-next-line
      var riderID = payload.rider._id;
      var srcLocation = payload.tripRequest.srcLoc;
      var destLocation = payload.tripRequest.destLoc;
      var pickUpAdrs = payload.tripRequest.pickUpAddress;
      var destAdrs = payload.tripRequest.destAddress;
      var latDelta = payload.tripRequest.latitudeDelta;
      var lonDelta = payload.tripRequest.longitudeDelta;
      var paymentMode = payload.tripRequest.paymentMode;
      // eslint-disable-next-line

      var driverID = driver._id;
      _trip2.default.findOneAsync({ driverId: driver._id, activeStatus: true }).then(function (response) {
        console.log("saved request obj", response);
        var tripRequestObj = new _tripRequest2.default({
          riderId: riderID,
          driverId: driverID,
          tripId: response._id,
          srcLoc: srcLocation,
          destLoc: destLocation,
          pickUpAddress: pickUpAdrs,
          destAddress: destAdrs,
          latitudeDelta: latDelta,
          longitudeDelta: lonDelta,
          paymentMode: paymentMode
        });
        console.log('SAVING HERE', tripRequestObj);
        tripRequestObj.saveAsync().then(function (savedTripRequest) {
          savedTripRequest.rider = null;
          savedTripRequest.driver = null;
          _user2.default.updateAsync({ $or: [{ _id: savedTripRequest.riderId }, { _id: savedTripRequest.driverId }] },
          // eslint-disable-next-line
          { $set: { currTripId: savedTripRequest._id, currTripState: 'tripRequest' } }, { new: true, multi: true }).then(function () {
            (0, _transformResponse.fetchReturnObj)(savedTripRequest).then(function (returnObj) {
              return resolve(returnObj);
            });
          }).error(function (e) {
            _socketStore2.default.emitByUserId(riderID, 'socketError', { message: 'error while updating curTripId in requestTrip', data: e });
            _socketStore2.default.emitByUserId(driverID, 'socketError', { message: 'error while updating curTripId in requestTrip', data: e });
            reject(e);
          });
        }).error(function (e) {
          _socketStore2.default.emitByUserId(riderID, 'socketError', e);
          reject(e);
        });
      }).catch(function (error) {
        _socketStore2.default.emitByUserId(riderID, 'socketError', error);
        reject(error);
      });
    });
  }

  // create trip request on rider trip request
  function createTripRequestAsync(payload, driver) {
    var riderID = payload.rider._id;
    return new _bluebird2.default(function (resolve, reject) {
      // eslint-disable-next-line
      var srcLocation = payload.request.sourceLoc;
      var destLocation = payload.request.destLoc;
      var startAddress = payload.request.startAddress;
      var endAddress = payload.request.endAddress;
      // const pickUpAdrs = payload.tripRequest.pickUpAddress;
      // const destAdrs = payload.tripRequest.destAddress;
      // const latDelta = payload.tripRequest.latitudeDelta;
      // const lonDelta = payload.tripRequest.longitudeDelta;
      // const { paymentMode } = payload.tripRequest;
      // eslint-disable-next-line
      var driverID = driver._id;
      // let timeStampvalue = (new Date()).toISOString();
      // TripSchema.findOneAsync({driverId: driver._id, activeStatus: true})
      // .then(response=>{
      //   if(!response) {
      //     return reject(new Error("No trip found"));
      //   }
      //   const tripRequestObj = new TripRequest({
      //     riderId: riderID,
      //     driverId: driverID,
      //     tripId: response._id,
      //     srcLoc: srcLocation,
      //     destLoc: destLocation,
      //     endAddress:endAddress,
      //     startAddress:startAddress,
      //     seatBooked: payload.request.seats ? payload.request.seats : 1,
      //     requestTime: timeStampvalue
      //   });
      //   console.log('SAVING THERE',tripRequestObj)
      //   tripRequestObj
      //   .saveAsync()
      //   .then((savedTripRequest) => {
      //     savedTripRequest.rider = null;
      //     savedTripRequest.driver = null;
      //     resolve(savedTripRequest);
      //   })
      //   .error((e) => {
      //     SocketStore.emitByUserId(riderID, 'socketError', {success: false, message: "Something went wrong", data: null});
      //     reject(e);
      //   });
      // })
      // .catch(error=>{
      //   SocketStore.emitByUserId(riderID, 'socketError', error);
      //   reject(error)
      // })

      //save request with adminId

      var getDriverTripAdminAsync = [
      // get driver's trip details async
      new _bluebird2.default(function (resolve, reject) {
        _trip2.default.findOneAsync({ driverId: driver._id, activeStatus: true }).then(function (response) {
          console.log("driver trip found", response);
          if (!response) {
            return resolve(null);
          } else {
            return resolve(response);
          }
        }).catch(function (error) {
          reject(error);
        });
      })];

      _bluebird2.default.all(getDriverTripAdminAsync).then(function (result) {
        console.log('admintripresult found', result);
        if (result && result.length && result[0]) {
          var driverTrip = result[0];
          var driverAdmin = payload.request.sourceLoc.adminId;
          if (!driverTrip) {
            return reject(new Error("No trip found"));
          }
          // else if (!driverAdmin) {
          //   return reject(new Error("No driver admin found"));
          // }
          var timeStampvalue = new Date().toISOString();
          var tripRequestObj = new _tripRequest2.default({
            riderId: riderID,
            driverId: driverID,
            tripId: driverTrip._id,
            adminId: driverAdmin,
            srcLoc: srcLocation,
            destLoc: destLocation,
            endAddress: endAddress,
            startAddress: startAddress,
            seatBooked: payload.request.seats ? payload.request.seats : 1,
            requestTime: timeStampvalue
          });
          console.log('SAVING THERE', tripRequestObj);
          tripRequestObj.saveAsync().then(function (savedTripRequest) {
            savedTripRequest.rider = null;
            savedTripRequest.driver = null;
            resolve(savedTripRequest);
          }).error(function (e) {
            _socketStore2.default.emitByUserId(riderID, 'socketError', { success: false, message: "Something went wrong", data: null });
            reject(e);
          });
        } else {
          resolve(null);
          // return reject(new Error('driver admin and trip not found'))
        }
      }).catch(function (error) {
        return reject(error);
      });
    });
  }
  function resetTripRequestAsync(driverObj) {
    // query to reset tripRequest object for a particular driver in database.
    return new _bluebird2.default(function (resolve) {
      // eslint-disable-next-line
      _user2.default.updateAsync(
      // eslint-disable-next-line
      { $or: [{ _id: driverObj._id }] }, { $set: { currTripId: null, currTripState: null } }, { new: true, multi: true }).then(function () {
        return resolve();
      }).error(function (e) {
        _socketStore2.default.emitByUserId(driverObj.riderId, 'socketError', { message: 'error while updating curTripId  to null in requestDriverResponse', data: e });
        _socketStore2.default.emitByUserId(driverObj.driverId, 'socketError', { message: 'error while updating curTripId to null in requestDriverResponse', data: e });
      });
    });
  }
  function checkSocketConnection(id) {
    var res = _socketStore2.default.getByUserId(id);
    if (res.success && res.data.length) {
      return true;
    } else {
      return false;
    }
  }

  function nearByDriver(riderId, request) {
    console.log('request is', request, (0, _typeof3.default)(request.sourceLoc), (0, _typeof3.default)(request.destLoc));
    var sourceLoc = request.sourceLoc.loc;
    var destLoc = request.destLoc.loc;
    console.log("driver nearby src dest", request);
    // var request = JSON.parse(JSON.stringify(request));
    return new _bluebird2.default(function (resolve, reject) {
      return _user2.default.findOneAsync({ _id: riderId, userType: _userTypes.USER_TYPE_RIDER }).then(function (userDoc) {
        var result = {
          foundDrivers: [],
          riderDetails: {}
        };
        if (userDoc) {
          console.log('rider found', userDoc);
          /**
           * matches driver that contains the trip request source and destination
           * as their route waypoints
           */
          return _driverRouteTerminal2.default.aggregateAsync([{
            $match: {
              "adminId": _mongoose2.default.Types.ObjectId(request.sourceLoc.adminId || request.destLoc.adminId)
            }
          }, {
            $group: {
              _id: "$driverId",
              terminals: { $addToSet: "$loc" }
            }
          }, {
            $match: {
              "terminals": {
                $all: [sourceLoc, destLoc]
              }
            }
          }, {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'driver'
            }
          }, {
            $match: {
              "driver.loginStatus": true,
              "driver.isAvailable": true
            }
          }]).then(function (foundDrivers) {
            if (foundDrivers) {
              console.log('drivers found on request ride', foundDrivers);
              result.foundDrivers = foundDrivers;
              result.riderDetails = userDoc;
              return resolve(result);
            } else {
              // console.log('no nearByDriver driver found');
              var err = new _APIError2.default('no nearByDriver found', _httpStatus2.default.INTERNAL_SERVER_ERROR);
              return reject(err);
            }
          }).error(function (driverErr) {
            // console.log('error while searching near by driver ');
            return reject(driverErr);
          });
        } else {
          // console.log('no rider found with the given rider id');
          var err = new _APIError2.default('no rider found with the given id', _httpStatus2.default.INTERNAL_SERVER_ERROR);
          // return reject(err);
          return resolve(result);
        }
      }).error(function (e) {
        // console.log('error while searching rider ');
        var err = new _APIError2.default('error while searching user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        return reject(err);
      });
    });
  }
}

function notifyDriverAdminTripStatus(driverId, event, payload) {
  var resPayload = (0, _extends3.default)({}, payload);
  var query = {
    driverId: driverId,
    activeStatus: true
  };
  _trip2.default.findOne(query, { "activeStatus": 1, "visitedTerminal": 1, "gpsLoc": 1 }).populate([{ path: 'driverId', select: 'name email' }]).then(function (result) {
    console.log('updated trip status, found admin', result);
    if (result) {
      resPayload.tripData = result;
      _socketStore2.default.emitByUserId(payload.data.tripId, event, resPayload);
    }
  });
}

exports.default = requestTripHandler;
module.exports = exports.default;
//# sourceMappingURL=request-trip.js.map
