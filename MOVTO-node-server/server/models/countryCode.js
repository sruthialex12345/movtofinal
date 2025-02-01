import mongoose, { Schema } from 'mongoose';

var CountryCodeSchema = new Schema({
    name: {type: String, default: "United States"},
    code:{type:String, default: "US"},  
    isdcode:{type:String, default: '+1'},  
    createdAt: { type: Date, default: new Date().toISOString() },
    updatedAt: { type: Date, default: new Date().toISOString() },
});

export default mongoose.model('countryCode', CountryCodeSchema);