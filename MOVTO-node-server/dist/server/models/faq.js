'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FaqSchema = new Schema({
    question: { type: String, default: null },
    answer: { type: String, default: null },
    status: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

exports.default = mongoose.model('faq', FaqSchema);
module.exports = exports.default;
//# sourceMappingURL=faq.js.map
