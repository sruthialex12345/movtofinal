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


describe('# socket start trip', function () {
  var rider1 = {
    email: 'abc2@xyz.com',
    password: '123',
    userType: _userTypes.USER_TYPE_RIDER,
    fname: 'abc2',
    lname: 'xyz2',
    phoneNo: '9876543210'
  };
  var riderJwtAccessToken = null;

  var rider2 = {
    email: 'asd2@xyz.com',
    password: '123',
    userType: _userTypes.USER_TYPE_RIDER,
    fname: 'asd2',
    lname: 'asd2',
    phoneNo: '9876543210'
  };
  var riderJwtAccessToken2 = null;

  var driver1 = {
    email: 'xyz12@abc.com',
    password: '123',
    userType: _userTypes.USER_TYPE_DRIVER,
    fname: 'xyz2',
    lname: 'abc2',
    phoneNo: '9876543210'
  };
  var driverJwtAccessToken = null;

  var driver2 = {
    email: 'qwe123@abc.com',
    password: '123',
    userType: _userTypes.USER_TYPE_DRIVER,
    fname: 'qwe2',
    lname: 'qwe2',
    phoneNo: '9876543210'
  };
  var driverJwtAccessToken2 = null;

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
    it('should create a new rider', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).post('/api/users/register').send(rider2).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(true);
        (0, _chai.expect)(res.body.data).to.have.all.keys('user', 'jwtAccessToken');
        rider2 = res.body.data.user;
        riderJwtAccessToken2 = res.body.data.jwtAccessToken;
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

  describe('# POST /api/users/register', function () {
    it('should create a new driver', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).post('/api/users/register').send(driver2).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(true);
        // expect(res.body.data).to.have.all.keys('user', 'jwtAccessToken');
        driver2 = res.body.data.user;
        driverJwtAccessToken2 = res.body.data.jwtAccessToken;
        done();
      });
    });
  });

  describe('# rider request for trip and driver start, end trip ', function () {
    it('rider should receieve end trip status', function (done) {
      var riderSocket2 = _socket2.default.connect('http://localhost:4123', { query: { token: riderJwtAccessToken2 } });
      var driverSocket = _socket2.default.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      var driverSocket2 = _socket2.default.connect('http://localhost:4123', { query: { token: driverJwtAccessToken2 } });
      var payload = {
        rider: rider2,
        tripRequest: {
          srcLoc: [25, 26],
          destLoc: [27, 28],
          pickUpAddress: 'geekyants(25, 26)',
          destAddress: 'bommanahalli(27, 28)',
          latitudeDelta: 0.123,
          longitudeDelta: 0.023
        }
      };
      riderSocket2.emit('requestTrip', payload);
      driverSocket.on('requestDriver', function () {
        // driver1 is already on some trip, so it should not get trip request evenet
      });

      driverSocket2.on('requestDriver', function (tripRequest) {
        var driverResponse = 1;
        if (driverResponse) {
          // when driver accepts the tripRequest then server fires an evenet(tripRequestUpdated) to rider
          (0, _chai.expect)(tripRequest.rider).to.be.an('object');
          (0, _chai.expect)(tripRequest.rider.currTripId).to.eql(tripRequest._id);
          (0, _chai.expect)(tripRequest.driver).to.be.an('object');
          (0, _chai.expect)(tripRequest.driver.currTripId).to.eql(tripRequest._id);

          tripRequest.tripRequestStatus = 'enRoute';
          tripRequest.tripRequestIssue = 'no Issue';
        }

        driverSocket2.emit('requestDriverResponse', tripRequest);

        // assuming driver has arrived at the pickUpAddress of the rider and start the trip
        tripRequest.tripRequestStatus = 'arrived';

        driverSocket2.emit('startTrip', tripRequest, function (tripObj) {
          tripAutomation(tripObj, driverSocket2);
          // callback function receives trip Object with the following property
          (0, _chai.expect)(tripObj.rider).to.be.an('object');
          (0, _chai.expect)(tripObj.rider.currTripId).to.eql(tripObj._id);
          (0, _chai.expect)(tripObj.rider.currTripState).to.eql('trip');
          (0, _chai.expect)(tripObj.driver).to.be.an('object');
          (0, _chai.expect)(tripObj.driver.currTripId).to.eql(tripObj._id);
          (0, _chai.expect)(tripObj.driver.currTripState).to.eql('trip');
        });
      });

      driverSocket2.on('tripUpdated', function (data) {
        if (data.tripStatus === 'endTrip' && data.riderRatingByDriver === 0) {
          (0, _chai.expect)(data.tripStatus).to.eql('endTrip');
          (0, _chai.expect)(data.driver).to.be.an('object');
          (0, _chai.expect)(data.driver.currTripId).to.eql(null);
          (0, _chai.expect)(data.driver.currTripState).to.eql(null);
          var rand = Math.floor(Math.random() * (5 - 2 + 1) * 2);
          data.riderRatingByDriver = rand;
          driverSocket2.emit('tripUpdate', data);
          driverSocket2.disconnect();
        }
      });

      riderSocket2.on('tripUpdated', function (data) {
        if (data.tripStatus === 'endTrip' && data.driverRatingByRider === 0) {
          (0, _chai.expect)(data.tripStatus).to.eql('endTrip');
          (0, _chai.expect)(data.driver).to.be.an('object');
          (0, _chai.expect)(data.driver.currTripId).to.eql(null);
          (0, _chai.expect)(data.driver.currTripState).to.eql(null);
          (0, _chai.expect)(data.rider).to.be.an('object');
          (0, _chai.expect)(data.rider.currTripId).to.eql(null);
          (0, _chai.expect)(data.rider.currTripState).to.eql(null);

          var rand = Math.floor(Math.random() * (5 - 2 + 1) * 2);
          data.driverRatingByRider = rand;
          riderSocket2.emit('tripUpdate', data);
          done();
          riderSocket2.disconnect();
        }
      });
      riderSocket2.on('socketError', function () {
        // console.log('some error occur in socket', data, '\ndisconnecting rider socket');
        riderSocket2.disconnect();
      });
      driverSocket2.on('socketError', function () {
        // console.log('some error occur in socket', data, '\ndisconnecting rider socket');
        driverSocket2.disconnect();
      });
    });
  });
  describe('# rider request for a trip driver arrived at the pickUpAddress and starts the trip', function () {
    it('should receive onTrip tripStatus by rider', function (done) {
      var riderSocket = _socket2.default.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      var driverSocket = _socket2.default.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      // let tripObj = null;
      var payload = {
        rider: rider1,
        tripRequest: {
          srcLoc: [101, 102],
          destLoc: [103, 104],
          pickUpAddress: 'geekyants(101, 102)',
          destAddress: 'bommanahalli(103, 104)',
          latitudeDelta: 0.123,
          longitudeDelta: 0.023
        }
      };
      riderSocket.emit('requestTrip', payload);

      driverSocket.on('requestDriver', function (tripRequest) {
        var driverResponse = 1;
        if (driverResponse) {
          // when driver accepts the tripRequest then server fires an evenet(tripRequestUpdated) to rider
          (0, _chai.expect)(tripRequest.rider).to.be.an('object');
          (0, _chai.expect)(tripRequest.rider.currTripId).to.eql(tripRequest._id);
          (0, _chai.expect)(tripRequest.rider.currTripState).to.eql('tripRequest');
          (0, _chai.expect)(tripRequest.driver).to.be.an('object');
          (0, _chai.expect)(tripRequest.driver.currTripId).to.eql(tripRequest._id);
          (0, _chai.expect)(tripRequest.driver.currTripState).to.eql('tripRequest');

          tripRequest.tripRequestStatus = 'enRoute';
          tripRequest.tripRequestIssue = 'no Issue';
        }
        driverSocket.emit('requestDriverResponse', tripRequest);

        // assuming driver has arrived at the pickUpAddress of the rider and start the trip
        tripRequest.tripRequestStatus = 'arrived';

        driverSocket.emit('startTrip', tripRequest, function (tripObj) {
          // callback function receives trip Object with the following property
          (0, _chai.expect)(tripObj.rider).to.be.an('object');
          (0, _chai.expect)(tripObj.rider.currTripId).to.eql(tripObj._id);
          (0, _chai.expect)(tripObj.rider.currTripState).to.eql('trip');
          (0, _chai.expect)(tripObj.driver).to.be.an('object');
          (0, _chai.expect)(tripObj.driver.currTripId).to.eql(tripObj._id);
          (0, _chai.expect)(tripObj.driver.currTripState).to.eql('trip');
        });
      });

      riderSocket.on('tripUpdated', function (data) {
        (0, _chai.expect)(data.tripStatus).to.eql('onTrip');
        (0, _chai.expect)(data.driver).to.be.an('object');
        (0, _chai.expect)(data.rider.currTripId).to.eql(data._id);
        (0, _chai.expect)(data.rider.currTripState).to.eql('trip');
        done();
        driverSocket.disconnect();
        riderSocket.disconnect();
      });
      riderSocket.on('socketError', function () {
        // console.log('some error occur in socket', data, '\ndisconnecting rider socket');
        riderSocket.disconnect();
      });
      driverSocket.on('socketError', function () {
        // console.log('some error occur in socket', data, '\ndisconnecting rider socket');
        driverSocket.disconnect();
      });
    });
  });

  describe('# rider request for a trip and all driver (driver1) is on some trip ', function () {
    it('rider should receive noNearByDriver tripRequestStatus', function (done) {
      var riderSocket2 = _socket2.default.connect('http://localhost:4123', { query: { token: riderJwtAccessToken2 } });
      var driverSocket = _socket2.default.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      var payload = {
        rider: rider2,
        tripRequest: {
          srcLoc: [1, 2],
          destLoc: [12, 13],
          pickUpAddress: 'geekyants',
          destAddress: 'bommanahalli',
          latitudeDelta: 0.123,
          longitudeDelta: 0.023
        }
      };
      riderSocket2.emit('requestTrip', payload);
      riderSocket2.on('tripRequestUpdated', function (data) {
        (0, _chai.expect)(data.tripRequestStatus).to.eql('noNearByDriver');
        done();
        riderSocket2.disconnect();
        driverSocket.disconnect();
      });
      riderSocket2.on('socketError', function () {
        // console.log('some error occur in socket', data, '\ndisconnecting rider socket');
        riderSocket2.disconnect();
      });
      driverSocket.on('socketError', function () {
        // console.log('some error occur in socket', data, '\ndisconnecting rider socket');
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
    it('should logout the rider successfully', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).get('/api/auth/logout').set('Authorization', riderJwtAccessToken2).expect(_httpStatus2.default.OK).then(function (res) {
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
  describe('# auth /api/auth/logout', function () {
    it('should logout the driver successfully', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).get('/api/auth/logout').set('Authorization', driverJwtAccessToken2).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(true);
        done();
      });
    });
  });
});

function tripAutomation(tripObj, driverSocket) {
  if (tripObj !== null || tripObj !== undefined) {
    tripObj.tripStatus = 'endTrip';
    driverSocket.emit('tripUpdate', tripObj);
  }
}
//# sourceMappingURL=userStartTrip.js.map
