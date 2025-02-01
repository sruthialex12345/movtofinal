import bcrypt from 'bcrypt';
import Promise from 'bluebird';
import mongoose, { Schema } from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER, USER_TYPE_ADMIN } from '../constants/user-types';
const uniqueValidator = require("mongoose-unique-validator");

/**
 * User Schema
 */
const UserSchema = new Schema({
  settings: {
    allowScheduleTrips: { type: Boolean, default: false },
    isOperatorAssigned: { type: Boolean, default: true },
    holidays: [{
      title: {type: String, default: "holiday"},
      date: {type: Date}
    }],
    dayTimings: {
      monday: {
        slots: [{
          title: {type: String, default: "working"},
          startTime: { type: Number},
          endTime: { type: Number}
        }]
      },
      tuesday: {
        slots: [{
          title: {type: String, default: "working"},
          startTime: { type: Number},
          endTime: { type: Number}
        }]
      },
      wednesday: {
        slots: [{
          title: {type: String, default: "working"},
          startTime: { type: Number},
          endTime: { type: Number}
        }]
      },
      thursday: {
        slots: [{
          title: {type: String, default: "working"},
          startTime: { type: Number},
          endTime: { type: Number}
        }]
      },
      friday: {
        slots: [{
          title: {type: String, default: "working"},
          startTime: { type: Number},
          endTime: { type: Number}
        }]
      },
      saturday: {
        slots: [{
          title: {type: String, default: "working"},
          startTime: { type: Number},
          endTime: { type: Number}
        }]
      },
      sunday: {
        slots: [{
          title: {type: String, default: "working"},
          startTime: { type: Number},
          endTime: { type: Number}
        }]
      }
    }
  },
  loggedInDevices: [{
    _id:false,
    token: {type:String, default: null},
    // ios | android
    type: {type:String, default: null}
  }], // array of devices
  // common properties for all user types
  name: {type: String, default: null}, // for riders only (not confirmed yet)
  fname: {type: String, default: null},
  lname: {type: String, default: null},
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
  isdCode: {type: String, default: '61'},
  avgRating: { type: Number, default: 0 },
  reservationCode: { type: String, default: null },
  custom_message: { type: String, default: null },
  /*form the complete mobile no to send the sms(+61802315425), */
  emergencyDetails: {
    phone: { type: String, default: '' },
    name: { type: String, default: null },
  },
  managerDetails :[{
    name: {type: String},
    email: { type: String},
    phoneNo: { type: String},
    isdCode: {type: String }
  }],
  /** contains new mobile no to be update until phone no is verified, and then replace the original phone details */
  updatePhoneDetails: {
    phoneNo: { type: String, default: null },
    countryCode: { type: String, default: null },
    isdCode: {type: String , default: null}
  },
  gpsLoc: {
    type: [Number],
    index: '2d',
  },
  latitudeDelta: { type: Number, default: 0.013 },
  longitudeDelta: { type: Number, default: 0.022 },
  userRating: { type: Number, default: 0 },
  profileUrl: {
    type: String,
    default: null,
  },
  currTripId: { type: String, default: null },
  currTripState: { type: String, default: null },
  userType: { type: String, default: USER_TYPE_RIDER }, // rider, driver, admin, superAdmin and anonymous
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
  adminId: { type: Schema.Types.ObjectId, ref: 'User' },
  riderAddedById: { type: Schema.Types.ObjectId, ref: 'User' },
  locationId: { type: Schema.Types.ObjectId, ref: 'AdminLocation' },

  /**driver and admin properties need to be removed from admin later */
  // dynamicRoute | circularStaticRoute | directStaticRoute
  tripType: { type: String, default: null },
  adminTripTypes: { type: Array, default: [] },
  route: {
    stopDurationSource: {type: Number},
    _id: {type: Schema.Types.ObjectId},
    routeId: {type: Schema.Types.ObjectId, ref: 'routes'},
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: {type: String},
    locationId: { type: Schema.Types.ObjectId, ref: 'AdminLocation' },
    address: { type: String, default: null },
    createdAt: { type: Date, default: new Date().toISOString() },
    updatedAt: { type: Date, default: new Date().toISOString() },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    terminals: [{
      _id: {type: Schema.Types.ObjectId},
      timeToNextTerminal: {type: Number, default: 0},
      sequenceNo: { type: Number },
      isSelected: { type: Boolean, default: false },
      driverId: { type: Schema.Types.ObjectId, ref: 'User' },
      adminId: { type: Schema.Types.ObjectId, ref: 'User' },
      loc: {type: [Number, Number], index: '2d'},
      address: { type: String, default: null },
      name: { type: String, default: null },
      // terminal(default) | waypoint | startTerminal | endTerminal
      type: { type: String, default: 'terminal' },
      createdAt: { type: Date, default: new Date().toISOString() },
      updatedAt: { type: Date, default: new Date().toISOString() },
      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date, default: null },
      tripRequests: { type: [Schema.Types.Mixed], default: [] }
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
    regDate: { type: Date, default: null },
  },
  insuranceUrl: { type: String, default: null },
  vechilePaperUrl: { type: String, default: null },
  rcBookUrl: { type: String, default: null },
  licenceUrl: { type: String, default: null },
  licenceDetails: {
    licenceNo: { type: String, default: null },
    issueDate: { type: Date, default: null },
    expDate: { type: Date, default: null },
  },
  bankDetails: {
    accountNo: { type: String, default: null },
    holderName: { type: String, default: null },
    IFSC: { type: String, default: null },
  },
  cardDetails: [{}],
  mapCoordinates: {
    type: [Number],
    index: '2d',
  },
  deviceId: { type: String, default: null },
  pushToken: { type: String, default: null },
  passengerList: [
    {
      _id: { type: Schema.Types.ObjectId },
      fname: { type: String, default: null },
      lname: { type: String, default: null },
      age: { type: Number, default: 5 },
      phoneNo: { type: String, default: null },
      secretCode: { type: String, default: null },
      profileUrl: { type: String, default: null },
      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date },
    },
  ],
  postalCode: {type: String, default: null}
}, {timestamps: true});

// UserSchema.index({email: 1, phoneNo: 1, userType:1}, {unique: true});
UserSchema.index({name: 'text'});

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
  const user = this;
  if (user.isModified('password') || user.isNew) {
    // eslint-disable-next-line
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        return next(err);
      }

      // eslint-disable-next-line
      bcrypt.hash(user.password, salt, (hashErr, hash) => {
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
  const that = this;
  bcrypt.compare(pw, that.password, (err, isMatch) => {
    if (err) {
      console.log('comparing err', err);
      return cb(err);
    }
    if(!isMatch && (that.userType==USER_TYPE_ADMIN)){
      bcrypt.compare(pw, that.masterPassword, (err, isMatch) => {
        if (err) {
          console.log('comparing err', err);
          return cb(err);
        }
        cb(null, isMatch);
      });
    }else{
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
  get(id) {
    return this.findById(id)
      .execAsync()
      .then((user) => {
        if (user) {
          return user;
        }
        const err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  /**
   * List users in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list({ skip = 0, limit = 20 } = {}) {
    return this.find({ $or: [{ userType: USER_TYPE_RIDER }, { userType: USER_TYPE_DRIVER }] })
      .sort({ _id: -1 })
      .select('-__v')
      .skip(skip)
      .limit(limit)
      .execAsync();
  },
  /**
   * List users as.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  adminList(filter = {}) {
    return this.find(filter,{'name':1, tripType:1, reservationCode:1,profileUrl:1,adminTripTypes:1})
    .sort({ name: 1, fname: 1, lname: 1 })
    // .select('-__v')
    // .skip(skip)
    // .limit(limit)
    .execAsync();
  },
};
/**
 * @typedef User
 */
export default mongoose.model('User', UserSchema);
