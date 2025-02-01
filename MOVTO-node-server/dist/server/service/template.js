'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.getCustomEmailTemplate = getCustomEmailTemplate;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _user = require('../models/user');

var _user2 = _interopRequireDefault(_user);

var _express = require('express');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require('email-templates'),
    EmailTemplate = _require.EmailTemplate;

var ReservationCodeDir = _path2.default.resolve(__dirname, '../templates', 'customTemplate');
var ReservationCodeObj = new EmailTemplate(_path2.default.join(ReservationCodeDir));

function getCustomEmailTemplate(userId) {
    return new _promise2.default(function (resolve, reject) {
        _user2.default.findOneAsync({ _id: userId }).then(function (adminObj) {
            var locals = (0, _assign2.default)({}, { data: adminObj });
            ReservationCodeObj.render(locals, function (err, results) {
                if (err) {
                    return reject(err);
                }
                return resolve(results.html);
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
}
//# sourceMappingURL=template.js.map
