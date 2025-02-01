'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _createUser$createUse;

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

var _userTypes = require('../server/constants/user-types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (_createUser$createUse = {
  // POST /api/users/register
  createUser: {
    body: {
      email: _joi2.default.string().required().label('Email is required'),
      // Minimum eight characters, at least one letter, one digit and one special character
      // password: Joi.string().regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)
      // .required().label("Invalid Password: Password should contain minimum eight characters, at least one letter, one digit and one special character"),
      password: _joi2.default.string().regex(/^(?=.*?[a-zA-Z])(?=.*?[0-9]).{8,}$/).required().label("Invalid Password: Password should contain minimum eight characters, at least one letter, one digit"),
      phoneNo: _joi2.default.string().required().label('Phone No. is required')
    }
  },

  createUserAdmin: {
    body: {
      email: _joi2.default.string().required().label('Email is required'),
      // Minimum eight characters, at least one letter, one digit and one special character
      // password: Joi.string().regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)
      // .required().label("Invalid Password: Password should contain minimum eight characters, at least one letter, one digit and one special character"),
      // password: Joi.string().regex(/^(?=.*?[a-zA-Z])(?=.*?[0-9]).{8,}$/)
      // .required().label("Invalid Password: Password should contain minimum eight characters, at least one letter, one digit"),
      phoneNo: _joi2.default.string().required().label('Phone No. is required')
    }
  },

  // PUT /api/users/mobile-phone
  updatePhoneNo: {
    body: {
      phoneNo: _joi2.default.string().required().label("Phone no. is required"),
      isdCode: _joi2.default.string().required().label("ISD Code is required"),
      countryCode: _joi2.default.string().required().label("Country code is required")
    }
  },

  // UPDATE /api/users
  updateUser: {
    body: {
      fname: _joi2.default.string().required().label("First name is required"),
      lname: _joi2.default.string().required().label("Last name is required"),
      phoneNo: _joi2.default.string().required().label("Phone no. is required")
    }
  },

  // POST /api/auth/login
  login: {
    body: {
      email: _joi2.default.string().required().label('Email is required'),
      password: _joi2.default.string().required().label('Password is required'),
      userType: _joi2.default.string().required().label('User type is required')
    }
  },

  // POST /api/auth/logindriver
  loginDriver: {
    body: {
      email: _joi2.default.string().required().label('Email is required'),
      password: _joi2.default.string().required().label('Password is required')
    }
  },

  // POST /api/auth/loginadmin
  loginadmin: {
    body: {
      email: _joi2.default.string().required().label('Email is required'),
      password: _joi2.default.string().required().label('Password is required')
    }
  },

  /**GET /api/users/drivers/rides/terminal/complete */
  tripRequests: {
    query: {
      tripId: _joi2.default.string().required().label('Trip Id is required'),
      driverId: _joi2.default.string().required().label('Driver Id is required'),
      terminalId: _joi2.default.string().required().label('Terminal Id is required')
    }
  }

}, (0, _defineProperty3.default)(_createUser$createUse, 'tripRequests', {
  query: {
    tripId: _joi2.default.string().required().label('Trip Id is required')
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'userList', {
  query: {
    limit: _joi2.default.number().integer().min(1),
    pageNo: _joi2.default.number().integer().min(1),
    userType: _joi2.default.string().required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'pending', {
  query: {
    userType: _joi2.default.string().required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'approve', {
  query: {
    id: _joi2.default.string().alphanum().required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'reject', {
  query: {
    id: _joi2.default.string().alphanum().required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'updateUserByAdmin', {
  body: {
    _id: _joi2.default.string().alphanum().required(),
    userType: _joi2.default.string().valid(_userTypes.USER_TYPE_RIDER, _userTypes.USER_TYPE_DRIVER).required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'updateDriverByAdmin', {
  body: {
    driverId: _joi2.default.string().alphanum().required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'removeDriverByAdmin', {
  query: {
    driverId: _joi2.default.string().alphanum().required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'createVehicle', {
  body: {
    adminId: _joi2.default.string().alphanum().required(),
    vehicleNo: _joi2.default.string().required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'updateVehicleByAdmin', {
  body: {
    vehicleId: _joi2.default.string().alphanum().required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'removeVehicleByAdmin', {
  query: {
    vehicleId: _joi2.default.string().alphanum().required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'tripList', {
  query: {
    limit: _joi2.default.number().integer().min(1),
    pageNo: _joi2.default.number().integer().min(1)
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'userTripRequestList', {
  query: {
    limit: _joi2.default.number().integer().min(1),
    pageNo: _joi2.default.number().integer().min(1),
    filter: _joi2.default.string()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'tripRevenueGraph', {
  params: {
    revenueYear: _joi2.default.number().integer().min(2000)
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'createNewTrip', {
  body: {
    riderId: _joi2.default.string().regex(/^[0-9a-fA-F]{24}$/),
    driverId: _joi2.default.string().regex(/^[0-9a-fA-F]{24}$/)
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'updateTripObject', {
  body: {
    riderId: _joi2.default.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    driverId: _joi2.default.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    pickUpAddress: _joi2.default.string().required(),
    destAddress: _joi2.default.string().required(),
    paymentMode: _joi2.default.string().required(),
    taxiType: _joi2.default.string().required(),
    // riderRatingByDriver: Joi.number()
    //   .integer()
    //   .required(),
    // driverRatingByRider: Joi.number()
    //   .integer()
    //   .required(),
    tripStatus: _joi2.default.string().required(),
    tripIssue: _joi2.default.string().required(),
    tripAmt: _joi2.default.number().integer().required(),
    seatBooked: _joi2.default.number().integer().required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'createNewAdminUser', {
  body: {
    userType: _joi2.default.string().valid(_userTypes.USER_TYPE_DRIVER, _userTypes.USER_TYPE_ADMIN).required(),
    email: _joi2.default.string().email().required(),
    phoneNo: _joi2.default.string().required(),
    locationId: _joi2.default.string().required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'onlineOffline', {
  body: {
    adminId: _joi2.default.string().alphanum().required(),
    driverId: _joi2.default.string().alphanum().required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'requestNewAccessCode', {
  body: {
    adminId: _joi2.default.string().alphanum().required(),
    userType: _joi2.default.string().valid(_userTypes.USER_TYPE_DRIVER, _userTypes.USER_TYPE_ADMIN).required(),
    phoneNo: _joi2.default.string().required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'createNewSuperAdminUser', {
  body: {
    userType: _joi2.default.string().valid(_userTypes.USER_TYPE_RIDER, _userTypes.USER_TYPE_DRIVER, _userTypes.USER_TYPE_ADMIN, _userTypes.USER_TYPE_SUPER_ADMIN).required(),
    email: _joi2.default.string().email().required(),
    password: _joi2.default.string().regex(/^[a-zA-Z0-9]{3,30}$/).required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'addReview', {
  body: {
    reviewerId: _joi2.default.string().regex(/^[0-9a-fA-F]{24}$/),
    reviewToType: _joi2.default.string().required()
    // message: Joi.string().required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'fromTerminalsValidate', {
  query: {
    adminId: _joi2.default.string().required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'toTerminalsValidate', {
  query: {
    adminId: _joi2.default.string().required()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'createAdmin', {
  body: {
    email: _joi2.default.string().required().label('Email is required'),
    phoneNo: _joi2.default.string().required().label('Phone No. is required')
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'createFaq', {
  body: {
    question: _joi2.default.string().required().label('Question is required'),
    answer: _joi2.default.string().required().label('Answer is required')
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'addRoute', {
  body: {
    name: _joi2.default.string().required().label('name is required'),
    locationId: _joi2.default.string().required().label('location is required'),
    terminals: _joi2.default.array().required().label('terminals are not valid/missing')
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'updateRoute', {
  body: {
    locationId: _joi2.default.string(),
    address: _joi2.default.string()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'getRouteDetails', {
  query: {
    routeId: _joi2.default.string().required().label('routeId is required')
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'removeRoute', {
  query: {
    routeId: _joi2.default.string().required().label('routeId is required')
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'addTerminal', {
  query: {
    routeId: _joi2.default.string().required().label('routeId is required')
  },
  body: {
    loc: _joi2.default.array().required().label('location is required'),
    address: _joi2.default.string().required().label('address is required'),
    name: _joi2.default.string().required().label('name is required'),
    type: _joi2.default.string().required().label('type is required')
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'updateTerminal', {
  query: {
    routeId: _joi2.default.string().required().label('routeId is required')
  },
  body: {
    _id: _joi2.default.string().required().label('terminal Id is required'),
    loc: _joi2.default.array(),
    address: _joi2.default.string(),
    name: _joi2.default.string(),
    type: _joi2.default.string()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'removeTerminal', {
  query: {
    routeId: _joi2.default.string().required().label('routeId is required')
  },
  body: {
    _id: _joi2.default.string().required().label('terminal Id is required'),
    loc: _joi2.default.array(),
    address: _joi2.default.string(),
    name: _joi2.default.string(),
    type: _joi2.default.string()
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'assignDriver', {
  body: {
    requestId: _joi2.default.string().required().label('request ID is required'),
    driverId: _joi2.default.string().required().label('driver ID is required')
  }
}), (0, _defineProperty3.default)(_createUser$createUse, 'cancelScheduleRequest', {
  body: {
    requestId: _joi2.default.string().required().label('request ID is required')
  }
}), _createUser$createUse);
module.exports = exports.default;
//# sourceMappingURL=param-validation.js.map
