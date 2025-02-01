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

_chai2.default.config.includeStack = true;

describe('## User(Rider) APIs', function () {
  var rider1 = {
    email: 'gauravp145@xyz.com',
    password: '123',
    userType: _userTypes.USER_TYPE_RIDER,
    fname: 'gaurav',
    lname: 'porwal',
    phoneNo: '9876543210'
  };

  var rider2 = {
    email: 'gauravp145@xyz.com',
    password: '12345',
    userType: _userTypes.USER_TYPE_RIDER,
    fname: 'a123',
    lname: 'porwal',
    phoneNo: '9876543210'
  };
  var jwtAccessToken = null;

  describe('# POST /api/users/register', function () {
    it('should create a new user', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).post('/api/users/register').send(rider1).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(true);
        (0, _chai.expect)(res.body.data).to.have.all.keys('user', 'jwtAccessToken');
        rider1 = res.body.data.user;
        jwtAccessToken = res.body.data.jwtAccessToken;
        done();
      });
    });
  });

  describe('# POST /api/users/register', function () {
    it('should not create new user with same email', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).post('/api/users/register').send(rider2).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(false);
        (0, _chai.expect)(res.body.message).to.equal('user already exist');
        done();
      });
    });
  });

  describe('# Error handling POST /api/users/register', function () {
    it('should throw parameter validation error', function (done) {
      delete rider2.phoneNo;
      (0, _supertestAsPromised2.default)(_index2.default).post('/api/users/register').send(rider2).expect(_httpStatus2.default.BAD_REQUEST).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(false);
        done();
      });
    });
  });

  describe('# get /api/users', function () {
    it('should get the user details', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).get('/api/users').set('Authorization', jwtAccessToken).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(true);
        (0, _chai.expect)(res.body.data.fname).to.equal(rider1.fname);
        done();
      });
    });
  });

  describe('# Error handling get /api/users', function () {
    it('should get UNAUTHORIZED error as no token provided', function (done) {
      (0, _supertestAsPromised2.default)(_index2.default).get('/api/users').expect(_httpStatus2.default.UNAUTHORIZED).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(false);
        done();
      });
    });
  });

  describe('# PUT /api/users', function () {
    it('should update user details', function (done) {
      rider1.fname = 'akshay';
      rider1.phoneNo = '9876543210';
      (0, _supertestAsPromised2.default)(_index2.default).put('/api/users').set('Authorization', jwtAccessToken).send(rider1).expect(_httpStatus2.default.OK).then(function (res) {
        (0, _chai.expect)(res.body.success).to.equal(true);
        (0, _chai.expect)(res.body.data).to.be.an('object');
        rider1 = res.body.data;
        done();
      });
    });
  });

  // describe('# Error handling PUT /api/users', () => {
  //   it('should give BAD_REQUEST as phoneNo less than 10 digit', (done) => {
  //     rider1.fname = 'akshay';
  //     rider1.phoneNo = '987654330';
  //     request(app)
  //       .put('/api/users')
  //       .set('Authorization', jwtAccessToken)
  //       .send(rider1)
  //       .expect(httpStatus.BAD_REQUEST)
  //       .then((res) => {
  //         expect(res.body.success).to.equal(false);
  //         done();
  //       });
  //   });
  // });

  // describe('# DELETE /api/users', () => {
  //   it('should delete the rider', (done) => {
  //     request(app)
  //       .delete('/api/users')
  //       .set('Authorization', jwtAccessToken)
  //       .expect(httpStatus.OK)
  //       .then((res) => {
  //         expect(res.body.success).to.equal(true);
  //         expect(res.body.data).to.be.an('object');
  //         jwtAccessToken = null;
  //         done();
  //       });
  //   });
  // });
});
//# sourceMappingURL=user.test.js.map
