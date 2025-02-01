import moment from 'moment';

import TripSchema from '../../models/trip';
import SocketStore from '../../service/socket-store';
import UserSchema from '../../models/user.js';
import paymentCtrl from '../../controllers/payment'; //eslint-disable-line

function cancelTripHandler(socket) {
    socket.on('cancelTrip', (tripObj, cb) => {
        console.log('CALLED FST TIME');
        const riderID = tripObj.riderId;
        const driverID = tripObj.driverId;
        const TripID = tripObj.tripId;
        let currentDate = new Date().toISOString();
        let pickUpTime;
        TripSchema.findOneAsync({ _id: TripID })
            .then(tripData => {
                if (tripData) {
                    if (tripData.tripStatus == 'unclaimed') {
                        cancelTrip(tripData);
                    }
                    else {
                        pickUpTime = tripData.pickUpTime;
                        applyCancellationRules(tripData, currentDate, pickUpTime)
                    }
                }
                else {
                    SocketStore.emitByUserId(riderID, `server error while finding trip`, {});
                }
            })
            .catch(error => {
                SocketStore.emitByUserId(riderID, `server error while charging cancellation fees ${error}`, {});
            })
    });

    function applyCancellationRules(tripData, currentDate, pickUpTime) {
        let timeDifference = moment(pickUpTime).diff(currentDate, 'milliseconds');
        if (timeDifference < 3600000) {
            chargeCancellationFees(tripData, '100');
        }
        else if (timeDifference < 28800000) {
            tripData.tripAmt = tripData.tripAmt / 2
            chargeCancellationFees(tripData, '50');
        }
        else {
            cancelTrip(tripData)
        }
    }

    function chargeCancellationFees(tripData, percentage) {
        paymentCtrl.cardPayment(tripData).then(status => {
            if (status != 'error') {
                TripSchema.findByIdAndUpdateAsync({ _id: tripData._id }, { $set: { paymentStatus: status, tripStatus: "cancelled" } })
                    .then(updatedTripObj => {
                        SocketStore.emitByUserId(updatedTripObj.riderID, `trip is successfully cancelled and ${percentage} % cancellation fees is charged`, updatedTripObj);
                    })
                    .catch(error => {
                        SocketStore.emitByUserId(updatedTripObj.riderID, `server error while cancelling trip ${error}`, {});
                    })
            }
            else {
                SocketStore.emitByUserId(tripData.riderID, `server error while charging cancellation fees`, {});
            }
        });
    }

    function cancelTrip(tripData) {
        TripSchema.findByIdAndUpdateAsync({ _id: tripData._id }, { $set: { tripStatus: "cancelled" } })
            .then(updatedTripObj => {
                SocketStore.emitByUserId(updatedTripObj.riderID, `trip is successfully cancelled`, updatedTripObj);
            })
            .catch(error => {
                SocketStore.emitByUserId(updatedTripObj.riderID, `server error while cancelling trip ${error}`, {});
            })
    }
}

export default cancelTripHandler;