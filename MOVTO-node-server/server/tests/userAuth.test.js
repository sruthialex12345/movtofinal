/* eslint-disable */
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai from 'chai';
import { expect } from 'chai';
import app from '../../index';
import { USER_TYPE_RIDER } from '../constants/user-types';

chai.config.includeStack = true;

describe('# auth api ', () => {
  let rider1 = {
    email: 'gauravp145@xyz.com',
    password: '123',
    userType: USER_TYPE_RIDER,
  };
  let jwtAccessToken = null;

  describe('# POST /api/auth/login', () => {
    it('should authenticate user and provide token', done => {
      request(app)
        .post('/api/auth/login')
        .send(rider1)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.success).to.equal(true);
          expect(res.body.data).to.have.all.keys('jwtAccessToken', 'user');
          expect(res.body.data.user.loginStatus).to.equal(true);
          rider1 = res.body.data.user;
          jwtAccessToken = res.body.data.jwtAccessToken;
          done();
        });
    });
  });

  describe('# auth /api/auth/login', () => {
    it('should give BAD_REQUEST as userType is not provided', done => {
      const rider = {
        email: 'gauravp145@sahusoft.com',
        password: '123',
      };
      request(app)
        .post('/api/auth/login')
        .send(rider)
        .expect(httpStatus.BAD_REQUEST)
        .then(res => {
          expect(res.body.success).to.equal(false);
          done();
        });
    });
  });

  describe('# auth /api/auth/login', () => {
    it('should give UNAUTHORIZED as wrong password is given', done => {
      rider1.password = '123344';
      request(app)
        .post('/api/auth/login')
        .send(rider1)
        .expect(httpStatus.UNAUTHORIZED)
        .then(res => {
          expect(res.body.success).to.equal(false);
          done();
        });
    });
  });

  describe('# auth /api/auth/login', () => {
    it('should give not found error(wrong email)', done => {
      rider1.email = 'xyz@sahusoft.com';
      rider1.password = '123';
      request(app)
        .post('/api/auth/login')
        .send(rider1)
        .expect(httpStatus.NOT_FOUND)
        .then(res => {
          expect(res.body.success).to.equal(false);
          done();
        });
    });
  });

  describe('# auth /api/auth/logout', () => {
    it('should give UNAUTHORIZED as no token provided', done => {
      request(app)
        .get('/api/auth/logout')
        .expect(httpStatus.UNAUTHORIZED)
        .then(res => {
          expect(res.body.success).to.equal(false);
          done();
        });
    });
  });

  describe('# auth /api/auth/logout', () => {
    it('should logout the rider successfully', done => {
      request(app)
        .get('/api/auth/logout')
        .set('Authorization', jwtAccessToken)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.success).to.equal(true);
          done();
        });
    });
  });

  describe('# DELETE /api/users', () => {
    it('should delete the rider', done => {
      request(app)
        .delete('/api/users')
        .set('Authorization', jwtAccessToken)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.success).to.equal(true);
          expect(res.body.data).to.be.an('object');
          jwtAccessToken = null;
          done();
        });
    });
  });
});
