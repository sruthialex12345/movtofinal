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


describe('# update location of the user(rider and driver)', function () {
  var rider1 = {
    email: 'abc3@xyz.com',
    password: '123',
    userType: _userTypes.USER_TYPE_RIDER,
    fname: 'abc3',
    lname: 'xyz3',
    phoneNo: '9876543210'
  };
  var riderJwtAccessToken = null;

  var driver1 = {
    email: 'xyz3@abc.com',
    password: '123',
    userType: _userTypes.USER_TYPE_DRIVER,
    fname: 'xyz3',
    lname: 'abc3',
    phoneNo: '9876543210'
  };
  var driverJwtAccessToken = null;

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

  describe('# rider update location and not taking any trip', function () {
    it('should receive updated location event', function (done) {
      var riderSocket = _socket2.default.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      var latitude = Math.floor(Math.random() * (100 - 10 + 1) + 10);
      var longitude = Math.floor(Math.random() * (100 - 10 + 1) + 10);
      var loc = [latitude, longitude];
      rider1.gpsLoc = loc;
      riderSocket.emit('updateLocation', rider1);
      riderSocket.on('locationUpdated', function (updatedRiderObj) {
        (0, _chai.expect)(updatedRiderObj.gpsLoc).to.be.an('array');
        (0, _chai.expect)(updatedRiderObj.gpsLoc).to.eql(loc);
        done();
        riderSocket.disconnect();
      });
    });
  });

  describe('# driver update location and not taking any trip', function () {
    it('should receive updated location event', function (done) {
      var driverSocket = _socket2.default.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      var latitude = Math.floor(Math.random() * (100 - 10 + 1) + 10);
      var longitude = Math.floor(Math.random() * (100 - 10 + 1) + 10);
      var loc = [latitude, longitude];
      driver1.gpsLoc = loc;
      driverSocket.emit('updateLocation', driver1);
      driverSocket.on('locationUpdated', function (updatedDriverObj) {
        (0, _chai.expect)(updatedDriverObj.gpsLoc).to.be.an('array');
        (0, _chai.expect)(updatedDriverObj.gpsLoc).to.eql(loc);
        done();
        driverSocket.disconnect();
      });
    });
  });
  describe('# driver update location when in arriving tripRequest Status', function () {
    it('rider should receive driver updated location', function (done) {
      var riderSocket = _socket2.default.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      var driverSocket = _socket2.default.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      var payload = {
        rider: rider1,
        tripRequest: {
          srcLoc: [25, 26],
          destLoc: [27, 28],
          pickUpAddress: 'geekyants',
          destAddress: 'bommanahalli',
          latitudeDelta: 0.123,
          longitudeDelta: 0.023
        }
      };
      var loc = [12, 24];
      riderSocket.emit('requestTrip', payload);

      driverSocket.on('requestDriver', function (tripRequest) {
        var driverResponse = 1;
        if (driverResponse) {
          tripRequest.tripRequestStatus = 'enRoute';
          tripRequest.tripRequestIssue = 'no Issue';
          var index = 1;
          tripRequestAutomation(index, tripRequest, driverSocket);
        }
        driverSocket.emit('requestDriverResponse', tripRequest);
        driver1.gpsLoc = loc;
        driverSocket.emit('updateLocation', driver1);
      });
      riderSocket.on('tripRequestUpdated', function (data) {
        if (data.tripRequestStatus === 'completed') {
          // expect(data.tripRequestStatus).to.equal('completed');
          // done();
          driverSocket.disconnect();
          riderSocket.disconnect();
        }
      });
      riderSocket.on('updateDriverLocation', function (driverGps) {
        (0, _chai.expect)(driverGps).to.eql(loc);
        done();
      });
      driverSocket.on('tripRequestUpdated', function () {
        // expect(data.tripRequestStatus).to.equal('cancelled');
        // done();
        riderSocket.disconnect();
        driverSocket.disconnect();
      });
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
    it('should logout the driver successfully', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).get('/api/auth/logout').set('Authorization', driverJwtAccessToken).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(true);
        done();
      });
    });
  });
});
function tripRequestAutomation(index, tripRequestObj, driverSocket) {
  setTimeout(function () {
    index++;
    if (index === 2) {
      tripRequestObj.tripRequestStatus = 'arriving';
    } else if (index === 3) {
      tripRequestObj.tripRequestStatus = 'arrived';
    } else if (index === 4) {
      tripRequestObj.tripRequestStatus = 'completed';
    } else {
      return 0;
    }
    driverSocket.emit('tripRequestUpdate', tripRequestObj);
    return tripRequestAutomation(index, tripRequestObj, driverSocket);
  }, 2000);
}
//# sourceMappingURL=userUpdateLocation.test.js.map
