/* eslint-disable */
import chai from 'chai';
import { expect } from 'chai';
import app from '../../index';
import io from 'socket.io-client';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER } from '../constants/user-types';

chai.config.includeStack = true;

describe('# socket start trip', () => {
  let rider1 = {
    email: 'abc2@xyz.com',
    password: '123',
    userType: USER_TYPE_RIDER,
    fname: 'abc2',
    lname: 'xyz2',
    phoneNo: '9876543210',
  };
  let riderJwtAccessToken = null;

  let rider2 = {
    email: 'asd2@xyz.com',
    password: '123',
    userType: USER_TYPE_RIDER,
    fname: 'asd2',
    lname: 'asd2',
    phoneNo: '9876543210',
  };
  let riderJwtAccessToken2 = null;

  let driver1 = {
    email: 'xyz12@abc.com',
    password: '123',
    userType: USER_TYPE_DRIVER,
    fname: 'xyz2',
    lname: 'abc2',
    phoneNo: '9876543210',
  };
  let driverJwtAccessToken = null;

  let driver2 = {
    email: 'qwe123@abc.com',
    password: '123',
    userType: USER_TYPE_DRIVER,
    fname: 'qwe2',
    lname: 'qwe2',
    phoneNo: '9876543210',
  };
  let driverJwtAccessToken2 = null;

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
    it('should create a new rider', done => {
      request(app)
        .post('/api/users/register')
        .send(rider2)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.success).to.equal(true);
          expect(res.body.data).to.have.all.keys('user', 'jwtAccessToken');
          rider2 = res.body.data.user;
          riderJwtAccessToken2 = res.body.data.jwtAccessToken;
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

  describe('# POST /api/users/register', () => {
    it('should create a new driver', done => {
      request(app)
        .post('/api/users/register')
        .send(driver2)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.success).to.equal(true);
          // expect(res.body.data).to.have.all.keys('user', 'jwtAccessToken');
          driver2 = res.body.data.user;
          driverJwtAccessToken2 = res.body.data.jwtAccessToken;
          done();
        });
    });
  });

  describe('# rider request for trip and driver start, end trip ', () => {
    it('rider should receieve end trip status', done => {
      const riderSocket2 = io.connect('http://localhost:4123', { query: { token: riderJwtAccessToken2 } });
      const driverSocket = io.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      const driverSocket2 = io.connect('http://localhost:4123', { query: { token: driverJwtAccessToken2 } });
      const payload = {
        rider: rider2,
        tripRequest: {
          srcLoc: [25, 26],
          destLoc: [27, 28],
          pickUpAddress: 'geekyants(25, 26)',
          destAddress: 'bommanahalli(27, 28)',
          latitudeDelta: 0.123,
          longitudeDelta: 0.023,
        },
      };
      riderSocket2.emit('requestTrip', payload);
      driverSocket.on('requestDriver', () => {
        // driver1 is already on some trip, so it should not get trip request evenet
      });

      driverSocket2.on('requestDriver', tripRequest => {
        const driverResponse = 1;
        if (driverResponse) {
          // when driver accepts the tripRequest then server fires an evenet(tripRequestUpdated) to rider
          expect(tripRequest.rider).to.be.an('object');
          expect(tripRequest.rider.currTripId).to.eql(tripRequest._id);
          expect(tripRequest.driver).to.be.an('object');
          expect(tripRequest.driver.currTripId).to.eql(tripRequest._id);

          tripRequest.tripRequestStatus = 'enRoute';
          tripRequest.tripRequestIssue = 'no Issue';
        }

        driverSocket2.emit('requestDriverResponse', tripRequest);

        // assuming driver has arrived at the pickUpAddress of the rider and start the trip
        tripRequest.tripRequestStatus = 'arrived';

        driverSocket2.emit('startTrip', tripRequest, tripObj => {
          tripAutomation(tripObj, driverSocket2);
          // callback function receives trip Object with the following property
          expect(tripObj.rider).to.be.an('object');
          expect(tripObj.rider.currTripId).to.eql(tripObj._id);
          expect(tripObj.rider.currTripState).to.eql('trip');
          expect(tripObj.driver).to.be.an('object');
          expect(tripObj.driver.currTripId).to.eql(tripObj._id);
          expect(tripObj.driver.currTripState).to.eql('trip');
        });
      });

      driverSocket2.on('tripUpdated', data => {
        if (data.tripStatus === 'endTrip' && data.riderRatingByDriver === 0) {
          expect(data.tripStatus).to.eql('endTrip');
          expect(data.driver).to.be.an('object');
          expect(data.driver.currTripId).to.eql(null);
          expect(data.driver.currTripState).to.eql(null);
          const rand = Math.floor(Math.random() * (5 - 2 + 1) * 2);
          data.riderRatingByDriver = rand;
          driverSocket2.emit('tripUpdate', data);
          driverSocket2.disconnect();
        }
      });

      riderSocket2.on('tripUpdated', data => {
        if (data.tripStatus === 'endTrip' && data.driverRatingByRider === 0) {
          expect(data.tripStatus).to.eql('endTrip');
          expect(data.driver).to.be.an('object');
          expect(data.driver.currTripId).to.eql(null);
          expect(data.driver.currTripState).to.eql(null);
          expect(data.rider).to.be.an('object');
          expect(data.rider.currTripId).to.eql(null);
          expect(data.rider.currTripState).to.eql(null);

          const rand = Math.floor(Math.random() * (5 - 2 + 1) * 2);
          data.driverRatingByRider = rand;
          riderSocket2.emit('tripUpdate', data);
          done();
          riderSocket2.disconnect();
        }
      });
      riderSocket2.on('socketError', () => {
        // console.log('some error occur in socket', data, '\ndisconnecting rider socket');
        riderSocket2.disconnect();
      });
      driverSocket2.on('socketError', () => {
        // console.log('some error occur in socket', data, '\ndisconnecting rider socket');
        driverSocket2.disconnect();
      });
    });
  });
  describe('# rider request for a trip driver arrived at the pickUpAddress and starts the trip', () => {
    it('should receive onTrip tripStatus by rider', done => {
      const riderSocket = io.connect('http://localhost:4123', { query: { token: riderJwtAccessToken } });
      const driverSocket = io.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      // let tripObj = null;
      const payload = {
        rider: rider1,
        tripRequest: {
          srcLoc: [101, 102],
          destLoc: [103, 104],
          pickUpAddress: 'geekyants(101, 102)',
          destAddress: 'bommanahalli(103, 104)',
          latitudeDelta: 0.123,
          longitudeDelta: 0.023,
        },
      };
      riderSocket.emit('requestTrip', payload);

      driverSocket.on('requestDriver', tripRequest => {
        const driverResponse = 1;
        if (driverResponse) {
          // when driver accepts the tripRequest then server fires an evenet(tripRequestUpdated) to rider
          expect(tripRequest.rider).to.be.an('object');
          expect(tripRequest.rider.currTripId).to.eql(tripRequest._id);
          expect(tripRequest.rider.currTripState).to.eql('tripRequest');
          expect(tripRequest.driver).to.be.an('object');
          expect(tripRequest.driver.currTripId).to.eql(tripRequest._id);
          expect(tripRequest.driver.currTripState).to.eql('tripRequest');

          tripRequest.tripRequestStatus = 'enRoute';
          tripRequest.tripRequestIssue = 'no Issue';
        }
        driverSocket.emit('requestDriverResponse', tripRequest);

        // assuming driver has arrived at the pickUpAddress of the rider and start the trip
        tripRequest.tripRequestStatus = 'arrived';

        driverSocket.emit('startTrip', tripRequest, tripObj => {
          // callback function receives trip Object with the following property
          expect(tripObj.rider).to.be.an('object');
          expect(tripObj.rider.currTripId).to.eql(tripObj._id);
          expect(tripObj.rider.currTripState).to.eql('trip');
          expect(tripObj.driver).to.be.an('object');
          expect(tripObj.driver.currTripId).to.eql(tripObj._id);
          expect(tripObj.driver.currTripState).to.eql('trip');
        });
      });

      riderSocket.on('tripUpdated', data => {
        expect(data.tripStatus).to.eql('onTrip');
        expect(data.driver).to.be.an('object');
        expect(data.rider.currTripId).to.eql(data._id);
        expect(data.rider.currTripState).to.eql('trip');
        done();
        driverSocket.disconnect();
        riderSocket.disconnect();
      });
      riderSocket.on('socketError', () => {
        // console.log('some error occur in socket', data, '\ndisconnecting rider socket');
        riderSocket.disconnect();
      });
      driverSocket.on('socketError', () => {
        // console.log('some error occur in socket', data, '\ndisconnecting rider socket');
        driverSocket.disconnect();
      });
    });
  });

  describe('# rider request for a trip and all driver (driver1) is on some trip ', () => {
    it('rider should receive noNearByDriver tripRequestStatus', done => {
      const riderSocket2 = io.connect('http://localhost:4123', { query: { token: riderJwtAccessToken2 } });
      const driverSocket = io.connect('http://localhost:4123', { query: { token: driverJwtAccessToken } });
      const payload = {
        rider: rider2,
        tripRequest: {
          srcLoc: [1, 2],
          destLoc: [12, 13],
          pickUpAddress: 'geekyants',
          destAddress: 'bommanahalli',
          latitudeDelta: 0.123,
          longitudeDelta: 0.023,
        },
      };
      riderSocket2.emit('requestTrip', payload);
      riderSocket2.on('tripRequestUpdated', data => {
        expect(data.tripRequestStatus).to.eql('noNearByDriver');
        done();
        riderSocket2.disconnect();
        driverSocket.disconnect();
      });
      riderSocket2.on('socketError', () => {
        // console.log('some error occur in socket', data, '\ndisconnecting rider socket');
        riderSocket2.disconnect();
      });
      driverSocket.on('socketError', () => {
        // console.log('some error occur in socket', data, '\ndisconnecting rider socket');
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
        .set('Authorization', riderJwtAccessToken2)
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
  describe('# auth /api/auth/logout', () => {
    it('should logout the driver successfully', done => {
      request(app)
        .get('/api/auth/logout')
        .set('Authorization', driverJwtAccessToken2)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.success).to.equal(true);
          done();
        });
    });
  });
});

function tripAutomation(tripObj, driverSocket) {
  if (tripObj !== null || tripObj !== undefined) {
    tripObj.tripStatus = 'endTrip';
    driverSocket.emit('tripUpdate', tripObj);
  }
}
