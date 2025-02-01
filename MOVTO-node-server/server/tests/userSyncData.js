/* eslint-disable */
import chai from 'chai';
import { expect } from 'chai';
import app from '../../index';
import io from 'socket.io-client';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER } from '../constants/user-types';

chai.config.includeStack = true;

describe('# user Sync data api', () => {
  let rider1 = {
    email: 'abc321@xyz.com',
    password: '123',
    userType: USER_TYPE_RIDER,
    fname: 'abc321',
    lname: 'xyz321',
    phoneNo: '9876543210',
  };
  let riderJwtAccessToken = null;

  let driver1 = {
    email: 'xyz321@abc.com',
    password: '123',
    userType: USER_TYPE_DRIVER,
    fname: 'xyz321',
    lname: 'abc321',
    phoneNo: '9876543210',
  };
  let driverJwtAccessToken = null;
  let tripRequestObject = null;

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

  describe('# user not in any trip or tripRequest', () => {
    it('# rider should receive tripRequest and trip Object as null', done => {
      const riderSocket = io.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      riderSocket.disconnect();
      request(app)
        .get('/api/syncData')
        .set('Authorization', riderJwtAccessToken)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.message).to.eql('user is not in any trip or tripRequest');
          expect(res.body.data.tripRequest).to.eql(null);
          expect(res.body.data.trip).to.eql(null);
          done();
        });
    });
  });
  describe('# rider in a tripRequest state and socket gets disconnedted', () => {
    it('rider should get the curr Synced data', done => {
      let riderSocket = io.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      const driverSocket = io.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      const payload = {
        rider: rider1,
        tripRequest: {
          srcLoc: [51, 61],
          destLoc: [71, 81],
          pickUpAddress: 'geekyants(51,61)',
          destAddress: 'bommanahalli(71,81)',
          latitudeDelta: 0.123,
          longitudeDelta: 0.023,
        },
      };
      riderSocket.emit('requestTrip', payload);
      driverSocket.on('requestDriver', tripRequest => {
        const driverResponse = 1;
        if (driverResponse) {
          // tripRequest object should have following property
          expect(tripRequest.tripRequestStatus).to.eql('request');
          expect(tripRequest.driver).to.be.an('object');
          expect(tripRequest.driver.currTripId).to.eql(tripRequest._id);
          expect(tripRequest.driver.currTripState).to.eql('tripRequest');
          expect(tripRequest.rider).to.be.an('object');
          tripRequest.tripRequestStatus = 'enRoute';
          tripRequest.tripRequestIssue = 'no Issue';
          const index = 1;
          driverSocket.emit('requestDriverResponse', tripRequest);
          tripRequestAutomation(index, tripRequest, driverSocket);
        }
        // driverSocket.emit('requestDriverResponse', tripRequest);
      });
      // rider socket reconnect with the socket server and request a syncData api
      riderSocket = io.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });

      setTimeout(() => {
        request(app)
          .get('/api/syncData')
          .set('Authorization', riderJwtAccessToken)
          .expect(httpStatus.OK)
          .then(res => {
            expect(res.body.success).to.equal(true);
            expect(res.body.data.tripRequest).to.be.an('object');
            expect(res.body.data.trip).to.eql(null);
            done();
          });
      }, 200);
      riderSocket.on('tripRequestUpdated', tripRequestObj => {
        tripRequestObject = tripRequestObj;
        if (tripRequestObj.tripRequestStatus === 'arrived') {
          expect(tripRequestObj.tripRequestStatus).to.be.eql('arrived');
          riderSocket.disconnect();
          driverSocket.disconnect();
        }
      });
    });
  });
  describe('# rider and driver is in trip and rider socket gets disconnedted', () => {
    it('# rider should get trip object in syncData api call', done => {
      const riderSocket = io.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      const driverSocket = io.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      // let tripObject = null;
      // using the above tripRequestObject for start trip
      driverSocket.emit('startTrip', tripRequestObject, tripObj => {
        if (tripObj !== null) {
          // tripAutomation(tripObj, driverSocket);
          // callback function receives trip Object with the following property
          expect(tripObj.rider).to.be.an('object');
          expect(tripObj.rider.currTripId).to.eql(tripObj._id);
          expect(tripObj.rider.currTripState).to.eql('trip');
          expect(tripObj.driver).to.be.an('object');
          expect(tripObj.driver.currTripId).to.eql(tripObj._id);
          expect(tripObj.driver.currTripState).to.eql('trip');
          // tripObject = tripObj;
          setTimeout(() => {
            tripObj.tripStatus = 'endTrip';
            driverSocket.emit('endTrip', tripObj);
          }, 50);
        }
      });
      riderSocket.disconnect();
      // syncing rider data from the database
      setTimeout(() => {
        request(app)
          .get('/api/syncData')
          .set('Authorization', riderJwtAccessToken)
          .expect(httpStatus.OK)
          .then(res => {
            expect(res.body.success).to.equal(true);
            expect(res.body.data.tripRequest).to.eql(null);
            expect(res.body.data.trip).to.be.an('object');
            done();
          });
      }, 50);
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
    it('should logout the rider successfully', done => {
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
  index++;
  if (index === 2) {
    tripRequestObj.tripRequestStatus = 'arriving';
  } else if (index === 3) {
    tripRequestObj.tripRequestStatus = 'arrived';
  } else {
    return 0;
  }
  driverSocket.emit('tripRequestUpdate', tripRequestObj);
  return tripRequestAutomation(index, tripRequestObj, driverSocket);
}

// function tripAutomation(tripObj, driverSocket) {
//   if (tripObj !== null || tripObj !== undefined) {
//     tripObj.tripStatus = 'endTrip';
//     driverSocket.emit('tripUpdate', tripObj);
//   }
// }
