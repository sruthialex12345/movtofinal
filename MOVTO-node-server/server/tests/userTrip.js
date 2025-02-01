/* eslint-disable */
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai from 'chai';
import { expect } from 'chai';
import app from '../../index';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER } from '../constants/user-types';

chai.config.includeStack = true;

describe('# user Trip History', () => {
  let rider2 = {
    email: 'asd2@xyz.com',
    password: '123',
    userType: USER_TYPE_RIDER,
  };
  let riderJwtAccessToken = null;

  let rider3 = {
    email: 'abcd@xyz.com',
    password: '12345',
    userType: USER_TYPE_RIDER,
    fname: 'abcd',
    lname: 'xyz',
    phoneNo: '9876543210',
  };
  let riderJwtAccessToken3 = null;

  describe('# POST /api/auth/login', () => {
    it('should authenticate rider and provide token', done => {
      request(app)
        .post('/api/auth/login')
        .send(rider2)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.success).to.equal(true);
          expect(res.body.data).to.have.all.keys('jwtAccessToken', 'user');
          expect(res.body.data.user.loginStatus).to.equal(true);
          rider2 = res.body.data.user;
          riderJwtAccessToken = res.body.data.jwtAccessToken;
          done();
        });
    });
  });

  describe('# GET /api/trips/history', () => {
    it('should receives user history details', done => {
      request(app)
        .get('/api/trips/history')
        .set('Authorization', riderJwtAccessToken)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.success).to.eql(true);
          expect(res.body.message).to.eql('user trip history');
          expect(res.body.data).to.be.an('array');
          done();
        });
    });
  });

  describe('# POST /api/users/register', () => {
    it('should create a new user', done => {
      request(app)
        .post('/api/users/register')
        .send(rider3)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.success).to.equal(true);
          expect(res.body.data).to.have.all.keys('user', 'jwtAccessToken');
          rider3 = res.body.data.user;
          riderJwtAccessToken3 = res.body.data.jwtAccessToken;
          done();
        });
    });
  });

  describe('# GET /api/trips/history', () => {
    it('should receives no history available', done => {
      request(app)
        .get('/api/trips/history')
        .set('Authorization', riderJwtAccessToken3)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.success).to.eql(true);
          expect(res.body.message).to.eql('no history available');
          expect(res.body.data.length).to.eql(0);
          done();
        });
    });
  });
  describe('# auth /api/auth/logout', () => {
    it('should logout the rider successfully', done => {
      request(app)
        .get('/api/auth/logout')
        .set('Authorization', riderJwtAccessToken)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.success).to.equal(true);
          done();
        });
    });
  });
  describe('# auth /api/auth/logout', () => {
    it('should logout the rider2 successfully', done => {
      request(app)
        .get('/api/auth/logout')
        .set('Authorization', riderJwtAccessToken3)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.success).to.equal(true);
          done();
        });
    });
  });
});
