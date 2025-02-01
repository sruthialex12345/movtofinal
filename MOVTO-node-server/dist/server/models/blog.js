'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BlogSchema = new _mongoose.Schema({
    slug: { type: String },
    heading: { type: String, default: '' },
    content: { type: String, default: '' },
    title: { type: String, default: '' },
    keywords: { type: String, default: '' },
    description: { type: String, default: '' },
    author: { type: String, default: '' },
    status: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: new Date().toISOString() },
    updatedAt: { type: Date, default: new Date().toISOString() }
});

exports.default = _mongoose2.default.model('blog', BlogSchema);
module.exports = exports.default;
//# sourceMappingURL=blog.js.map
