import mongoose, { Schema } from 'mongoose';

const AdminNotifyMessageSchema = new Schema({
  userIdAdmin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: {type: String, default: 'Run your business on the go. Download CircularDrive.  \n\nAnroid : https://bit.ly/2SXLD3H \niOS: https://apple.co/2Tn7OiW'},
  isDeleted: { type: Boolean, default: false },
}, {timestamps: true});

export default mongoose.model('AdminNotifyMessage', AdminNotifyMessageSchema);
