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
  _blog2.default.countAsync(query).then(function (totalUserRecord) {
    console.log("totalUserRecord -- >", totalUserRecord);
    var returnObj = {
      success: true,
      message: 'no of Blog pages are zero', // `no of active drivers are ${returnObj.data.length}`;
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
    _blog2.default.find(query).then(function (userData) {
      returnObj.data = userData;
      returnObj.message = 'Blog pages found';
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
function createBlog(req, res, next) {
  var headingcheck = req.body.heading.replace(new RegExp(" ", 'g'), "-").toLowerCase();
  _blog2.default.findOneAsync({ slug: headingcheck })
  // eslint-disable-next-line consistent-return
  .then(function (foundUser) {
    var returnObj = {
      success: false,
      message: 'Blog is already exist with this heading, Please try other heading',
      data: null
    };
    if (foundUser) {
      return res.send(returnObj);
    }
    var blogObj = new _blog2.default({
      heading: req.body.heading,
      content: req.body.content,
      slug: headingcheck,
      title: req.body.title,
      description: req.body.description,
      keywords: req.body.keywords,
      author: req.body.author
    });
    blogObj.saveAsync().then(function (savedUser) {
      returnObj.success = true;
      returnObj.message = 'Blog created successfully';
      returnObj.data = savedUser;
      res.send(returnObj);
    }).error(function (e) {
      var err = new _APIError2.default('Error while Creating new Blog ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      returnObj.success = false;
      returnObj.message = 'Blog not created';
      console.log(err); // eslint-disable-line no-console
      return next(returnObj);
    });
  }).error(function (e) {
    var err = new _APIError2.default('Error while Searching the Blog ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    return next(err);
  });
}

function blogPageDetails(req, res, next) {
  console.log(req.query);
  _blog2.default.findOneAsync({ _id: req.query._id }).then(function (StaticDoc) {
    var returnObj = {
      success: false,
      message: 'Blog is details not found',
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

function updateBlogPage(req, res, next) {
  var updatePageObj = (0, _assign2.default)({}, req.body);
  var headingcheck = req.body.heading.replace(new RegExp(" ", 'g'), "-").toLowerCase();
  _blog2.default.findOneAsync({ slug: headingcheck, _id: { $ne: req.body.blogId } }).then(function (foundpageDoc) {
    var returnObj = {
      success: false,
      message: 'Blog is already exist with this heading, Please try other heading',
      data: null,
      meta: null
    };
    if (foundpageDoc) {
      return res.send(returnObj);
    }
    var pageDoc = {
      heading: updatePageObj.heading,
      content: updatePageObj.content,
      slug: headingcheck,
      title: updatePageObj.title,
      description: updatePageObj.description,
      keywords: updatePageObj.keywords,
      author: updatePageObj.author
    };
    _blog2.default.findOneAndUpdate({ _id: req.body.blogId }, { $set: pageDoc }).then(function (savedDoc) {
      returnObj.success = true;
      returnObj.message = 'Blog page updated';
      returnObj.data = savedDoc;
      res.send(returnObj);
    }).error(function (e) {
      var err = new _APIError2.default('Error occured while updating the Blog details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the Blog ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function updateBlogStatus(req, res, next) {
  _blog2.default.updateAsync({ _id: req.body._id }, { $set: { status: req.body.status } }) // eslint-disable-line no-underscore-dangle
  .then(function (savedDoc) {
    var returnObj = {
      success: true,
      message: 'Blog updated',
      data: savedDoc
    };
    res.send(returnObj);
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while Updating Blog Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function blogRemove(req, res, next) {
  _blog2.default.updateAsync({ _id: req.body._id }, { $set: { is_deleted: req.body.status } }) // eslint-disable-line no-underscore-dangle
  .then(function (savedDoc) {
    var returnObj = {
      success: true,
      message: 'Blog deleted',
      data: savedDoc
    };
    res.send(returnObj);
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while Updating Blog Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

exports.default = {
  list: list, createBlog: createBlog, blogPageDetails: blogPageDetails, updateBlogPage: updateBlogPage, updateBlogStatus: updateBlogStatus, blogRemove: blogRemove
};
module.exports = exports.default;
//# sourceMappingURL=blog.js.map
