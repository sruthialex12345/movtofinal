'use strict';

var _supertestAsPromised = require('supertest-as-promised');

var _supertestAsPromised2 = _interopRequireDefault(_supertestAsPromised);

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _index = require('../../index');

var _index2 = _interopRequireDefault(_index);

var _userTypes = require('../constants/user-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_chai2.default.config.includeStack = true;

describe('# Socket ', function () {
  var riderSocket = void 0;
  var driverSocket = void 0;
  var rider1 = {
    email: 'abc@xyz.com',
    password: '123',
    userType: _userTypes.USER_TYPE_RIDER,
    fname: 'gaurav',
    lname: 'porwal',
    phoneNo: '9876543210'
  };
  var riderJwtAccessToken = null;

  var driver1 = {
    email: 'xyz@abc.com',
    password: '123',
    userType: _userTypes.USER_TYPE_DRIVER,
    fname: 'akshay',
    lname: 'porwal',
    phoneNo: '9876543210'
  };
  var driverJwtAccessToken = null;

  describe('# POST /api/users/register', function () {
    it('should create a new rider', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).post('/api/users/register').send(rider1).expect(_httpStatus2.default.OK).then(function (res) {
        console.log('res******\n\n', res, '\n******\n');
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

  describe('# rider socket connection and disconnection', function () {
    it('should connect to socket', function (done) {
      riderSocket = _socket2.default.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      riderSocket.on('connect', function () {
        riderSocket.emit('hello');
      });
      riderSocket.on('helloResponse', function (data) {
        (0, _chai.expect)(data).to.equal('hello everyone');
        riderSocket.disconnect();
      });
      riderSocket.on('disconnect', function () {
        done();
      });
    });
  });

  describe('# socket connection(without token) rider', function () {
    it('should disconnect socket automatically as no token provided', function (done) {
      var riderSocketNoToken = _socket2.default.connect('http://localhost:4123', { query: { token: null } });
      riderSocketNoToken.on('disconnect', function () {
        done();
      });
    });
  });

  describe('# socket connection driver', function () {
    it('should connect to socket', function (done) {
      driverSocket = _socket2.default.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      driverSocket.on('connect', function () {
        driverSocket.emit('hello');
      });
      driverSocket.on('helloResponse', function (data) {
        (0, _chai.expect)(data).to.equal('hello everyone');
        driverSocket.disconnect();
      });
      driverSocket.on('disconnect', function () {
        done();
      });
    });
  });

  describe('# socket connection(without token) driver', function () {
    it('should disconnect socket automatically as no token provided', function (done) {
      var driverSocketNoToken = _socket2.default.connect('http://localhost:4123', { query: { token: null } });
      driverSocketNoToken.on('disconnect', function () {
        done();
      });
    });
  });
});
//# sourceMappingURL=Socket.test.js.map
