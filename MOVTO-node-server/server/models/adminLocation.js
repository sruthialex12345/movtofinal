import mongoose, { Schema } from 'mongoose';

/**
 * User Review Schema (Address book)
 */
const AdminLocationSchema = new Schema({
  userIdAdmin: { type: Schema.Types.ObjectId, ref: 'User'},
  radius:{ type: Number, default: 0},
  name:{ type: String, default: null},
  zone: {
      location: {type: [Number, Number],index: '2d',},
      formattedAddress: {type: Schema.Types.String,default: " "}
  },
  polygons: {
    type: {type: String, default: "Polygon"},
    coordinates: {type: [[[Number, Number]]]}
  },
  createdAt: { type: Date, default: new Date().toISOString() },
  updatedAt: { type: Date, default: new Date().toISOString() },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
});

export default mongoose.model('AdminLocation', AdminLocationSchema);
