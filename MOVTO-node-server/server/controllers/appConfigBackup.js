import httpStatus from 'http-status';
import AppConfig from '../models/appConfig';
import APIError from '../helpers/APIError';

const _ = require('lodash');

/**
 * Return the trip details of the user.
 * @param req
 * @param res
 * @param next
 * @returns { trip: historyObjArray[{ tripObj }]  }
 */
function getConfig(req, res, next) {
  // eslint-disable-next-line
  AppConfig.find((error, configData) => {
    if (error) {
      const err = new APIError(`error while finding version number for the user  ${error}`, httpStatus.INTERNAL_SERVER_ERROR);
      return next(err);
    }
    res.send(configData);
  });
}

function updateVersion(next) {
  return new Promise((resolve, reject) => {
    AppConfig.findOneAsync({ key: 'version' }).then((foundKey) => {
      if (foundKey !== null) {
        const prevValue = foundKey.value;
        const newVersion = prevValue + 1;
        AppConfig.findOneAndUpdateAsync({ key: 'version' }, { $set: { value: newVersion, type: 'Number' } }, { new: true })
          .then((updatedVersion) => {
            if (updatedVersion) {
              resolve(updatedVersion);
            }
          })
          .error((e) => {
            const err = new APIError(`error in updating user details while login ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
            next(err);
          });
      } else {
        const newVersionConfig = new AppConfig({
          type: 'Number',
          key: 'version',
          value: 1,
        });
        newVersionConfig
          .saveAsync()
          .then((savedVersionConfigObj) => {
            resolve(savedVersionConfigObj);
          })
          .error(e => reject(e));
      }
    });
  });
}

function updateConfig(req, res, next) {
  const reqObj = Object.assign({}, req.body);
  const result = [];
  const keys = _.keys(reqObj);
  const values = _.values(reqObj);
  _.map(keys, (keyitem, index) => {
    AppConfig.findOneAsync({ key: keyitem }).then((foundKey) => {
      if (foundKey !== null) {
        if (foundKey.value !== values[index]) {
          AppConfig.findOneAndUpdateAsync({ key: keyitem }, { $set: { value: values[index] } }, { new: true })
            .then((updatedConfigObj) => {
              if (updatedConfigObj) {
                result.push(updatedConfigObj);
                if (result.length === keys.length) {
                  updateVersion(next).then((versionConfig) => {
                    result.push(versionConfig);
                    res.send(result);
                  });
                }
              }
            })
            .error((e) => {
              const err = new APIError(`error in updating user details while login ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            });
        } else {
          result.push(foundKey);
          if (result.length === keys.length) {
            res.send(result);
          }
        }
      } else {
        const newConfig = new AppConfig({
          type: typeof values[index],
          key: keyitem,
          value: values[index],
        });
        newConfig
          .saveAsync()
          .then((savedConfigObj) => {
            result.push(savedConfigObj);
            if (result.length === keys.length) {
              res.send(result);
            }
          })
          .error(e => next(e));
      }
    });
  });
}
function getConfigVersion(req, res, next) {
  // eslint-disable-next-line
  AppConfig.find((error, configData) => {
    if (error) {
      const err = new APIError(`error while finding version number for the user  ${error}`, httpStatus.INTERNAL_SERVER_ERROR);
      return next(err);
    }
    const returnObj = {
      success: true,
      message: 'config version number',
      data: configData.version,
    };
    res.send(returnObj);
  });
}

export default { getConfigVersion, getConfig, updateConfig };
