'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _trip = require('../../models/trip');

var _trip2 = _interopRequireDefault(_trip);

var _socketStore = require('../../service/socket-store');

var _socketStore2 = _interopRequireDefault(_socketStore);

var _user = require('../../models/user.js');

var _user2 = _interopRequireDefault(_user);

var _payment = require('../../controllers/payment');

var _payment2 = _interopRequireDefault(_payment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//eslint-disable-line

function cancelTripHandler(socket) {
    socket.on('cancelTrip', function (tripObj, cb) {
        console.log('CALLED FST TIME');
        var riderID = tripObj.riderId;
        var driverID = tripObj.driverId;
        var TripID = tripObj.tripId;
        var currentDate = new Date().toISOString();
        var pickUpTime = void 0;
        _trip2.default.findOneAsync({ _id: TripID }).then(function (tripData) {
            if (tripData) {
                if (tripData.tripStatus == 'unclaimed') {
                    cancelTrip(tripData);
                } else {
                    pickUpTime = tripData.pickUpTime;
                    applyCancellationRules(tripData, currentDate, pickUpTime);
                }
            } else {
                _socketStore2.default.emitByUserId(riderID, 'server error while finding trip', {});
            }
        }).catch(function (error) {
            _socketStore2.default.emitByUserId(riderID, 'server error while charging cancellation fees ' + error, {});
        });
    });

    function applyCancellationRules(tripData, currentDate, pickUpTime) {
        var timeDifference = (0, _moment2.default)(pickUpTime).diff(currentDate, 'milliseconds');
        if (timeDifference < 3600000) {
            chargeCancellationFees(tripData, '100');
        } else if (timeDifference < 28800000) {
            tripData.tripAmt = tripData.tripAmt / 2;
            chargeCancellationFees(tripData, '50');
        } else {
            cancelTrip(tripData);
        }
    }

    function chargeCancellationFees(tripData, percentage) {
        _payment2.default.cardPayment(tripData).then(function (status) {
            if (status != 'error') {
                _trip2.default.findByIdAndUpdateAsync({ _id: tripData._id }, { $set: { paymentStatus: status, tripStatus: "cancelled" } }).then(function (updatedTripObj) {
                    _socketStore2.default.emitByUserId(updatedTripObj.riderID, 'trip is successfully cancelled and ' + percentage + ' % cancellation fees is charged', updatedTripObj);
                }).catch(function (error) {
                    _socketStore2.default.emitByUserId(updatedTripObj.riderID, 'server error while cancelling trip ' + error, {});
                });
            } else {
                _socketStore2.default.emitByUserId(tripData.riderID, 'server error while charging cancellation fees', {});
            }
        });
    }

    function cancelTrip(tripData) {
        _trip2.default.findByIdAndUpdateAsync({ _id: tripData._id }, { $set: { tripStatus: "cancelled" } }).then(function (updatedTripObj) {
            _socketStore2.default.emitByUserId(updatedTripObj.riderID, 'trip is successfully cancelled', updatedTripObj);
        }).catch(function (error) {
            _socketStore2.default.emitByUserId(updatedTripObj.riderID, 'server error while cancelling trip ' + error, {});
        });
    }
}

exports.default = cancelTripHandler;
module.exports = exports.default;
//# sourceMappingURL=cancel-trip.js.map
