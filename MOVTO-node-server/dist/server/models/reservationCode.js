'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * User Reservation Code Schema (Address book)
 */
var ReservationCodeSchema = new _mongoose.Schema({
    userIdAdmin: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
    reservationCode: { type: String, default: null },
    name: { type: String, default: null },
    company_name: { type: String, default: null },
    email: { type: String, default: null },
    createdAt: { type: Date, default: new Date().toISOString() },
    updatedAt: { type: Date, default: new Date().toISOString() },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
});

exports.default = _mongoose2.default.model('reservationCodes', ReservationCodeSchema);
module.exports = exports.default;
//# sourceMappingURL=reservationCode.js.map
