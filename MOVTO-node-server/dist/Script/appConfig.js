'use strict';

/* eslint-disable no-console */

var printMessage = require('print-message');
var async = require('async');
// Import mongoose.js to define our schema and interact with MongoDB
var mongoose = require('mongoose');

var Schema = mongoose.Schema.Schema;

// Import bcrypt-nodejs for hashing passwords on MongoDB

var databaseName = process.env.NODE_ENV === 'production' ? 'mgd-prod' : 'mgd-dev';

// URL to connect to a local MongoDB with database test.
// Change this to fit your running MongoDB instance
var databaseURL = 'mongodb://localhost:27017/' + databaseName;

printMessage(['Please have patience while appConfig gets seeded. This may take around 10 - 15 minutes.'], {
  color: 'green',
  borderColor: 'red'
});

// Setting up the Token
var AppConfigSchema = new mongoose.Schema({
  type: { type: Schema.Types.Mixed },
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed }
});

var AppConfig = mongoose.model('AppConfig', AppConfigSchema);

// Async series method to make sure asynchronous calls below run sequentially
async.series([
// function - connect to MongoDB using mongoose, which is an asynchronous call
function connectToDatabase(callback) {
  // Open connection to MongoDB
  mongoose.connect(databaseURL);
  // Need to listen to 'connected' event then execute callback method
  // to call the next set of code in the async.serial array
  mongoose.connection.on('connected', function () {
    console.log('db connected via mongoose');
    // Execute callback now we have a successful connection to the DB
    // and move on to the third function below in async.series
    callback(null, 'SUCCESS - Connected to mongodb');
  });
},

// function - use Mongoose to create a User model and save it to database
function saveAppConfig(callback) {
  // BEGIN SEED DATABASE
  // Use an array to store a list of User model objects to save to the database
  var appConfigs = [new AppConfig({
    type: 'string',
    key: 'googleMapsApiKey',
    value: 'AIzaSyAnOIeq4UUKE_T1RRpXCGY_H3o88Aa_mNg'
  }), new AppConfig({
    type: 'boolean',
    key: 'cash',
    value: true
  }), new AppConfig({
    type: 'boolean',
    key: 'stripe',
    value: false
  }), new AppConfig({
    type: 'boolean',
    key: 'enableGoogle',
    value: true
  }), new AppConfig({
    type: 'boolean',
    key: 'enableFacebook',
    value: true
  }), new AppConfig({
    type: 'object',
    key: 'stripeConfig',
    value: { stripekey: '' }
  }), new AppConfig({
    type: 'object',
    key: 'tripPrice',
    value: {
      farePerMin: 2,
      farePerKm: 7,
      baseFare: 10,
      currencySymbol: '$'
    }
  }), new AppConfig({
    type: 'object',
    key: 'googleAuth',
    value: {
      iosClientId: '805539794872-s9o2jt8l5er0mp5uidj9ak0f1h3chpqp.apps.googleusercontent.com',
      androidClientId: '805539794872-jb1vv12mh1k90fpuo7ki3cku1ietb30e.apps.googleusercontent.com'
    }
  }), new AppConfig({
    type: 'object',
    key: 'facebookAuth',
    value: { authToken: '1919559661598816' }
  }), new AppConfig({
    type: 'object',
    key: 'sendConfig',
    value: {
      email: {
        onForgotPassword: true,
        onRegistrationRider: true,
        onRegistrationDriver: true,
        onEndTripRider: true,
        onEndTripDriver: true,
        rideAcceptRider: true
      },
      sms: {
        onEndTripRider: true,
        onEndTripDriver: true,
        rideAcceptRider: true
      }
    }
  }), new AppConfig({
    type: 'object',
    key: 'approveConfig',
    value: {
      autoApproveRider: true,
      autoApproveDriver: true
    }
  })];
  console.log(appConfigs[0], appConfigs[1], appConfigs[2], appConfigs[3], appConfigs[4], appConfigs[5]);
  console.log(appConfigs[6], appConfigs[7], appConfigs[8], appConfigs[9], appConfigs[10]);

  console.log('Populating database with %s appConfigs', appConfigs.length);
  // Use 'async.eachSeries' to loop through the 'users' array to make
  // sure each asnychronous call to save the user into the database
  // completes before moving to the next User model item in the array
  async.eachSeries(
  // 1st parameter is the 'users' array to iterate over
  appConfigs, function (admin, userSavedCallBack) {
    // There is no need to make a call to create the 'test' database.
    // Saving a model will automatically create the database
    admin.save(function (err) {
      if (err) {
        // Send JSON response to console for errors
        console.dir(err);
      }

      // Print out which user we are saving
      console.log('Saving user #%s', admin.key);

      // Call 'userSavedCallBack' and NOT 'callback' to ensure that the next
      // 'user' item in the 'users' array gets called to be saved to the database
      userSavedCallBack();
    });
  },
  // 3rd parameter is a function to call when all users in 'users' array have
  // completed their asynchronous user.save function
  function (err) {
    if (err) {
      console.log('Finished aysnc.each in seeding db');
    }
    console.log('Finished aysnc.each in seeding db');

    // Execute callback function from line 130 to signal to async.series that
    // all asynchronous calls are now done
    callback(null, 'SUCCESS - Seed database');
  });
  // END SEED DATABASE
}],
// This function executes when everything above is done
function (err, results) {
  console.log('\n\n--- Database seed progam completed ---');

  if (err) {
    console.log('Errors = ');
    console.dir(err);
  } else {
    console.log('Results = ');
    console.log(results);
  }

  console.log('\n\n--- Exiting database seed program ---');
  // Exit the process to get back to terminal console
  process.exit(0);
});
//# sourceMappingURL=appConfig.js.map
