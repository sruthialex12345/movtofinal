'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _httpStatus = require('http-status');

var _httpStatus2 = _interopRequireDefault(_httpStatus);

var _APIError = require('../helpers/APIError');

var _APIError2 = _interopRequireDefault(_APIError);

var _env = require('../../config/env');

var _env2 = _interopRequireDefault(_env);

var _staticPage = require('../models/staticPage');

var _staticPage2 = _interopRequireDefault(_staticPage);

var _contact = require('../models/contact');

var _contact2 = _interopRequireDefault(_contact);

var _requestDemo = require('../models/requestDemo');

var _requestDemo2 = _interopRequireDefault(_requestDemo);

var _emailApi = require('../service/emailApi');

var _emailApi2 = _interopRequireDefault(_emailApi);

var _joinOurPartner = require('../models/joinOurPartner');

var _joinOurPartner2 = _interopRequireDefault(_joinOurPartner);

var _blog = require('../models/blog');

var _blog2 = _interopRequireDefault(_blog);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var list = function list(req, res) {
  var _req$query = req.query,
      pageNo = _req$query.pageNo,
      _req$query$limit = _req$query.limit,
      limit = _req$query$limit === undefined ? _env2.default.limit : _req$query$limit;

  var name = req.query.keyword ? req.query.keyword : '';
  var query = {
    is_deleted: false,
    $or: [{ "heading": { $regex: name, $options: 'i' } }]
  };
  _staticPage2.default.countAsync(query).then(function (totalUserRecord) {
    console.log("totalUserRecord -- >", totalUserRecord);
    var returnObj = {
      success: true,
      message: 'no of Static pages are zero', // `no of active drivers are ${returnObj.data.length}`;
      data: null,
      meta: {
        totalNoOfPages: Math.ceil(totalUserRecord / limit),
        limit: limit,
        currPageNo: pageNo,
        currNoOfRecord: 20
      }
    };
    if (totalUserRecord < 1) {
      return res.send(returnObj);
    }
    _staticPage2.default.find(query).then(function (userData) {
      returnObj.data = userData;
      returnObj.message = 'Static pages found';
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      return res.send(returnObj);
    }).catch(function (err) {
      res.send('Error', err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of users ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside getAllUsers records');
    next(err);
  });
};

function staticPageDetails(req, res, next) {
  console.log(req.query);
  console.log(req.query.pageSlug);
  _staticPage2.default.findOneAsync({ slug: req.query.pageSlug }).then(function (StaticDoc) {
    var returnObj = {
      success: false,
      message: 'Unable to find the Page',
      data: "Not Found",
      meta: null
    };
    if (StaticDoc) {
      returnObj.success = true;
      returnObj.message = 'Success';
      returnObj.data = StaticDoc;
      res.send(returnObj);
    } else {
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function updateStaticPage(req, res, next) {
  var updatePageObj = (0, _assign2.default)({}, req.body);
  // console.log("Request-->",  req.body);
  _staticPage2.default.findOneAsync({ slug: req.body.slug }).then(function (pageDoc) {
    var returnObj = {
      success: false,
      message: 'unable to find the object',
      data: null,
      meta: null
    };
    if (pageDoc) {
      pageDoc.heading = updatePageObj.heading;
      pageDoc.content = updatePageObj.content;
      pageDoc.title = updatePageObj.title;
      pageDoc.description = updatePageObj.description;
      pageDoc.keywords = updatePageObj.keywords;
      pageDoc.author = updatePageObj.author;
      pageDoc.saveAsync().then(function (savedDoc) {
        returnObj.success = true;
        returnObj.message = 'Static page updated';
        returnObj.data = savedDoc;
        res.send(returnObj);
      }).error(function (e) {
        var err = new _APIError2.default('Error occured while updating the user details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    } else {
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

var contactList = function contactList(req, res) {
  var _req$query2 = req.query,
      pageNo = _req$query2.pageNo,
      _req$query2$limit = _req$query2.limit,
      limit = _req$query2$limit === undefined ? _env2.default.limit : _req$query2$limit;

  var name = req.query.keyword ? req.query.keyword : '';
  var query = {
    is_deleted: false,
    $or: [{ "name": { $regex: name, $options: 'i' } }, { "subject": { $regex: name, $options: 'i' } }, { "email": { $regex: name, $options: 'i' } }]
  };
  _contact2.default.countAsync(query).then(function (totalUserRecord) {
    console.log("totalUserRecord -- >", totalUserRecord);
    var returnObj = {
      success: true,
      message: 'no of Contactus list are zero', // `no of active drivers are ${returnObj.data.length}`;
      data: null,
      meta: {
        totalNoOfPages: Math.ceil(totalUserRecord / limit),
        limit: limit,
        currPageNo: pageNo,
        currNoOfRecord: 20
      }
    };
    if (totalUserRecord < 1) {
      return res.send(returnObj);
    }
    _contact2.default.find(query).then(function (userData) {
      returnObj.data = userData;
      returnObj.message = 'Contactus list found';
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      return res.send(returnObj);
    }).catch(function (err) {
      res.send('Error', err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of users ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside Contactus list records');
    next(err);
  });
};

// { email: req.body.email, phoneNo: req.body.phoneNo }
function contactus(req, res, next) {
  var userData = (0, _assign2.default)({}, req.body);
  var returnObj = {
    success: false,
    message: '',
    data: null
  };
  if (userData.email == '' || userData.name == '' || userData.slug == '' || userData.subject == '') {
    var err = new _APIError2.default('Please fill all required fields', _httpStatus2.default.CONFLICT, true);
    return next(err);
  }
  var contactsObj = new _contact2.default({
    email: userData.email,
    name: userData.name,
    message: userData.message,
    subject: userData.subject,
    isdCode: userData.isdCode,
    phoneNo: userData.phoneNo
  });
  contactsObj.saveAsync().then(function (savedUser) {
    returnObj.success = true;
    returnObj.message = 'Request Submitted, CircularDrive team will contact you.';
    returnObj.data = savedUser;
    (0, _emailApi2.default)(savedUser._id, savedUser, 'contactus'); //eslint-disable-line
    res.send(returnObj);
  }).error(function (e) {
    console.log(e); // eslint-disable-line no-console
    var err = new _APIError2.default('Error while Creating new User ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    returnObj.success = false;
    returnObj.message = 'Message not sent';
    return next(returnObj);
  });
}

function joinOurPartner(req, res, next) {
  var userData = (0, _assign2.default)({}, req.body);
  var returnObj = {
    success: false,
    message: '',
    data: null
  };
  if (userData.email == '' || userData.name == '' || userData.phoneNo == '' || userData.subject == '') {
    var err = new _APIError2.default('Please fill all required fields', _httpStatus2.default.CONFLICT, true);
    return next(err);
  }
  var joinOurPartnersObj = new _joinOurPartner2.default({
    name: userData.name,
    company_name: userData.company_name,
    phoneNo: userData.phoneNo,
    email: userData.email.toLowerCase(),
    isdCode: userData.isdCode,
    message: userData.message,
    noofdriver: userData.noofdriver,
    address: userData.address,
    noofshuttle: userData.noofshuttle
  });
  joinOurPartnersObj.saveAsync().then(function (savedUser) {
    returnObj.success = true;
    returnObj.message = 'Request Submitted, CircularDrive team will contact you';
    returnObj.data = savedUser;
    (0, _emailApi2.default)(savedUser._id, savedUser, 'joinOurPartner'); //eslint-disable-line
    res.send(returnObj);
  }).error(function (e) {
    console.log(e); // eslint-disable-line no-console
    var err = new _APIError2.default('Error while Creating new User ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    returnObj.success = false;
    returnObj.message = 'Message not sent';
    return next(returnObj);
  });
}

var joinPartnerList = function joinPartnerList(req, res) {
  var _req$query3 = req.query,
      pageNo = _req$query3.pageNo,
      _req$query3$limit = _req$query3.limit,
      limit = _req$query3$limit === undefined ? _env2.default.limit : _req$query3$limit;

  var name = req.query.keyword ? req.query.keyword : '';
  var query = {
    is_deleted: false,
    $or: [{ "name": { $regex: name, $options: 'i' } }, { "address": { $regex: name, $options: 'i' } }, { "email": { $regex: name, $options: 'i' } }, { "company_name": { $regex: name, $options: 'i' } }]
  };
  _joinOurPartner2.default.countAsync(query).then(function (totalUserRecord) {
    var returnObj = {
      success: true,
      message: 'no of join partner list are zero', // `no of active drivers are ${returnObj.data.length}`;
      data: null,
      meta: {
        totalNoOfPages: Math.ceil(totalUserRecord / limit),
        limit: limit,
        currPageNo: pageNo,
        currNoOfRecord: 20
      }
    };
    if (totalUserRecord < 1) {
      return res.send(returnObj);
    }
    _joinOurPartner2.default.find(query).then(function (userData) {
      returnObj.data = userData;
      returnObj.message = 'Join partner list found';
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      return res.send(returnObj);
    }).catch(function (err) {
      res.send('Error', err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of users ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside Contactus list records');
    next(err);
  });
};

var blogs = function blogs(req, res) {
  var _req$query4 = req.query,
      pageNo = _req$query4.pageNo,
      _req$query4$limit = _req$query4.limit,
      limit = _req$query4$limit === undefined ? _env2.default.limit : _req$query4$limit;

  var name = req.query.keyword ? req.query.keyword : '';
  var query = {
    is_deleted: false,
    $or: [{ "heading": { $regex: name, $options: 'i' } }]
  };
  _blog2.default.countAsync(query).then(function (totalBlogRecord) {
    var returnObj = {
      success: true,
      message: 'no of Blog\'s are zero', // `no of active drivers are ${returnObj.data.length}`;
      data: null,
      meta: {
        totalNoOfPages: Math.ceil(totalBlogRecord / limit),
        limit: limit,
        currPageNo: pageNo,
        currNoOfRecord: 20
      }
    };
    if (totalBlogRecord < 1) {
      return res.send(returnObj);
    }
    _blog2.default.find(query).then(function (userData) {
      returnObj.data = userData;
      returnObj.message = 'Blog\'s pages found';
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      return res.send(returnObj);
    }).catch(function (err) {
      res.send('Error', err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of Blog ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside Blogs records');
    next(err);
  });
};

function blogDetails(req, res, next) {
  _blog2.default.findOneAsync({ slug: req.query.pageSlug }).then(function (BlogDoc) {
    var returnObj = {
      success: false,
      message: 'Unable to find the Page',
      data: "Not Found",
      meta: null
    };
    if (BlogDoc) {
      returnObj.success = true;
      returnObj.message = 'Success';
      returnObj.data = BlogDoc;
      res.send(returnObj);
    } else {
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function requestDemo(req, res, next) {
  var userData = (0, _assign2.default)({}, req.body);
  var returnObj = {
    success: false,
    message: '',
    data: null
  };
  if (userData.email == '' || userData.name == '' || userData.slug == '' || userData.subject == '') {
    var err = new _APIError2.default('Please fill all required fields', _httpStatus2.default.CONFLICT, true);
    return next(err);
  }
  var requestDemoObj = new _requestDemo2.default({
    email: userData.email,
    name: userData.name,
    company: userData.company,
    address: userData.address,
    isdCode: userData.isdCode,
    phoneNo: userData.phoneNo
  });
  requestDemoObj.saveAsync().then(function (savedData) {
    returnObj.success = true;
    returnObj.message = 'Request Submitted, CircularDrive team will contact you.';
    returnObj.data = savedData;
    (0, _emailApi2.default)(savedData._id, savedData, 'requestDemo'); //eslint-disable-line
    res.send(returnObj);
  }).error(function (e) {
    console.log(e); // eslint-disable-line no-console
    var err = new _APIError2.default('Error while Creating new User ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    returnObj.success = false;
    returnObj.message = 'Message not sent';
    return next(returnObj);
  });
}

exports.default = {
  list: list, staticPageDetails: staticPageDetails, updateStaticPage: updateStaticPage,
  contactList: contactList, contactus: contactus, joinOurPartner: joinOurPartner, joinPartnerList: joinPartnerList, requestDemo: requestDemo,
  blogs: blogs, blogDetails: blogDetails
};
module.exports = exports.default;
//# sourceMappingURL=static-page.js.map
