'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _index = require('../../index');

var _index2 = _interopRequireDefault(_index);

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

var _supertestAsPromised = require('supertest-as-promised');

var _supertestAsPromised2 = _interopRequireDefault(_supertestAsPromised);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _userTypes = require('../constants/user-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_chai2.default.config.includeStack = true; /* eslint-disable */


describe('# user Sync data api', function () {
  var rider1 = {
    email: 'abc321@xyz.com',
    password: '123',
    userType: _userTypes.USER_TYPE_RIDER,
    fname: 'abc321',
    lname: 'xyz321',
    phoneNo: '9876543210'
  };
  var riderJwtAccessToken = null;

  var driver1 = {
    email: 'xyz321@abc.com',
    password: '123',
    userType: _userTypes.USER_TYPE_DRIVER,
    fname: 'xyz321',
    lname: 'abc321',
    phoneNo: '9876543210'
  };
  var driverJwtAccessToken = null;
  var tripRequestObject = null;

  describe('# POST /api/users/register', function () {
    it('should create a new rider', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).post('/api/users/register').send(rider1).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(true);
        (0, _chai.expect)(res.body.data).to.have.all.keys('user', 'jwtAccessToken');
        rider1 = res.body.data.user;
        riderJwtAccessToken = res.body.data.jwtAccessToken;
        done();
      });
    });
  });

  describe('# POST /api/users/register', function () {
    it('should create a new driver', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).post('/api/users/register').send(driver1).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(true);
        // expect(res.body.data).to.have.all.keys('user', 'jwtAccessToken');
        driver1 = res.body.data.user;
        driverJwtAccessToken = res.body.data.jwtAccessToken;
        done();
      });
    });
  });

  describe('# user not in any trip or tripRequest', function () {
    it('# rider should receive tripRequest and trip Object as null', function (done) {
      var riderSocket = _socket2.default.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      riderSocket.disconnect();
      (0, _supertestAsPromised2.default)(_index2.default).get('/api/syncData').set('Authorization', riderJwtAccessToken).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.message).to.eql('user is not in any trip or tripRequest');
        (0, _chai.expect)(res.body.data.tripRequest).to.eql(null);
        (0, _chai.expect)(res.body.data.trip).to.eql(null);
        done();
      });
    });
  });
  describe('# rider in a tripRequest state and socket gets disconnedted', function () {
    it('rider should get the curr Synced data', function (done) {
      var riderSocket = _socket2.default.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      var driverSocket = _socket2.default.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      var payload = {
        rider: rider1,
        tripRequest: {
          srcLoc: [51, 61],
          destLoc: [71, 81],
          pickUpAddress: 'geekyants(51,61)',
          destAddress: 'bommanahalli(71,81)',
          latitudeDelta: 0.123,
          longitudeDelta: 0.023
        }
      };
      riderSocket.emit('requestTrip', payload);
      driverSocket.on('requestDriver', function (tripRequest) {
        var driverResponse = 1;
        if (driverResponse) {
          // tripRequest object should have following property
          (0, _chai.expect)(tripRequest.tripRequestStatus).to.eql('request');
          (0, _chai.expect)(tripRequest.driver).to.be.an('object');
          (0, _chai.expect)(tripRequest.driver.currTripId).to.eql(tripRequest._id);
          (0, _chai.expect)(tripRequest.driver.currTripState).to.eql('tripRequest');
          (0, _chai.expect)(tripRequest.rider).to.be.an('object');
          tripRequest.tripRequestStatus = 'enRoute';
          tripRequest.tripRequestIssue = 'no Issue';
          var index = 1;
          driverSocket.emit('requestDriverResponse', tripRequest);
          tripRequestAutomation(index, tripRequest, driverSocket);
        }
        // driverSocket.emit('requestDriverResponse', tripRequest);
      });
      // rider socket reconnect with the socket server and request a syncData api
      riderSocket = _socket2.default.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });

      setTimeout(function () {
        (0, _supertestAsPromised2.default)(_index2.default).get('/api/syncData').set('Authorization', riderJwtAccessToken).expect(_httpStatus2.default.OK).then(function (res) {
          (0, _chai.expect)(res.body.success).to.equal(true);
          (0, _chai.expect)(res.body.data.tripRequest).to.be.an('object');
          (0, _chai.expect)(res.body.data.trip).to.eql(null);
          done();
        });
      }, 200);
      riderSocket.on('tripRequestUpdated', function (tripRequestObj) {
        tripRequestObject = tripRequestObj;
        if (tripRequestObj.tripRequestStatus === 'arrived') {
          (0, _chai.expect)(tripRequestObj.tripRequestStatus).to.be.eql('arrived');
          riderSocket.disconnect();
          driverSocket.disconnect();
        }
      });
    });
  });
  describe('# rider and driver is in trip and rider socket gets disconnedted', function () {
    it('# rider should get trip object in syncData api call', function (done) {
      var riderSocket = _socket2.default.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      var driverSocket = _socket2.default.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      // let tripObject = null;
      // using the above tripRequestObject for start trip
      driverSocket.emit('startTrip', tripRequestObject, function (tripObj) {
        if (tripObj !== null) {
          // tripAutomation(tripObj, driverSocket);
          // callback function receives trip Object with the following property
          (0, _chai.expect)(tripObj.rider).to.be.an('object');
          (0, _chai.expect)(tripObj.rider.currTripId).to.eql(tripObj._id);
          (0, _chai.expect)(tripObj.rider.currTripState).to.eql('trip');
          (0, _chai.expect)(tripObj.driver).to.be.an('object');
          (0, _chai.expect)(tripObj.driver.currTripId).to.eql(tripObj._id);
          (0, _chai.expect)(tripObj.driver.currTripState).to.eql('trip');
          // tripObject = tripObj;
          setTimeout(function () {
            tripObj.tripStatus = 'endTrip';
            driverSocket.emit('endTrip', tripObj);
          }, 50);
        }
      });
      riderSocket.disconnect();
      // syncing rider data from the database
      setTimeout(function () {
        (0, _supertestAsPromised2.default)(_index2.default).get('/api/syncData').set('Authorization', riderJwtAccessToken).expect(_httpStatus2.default.OK).then(function (res) {
          (0, _chai.expect)(res.body.success).to.equal(true);
          (0, _chai.expect)(res.body.data.tripRequest).to.eql(null);
          (0, _chai.expect)(res.body.data.trip).to.be.an('object');
          done();
        });
      }, 50);
    });
  });
  describe('# auth /api/auth/logout', function () {
    it('should logout the rider successfully', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).get('/api/auth/logout').set('Authorization', riderJwtAccessToken).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(true);
        done();
      });
    });
  });
  describe('# auth /api/auth/logout', function () {
    it('should logout the rider successfully', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).get('/api/auth/logout').set('Authorization', driverJwtAccessToken).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(true);
        done();
      });
    });
  });
});

function tripRequestAutomation(index, tripRequestObj, driverSocket) {
  index++;
  if (index === 2) {
    tripRequestObj.tripRequestStatus = 'arriving';
  } else if (index === 3) {
    tripRequestObj.tripRequestStatus = 'arrived';
  } else {
    return 0;
  }
  driverSocket.emit('tripRequestUpdate', tripRequestObj);
  return tripRequestAutomation(index, tripRequestObj, driverSocket);
}

// function tripAutomation(tripObj, driverSocket) {
//   if (tripObj !== null || tripObj !== undefined) {
//     tripObj.tripStatus = 'endTrip';
//     driverSocket.emit('tripUpdate', tripObj);
//   }
// }
//# sourceMappingURL=userSyncData.js.map
