'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _userTypes = require('../constants/user-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TripRequestSchema = new _mongoose.Schema({
  riderId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
  driverId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
  tripId: { type: _mongoose.Schema.Types.ObjectId, ref: 'trip' },
  scheduledRequestId: { type: _mongoose.Schema.Types.ObjectId, ref: 'scheduledTripRequest' },
  isScheduled: { type: Boolean, default: false },
  srcLoc: {
    _id: { type: _mongoose.Schema.Types.ObjectId },
    sequenceNo: { type: Number },
    timeToNextTerminal: { type: Number, default: 0 },
    isSelected: { type: Boolean, default: false },
    adminId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
    loc: { type: [Number, Number], index: '2d' },
    address: { type: String, default: null },
    name: { type: String, default: null },
    // terminal(default) | waypoint | startTerminal | endTerminal
    type: { type: String, default: 'terminal' },
    createdAt: { type: Date, default: new Date().toISOString() },
    updatedAt: { type: Date, default: new Date().toISOString() },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  destLoc: {
    _id: { type: _mongoose.Schema.Types.ObjectId },
    sequenceNo: { type: Number },
    timeToNextTerminal: { type: Number, default: 0 },
    isSelected: { type: Boolean, default: false },
    adminId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
    loc: { type: [Number, Number], index: '2d' },
    address: { type: String, default: null },
    name: { type: String, default: null },
    // terminal(default) | waypoint | startTerminal | endTerminal
    type: { type: String, default: 'terminal' },
    createdAt: { type: Date, default: new Date().toISOString() },
    updatedAt: { type: Date, default: new Date().toISOString() },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  startAddress: { type: String, default: null },
  endAddress: { type: String, default: null },
  paymentMode: { type: String, default: 'CASH' },
  paymentStatus: { type: String, default: null },
  /**
   * Average waiting time by Rider
   *  waitingTime
   */
  waitingTime: { type: Number, default: 300000 },
  /**
   * statuses:
   * request|accepted|completed|cancelled|rejected|enRoute|arriving|arrived
   */
  tripRequestStatus: { type: String, default: 'request' },
  tripRequestIssue: { type: String, default: 'busy' },
  pickUpAddress: { type: String, default: null },
  destAddress: { type: String, default: null },
  latitudeDelta: { type: Number, default: 0.012 },
  longitudeDelta: { type: Number, default: 0.012 },
  requestTime: { type: Date, default: new Date().toISOString() },
  requestUpdatedTime: { type: Date, default: new Date().toISOString() },
  seatBooked: { type: Number, default: 1 }
});

TripRequestSchema.statics = {
  userList: function userList() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$skip = _ref.skip,
        skip = _ref$skip === undefined ? 0 : _ref$skip,
        _ref$limit = _ref.limit,
        limit = _ref$limit === undefined ? 10 : _ref$limit,
        _ref$userId = _ref.userId,
        userId = _ref$userId === undefined ? null : _ref$userId,
        _ref$userType = _ref.userType,
        userType = _ref$userType === undefined ? null : _ref$userType;

    var searchObj = {};
    if (userType === _userTypes.USER_TYPE_RIDER) {
      searchObj = {};
      searchObj.riderId = userId;
    }
    if (userType === _userTypes.USER_TYPE_DRIVER) {
      searchObj = {};
      searchObj.driverId = userId;
    }
    return this.find(searchObj).skip(skip).limit(limit).populate('riderId driverId tripId').execAsync();
  },
  getUserCount: function getUserCount(userType, userId) {
    var searchObj = {};
    if (userType === _userTypes.USER_TYPE_RIDER) {
      searchObj = {};
      searchObj.riderId = userId;
    }
    if (userType === _userTypes.USER_TYPE_DRIVER) {
      searchObj = {};
      searchObj.driverId = userId;
    }

    return this.countAsync(searchObj);
  }
};

exports.default = _mongoose2.default.model('tripRequest', TripRequestSchema);
module.exports = exports.default;
//# sourceMappingURL=tripRequest.js.map
