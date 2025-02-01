/* eslint-disable */
import chai from 'chai';
import { expect } from 'chai';
import app from '../../index';
import io from 'socket.io-client';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER } from '../constants/user-types';

chai.config.includeStack = true;

describe('# update location of the user(rider and driver)', () => {
  let rider1 = {
    email: 'abc3@xyz.com',
    password: '123',
    userType: USER_TYPE_RIDER,
    fname: 'abc3',
    lname: 'xyz3',
    phoneNo: '9876543210',
  };
  let riderJwtAccessToken = null;

  let driver1 = {
    email: 'xyz3@abc.com',
    password: '123',
    userType: USER_TYPE_DRIVER,
    fname: 'xyz3',
    lname: 'abc3',
    phoneNo: '9876543210',
  };
  let driverJwtAccessToken = null;

  describe('# POST /api/users/register', () => {
    it('should create a new rider', done => {
      request(app)
        .post('/api/users/register')
        .send(rider1)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.success).to.equal(true);
          expect(res.body.data).to.have.all.keys('user', 'jwtAccessToken');
          rider1 = res.body.data.user;
          riderJwtAccessToken = res.body.data.jwtAccessToken;
          done();
        });
    });
  });

  describe('# POST /api/users/register', () => {
    it('should create a new driver', done => {
      request(app)
        .post('/api/users/register')
        .send(driver1)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.success).to.equal(true);
          // expect(res.body.data).to.have.all.keys('user', 'jwtAccessToken');
          driver1 = res.body.data.user;
          driverJwtAccessToken = res.body.data.jwtAccessToken;
          done();
        });
    });
  });

  describe('# rider update location and not taking any trip', () => {
    it('should receive updated location event', done => {
      const riderSocket = io.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      const latitude = Math.floor(Math.random() * (100 - 10 + 1) + 10);
      const longitude = Math.floor(Math.random() * (100 - 10 + 1) + 10);
      const loc = [latitude, longitude];
      rider1.gpsLoc = loc;
      riderSocket.emit('updateLocation', rider1);
      riderSocket.on('locationUpdated', updatedRiderObj => {
        expect(updatedRiderObj.gpsLoc).to.be.an('array');
        expect(updatedRiderObj.gpsLoc).to.eql(loc);
        done();
        riderSocket.disconnect();
      });
    });
  });

  describe('# driver update location and not taking any trip', () => {
    it('should receive updated location event', done => {
      const driverSocket = io.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      const latitude = Math.floor(Math.random() * (100 - 10 + 1) + 10);
      const longitude = Math.floor(Math.random() * (100 - 10 + 1) + 10);
      const loc = [latitude, longitude];
      driver1.gpsLoc = loc;
      driverSocket.emit('updateLocation', driver1);
      driverSocket.on('locationUpdated', updatedDriverObj => {
        expect(updatedDriverObj.gpsLoc).to.be.an('array');
        expect(updatedDriverObj.gpsLoc).to.eql(loc);
        done();
        driverSocket.disconnect();
      });
    });
  });
  describe('# driver update location when in arriving tripRequest Status', () => {
    it('rider should receive driver updated location', done => {
      const riderSocket = io.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      const driverSocket = io.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      const payload = {
        rider: rider1,
        tripRequest: {
          srcLoc: [25, 26],
          destLoc: [27, 28],
          pickUpAddress: 'geekyants',
          destAddress: 'bommanahalli',
          latitudeDelta: 0.123,
          longitudeDelta: 0.023,
        },
      };
      const loc = [12, 24];
      riderSocket.emit('requestTrip', payload);

      driverSocket.on('requestDriver', tripRequest => {
        const driverResponse = 1;
        if (driverResponse) {
          tripRequest.tripRequestStatus = 'enRoute';
          tripRequest.tripRequestIssue = 'no Issue';
          const index = 1;
          tripRequestAutomation(index, tripRequest, driverSocket);
        }
        driverSocket.emit('requestDriverResponse', tripRequest);
        driver1.gpsLoc = loc;
        driverSocket.emit('updateLocation', driver1);
      });
      riderSocket.on('tripRequestUpdated', data => {
        if (data.tripRequestStatus === 'completed') {
          // expect(data.tripRequestStatus).to.equal('completed');
          // done();
          driverSocket.disconnect();
          riderSocket.disconnect();
        }
      });
      riderSocket.on('updateDriverLocation', driverGps => {
        expect(driverGps).to.eql(loc);
        done();
      });
      driverSocket.on('tripRequestUpdated', () => {
        // expect(data.tripRequestStatus).to.equal('cancelled');
        // done();
        riderSocket.disconnect();
        driverSocket.disconnect();
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
    it('should logout the driver successfully', done => {
      request(app)
        .get('/api/auth/logout')
        .set('Authorization', driverJwtAccessToken)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.success).to.equal(true);
          done();
        });
    });
  });
});
function tripRequestAutomation(index, tripRequestObj, driverSocket) {
  setTimeout(() => {
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
  }, 2000);
}
