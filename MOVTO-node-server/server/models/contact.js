var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ContactSchema = new Schema({
    name: {type: String,default: null},
    email: {type: String,default: null},
    subject: {type: String,default: null},
    message: {type: String,default: null},
    image: {type: String,default: null},
    is_replied: {type: Boolean,default: false},
    isdCode: {type: String, required: true},
    phoneNo: { type: String, required: true },
    reply: {type: String,default: null},
    is_deleted: {type: Boolean,default: false}
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model('contact', ContactSchema);
