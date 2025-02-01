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


describe('# socket trip request ', function () {
  var rider1 = {
    email: 'abc1@xyz.com',
    password: '123',
    userType: _userTypes.USER_TYPE_RIDER,
    fname: 'abc1',
    lname: 'xyz1',
    phoneNo: '9876543210'
  };
  var riderJwtAccessToken = null;

  var driver1 = {
    email: 'xyz123@abc.com',
    password: '123',
    userType: _userTypes.USER_TYPE_DRIVER,
    fname: 'xyz1',
    lname: 'abc1',
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

  describe('# rider request for a trip with no driver available', function () {
    it('should receive noNearByDriver status', function (done) {
      var riderSocket = _socket2.default.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      var payload = {
        rider: rider1,
        tripRequest: {
          srcLoc: [1, 2],
          destLoc: [3, 4],
          pickUpAddress: 'geekyants',
          destAddress: 'bommanahalli',
          latitudeDelta: 0.123,
          longitudeDelta: 0.023
        }
      };
      riderSocket.emit('requestTrip', payload);
      riderSocket.on('tripRequestUpdated', function (data) {
        (0, _chai.expect)(data.tripRequestStatus).to.equal('noNearByDriver');
        riderSocket.disconnect();
        done();
      });
    });
  });
  describe('# rider request for a trip when driver available but reject the tripRequest', function () {
    it('rider should receive noNearByDriver status', function (done) {
      var riderSocket = _socket2.default.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      var driverSocket = _socket2.default.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      var payload = {
        rider: rider1,
        tripRequest: {
          srcLoc: [5, 6],
          destLoc: [7, 8],
          pickUpAddress: 'geekyants',
          destAddress: 'bommanahalli',
          latitudeDelta: 0.123,
          longitudeDelta: 0.023
        }
      };
      riderSocket.emit('requestTrip', payload);

      driverSocket.on('requestDriver', function (tripRequest) {
        var driverResponse = 0;
        if (!driverResponse) {
          // tripRequest object should have following property
          (0, _chai.expect)(tripRequest.tripRequestStatus).to.eql('request');
          (0, _chai.expect)(tripRequest.driver).to.be.an('object');
          (0, _chai.expect)(tripRequest.driver.currTripId).to.eql(tripRequest._id);
          (0, _chai.expect)(tripRequest.driver.currTripState).to.eql('tripRequest');
          (0, _chai.expect)(tripRequest.rider).to.be.an('object');
          tripRequest.tripRequestStatus = 'rejected';
          tripRequest.tripRequestIssue = 'not interrested';
        }
        driverSocket.emit('requestDriverResponse', tripRequest);
      });

      riderSocket.on('tripRequestUpdated', function (tripRequestObj) {
        (0, _chai.expect)(tripRequestObj.tripRequestStatus).to.equal('noNearByDriver');
        riderSocket.disconnect();
        driverSocket.disconnect();
        done();
      });
    });
  });
  describe('# rider request for a trip and driver accepts it but rider cancelled the tripRequest', function () {
    it('should receive cancelled status by driver', function (done) {
      var riderSocket = _socket2.default.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      var driverSocket = _socket2.default.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      var payload = {
        rider: rider1,
        tripRequest: {
          srcLoc: [9, 10],
          destLoc: [11, 12],
          pickUpAddress: 'geekyants',
          destAddress: 'bommanahalli',
          latitudeDelta: 0.123,
          longitudeDelta: 0.023
        }
      };
      riderSocket.emit('requestTrip', payload);

      driverSocket.on('requestDriver', function (tripRequest) {
        console.log('***************tripRequest@@@@@@@@@@@@@', tripRequest);
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
        }
        driverSocket.emit('requestDriverResponse', tripRequest);
      });

      riderSocket.on('tripRequestUpdated', function (tripRequestObj) {
        if (tripRequestObj.tripRequestStatus === 'enRoute') {
          (0, _chai.expect)(tripRequestObj.rider.currTripId).to.eql(tripRequestObj._id);
          (0, _chai.expect)(tripRequestObj.rider.currTripState).to.eql('tripRequest');
          // rider cancelling the trip request
          tripRequestObj.tripRequestStatus = 'cancelled';
          tripRequestObj.tripRequestIssue = 'driver taking too much time to arrive';
          riderSocket.emit('tripRequestUpdate', tripRequestObj);
        }
      });
      driverSocket.on('tripRequestUpdated', function (data) {
        (0, _chai.expect)(data.tripRequestStatus).to.equal('cancelled');
        (0, _chai.expect)(data.driver).to.be.an('object');
        (0, _chai.expect)(data.driver.currTripId).to.eql(null);
        (0, _chai.expect)(data.driver.currTripState).to.eql(null);
        done();
        riderSocket.disconnect();
        driverSocket.disconnect();
      });
    });
  });
  describe('# rider request for a trip and driver accepts it and driver arrived at the pickUpAddress', function () {
    it('rider should receive completed tripRequestStatus', function (done) {
      var riderSocket = _socket2.default.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      var driverSocket = _socket2.default.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      var payload = {
        rider: rider1,
        tripRequest: {
          srcLoc: [13, 14],
          destLoc: [15, 16],
          pickUpAddress: 'geekyants',
          destAddress: 'bommanahalli',
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
      riderSocket.on('tripRequestUpdated', function (tripRequestObject) {
        if (tripRequestObject.tripRequestStatus === 'enRoute') {
          // when driver accepts the tripRequest then server fires an evenet(tripRequestUpdated) to rider
          (0, _chai.expect)(tripRequestObject.rider).to.be.an('object');
          (0, _chai.expect)(tripRequestObject.rider.currTripId).to.eql(tripRequestObject._id);
          (0, _chai.expect)(tripRequestObject.rider.currTripState).to.eql('tripRequest');
          (0, _chai.expect)(tripRequestObject.driver).to.be.an('object');
          (0, _chai.expect)(tripRequestObject.driver.currTripId).to.eql(tripRequestObject._id);
          (0, _chai.expect)(tripRequestObject.driver.currTripState).to.eql('tripRequest');
        }
        if (tripRequestObject.tripRequestStatus === 'completed') {
          (0, _chai.expect)(tripRequestObject.tripRequestStatus).to.equal('completed');
          (0, _chai.expect)(tripRequestObject.rider).to.be.an('object');
          (0, _chai.expect)(tripRequestObject.rider.currTripId).to.eql(tripRequestObject._id);
          (0, _chai.expect)(tripRequestObject.rider.currTripState).to.eql('tripRequest');
          done();
          driverSocket.disconnect();
          riderSocket.disconnect();
        }
      });
      // in case rider cancelled the trip request
      driverSocket.on('tripRequestUpdated', function (data) {
        (0, _chai.expect)(data.tripRequestStatus).to.equal('cancelled');
        done();
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
    it('should logout the rider successfully', function (done) {
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
  }, 400);
}
//# sourceMappingURL=userRequestTrip.js.map
