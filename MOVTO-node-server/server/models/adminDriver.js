import mongoose, { Schema } from 'mongoose';

const AdminDriverSchema = new Schema({
  userIdAdmin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userIdDriver: { type: Schema.Types.ObjectId, ref: 'User' },
  locationId: { type: Schema.Types.ObjectId, ref: 'AdminLocation' },
  accessCode: {type: Schema.Types.String, required: true, select: false},
  zone: {
    geometry: {
      location: {
        type: [Number, Number],
        index: '2d',
      }
    },
    formattedAddress: {
      type: Schema.Types.String,
      default: " "
    }
  },
  isDeleted: { type: Boolean, default: false },
}, {timestamps: true});

export default mongoose.model('AdminDriver', AdminDriverSchema);
