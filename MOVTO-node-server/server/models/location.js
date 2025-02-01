import mongoose, { Schema } from 'mongoose';

/**
 * User locations Schema (Address book)
 */
const LocationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  locationId: { type: Schema.Types.ObjectId },
  address: { type: String, default: null },
  name: { type: String, default: null },
  createdAt: { type: Date, default: new Date().toISOString() },
  updatedAt: { type: Date, default: new Date().toISOString() },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
});

export default mongoose.model('locations', LocationSchema);
