import mongoose from 'mongoose';
import cloudinary from 'cloudinary';
import formidable from 'formidable';
import User from '../models/user';
import TripSchema from '../models/trip';
import ServerConfig from '../models/serverConfig';

/**
 * Get getCloudinaryDetails
 * @returns {getCloudinaryDetails}
 */
function getCloudinaryDetails() {
  return new Promise((resolve, reject) => {
    ServerConfig.findOneAsync({ key: 'cloudinaryConfig' })
      .then((foundDetails) => {
        resolve(foundDetails.value);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export const addPassenger = (req, res) => {
  const { userId, ...passengerDetails } = req.body;
  // eslint-disable-next-line no-underscore-dangle
  passengerDetails._id = new mongoose.Types.ObjectId();
  User.findOneAsync({ _id: userId }).then((user) => {
    const newPassengerList = user.passengerList.concat([passengerDetails]);
    User.findOneAndUpdateAsync({ _id: user._id }, { $set: { passengerList: newPassengerList } }, { new: true }) //eslint-disable-line
      .then((updateUser) => {
        res.send({ message: 'Passenger successfully added', data: updateUser });
      })
      .catch((err) => {
        res.send({ data: err, message: 'Error adding new passenger' });
      });
  });
};

// eslint-disable-next-line consistent-return
export const addPassengerTrip = (req, res) => {
  const { tripId, pickUpTime, passengerIds } = req.body;
  if (passengerIds.length > 4) {
    return res.send({ status: false, code: 400, message: 'Maximum 4 passenger can be added in one ride.' });
  }
  TripSchema.findOneAndUpdateAsync({ _id: tripId }, { $set: { passengerIds, pickUpTime } }, { new: true })
    .then((tripData) => {
      if (tripData) {
        res.send({ status: true, code: 200, message: 'Passeger added successfully' });
      } else {
        res.send({ status: false, code: 400, message: 'No passenger added' });
      }
    })
    .catch(() => {
      res.send({ status: false, code: 400, message: 'server error while adding passenger' });
    });
};

export const updatePassenger = (req, res) => {
  const { userId, ...passengerDetails } = req.body;

  User.findOneAsync({ _id: userId })
    .then((user) => {
      let passengerId = null;
      // eslint-disable-next-line array-callback-return
      user.passengerList.map((passenger) => {
        if (passengerDetails.id === passenger.id) {
          passengerId = passenger.id;
        }
      });
      if (passengerId) {
        // todo: update passenger
      } else {
        res.send({ message: 'No passenger found' });
      }
    })
    .catch((err) => {
      res.send({ data: err, message: 'Error in updating passenger details' });
    });
};

export const removePassenger = (req, res) => {
  // eslint-disable-next-line no-underscore-dangle
  const userId = req.user._id;
  const { passengerId } = req.body;
  getPassengerIncompleteRides(userId, passengerId).then((resp) => {
    if (resp.data.length > 0) {
      res.send({ status: false, data: [], message: 'Passenger is added on trip, therefore cannot be deleted' });
    } else {
      User.findOneAsync({ _id: userId })
        .then((user) => {
          const oldPassengerList = user.passengerList || [];
          const passengerList = oldPassengerList.map((p) => {
            // eslint-disable-next-line no-underscore-dangle
            if (p._id === passengerId) {
              p.isDeleted = true;
              p.deletedAt = new Date().toISOString();
            }
            return p;
          });
          User.findOneAndUpdateAsync({ _id: user._id }, { $set: { passengerList } }, { new: true }) // eslint-disable-line no-underscore-dangle
            .then((updateUser) => {
              const newPassengerList = updateUser.passengerList;
              // console.log(newPassengerList);
              res.send({ data: newPassengerList, message: 'Passenger successfully removed' });
            })
            .catch((err) => {
              res.send({ data: err, message: 'Unable to delete passenger' });
            });
        })
        .catch((err) => {
          res.send({ data: err, message: 'Error in removing passenger' });
        });
    }
  });
};

export function getPassengerIncompleteRides(userId, _id) {
  return new Promise((resolve, reject) => {
    TripSchema.findAsync({ riderId: userId, passengerIds: { $in: [_id] }, $and: [{ tripStatus: { $ne: 'completed' } }, { tripStatus: { $ne: 'cancelled' } }, { tripStatus: { $ne: 'expired' } }] })
      .then((tripData) => {
        if (tripData.length > 0) {
          const resp = {
            data: [],
            message: 'No trips found',
          };
          resolve(resp);
        } else {
          const resp = {
            data: tripData,
            message: 'Trips found',
          };
          resolve(resp);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * upload user image
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */
export const uploadImage = (req, res /* , next */) => {
  getCloudinaryDetails().then((value) => {
    if (value) {
      cloudinary.config({
        cloud_name: value.cloud_name,
        api_key: value.api_key,
        api_secret: value.api_secret,
      });
      const form = new formidable.IncomingForm();
      form.on('error', (err) => {
        console.error(err); // eslint-disable-line no-console
      });

      form.parse(req, (err, fields, files) => {
        const imgpath = files.image;
        cloudinary.v2.uploader.upload(
          imgpath.path,
          {
            transformation: [
              {
                effect: 'improve',
                gravity: 'face',
                height: 100,
                radius: 'max',
                width: 100,
                crop: 'fill',
              },
              { quality: 'auto' },
            ],
          },
          (error, results) => {
            if (results) {
              const { user, passengerId } = req;
              if (req.headers.updatetype === 'profile') {
                // user.profileUrl = results.url;

                // eslint-disable-next-line no-underscore-dangle
                User.findOneAsync({ _id: user._id })
                  .then((foundUser) => {
                    const oldPassengerList = foundUser.passengerList || [];
                    const passengerList = oldPassengerList.map((p) => {
                      // eslint-disable-next-line no-underscore-dangle
                      if (p._id === passengerId) {
                        p.profileUrl = results.url;
                      }

                      return p;
                    });

                    User.findOneAndUpdateAsync({ _id: foundUser._id }, { $set: { passengerList } }, { new: true }) //eslint-disable-line
                      .then((updateUser) => {
                        const newPassengerList = updateUser.passengerList;
                        res.send({ success: true, message: 'Passenger image successfully updated', data: newPassengerList });
                      })
                      .catch(() => {
                        res.send({ data: err, message: 'Unable to update passenger image' });
                      });
                  })
                  .catch(() => {
                    res.send({ data: err, message: 'Error in updating passenger image' });
                  });
              }
            }
          }
        );
      });
    } else {
      const returnObj = {
        success: false,
        message: 'Problem in updating',
        data: req.user,
      };
      res.send(returnObj);
    }
  });
};
