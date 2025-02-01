import request from 'supertest-as-promised';
import chai, { expect } from 'chai';
import io from 'socket.io-client';
import httpStatus from 'http-status';
import app from '../../index';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER } from '../constants/user-types';

chai.config.includeStack = true;

describe('# Socket ', () => {
  let riderSocket;
  let driverSocket;
  let rider1 = {
    email: 'abc@xyz.com',
    password: '123',
    userType: USER_TYPE_RIDER,
    fname: 'gaurav',
    lname: 'porwal',
    phoneNo: '9876543210',
  };
  let riderJwtAccessToken = null;

  let driver1 = {
    email: 'xyz@abc.com',
    password: '123',
    userType: USER_TYPE_DRIVER,
    fname: 'akshay',
    lname: 'porwal',
    phoneNo: '9876543210',
  };
  let driverJwtAccessToken = null;

  describe('# POST /api/users/register', () => {
    it('should create a new rider', (done) => {
      request(app)
        .post('/api/users/register')
        .send(rider1)
        .expect(httpStatus.OK)
        .then((res) => {
          console.log('res******\n\n', res, '\n******\n');
          expect(res.body.success).to.equal(true);
          expect(res.body.data).to.have.all.keys('user', 'jwtAccessToken');
          rider1 = res.body.data.user;
          riderJwtAccessToken = res.body.data.jwtAccessToken;
          done();
        });
    });
  });

  describe('# POST /api/users/register', () => {
    it('should create a new driver', (done) => {
      request(app)
        .post('/api/users/register')
        .send(driver1)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.success).to.equal(true);
          // expect(res.body.data).to.have.all.keys('user', 'jwtAccessToken');
          driver1 = res.body.data.user;
          driverJwtAccessToken = res.body.data.jwtAccessToken;
          done();
        });
    });
  });

  describe('# rider socket connection and disconnection', () => {
    it('should connect to socket', (done) => {
      riderSocket = io.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      riderSocket.on('connect', () => {
        riderSocket.emit('hello');
      });
      riderSocket.on('helloResponse', (data) => {
        expect(data).to.equal('hello everyone');
        riderSocket.disconnect();
      });
      riderSocket.on('disconnect', () => {
        done();
      });
    });
  });

  describe('# socket connection(without token) rider', () => {
    it('should disconnect socket automatically as no token provided', (done) => {
      const riderSocketNoToken = io.connect('http://localhost:4123', { query: { token: null } });
      riderSocketNoToken.on('disconnect', () => {
        done();
      });
    });
  });

  describe('# socket connection driver', () => {
    it('should connect to socket', (done) => {
      driverSocket = io.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      driverSocket.on('connect', () => {
        driverSocket.emit('hello');
      });
      driverSocket.on('helloResponse', (data) => {
        expect(data).to.equal('hello everyone');
        driverSocket.disconnect();
      });
      driverSocket.on('disconnect', () => {
        done();
      });
    });
  });

  describe('# socket connection(without token) driver', () => {
    it('should disconnect socket automatically as no token provided', (done) => {
      const driverSocketNoToken = io.connect('http://localhost:4123', { query: { token: null } });
      driverSocketNoToken.on('disconnect', () => {
        done();
      });
    });
  });
});
