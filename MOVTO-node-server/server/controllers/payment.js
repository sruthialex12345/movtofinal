import stripePackage from 'stripe';
import AppConfig from '../models/appConfig';
import Transaction from '../models/transaction';
import User from '../models/user';
import Wallet from '../models/wallet';

function getStripeKey() {
  return new Promise((resolve, reject) => {
    AppConfig.findOneAsync({ key: 'stripeConfig' })
      .then((foundDetails) => {
        resolve(foundDetails.value.stripekey);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function checkSaveCard(req, res) {
  User.findOneAsync({ email: req.body.email })
    .then((foundUser) => {
      if (foundUser.cardDetails.length !== 0) {
        // eslint-disable-next-line
        const cards = foundUser.cardDetails.map(({ brand, country, cvc_check, last4, fingerprint, funding, exp_year, exp_month }) => ({ brand, country, cvc_check, last4, fingerprint, funding, exp_year, exp_month }));
        res.send({ data: cards, message: 'Card Exist' });
      } else {
        res.send({ message: 'No Saved Card' });
      }
    })
    .catch((err) => {
      console.log(err, 'Error'); //eslint-disable-line
      res.send({ data: err, message: 'Error' });
    });
}

function removeCard(req, res) {
  User.findOneAsync({ email: req.body.email })
    .then((foundUser) => {
      const { cardDetails } = foundUser;
      let indexOfCard = -1;
      if (cardDetails.length !== 0) {
        // eslint-disable-next-line
        cardDetails.map((obj, index) => {
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
        User.findOneAndUpdateAsync({ _id: foundUser._id }, { $set: { cardDetails } }, { new: true }) //eslint-disable-line
          .then((updateUser) => {
            const newCardDetails = updateUser.cardDetails;
            res.send({ data: newCardDetails, message: 'Card Successfully Removed' });
          })
          .catch((err) => {
            res.send({ data: err, message: 'Unable to delete card' });
          });
      }
    })
    .catch((err) => {
      res.send({ data: err, message: 'Error in removing card' });
    });
}

function addCard(req, res) {
  const paymentDetails = req.body;
  getStripeKey().then((key) => {
    const stripe = stripePackage(key);
    User.findOneAsync({ email: paymentDetails.email })
      .then((foundUser) => {
        const user = foundUser;
        if (user.userCardId) {
          stripe.customers
            .createSource(user.userCardId, {
              source: {
                object: 'card',
                exp_month: paymentDetails.expiryMonth,
                exp_year: paymentDetails.expiryYear,
                number: paymentDetails.cardNumber,
                cvc: paymentDetails.cvc,
              },
            })
            .then((newCard) => {
              const newCardDetails = user.cardDetails;
              let checkUser = false;
              newCardDetails.forEach((obj) => {
                if (newCard.fingerprint === obj.fingerprint) {
                  checkUser = true;
                }
              });
              if (checkUser) {
                res.send({ message: 'Card Already Present' });
              } else if (paymentDetails.saveCard) {
                newCardDetails.push(newCard);
                User.findOneAndUpdateAsync({ _id: user._id }, { $set: { cardDetails: newCardDetails } }, { new: true }) //eslint-disable-line
                  .then((updateUser) => {
                    res.send({ message: 'Successfully Added', data: updateUser });
                  })
                  .catch((err) => {
                    res.send({ data: err, message: 'Error in adding new card details in database' });
                  });
              } else {
                res.send({ message: 'Card is not saved in database' });
              }
            })
            .catch((err) => {
              res.send({ data: err, message: 'Error in adding card to Stripe Account' });
            });
        } else {
          stripe.customers
            .create({ email: paymentDetails.email })
            .then((customer) => {
              console.log('Custmer', customer); //eslint-disable-line
              return stripe.customers.createSource(customer.id, {
                source: {
                  object: 'card',
                  exp_month: paymentDetails.expiryMonth,
                  exp_year: paymentDetails.expiryYear,
                  number: paymentDetails.cardNumber,
                  cvc: paymentDetails.cvc,
                },
              });
            })
            .then((source) => {
              const newCardDetails = user.cardDetails;
              newCardDetails.push(source);
              User.findOneAndUpdateAsync({ _id: user._id }, { $set: { cardDetails: newCardDetails, userCardId: source.customer } }, { new: true }) //eslint-disable-line
                .then((updateUser) => {
                  res.send({ message: 'Card successfully added and customer id created', data: updateUser });
                })
                .catch((err) => {
                  res.send({ data: err, message: 'Error in adding new card data for new user' });
                });
            })
            .catch((err) => {
              res.send({ data: err, message: 'Error in adding new card in stripe' });
            });
        }
      })
      .catch((err) => {
        res.send({ data: err, message: 'Error in finding user' });
      });
  });
}

function updateCard(req, res) {
  const cardDetails = req.body;
  getStripeKey().then((key) => {
    const stripe = stripePackage(key);
    User.findOneAsync({ email: cardDetails.email })
      .then((foundUser) => {
        const user = foundUser;
        let cardId = null;
        if (cardDetails.fingerprint) {
          user.cardDetails.forEach((obj) => {
            if (cardDetails.fingerprint === obj.fingerprint) {
              cardId = obj.id;
            }
          });
          if (cardId) {
            stripe.customers
              .update(user.userCardId, {
                default_source: cardId,
              })
              .then((checkCard) => {
                console.log('Default Card Changed', checkCard); //eslint-disable-line
              })
              .catch((err) => {
                res.send({ data: err, message: 'Error in changing default card' });
              });
          } else {
            res.send({ message: 'No card found ' });
          }
          res.send({ message: 'Updated Successfully' });
        } else {
          res.send({ message: 'Fingerprint data not available' });
        }
      })
      .catch((err) => {
        res.send({ data: err, message: 'Error in updating card details' });
      });
  });
}

function cardPayment(tripObj) {
  return new Promise((resolve, reject) => {
    getStripeKey().then((key) => {
      const stripe = stripePackage(key);
      stripe.setTimeout(20000);
      User.findOneAsync({ email: tripObj.rider.email })
        .then((foundUser) => {
          const user = foundUser;
          stripe.charges
            .create({
              amount: tripObj.tripAmt,
              currency: 'usd',
              customer: user.userCardId,
            })
            .then((charge) => {
              const paymentStatus = charge.status;
              // add transaction here
              resolve(paymentStatus);
            })
            .catch((err) => {
              const paymentStatus = 'error';
              console.log(err); //eslint-disable-line
              // transaction here failed
              resolve(paymentStatus);
            });
        })
        .catch((err) => {
          const paymentStatus = 'error';
          console.log(err); //eslint-disable-line
          reject(paymentStatus);
        });
    });
  }).catch((e) => {
    console.log('test', e); //eslint-disable-line
  });
}

function getBalance(req, res) {
  Wallet.findOneAsync({ userEmail: req.body.email }).then((foundWallet) => {
    if (foundWallet !== null) {
      const returnObj = {
        success: true,
        message: '',
        data: {},
      };
      returnObj.data.user = foundWallet;
      returnObj.message = 'Wallet Present for this account';
      res.send(returnObj);
    } else {
      const returnObj = {
        success: false,
        message: '',
        data: {},
      };
      returnObj.data.user = foundWallet;
      returnObj.message = 'No wallet Present for this account';
      res.send(returnObj);
    }
  });
}

export function payAll(tripObj) {
  Wallet.findOneAndUpdateAsync({ userEmail: tripObj.rider.email }, { $inc: { walletBalance: -Number(tripObj.tripAmt) * 100 } }).then((updateWalletObj) => {
    if (updateWalletObj) {
      // transaction insert
      const transactionOwner = new Transaction({
        userIdFrom: tripObj.riderId,
        tripId: tripObj._id, //eslint-disable-line
        amount: Number(tripObj.tripAmt) * 20, // couz value is in cents
        walletIdFrom: tripObj.rider.email,
      });
      transactionOwner.saveAsync().then((transactionRider) => {
        const returnObj = {
          success: true,
          message: '',
          data: {},
        };
        returnObj.data.user = transactionRider;
        returnObj.message = 'transaction created successfully wallet was present';
      });
      Wallet.findOneAndUpdateAsync({ userEmail: tripObj.driver.email }, { $inc: { walletBalance: Number(tripObj.tripAmt) * 80 } }).then((WalletObjDriver) => {
        console.log(WalletObjDriver); //eslint-disable-line
        const transactionDriver = new Transaction({
          userIdTo: tripObj.driverId,
          userIdFrom: tripObj.riderId,
          amount: Number(tripObj.tripAmt) * 80,
          tripId: tripObj._id, //eslint-disable-line
          walletIdFrom: tripObj.rider.email,
          walletIdTo: tripObj.driver.email,
        });
        transactionDriver.saveAsync().then((transactionRider) => {
          const returnObj = {
            success: true,
            message: '',
            data: {},
          };
          returnObj.data.user = transactionRider;
          returnObj.message = 'transaction created successfully wallet was not present';
        });
      });
    } else {
      const returnObj = {
        success: false,
        message: '',
        data: {},
      };
      returnObj.data.user = updateWalletObj;
      returnObj.message = 'walletBalance updatation failed';
      returnObj.success = false;
    }
  });
}

function addBalance(req, res, next) {
  Wallet.findOneAndUpdateAsync({ userEmail: req.body.riderEmail }, { $inc: { walletBalance: Number(req.body.amount) } })
    .then((updateWalletObj) => {
      if (updateWalletObj) {
        // transaction insert
        const transactionOwner = new Transaction({
          userIdFrom: req.body.riderEmail,
          tripId: req.body.tripId,
          amount: Number(req.body.amount),
          walletIdFrom: req.body.riderEmail,
        });
        transactionOwner.saveAsync().then((transactionRider) => {
          const returnObj = {
            success: true,
            message: '',
            data: {},
          };
          returnObj.data.user = transactionRider;
          returnObj.message = 'transaction created successfully';
          res.send(returnObj);
        });
      } else {
        const wallet = new Wallet({
          userEmail: req.body.riderEmail,
          walletBalance: req.body.amount,
        });
        wallet.saveAsync().then((savedWallet) => {
          console.log(savedWallet); //eslint-disable-line
          const transactionOwner = new Transaction({
            userIdFrom: req.body.riderEmail,
            tripId: req.body.tripId,
            amount: Number(req.body.amount),
            walletIdFrom: req.body.riderEmail,
          });
          transactionOwner
            .saveAsync()
            .then((transactionRider) => {
              const returnObj = {
                success: true,
                message: '',
                data: {},
              };
              returnObj.data.user = transactionRider;
              returnObj.message = 'transaction created successfully';
              res.send(returnObj);
            })
            .error((e) => {
              console.log('error', e);
            }); //eslint-disable-line
        });
      }
    })
    .error((e) => {
      next(e);
    });
}

export function saveTransaction(tripObj) {
  const transactionOwner = new Transaction({
    userIdFrom: tripObj.riderId,
    tripId: tripObj._id, //eslint-disable-line
    amount: Number(tripObj.tripAmt),
    userIdTo: tripObj.driverId,
  });
  transactionOwner.saveAsync().then((transactionRider) => {
    const returnObj = {
      success: true,
      message: '',
      data: {},
    };
    returnObj.data.user = transactionRider;
    returnObj.message = 'Transaction created successfully';
  });
}

export default {
  getStripeKey,
  payAll,
  getBalance,
  addBalance,
  checkSaveCard,
  removeCard,
  addCard,
  cardPayment,
  updateCard,
  saveTransaction,
};
