'use strict';

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _bcryptNodejs = require('bcrypt-nodejs');

var _bcryptNodejs2 = _interopRequireDefault(_bcryptNodejs);

var _userTypes = require('../server/constants/user-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-console */
var databaseName = process.env.NODE_ENV === 'production' ? 'mgd-prod' : 'mgd-dev';
var databaseURL = 'mongodb://localhost:27017/' + databaseName;

var userSchema = new _mongoose2.default.Schema({
  fname: { type: String, default: null },
  lname: { type: String, default: null },
  email: { type: String, required: true },
  password: {
    type: String,
    required: true,
    select: false
  },
  userType: { type: String, default: _userTypes.USER_TYPE_ADMIN }
});

/**
 * Mongoose middleware that is called before save to hash the password
 */
// eslint-disable-next-line consistent-return
userSchema.pre('save', function handleUserPreSave(next, err) {
  var user = this;
  var SALT_FACTOR = 10;
  console.log(err);
  if (!user.isNew) {
    // && !user.isModified('password')
    return next();
  }

  // Encrypt password before saving to database
  // eslint-disable-next-line consistent-return
  _bcryptNodejs2.default.genSalt(SALT_FACTOR, function (error, salt) {
    if (error) return next(error);
    // eslint-disable-next-line consistent-return
    _bcryptNodejs2.default.hash(user.password, salt, null, function (errors, hash) {
      if (errors) return next(errors);
      user.password = hash;
      next();
    });
  });
});

var User = _mongoose2.default.model('User', userSchema);

_async2.default.series([function connectToDatabase(callback) {
  _mongoose2.default.connect(databaseURL);
  _mongoose2.default.connection.on('connected', function () {
    console.log('db connected via mongoose');
    callback(null, 'SUCCESS - Connected to mongodb');
  });
}, function (callback) {
  var users = [];
  var user = new User({
    fname: 'Rishabh',
    lname: 'Pandey',
    email: 'admin@taxiApp.com',
    password: 'Password',
    userType: _userTypes.USER_TYPE_ADMIN
  });
  users.push(user);
  console.log('Populating database with %s users', users.length);
  _async2.default.eachSeries(users, function (admin, userSavedCallBack) {
    user.save(function (err) {
      if (err) {
        console.dir(err);
      }
      console.log('Saving user #%s', user.name);
      userSavedCallBack();
    });
  }, function (err) {
    if (err) {
      console.dir(err);
    }
    console.log('Finished aysnc.each in seeding db');
    callback(null, 'SUCCESS - Seed database');
  });
}], function (err, results) {
  console.log('\n\n--- Database seed progam completed ---');

  if (err) {
    console.log('Errors = ');
    console.dir(err);
  } else {
    console.log('Results = ');
    console.log(results);
  }
  console.log('\n\n--- Exiting database seed program ---');
  process.exit(0);
});
//# sourceMappingURL=admin.js.map
