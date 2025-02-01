import mongoose, { Schema } from 'mongoose';

const BlogSchema = new Schema({
    slug: {type: String},
    heading: {type: String, default: ''},
    content: {type: String, default: ''},
    title: {type: String, default: ''},
    keywords: {type: String, default: ''},
    description: {type: String, default: ''},
    author: {type: String, default: ''},
    status: { type: Boolean, default: true },
    is_deleted: {type: Boolean,default: false},
    createdAt: { type: Date, default: new Date().toISOString() },
    updatedAt: { type: Date, default: new Date().toISOString() }, 
});

export default mongoose.model('blog', BlogSchema);


