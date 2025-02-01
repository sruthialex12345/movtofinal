import mongoose, { Schema } from 'mongoose';

/**
 * User Review Schema (Address book)
 */
const ReviewSchema = new Schema({
  reviewerId: { type: Schema.Types.ObjectId, ref: 'User'},
  reviewToId: { type: Schema.Types.ObjectId, ref: 'User',default: null  },
  adminId: { type: Schema.Types.ObjectId, ref: 'User',default: null  },
  reviewToType: { type: String, default: null},
  message:{ type: String, default: 0 },
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: new Date().toISOString() },
  updatedAt: { type: Date, default: new Date().toISOString() },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
});

export default mongoose.model('reviews', ReviewSchema);
