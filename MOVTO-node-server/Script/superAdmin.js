/* eslint-disable no-console */
const async = require('async');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const databaseName = process.env.NODE_ENV === 'production' ? 'mgd-prod' : 'mgd-dev';
const databaseURL = `mongodb://localhost:27017/${databaseName}`;

const userSchema = new mongoose.Schema({
  fname: { type: String, default: null },
  lname: { type: String, default: null },
  email: { type: String, required: true },
  password: {
    type: String,
    required: true,
    select: false,
  },
  userType: { type: String, default: 'superAdmin' },
});

// Mongoose middleware that is called before save to hash the password
// eslint-disable-next-line consistent-return
userSchema.pre('save', (next, err) => {
  const user = this;
  const SALT_FACTOR = 10;
  console.log(err);
  if (!user.isNew) {
    // && !user.isModified('password')
    return next();
  }

  // Encrypt password before saving to database
  // eslint-disable-next-line consistent-return
  bcrypt.genSalt(SALT_FACTOR, (error, salt) => {
    if (error) return next(error);
    // eslint-disable-next-line consistent-return
    bcrypt.hash(user.password, salt, null, (errors, hash) => {
      if (errors) return next(errors);
      user.password = hash;
      next();
    });
  });
});

const User = mongoose.model('User', userSchema);

async.series(
  [
    function connectToDatabase(callback) {
      mongoose.connect(databaseURL);
      mongoose.connection.on('connected', () => {
        console.log('db connected via mongoose');
        callback(null, 'SUCCESS - Connected to mongodb');
      });
    },
    (callback) => {
      const users = [];
      const user = new User({
        fname: 'Rishabh',
        lname: 'Pandey',
        email: 'superAdmin@taxiApp.com',
        password: 'Password',
        userType: 'superAdmin',
      });
      users.push(user);
      console.log('Populating database with %s users', users.length);
      async.eachSeries(
        users,
        (admin, userSavedCallBack) => {
          user.save((err) => {
            if (err) {
              console.dir(err);
            }
            console.log('Saving user #%s', user.name);
            userSavedCallBack();
          });
        },
        (err) => {
          if (err) {
            console.dir(err);
          }
          console.log('Finished aysnc.each in seeding db');
          callback(null, 'SUCCESS - Seed database');
        }
      );
    },
  ],
  (err, results) => {
    console.log('\n\n--- Database seed progam completed ---');

    if (err) {
      console.log('Errors = ');
      console.dir(err);
    } else {
      console.log('Results = ');
      console.log(results);
    }
    console.log('\n\n--- Exiting database seed progam ---');
    process.exit(0);
  }
);
