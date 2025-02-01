import Joi from 'joi';
import { USER_TYPE_RIDER, USER_TYPE_DRIVER, USER_TYPE_ADMIN, USER_TYPE_SUPER_ADMIN } from '../server/constants/user-types';

export default {
  // POST /api/users/register
  createUser: {
    body: {
      email: Joi.string().required().label('Email is required'),
      // Minimum eight characters, at least one letter, one digit and one special character
      // password: Joi.string().regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)
      // .required().label("Invalid Password: Password should contain minimum eight characters, at least one letter, one digit and one special character"),
      password: Joi.string().regex(/^(?=.*?[a-zA-Z])(?=.*?[0-9]).{8,}$/)
      .required().label("Invalid Password: Password should contain minimum eight characters, at least one letter, one digit"),
      phoneNo: Joi.string().required().label('Phone No. is required')
    },
  },

  createUserAdmin: {
    body: {
      email: Joi.string().required().label('Email is required'),
      // Minimum eight characters, at least one letter, one digit and one special character
      // password: Joi.string().regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)
      // .required().label("Invalid Password: Password should contain minimum eight characters, at least one letter, one digit and one special character"),
      // password: Joi.string().regex(/^(?=.*?[a-zA-Z])(?=.*?[0-9]).{8,}$/)
      // .required().label("Invalid Password: Password should contain minimum eight characters, at least one letter, one digit"),
      phoneNo: Joi.string().required().label('Phone No. is required')
    },
  },

  // PUT /api/users/mobile-phone
  updatePhoneNo: {
    body: {
      phoneNo: Joi.string().required().label("Phone no. is required"),
      isdCode: Joi.string().required().label("ISD Code is required"),
      countryCode: Joi.string().required().label("Country code is required")
    },
  },

  // UPDATE /api/users
  updateUser: {
    body: {
      fname: Joi.string().required().label("First name is required"),
      lname: Joi.string().required().label("Last name is required"),
      phoneNo: Joi.string().required().label("Phone no. is required"),
    },
  },


  // POST /api/auth/login
  login: {
    body: {
      email: Joi.string().required().label('Email is required'),
      password: Joi.string().required().label('Password is required'),
      userType: Joi.string().required().label('User type is required'),
    },
  },

  // POST /api/auth/logindriver
  loginDriver: {
    body: {
      email: Joi.string().required().label('Email is required'),
      password: Joi.string().required().label('Password is required')
    },
  },

  // POST /api/auth/loginadmin
  loginadmin: {
    body: {
      email: Joi.string().required().label('Email is required'),
      password: Joi.string().required().label('Password is required'),
    },
  },

  /**GET /api/users/drivers/rides/terminal/complete */
  tripRequests: {
    query: {
      tripId: Joi.string().required().label('Trip Id is required'),
      driverId: Joi.string().required().label('Driver Id is required'),
      terminalId: Joi.string().required().label('Terminal Id is required')
    }
  },

  // GET /api/users/drivers/terminalRideRequests
  tripRequests: {
    query: {
      tripId: Joi.string().required().label('Trip Id is required')
    }
  },

  // GET /api/admin/user
  userList: {
    query: {
      limit: Joi.number()
        .integer()
        .min(1),
      pageNo: Joi.number()
        .integer()
        .min(1),
      userType: Joi.string().required(),
    },
  },

  // Get /api/admin/approvePendingUsers
  pending: {
    query: {
      userType: Joi.string().required(),
    },
  },
  // PUT /api/admin/approveUser
  approve: {
    query: {
      id: Joi.string()
        .alphanum()
        .required(),
    },
  },

  reject: {
    query: {
      id: Joi.string()
        .alphanum()
        .required(),
    },
  },
  // GET /api/admin/allusers
  // alluserList: {
  //   query: {
  //     limit: Joi.number().integer().min(1),
  //   }
  // },
  // PUT /api/admin/user: userId

  updateUserByAdmin: {
    body: {
      _id: Joi.string()
        .alphanum()
        .required(),
      userType: Joi.string()
        .valid(USER_TYPE_RIDER, USER_TYPE_DRIVER)
        .required(),
    },
  },

  updateDriverByAdmin: {
    body: {
      driverId: Joi.string()
      .alphanum()
      .required()
    }
  },

  removeDriverByAdmin: {
    query: {
      driverId: Joi.string()
      .alphanum()
      .required()
    }
  },

  /** start: vehicle management validation by admin */

  createVehicle: {
    body: {
      adminId: Joi.string()
      .alphanum()
      .required(),
      vehicleNo: Joi.string().required()
    },
  },

  updateVehicleByAdmin: {
    body: {
      vehicleId: Joi.string()
      .alphanum()
      .required()
    }
  },

  removeVehicleByAdmin: {
    query: {
      vehicleId: Joi.string()
      .alphanum()
      .required()
    }
  },

  /** end: vehicle management validation by admin */

  // GET /api/admin/tripDetails
  tripList: {
    query: {
      limit: Joi.number()
        .integer()
        .min(1),
      pageNo: Joi.number()
        .integer()
        .min(1),
    },
  },

  // GET /api/admin/tripDetails
  userTripRequestList: {
    query: {
      limit: Joi.number()
        .integer()
        .min(1),
      pageNo: Joi.number()
        .integer()
        .min(1),
      filter: Joi.string(),
    },
  },
  tripRevenueGraph: {
    params: {
      revenueYear: Joi.number()
        .integer()
        .min(2000),
    },
  },
  createNewTrip: {
    body: {
      riderId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
      driverId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    },
  },
  updateTripObject: {
    body: {
      riderId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      driverId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      pickUpAddress: Joi.string().required(),
      destAddress: Joi.string().required(),
      paymentMode: Joi.string().required(),
      taxiType: Joi.string().required(),
      // riderRatingByDriver: Joi.number()
      //   .integer()
      //   .required(),
      // driverRatingByRider: Joi.number()
      //   .integer()
      //   .required(),
      tripStatus: Joi.string().required(),
      tripIssue: Joi.string().required(),
      tripAmt: Joi.number()
        .integer()
        .required(),
      seatBooked: Joi.number()
        .integer()
        .required(),
    },
  },
  // for admin/partner creating new user(driver/admin)
  createNewAdminUser: {
    body: {
      userType: Joi.string()
        .valid(USER_TYPE_DRIVER, USER_TYPE_ADMIN)
        .required(),
      email: Joi.string()
        .email()
        .required(),
      phoneNo: Joi.string().required(),
      locationId: Joi.string().required()
    },
  },

  onlineOffline: {
    body: {
      adminId: Joi.string()
        .alphanum()
        .required(),
      driverId: Joi.string()
      .alphanum()
      .required()
    },
  },

  requestNewAccessCode: {
    body: {
      adminId: Joi.string()
        .alphanum()
        .required(),
      userType: Joi.string()
        .valid(USER_TYPE_DRIVER, USER_TYPE_ADMIN)
        .required(),
      phoneNo: Joi.string().required()
    },
  },
  // for super admin creating new user
  createNewSuperAdminUser: {
    body: {
      userType: Joi.string()
        .valid(USER_TYPE_RIDER, USER_TYPE_DRIVER, USER_TYPE_ADMIN, USER_TYPE_SUPER_ADMIN)
        .required(),
      email: Joi.string()
        .email()
        .required(),
      password: Joi.string()
        .regex(/^[a-zA-Z0-9]{3,30}$/)
        .required(),
    },
  },
  addReview: {
    body: {
      reviewerId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
      reviewToType: Joi.string().required()
      // message: Joi.string().required()
    },
  },
  // GET /api/admin/user
  fromTerminalsValidate: {
    query: {
      adminId: Joi.string().required()
    },
  },
   // GET /api/admin/user
   toTerminalsValidate: {
    query: {
      adminId: Joi.string().required()
    },
  },

  createAdmin: {
    body: {
      email: Joi.string().required().label('Email is required'),
      phoneNo: Joi.string().required().label('Phone No. is required')
    },
  },

  createFaq: {
    body: {
      question: Joi.string().required().label('Question is required'),
      answer: Joi.string().required().label('Answer is required')
    },
  },

  /************************************
   * admin routes
   ************************************/
  addRoute: {
    body: {
      name: Joi.string().required().label('name is required'),
      locationId: Joi.string().required().label('location is required'),
      terminals: Joi.array().required().label('terminals are not valid/missing')
    }
  },

  updateRoute: {
    body: {
      locationId: Joi.string(),
      address: Joi.string()
    }
  },

  getRouteDetails: {
    query: {
      routeId: Joi.string().required().label('routeId is required')
    }
  },

  removeRoute: {
    query: {
      routeId: Joi.string().required().label('routeId is required')
    }
  },

  addTerminal: {
    query: {
      routeId: Joi.string().required().label('routeId is required')
    },
    body: {
      loc: Joi.array().required().label('location is required'),
      address: Joi.string().required().label('address is required'),
      name: Joi.string().required().label('name is required'),
      type: Joi.string().required().label('type is required')
    }
  },

  updateTerminal: {
    query: {
      routeId: Joi.string().required().label('routeId is required')
    },
    body: {
      _id: Joi.string().required().label('terminal Id is required'),
      loc: Joi.array(),
      address: Joi.string(),
      name: Joi.string(),
      type: Joi.string()
    }
  },

  removeTerminal: {
    query: {
      routeId: Joi.string().required().label('routeId is required')
    },
    body: {
      _id: Joi.string().required().label('terminal Id is required'),
      loc: Joi.array(),
      address: Joi.string(),
      name: Joi.string(),
      type: Joi.string()
    }
  },
  assignDriver: {
    body: {
      requestId: Joi.string().required().label('request ID is required'),
      driverId: Joi.string().required().label('driver ID is required')
    }
  },
  cancelScheduleRequest: {
    body: {
      requestId: Joi.string().required().label('request ID is required')
    }
  }

};
