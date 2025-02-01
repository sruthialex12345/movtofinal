'use strict';

var _supertestAsPromised = require('supertest-as-promised');

var _supertestAsPromised2 = _interopRequireDefault(_supertestAsPromised);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _index = require('../../index');

var _index2 = _interopRequireDefault(_index);

var _userTypes = require('../constants/user-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable */
_chai2.default.config.includeStack = true;

describe('# user Trip History', function () {
  var rider2 = {
    email: 'asd2@xyz.com',
    password: '123',
    userType: _userTypes.USER_TYPE_RIDER
  };
  var riderJwtAccessToken = null;

  var rider3 = {
    email: 'abcd@xyz.com',
    password: '12345',
    userType: _userTypes.USER_TYPE_RIDER,
    fname: 'abcd',
    lname: 'xyz',
    phoneNo: '9876543210'
  };
  var riderJwtAccessToken3 = null;

  describe('# POST /api/auth/login', function () {
    it('should authenticate rider and provide token', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).post('/api/auth/login').send(rider2).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(true);
        (0, _chai.expect)(res.body.data).to.have.all.keys('jwtAccessToken', 'user');
        (0, _chai.expect)(res.body.data.user.loginStatus).to.equal(true);
        rider2 = res.body.data.user;
        riderJwtAccessToken = res.body.data.jwtAccessToken;
        done();
      });
    });
  });

  describe('# GET /api/trips/history', function () {
    it('should receives user history details', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).get('/api/trips/history').set('Authorization', riderJwtAccessToken).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.eql(true);
        (0, _chai.expect)(res.body.message).to.eql('user trip history');
        (0, _chai.expect)(res.body.data).to.be.an('array');
        done();
      });
    });
  });

  describe('# POST /api/users/register', function () {
    it('should create a new user', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).post('/api/users/register').send(rider3).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(true);
        (0, _chai.expect)(res.body.data).to.have.all.keys('user', 'jwtAccessToken');
        rider3 = res.body.data.user;
        riderJwtAccessToken3 = res.body.data.jwtAccessToken;
        done();
      });
    });
  });

  describe('# GET /api/trips/history', function () {
    it('should receives no history available', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).get('/api/trips/history').set('Authorization', riderJwtAccessToken3).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.eql(true);
        (0, _chai.expect)(res.body.message).to.eql('no history available');
        (0, _chai.expect)(res.body.data.length).to.eql(0);
        done();
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
    it('should logout the rider2 successfully', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).get('/api/auth/logout').set('Authorization', riderJwtAccessToken3).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(true);
        done();
      });
    });
  });
});
//# sourceMappingURL=userTrip.js.map
