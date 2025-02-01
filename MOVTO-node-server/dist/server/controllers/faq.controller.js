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

var _faq = require('../models/faq');

var _faq2 = _interopRequireDefault(_faq);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var faq = function faq(req, res) {
  var _req$query = req.query,
      pageNo = _req$query.pageNo,
      _req$query$limit = _req$query.limit,
      limit = _req$query$limit === undefined ? _env2.default.limit : _req$query$limit;

  var name = req.query.keyword ? req.query.keyword : '';
  var query = {
    is_deleted: false,
    $or: [{ "question": { $regex: name, $options: 'i' } }, { "answer": { $regex: name, $options: 'i' } }]
  };
  _faq2.default.countAsync(query).then(function (totalUserRecord) {
    console.log("totalUserRecord", totalUserRecord);
    var returnObj = {
      success: true,
      message: 'no of Faq\'s are zero', // `no of active drivers are ${returnObj.data.length}`;
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
    _faq2.default.find(query).then(function (userData) {
      returnObj.data = userData;
      returnObj.message = 'Faq\'s pages found';
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      return res.send(returnObj);
    }).catch(function (err) {
      res.send('Error', err);
    });
  }).error(function (e) {
    var err = new _APIError2.default('error occured while counting the no of users ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    debug('error inside Faqs records');
    next(err);
  });
};

function faqDetails(req, res, next) {
  _faq2.default.findOneAsync({ _id: req.query.faqId }).then(function (faqDoc) {
    var returnObj = {
      success: false,
      message: 'Unable to find the Page',
      data: null,
      meta: null
    };
    if (faqDoc) {
      returnObj.success = true;
      returnObj.message = 'Success';
      returnObj.data = faqDoc;
      res.send(returnObj);
    } else {
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the user ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function createFaq(req, res, next) {
  var faqData = (0, _assign2.default)({}, req.body);
  _faq2.default.findOneAsync({
    $or: [{ question: req.body.question }]
  })
  // eslint-disable-next-line consistent-return
  .then(function (foundUser) {
    var returnObj = {
      success: false,
      message: '',
      data: null
    };
    if (foundUser !== null) {
      var err = new _APIError2.default('This questions is already exists', _httpStatus2.default.CONFLICT, true);
      return next(err);
    }
    var faqsObj = new _faq2.default({
      question: faqData.question,
      answer: faqData.answer
    });
    faqsObj.saveAsync().then(function (savedUser) {
      returnObj.success = true;
      returnObj.message = 'Faq created successfully';
      returnObj.data = savedUser;
      res.send(returnObj);
    }).error(function (e) {
      var err = new _APIError2.default('Error while Creating new Faq ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
      returnObj.success = false;
      returnObj.message = 'Faq not created';
      console.log(err); // eslint-disable-line no-console
      return next(returnObj);
    });
  }).error(function (e) {
    var err = new _APIError2.default('Error while Searching the Faq ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    return next(err);
  });
}

function updateFaq(req, res, next) {
  var updatePageObj = (0, _assign2.default)({}, req.body);
  _faq2.default.findOneAsync({ _id: req.body.faqId }).then(function (pageDoc) {
    var returnObj = {
      success: false,
      message: 'unable to find the object',
      data: null,
      meta: null
    };
    if (pageDoc) {
      pageDoc.question = updatePageObj.question;
      pageDoc.answer = updatePageObj.answer;
      pageDoc.saveAsync().then(function (savedDoc) {
        returnObj.success = true;
        returnObj.message = 'Faqs page updated';
        returnObj.data = savedDoc;
        res.send(returnObj);
      }).error(function (e) {
        var err = new _APIError2.default('Error occured while updating the Faqs details ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
        next(err);
      });
    } else {
      res.send(returnObj);
    }
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while searching for the Faqs ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function updateFaqStatus(req, res, next) {
  _faq2.default.updateAsync({ _id: req.body._id }, { $set: { status: req.body.status } }) // eslint-disable-line no-underscore-dangle
  .then(function (savedDoc) {
    var returnObj = {
      success: true,
      message: 'Faq document updated',
      data: savedDoc
    };
    res.send(returnObj);
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while Updating Faq Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function faqRemove(req, res, next) {
  _faq2.default.updateAsync({ _id: req.body._id }, { $set: { is_deleted: req.body.status } }) // eslint-disable-line no-underscore-dangle
  .then(function (savedDoc) {
    var returnObj = {
      success: true,
      message: 'Faq document deleted',
      data: savedDoc
    };
    res.send(returnObj);
  }).error(function (e) {
    var err = new _APIError2.default('Error occured while Updating Faq Object ' + e, _httpStatus2.default.INTERNAL_SERVER_ERROR);
    next(err);
  });
}

exports.default = {
  faq: faq, faqDetails: faqDetails, createFaq: createFaq, updateFaq: updateFaq, updateFaqStatus: updateFaqStatus, faqRemove: faqRemove
};
module.exports = exports.default;
//# sourceMappingURL=faq.controller.js.map
