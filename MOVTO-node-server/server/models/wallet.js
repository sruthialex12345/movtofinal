import mongoose, { Schema } from 'mongoose';
import { USER_TYPE_RIDER } from '../constants/user-types';

const WalletSchema = new Schema({
  userEmail: { type: String, default: null },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  userType: { type: String, default: USER_TYPE_RIDER },
  stripeAccountId: { type: String, default: null },
  walletBalance: { type: Number, default: 0 },
  createdAt: { type: Date, default: new Date().toISOString() },
  updatedAt: { type: Date, default: new Date().toISOString() },
});

export default mongoose.model('Wallet', WalletSchema);
