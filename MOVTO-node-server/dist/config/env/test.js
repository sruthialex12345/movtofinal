'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  env: 'test',
  jwtSecret: '0a6b944d-d2fb-46fc-a85e-0295c986cd9f',
  db: 'mongodb://localhost/taxiApp-api-test',
  port: 4123,
  passportOptions: {
    session: false
  },
  radius: 320000000000 / 6371,
  arrivedDistance: 200,
  arrivingDistance: 1000,
  limit: 10,
  skip: 0,
  tripFilter: 'All'
};
module.exports = exports.default;
//# sourceMappingURL=test.js.map
