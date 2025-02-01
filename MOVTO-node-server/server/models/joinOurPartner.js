var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var JoinOurPartnerSchema = new Schema({
    name: {type: String,default: null},
    company_name:{type: String,default: null},
    email: {type: String,default: null},
    noofdriver: {type: Number,default: null},
    noofshuttle: {type: Number,default: null},
    address: {type: String,default: null},
    isdCode: {type: String, required: true},
    phoneNo: { type: String, required: true },
    message: {type: String,default: null},
    is_replied: {type: Boolean,default: false},
    reply: {type: String,default: null},
    is_deleted: {type: Boolean,default: false}
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model('joinOurPartner', JoinOurPartnerSchema);
