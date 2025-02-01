import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../index';
import { USER_TYPE_RIDER } from '../constants/user-types';

chai.config.includeStack = true;

describe('## User(Rider) APIs', () => {
  let rider1 = {
    email: 'gauravp145@xyz.com',
    password: '123',
    userType: USER_TYPE_RIDER,
    fname: 'gaurav',
    lname: 'porwal',
    phoneNo: '9876543210',
  };

  const rider2 = {
    email: 'gauravp145@xyz.com',
    password: '12345',
    userType: USER_TYPE_RIDER,
    fname: 'a123',
    lname: 'porwal',
    phoneNo: '9876543210',
  };
  let jwtAccessToken = null;

  describe('# POST /api/users/register', () => {
    it('should create a new user', (done) => {
      request(app)
        .post('/api/users/register')
        .send(rider1)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.success).to.equal(true);
          expect(res.body.data).to.have.all.keys('user', 'jwtAccessToken');
          rider1 = res.body.data.user;
          jwtAccessToken = res.body.data.jwtAccessToken;
          done();
        });
    });
  });

  describe('# POST /api/users/register', () => {
    it('should not create new user with same email', (done) => {
      request(app)
        .post('/api/users/register')
        .send(rider2)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.success).to.equal(false);
          expect(res.body.message).to.equal('user already exist');
          done();
        });
    });
  });

  describe('# Error handling POST /api/users/register', () => {
    it('should throw parameter validation error', (done) => {
      delete rider2.phoneNo;
      request(app)
        .post('/api/users/register')
        .send(rider2)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          expect(res.body.success).to.equal(false);
          done();
        });
    });
  });

  describe('# get /api/users', () => {
    it('should get the user details', (done) => {
      request(app)
        .get('/api/users')
        .set('Authorization', jwtAccessToken)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.success).to.equal(true);
          expect(res.body.data.fname).to.equal(rider1.fname);
          done();
        });
    });
  });

  describe('# Error handling get /api/users', () => {
    it('should get UNAUTHORIZED error as no token provided', (done) => {
      request(app)
        .get('/api/users')
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.success).to.equal(false);
          done();
        });
    });
  });

  describe('# PUT /api/users', () => {
    it('should update user details', (done) => {
      rider1.fname = 'akshay';
      rider1.phoneNo = '9876543210';
      request(app)
        .put('/api/users')
        .set('Authorization', jwtAccessToken)
        .send(rider1)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.success).to.equal(true);
          expect(res.body.data).to.be.an('object');
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
