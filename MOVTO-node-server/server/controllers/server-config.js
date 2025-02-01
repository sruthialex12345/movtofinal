import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import ServerConfig from '../models/serverConfig';
import _ from 'lodash'; //eslint-disable-line

function getConfig(req, res, next) {
  // eslint-disable-next-line
  ServerConfig.find((error, configData) => {
    if (error) {
      const err = new APIError(`error while finding corresponding data  ${error}`, httpStatus.INTERNAL_SERVER_ERROR);
      return next(err);
    }
    const configObj = {};
    _.map(configData, (keyData) => {
      configObj[keyData.key] = keyData.value;
    });
    res.send(configObj);
  });
}

function updateConfig(req, res, next) {
  const reqObj = Object.assign({}, req.body);
  const result = [];
  const keys = _.keys(reqObj);
  const values = _.values(reqObj);
  _.map(keys, (keyitem, index) => {
    ServerConfig.findOneAsync({ key: keyitem }).then((foundKey) => {
      if (foundKey !== null) {
        ServerConfig.findOneAndUpdateAsync({ key: keyitem }, { $set: { value: values[index] } }, { new: true })
          .then((updatedConfigObj) => {
            if (updatedConfigObj) {
              result.push(updatedConfigObj);
              res.send(result);
            }
          })
          .error((e) => {
            const err = new APIError(`error in updating user details while login ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
            next(err);
          });
      } else {
        const newConfig = new ServerConfig({
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

export default { getConfig, updateConfig };
