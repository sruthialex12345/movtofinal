'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RequestDemoSchema = new Schema({
    name: { type: String, default: null },
    email: { type: String, default: null },
    subject: { type: String, default: null },
    address: { type: String, default: null },
    company: { type: String, default: null },
    image: { type: String, default: null },
    is_replied: { type: Boolean, default: false },
    isdCode: { type: String, required: true },
    phoneNo: { type: String, required: true },
    reply: { type: String, default: null },
    is_deleted: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

exports.default = mongoose.model('requestDemo', RequestDemoSchema);
module.exports = exports.default;
//# sourceMappingURL=requestDemo.js.map
