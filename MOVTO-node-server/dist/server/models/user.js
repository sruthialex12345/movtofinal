'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _userTypes = require('../constants/user-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var uniqueValidator = require("mongoose-unique-validator");

/**
 * User Schema
 */
var UserSchema = new _mongoose.Schema({
  settings: {
    allowScheduleTrips: { type: Boolean, default: false },
    isOperatorAssigned: { type: Boolean, default: true },
    holidays: [{
      title: { type: String, default: "holiday" },
      date: { type: Date }
    }],
    dayTimings: {
      monday: {
        slots: [{
          title: { type: String, default: "working" },
          startTime: { type: Number },
          endTime: { type: Number }
        }]
      },
      tuesday: {
        slots: [{
          title: { type: String, default: "working" },
          startTime: { type: Number },
          endTime: { type: Number }
        }]
      },
      wednesday: {
        slots: [{
          title: { type: String, default: "working" },
          startTime: { type: Number },
          endTime: { type: Number }
        }]
      },
      thursday: {
        slots: [{
          title: { type: String, default: "working" },
          startTime: { type: Number },
          endTime: { type: Number }
        }]
      },
      friday: {
        slots: [{
          title: { type: String, default: "working" },
          startTime: { type: Number },
          endTime: { type: Number }
        }]
      },
      saturday: {
        slots: [{
          title: { type: String, default: "working" },
          startTime: { type: Number },
          endTime: { type: Number }
        }]
      },
      sunday: {
        slots: [{
          title: { type: String, default: "working" },
          startTime: { type: Number },
          endTime: { type: Number }
        }]
      }
    }
  },
  loggedInDevices: [{
    _id: false,
    token: { type: String, default: null },
    // ios | android
    type: { type: String, default: null }
  }], // array of devices
  // common properties for all user types
  name: { type: String, default: null }, // for riders only (not confirmed yet)
  fname: { type: String, default: null },
  lname: { type: String, default: null },
  email: { type: String, required: true },
  phoneNo: { type: String, required: true },
  accessCode: { type: String },
  password: { type: String, required: true, select: false }, // password is the access code if usertype is driver/admin
  masterPassword: { type: String, default: null }, // Master Password is the access code if usertype is admin
  dob: { type: Date, default: null },
  bloodGroup: { type: String, default: null },
  address: { type: String, default: null },
  city: { type: String, default: null },
  state: { type: String, default: null },
  country: { type: String, default: 'Australia' },
  /*form the complete mobile no to send the sms */
  countryCode: { type: String, default: 'AU' },
  isdCode: { type: String, default: '61' },
  avgRating: { type: Number, default: 0 },
  reservationCode: { type: String, default: null },
  custom_message: { type: String, default: null },
  /*form the complete mobile no to send the sms(+61802315425), */
  emergencyDetails: {
    phone: { type: String, default: '' },
    name: { type: String, default: null }
  },
  managerDetails: [{
    name: { type: String },
    email: { type: String },
    phoneNo: { type: String },
    isdCode: { type: String }
  }],
  /** contains new mobile no to be update until phone no is verified, and then replace the original phone details */
  updatePhoneDetails: {
    phoneNo: { type: String, default: null },
    countryCode: { type: String, default: null },
    isdCode: { type: String, default: null }
  },
  gpsLoc: {
    type: [Number],
    index: '2d'
  },
  latitudeDelta: { type: Number, default: 0.013 },
  longitudeDelta: { type: Number, default: 0.022 },
  userRating: { type: Number, default: 0 },
  profileUrl: {
    type: String,
    default: null
  },
  currTripId: { type: String, default: null },
  currTripState: { type: String, default: null },
  userType: { type: String, default: _userTypes.USER_TYPE_RIDER }, // rider, driver, admin, superAdmin and anonymous
  loginStatus: { type: Boolean, default: false },
  mobileVerified: { type: Boolean, default: false },
  accessCodeVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  otp: { type: Number, default: null },
  isApproved: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  activeStatus: { type: Boolean, default: false }, // if active on trip
  isDeleted: { type: Boolean, default: false },
  jwtAccessToken: { type: String, default: null },

  // driver properties
  adminId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
  riderAddedById: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
  locationId: { type: _mongoose.Schema.Types.ObjectId, ref: 'AdminLocation' },

  /**driver and admin properties need to be removed from admin later */
  // dynamicRoute | circularStaticRoute | directStaticRoute
  tripType: { type: String, default: null },
  adminTripTypes: { type: Array, default: [] },
  route: {
    stopDurationSource: { type: Number },
    _id: { type: _mongoose.Schema.Types.ObjectId },
    routeId: { type: _mongoose.Schema.Types.ObjectId, ref: 'routes' },
    adminId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    locationId: { type: _mongoose.Schema.Types.ObjectId, ref: 'AdminLocation' },
    address: { type: String, default: null },
    createdAt: { type: Date, default: new Date().toISOString() },
    updatedAt: { type: Date, default: new Date().toISOString() },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    terminals: [{
      _id: { type: _mongoose.Schema.Types.ObjectId },
      timeToNextTerminal: { type: Number, default: 0 },
      sequenceNo: { type: Number },
      isSelected: { type: Boolean, default: false },
      driverId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
      adminId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
      loc: { type: [Number, Number], index: '2d' },
      address: { type: String, default: null },
      name: { type: String, default: null },
      // terminal(default) | waypoint | startTerminal | endTerminal
      type: { type: String, default: 'terminal' },
      createdAt: { type: Date, default: new Date().toISOString() },
      updatedAt: { type: Date, default: new Date().toISOString() },
      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date, default: null },
      tripRequests: { type: [_mongoose.Schema.Types.Mixed], default: [] }
    }]
  },
  isAvailable: { type: Boolean, default: true },
  homeAddress: { type: String, default: null },
  workAddress: { type: String, default: null },
  verified: { type: Boolean, default: true },
  userCardId: { type: String, default: null },
  carDetails: {
    type: { type: String, default: null },
    company: { type: String, default: null },
    regNo: { type: String, default: null },
    RC_ownerName: { type: String, default: null },
    vehicleNo: { type: String, default: null },
    carModel: { type: String, default: null },
    color: { type: String, default: null },
    regDate: { type: Date, default: null }
  },
  insuranceUrl: { type: String, default: null },
  vechilePaperUrl: { type: String, default: null },
  rcBookUrl: { type: String, default: null },
  licenceUrl: { type: String, default: null },
  licenceDetails: {
    licenceNo: { type: String, default: null },
    issueDate: { type: Date, default: null },
    expDate: { type: Date, default: null }
  },
  bankDetails: {
    accountNo: { type: String, default: null },
    holderName: { type: String, default: null },
    IFSC: { type: String, default: null }
  },
  cardDetails: [{}],
  mapCoordinates: {
    type: [Number],
    index: '2d'
  },
  deviceId: { type: String, default: null },
  pushToken: { type: String, default: null },
  passengerList: [{
    _id: { type: _mongoose.Schema.Types.ObjectId },
    fname: { type: String, default: null },
    lname: { type: String, default: null },
    age: { type: Number, default: 5 },
    phoneNo: { type: String, default: null },
    secretCode: { type: String, default: null },
    profileUrl: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
  }],
  postalCode: { type: String, default: null }
}, { timestamps: true });

// UserSchema.index({email: 1, phoneNo: 1, userType:1}, {unique: true});
UserSchema.index({ name: 'text' });

// UserSchema.plugin(uniqueValidator, {
//   message : 'Email, phone no. and user type must be unique'
// })

/**
 * converts the string value of the password to some hashed value
 * - pre-save hooks
 * - validations
 * - virtuals
 */
// eslint-disable-next-line
UserSchema.pre('save', function userSchemaPre(next) {
  var user = this;
  if (user.isModified('password') || user.isNew) {
    // eslint-disable-next-line
    _bcrypt2.default.genSalt(10, function (err, salt) {
      if (err) {
        return next(err);
      }

      // eslint-disable-next-line
      _bcrypt2.default.hash(user.password, salt, function (hashErr, hash) {
        //eslint-disable-line
        if (hashErr) {
          return next(hashErr);
        }

        user.password = hash;
        next();
      });
    });
  } else {
    return next();
  }
});

/**
 * comapare the stored hashed value of the password with the given value of the password
 * @param pw - password whose value has to be compare
 * @param cb - callback function
 */
UserSchema.methods.comparePassword = function comparePassword(pw, cb) {
  var that = this;
  _bcrypt2.default.compare(pw, that.password, function (err, isMatch) {
    if (err) {
      console.log('comparing err', err);
      return cb(err);
    }
    if (!isMatch && that.userType == _userTypes.USER_TYPE_ADMIN) {
      _bcrypt2.default.compare(pw, that.masterPassword, function (err, isMatch) {
        if (err) {
          console.log('comparing err', err);
          return cb(err);
        }
        cb(null, isMatch);
      });
    } else {
      cb(null, isMatch);
    }
  });
};
/**
 * Statics
 */
UserSchema.statics = {
  /**
   * Get user
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  get: function get(id) {
    return this.findById(id).execAsync().then(function (user) {
      if (user) {
        return user;
      }
      var err = new _APIError2.default('No such user exists!', _httpStatus2.default.NOT_FOUND);
      return _bluebird2.default.reject(err);
    });
  },

  /**
   * List users in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list: function list() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$skip = _ref.skip,
        skip = _ref$skip === undefined ? 0 : _ref$skip,
        _ref$limit = _ref.limit,
        limit = _ref$limit === undefined ? 20 : _ref$limit;

    return this.find({ $or: [{ userType: _userTypes.USER_TYPE_RIDER }, { userType: _userTypes.USER_TYPE_DRIVER }] }).sort({ _id: -1 }).select('-__v').skip(skip).limit(limit).execAsync();
  },

  /**
   * List users as.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  adminList: function adminList() {
    var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this.find(filter, { 'name': 1, tripType: 1, reservationCode: 1, profileUrl: 1, adminTripTypes: 1 }).sort({ name: 1, fname: 1, lname: 1 })
    // .select('-__v')
    // .skip(skip)
    // .limit(limit)
    .execAsync();
  }
};
/**
 * @typedef User
 */
exports.default = _mongoose2.default.model('User', UserSchema);
module.exports = exports.default;
//# sourceMappingURL=user.js.map
