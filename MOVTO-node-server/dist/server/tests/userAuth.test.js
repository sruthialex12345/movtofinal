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

describe('# auth api ', function () {
  var rider1 = {
    email: 'gauravp145@xyz.com',
    password: '123',
    userType: _userTypes.USER_TYPE_RIDER
  };
  var jwtAccessToken = null;

  describe('# POST /api/auth/login', function () {
    it('should authenticate user and provide token', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).post('/api/auth/login').send(rider1).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(true);
        (0, _chai.expect)(res.body.data).to.have.all.keys('jwtAccessToken', 'user');
        (0, _chai.expect)(res.body.data.user.loginStatus).to.equal(true);
        rider1 = res.body.data.user;
        jwtAccessToken = res.body.data.jwtAccessToken;
        done();
      });
    });
  });

  describe('# auth /api/auth/login', function () {
    it('should give BAD_REQUEST as userType is not provided', function (done) {
      var rider = {
        email: 'gauravp145@sahusoft.com',
        password: '123'
      };
      (0, _supertestAsPromised2.default)(_index2.default).post('/api/auth/login').send(rider).expect(_httpStatus2.default.BAD_REQUEST).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(false);
        done();
      });
    });
  });

  describe('# auth /api/auth/login', function () {
    it('should give UNAUTHORIZED as wrong password is given', function (done) {
      rider1.password = '123344';
      (0, _supertestAsPromised2.default)(_index2.default).post('/api/auth/login').send(rider1).expect(_httpStatus2.default.UNAUTHORIZED).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(false);
        done();
      });
    });
  });

  describe('# auth /api/auth/login', function () {
    it('should give not found error(wrong email)', function (done) {
      rider1.email = 'xyz@sahusoft.com';
      rider1.password = '123';
      (0, _supertestAsPromised2.default)(_index2.default).post('/api/auth/login').send(rider1).expect(_httpStatus2.default.NOT_FOUND).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(false);
        done();
      });
    });
  });

  describe('# auth /api/auth/logout', function () {
    it('should give UNAUTHORIZED as no token provided', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).get('/api/auth/logout').expect(_httpStatus2.default.UNAUTHORIZED).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(false);
        done();
      });
    });
  });

  describe('# auth /api/auth/logout', function () {
    it('should logout the rider successfully', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).get('/api/auth/logout').set('Authorization', jwtAccessToken).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(true);
        done();
      });
    });
  });

  describe('# DELETE /api/users', function () {
    it('should delete the rider', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).delete('/api/users').set('Authorization', jwtAccessToken).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(true);
        (0, _chai.expect)(res.body.data).to.be.an('object');
        jwtAccessToken = null;
        done();
      });
    });
  });
});
//# sourceMappingURL=userAuth.test.js.map
