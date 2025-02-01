import mongoose, { Schema } from 'mongoose';

const TransactionSchema = new Schema({
  userIdTo: { type: Schema.Types.ObjectId, ref: 'User' },
  userIdFrom: { type: Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, default: null },
  tripId: { type: Schema.Types.ObjectId, ref: 'trip', default: null },
  createdAt: { type: Date, default: new Date().toISOString() },
  updatedAt: { type: Date, default: new Date().toISOString() },
});

export default mongoose.model('Transaction', TransactionSchema);
