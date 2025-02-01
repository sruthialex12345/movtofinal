/* eslint-disable */
import chai from 'chai';
import { expect } from 'chai';
import app from '../../index';
import io from 'socket.io-client';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER } from '../constants/user-types';

chai.config.includeStack = true;

describe('# socket trip request ', () => {
  let rider1 = {
    email: 'abc1@xyz.com',
    password: '123',
    userType: USER_TYPE_RIDER,
    fname: 'abc1',
    lname: 'xyz1',
    phoneNo: '9876543210',
  };
  let riderJwtAccessToken = null;

  let driver1 = {
    email: 'xyz123@abc.com',
    password: '123',
    userType: USER_TYPE_DRIVER,
    fname: 'xyz1',
    lname: 'abc1',
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

  describe('# rider request for a trip with no driver available', () => {
    it('should receive noNearByDriver status', done => {
      const riderSocket = io.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      const payload = {
        rider: rider1,
        tripRequest: {
          srcLoc: [1, 2],
          destLoc: [3, 4],
          pickUpAddress: 'geekyants',
          destAddress: 'bommanahalli',
          latitudeDelta: 0.123,
          longitudeDelta: 0.023,
        },
      };
      riderSocket.emit('requestTrip', payload);
      riderSocket.on('tripRequestUpdated', data => {
        expect(data.tripRequestStatus).to.equal('noNearByDriver');
        riderSocket.disconnect();
        done();
      });
    });
  });
  describe('# rider request for a trip when driver available but reject the tripRequest', () => {
    it('rider should receive noNearByDriver status', done => {
      const riderSocket = io.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      const driverSocket = io.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      const payload = {
        rider: rider1,
        tripRequest: {
          srcLoc: [5, 6],
          destLoc: [7, 8],
          pickUpAddress: 'geekyants',
          destAddress: 'bommanahalli',
          latitudeDelta: 0.123,
          longitudeDelta: 0.023,
        },
      };
      riderSocket.emit('requestTrip', payload);

      driverSocket.on('requestDriver', tripRequest => {
        const driverResponse = 0;
        if (!driverResponse) {
          // tripRequest object should have following property
          expect(tripRequest.tripRequestStatus).to.eql('request');
          expect(tripRequest.driver).to.be.an('object');
          expect(tripRequest.driver.currTripId).to.eql(tripRequest._id);
          expect(tripRequest.driver.currTripState).to.eql('tripRequest');
          expect(tripRequest.rider).to.be.an('object');
          tripRequest.tripRequestStatus = 'rejected';
          tripRequest.tripRequestIssue = 'not interrested';
        }
        driverSocket.emit('requestDriverResponse', tripRequest);
      });

      riderSocket.on('tripRequestUpdated', tripRequestObj => {
        expect(tripRequestObj.tripRequestStatus).to.equal('noNearByDriver');
        riderSocket.disconnect();
        driverSocket.disconnect();
        done();
      });
    });
  });
  describe('# rider request for a trip and driver accepts it but rider cancelled the tripRequest', () => {
    it('should receive cancelled status by driver', done => {
      const riderSocket = io.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      const driverSocket = io.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      const payload = {
        rider: rider1,
        tripRequest: {
          srcLoc: [9, 10],
          destLoc: [11, 12],
          pickUpAddress: 'geekyants',
          destAddress: 'bommanahalli',
          latitudeDelta: 0.123,
          longitudeDelta: 0.023,
        },
      };
      riderSocket.emit('requestTrip', payload);

      driverSocket.on('requestDriver', tripRequest => {
        console.log('***************tripRequest@@@@@@@@@@@@@', tripRequest);
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
        }
        driverSocket.emit('requestDriverResponse', tripRequest);
      });

      riderSocket.on('tripRequestUpdated', tripRequestObj => {
        if (tripRequestObj.tripRequestStatus === 'enRoute') {
          expect(tripRequestObj.rider.currTripId).to.eql(tripRequestObj._id);
          expect(tripRequestObj.rider.currTripState).to.eql('tripRequest');
          // rider cancelling the trip request
          tripRequestObj.tripRequestStatus = 'cancelled';
          tripRequestObj.tripRequestIssue = 'driver taking too much time to arrive';
          riderSocket.emit('tripRequestUpdate', tripRequestObj);
        }
      });
      driverSocket.on('tripRequestUpdated', data => {
        expect(data.tripRequestStatus).to.equal('cancelled');
        expect(data.driver).to.be.an('object');
        expect(data.driver.currTripId).to.eql(null);
        expect(data.driver.currTripState).to.eql(null);
        done();
        riderSocket.disconnect();
        driverSocket.disconnect();
      });
    });
  });
  describe('# rider request for a trip and driver accepts it and driver arrived at the pickUpAddress', () => {
    it('rider should receive completed tripRequestStatus', done => {
      const riderSocket = io.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      const driverSocket = io.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      const payload = {
        rider: rider1,
        tripRequest: {
          srcLoc: [13, 14],
          destLoc: [15, 16],
          pickUpAddress: 'geekyants',
          destAddress: 'bommanahalli',
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
      riderSocket.on('tripRequestUpdated', tripRequestObject => {
        if (tripRequestObject.tripRequestStatus === 'enRoute') {
          // when driver accepts the tripRequest then server fires an evenet(tripRequestUpdated) to rider
          expect(tripRequestObject.rider).to.be.an('object');
          expect(tripRequestObject.rider.currTripId).to.eql(tripRequestObject._id);
          expect(tripRequestObject.rider.currTripState).to.eql('tripRequest');
          expect(tripRequestObject.driver).to.be.an('object');
          expect(tripRequestObject.driver.currTripId).to.eql(tripRequestObject._id);
          expect(tripRequestObject.driver.currTripState).to.eql('tripRequest');
        }
        if (tripRequestObject.tripRequestStatus === 'completed') {
          expect(tripRequestObject.tripRequestStatus).to.equal('completed');
          expect(tripRequestObject.rider).to.be.an('object');
          expect(tripRequestObject.rider.currTripId).to.eql(tripRequestObject._id);
          expect(tripRequestObject.rider.currTripState).to.eql('tripRequest');
          done();
          driverSocket.disconnect();
          riderSocket.disconnect();
        }
      });
      // in case rider cancelled the trip request
      driverSocket.on('tripRequestUpdated', data => {
        expect(data.tripRequestStatus).to.equal('cancelled');
        done();
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
  }, 400);
}
