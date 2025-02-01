'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var StaticPageSchema = new _mongoose.Schema({
    slug: {
        type: String,
        unique: true,
        required: 'Page name is required'
    },
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

exports.default = _mongoose2.default.model('staticPage', StaticPageSchema);
module.exports = exports.default;
//# sourceMappingURL=staticPage.js.map
