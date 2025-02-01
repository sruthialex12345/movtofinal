'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.payAll = payAll;
exports.saveTransaction = saveTransaction;

var _stripe = require('stripe');

var _stripe2 = _interopRequireDefault(_stripe);

var _appConfig = require('../models/appConfig');

var _appConfig2 = _interopRequireDefault(_appConfig);

var _transaction = require('../models/transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

var _wallet = require('../models/wallet');

var _wallet2 = _interopRequireDefault(_wallet);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getStripeKey() {
  return new _promise2.default(function (resolve, reject) {
    _appConfig2.default.findOneAsync({ key: 'stripeConfig' }).then(function (foundDetails) {
      resolve(foundDetails.value.stripekey);
    }).catch(function (err) {
      reject(err);
    });
  });
}

function checkSaveCard(req, res) {
  _user2.default.findOneAsync({ email: req.body.email }).then(function (foundUser) {
    if (foundUser.cardDetails.length !== 0) {
      // eslint-disable-next-line
      var cards = foundUser.cardDetails.map(function (_ref) {
        var brand = _ref.brand,
            country = _ref.country,
            cvc_check = _ref.cvc_check,
            last4 = _ref.last4,
            fingerprint = _ref.fingerprint,
            funding = _ref.funding,
            exp_year = _ref.exp_year,
            exp_month = _ref.exp_month;
        return { brand: brand, country: country, cvc_check: cvc_check, last4: last4, fingerprint: fingerprint, funding: funding, exp_year: exp_year, exp_month: exp_month };
      });
      res.send({ data: cards, message: 'Card Exist' });
    } else {
      res.send({ message: 'No Saved Card' });
    }
  }).catch(function (err) {
    console.log(err, 'Error'); //eslint-disable-line
    res.send({ data: err, message: 'Error' });
  });
}

function removeCard(req, res) {
  _user2.default.findOneAsync({ email: req.body.email }).then(function (foundUser) {
    var cardDetails = foundUser.cardDetails;

    var indexOfCard = -1;
    if (cardDetails.length !== 0) {
      // eslint-disable-next-line
      cardDetails.map(function (obj, index) {
        //eslint-disable-line
        if (obj.fingerprint === req.body.fingerprint) {
          indexOfCard = index;
        }
      });
    }
    if (indexOfCard === -1) {
      res.send({ message: 'Card Not Found' });
    } else {
      cardDetails.splice(indexOfCard, 1);
      _user2.default.findOneAndUpdateAsync({ _id: foundUser._id }, { $set: { cardDetails: cardDetails } }, { new: true }) //eslint-disable-line
      .then(function (updateUser) {
        var newCardDetails = updateUser.cardDetails;
        res.send({ data: newCardDetails, message: 'Card Successfully Removed' });
      }).catch(function (err) {
        res.send({ data: err, message: 'Unable to delete card' });
      });
    }
  }).catch(function (err) {
    res.send({ data: err, message: 'Error in removing card' });
  });
}

function addCard(req, res) {
  var paymentDetails = req.body;
  getStripeKey().then(function (key) {
    var stripe = (0, _stripe2.default)(key);
    _user2.default.findOneAsync({ email: paymentDetails.email }).then(function (foundUser) {
      var user = foundUser;
      if (user.userCardId) {
        stripe.customers.createSource(user.userCardId, {
          source: {
            object: 'card',
            exp_month: paymentDetails.expiryMonth,
            exp_year: paymentDetails.expiryYear,
            number: paymentDetails.cardNumber,
            cvc: paymentDetails.cvc
          }
        }).then(function (newCard) {
          var newCardDetails = user.cardDetails;
          var checkUser = false;
          newCardDetails.forEach(function (obj) {
            if (newCard.fingerprint === obj.fingerprint) {
              checkUser = true;
            }
          });
          if (checkUser) {
            res.send({ message: 'Card Already Present' });
          } else if (paymentDetails.saveCard) {
            newCardDetails.push(newCard);
            _user2.default.findOneAndUpdateAsync({ _id: user._id }, { $set: { cardDetails: newCardDetails } }, { new: true }) //eslint-disable-line
            .then(function (updateUser) {
              res.send({ message: 'Successfully Added', data: updateUser });
            }).catch(function (err) {
              res.send({ data: err, message: 'Error in adding new card details in database' });
            });
          } else {
            res.send({ message: 'Card is not saved in database' });
          }
        }).catch(function (err) {
          res.send({ data: err, message: 'Error in adding card to Stripe Account' });
        });
      } else {
        stripe.customers.create({ email: paymentDetails.email }).then(function (customer) {
          console.log('Custmer', customer); //eslint-disable-line
          return stripe.customers.createSource(customer.id, {
            source: {
              object: 'card',
              exp_month: paymentDetails.expiryMonth,
              exp_year: paymentDetails.expiryYear,
              number: paymentDetails.cardNumber,
              cvc: paymentDetails.cvc
            }
          });
        }).then(function (source) {
          var newCardDetails = user.cardDetails;
          newCardDetails.push(source);
          _user2.default.findOneAndUpdateAsync({ _id: user._id }, { $set: { cardDetails: newCardDetails, userCardId: source.customer } }, { new: true }) //eslint-disable-line
          .then(function (updateUser) {
            res.send({ message: 'Card successfully added and customer id created', data: updateUser });
          }).catch(function (err) {
            res.send({ data: err, message: 'Error in adding new card data for new user' });
          });
        }).catch(function (err) {
          res.send({ data: err, message: 'Error in adding new card in stripe' });
        });
      }
    }).catch(function (err) {
      res.send({ data: err, message: 'Error in finding user' });
    });
  });
}

function updateCard(req, res) {
  var cardDetails = req.body;
  getStripeKey().then(function (key) {
    var stripe = (0, _stripe2.default)(key);
    _user2.default.findOneAsync({ email: cardDetails.email }).then(function (foundUser) {
      var user = foundUser;
      var cardId = null;
      if (cardDetails.fingerprint) {
        user.cardDetails.forEach(function (obj) {
          if (cardDetails.fingerprint === obj.fingerprint) {
            cardId = obj.id;
          }
        });
        if (cardId) {
          stripe.customers.update(user.userCardId, {
            default_source: cardId
          }).then(function (checkCard) {
            console.log('Default Card Changed', checkCard); //eslint-disable-line
          }).catch(function (err) {
            res.send({ data: err, message: 'Error in changing default card' });
          });
        } else {
          res.send({ message: 'No card found ' });
        }
        res.send({ message: 'Updated Successfully' });
      } else {
        res.send({ message: 'Fingerprint data not available' });
      }
    }).catch(function (err) {
      res.send({ data: err, message: 'Error in updating card details' });
    });
  });
}

function cardPayment(tripObj) {
  return new _promise2.default(function (resolve, reject) {
    getStripeKey().then(function (key) {
      var stripe = (0, _stripe2.default)(key);
      stripe.setTimeout(20000);
      _user2.default.findOneAsync({ email: tripObj.rider.email }).then(function (foundUser) {
        var user = foundUser;
        stripe.charges.create({
          amount: tripObj.tripAmt,
          currency: 'usd',
          customer: user.userCardId
        }).then(function (charge) {
          var paymentStatus = charge.status;
          // add transaction here
          resolve(paymentStatus);
        }).catch(function (err) {
          var paymentStatus = 'error';
          console.log(err); //eslint-disable-line
          // transaction here failed
          resolve(paymentStatus);
        });
      }).catch(function (err) {
        var paymentStatus = 'error';
        console.log(err); //eslint-disable-line
        reject(paymentStatus);
      });
    });
  }).catch(function (e) {
    console.log('test', e); //eslint-disable-line
  });
}

function getBalance(req, res) {
  _wallet2.default.findOneAsync({ userEmail: req.body.email }).then(function (foundWallet) {
    if (foundWallet !== null) {
      var returnObj = {
        success: true,
        message: '',
        data: {}
      };
      returnObj.data.user = foundWallet;
      returnObj.message = 'Wallet Present for this account';
      res.send(returnObj);
    } else {
      var _returnObj = {
        success: false,
        message: '',
        data: {}
      };
      _returnObj.data.user = foundWallet;
      _returnObj.message = 'No wallet Present for this account';
      res.send(_returnObj);
    }
  });
}

function payAll(tripObj) {
  _wallet2.default.findOneAndUpdateAsync({ userEmail: tripObj.rider.email }, { $inc: { walletBalance: -Number(tripObj.tripAmt) * 100 } }).then(function (updateWalletObj) {
    if (updateWalletObj) {
      // transaction insert
      var transactionOwner = new _transaction2.default({
        userIdFrom: tripObj.riderId,
        tripId: tripObj._id, //eslint-disable-line
        amount: Number(tripObj.tripAmt) * 20, // couz value is in cents
        walletIdFrom: tripObj.rider.email
      });
      transactionOwner.saveAsync().then(function (transactionRider) {
        var returnObj = {
          success: true,
          message: '',
          data: {}
        };
        returnObj.data.user = transactionRider;
        returnObj.message = 'transaction created successfully wallet was present';
      });
      _wallet2.default.findOneAndUpdateAsync({ userEmail: tripObj.driver.email }, { $inc: { walletBalance: Number(tripObj.tripAmt) * 80 } }).then(function (WalletObjDriver) {
        console.log(WalletObjDriver); //eslint-disable-line
        var transactionDriver = new _transaction2.default({
          userIdTo: tripObj.driverId,
          userIdFrom: tripObj.riderId,
          amount: Number(tripObj.tripAmt) * 80,
          tripId: tripObj._id, //eslint-disable-line
          walletIdFrom: tripObj.rider.email,
          walletIdTo: tripObj.driver.email
        });
        transactionDriver.saveAsync().then(function (transactionRider) {
          var returnObj = {
            success: true,
            message: '',
            data: {}
          };
          returnObj.data.user = transactionRider;
          returnObj.message = 'transaction created successfully wallet was not present';
        });
      });
    } else {
      var returnObj = {
        success: false,
        message: '',
        data: {}
      };
      returnObj.data.user = updateWalletObj;
      returnObj.message = 'walletBalance updatation failed';
      returnObj.success = false;
    }
  });
}

function addBalance(req, res, next) {
  _wallet2.default.findOneAndUpdateAsync({ userEmail: req.body.riderEmail }, { $inc: { walletBalance: Number(req.body.amount) } }).then(function (updateWalletObj) {
    if (updateWalletObj) {
      // transaction insert
      var transactionOwner = new _transaction2.default({
        userIdFrom: req.body.riderEmail,
        tripId: req.body.tripId,
        amount: Number(req.body.amount),
        walletIdFrom: req.body.riderEmail
      });
      transactionOwner.saveAsync().then(function (transactionRider) {
        var returnObj = {
          success: true,
          message: '',
          data: {}
        };
        returnObj.data.user = transactionRider;
        returnObj.message = 'transaction created successfully';
        res.send(returnObj);
      });
    } else {
      var wallet = new _wallet2.default({
        userEmail: req.body.riderEmail,
        walletBalance: req.body.amount
      });
      wallet.saveAsync().then(function (savedWallet) {
        console.log(savedWallet); //eslint-disable-line
        var transactionOwner = new _transaction2.default({
          userIdFrom: req.body.riderEmail,
          tripId: req.body.tripId,
          amount: Number(req.body.amount),
          walletIdFrom: req.body.riderEmail
        });
        transactionOwner.saveAsync().then(function (transactionRider) {
          var returnObj = {
            success: true,
            message: '',
            data: {}
          };
          returnObj.data.user = transactionRider;
          returnObj.message = 'transaction created successfully';
          res.send(returnObj);
        }).error(function (e) {
          console.log('error', e);
        }); //eslint-disable-line
      });
    }
  }).error(function (e) {
    next(e);
  });
}

function saveTransaction(tripObj) {
  var transactionOwner = new _transaction2.default({
    userIdFrom: tripObj.riderId,
    tripId: tripObj._id, //eslint-disable-line
    amount: Number(tripObj.tripAmt),
    userIdTo: tripObj.driverId
  });
  transactionOwner.saveAsync().then(function (transactionRider) {
    var returnObj = {
      success: true,
      message: '',
      data: {}
    };
    returnObj.data.user = transactionRider;
    returnObj.message = 'Transaction created successfully';
  });
}

exports.default = {
  getStripeKey: getStripeKey,
  payAll: payAll,
  getBalance: getBalance,
  addBalance: addBalance,
  checkSaveCard: checkSaveCard,
  removeCard: removeCard,
  addCard: addCard,
  cardPayment: cardPayment,
  updateCard: updateCard,
  saveTransaction: saveTransaction
};
//# sourceMappingURL=payment.js.map
