import mongoose, { Schema } from 'mongoose';

/**
 * AppConfig Schema
 */
const DriverDocumentsSchema = new Schema({
  driverId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  documentId: { type: Schema.Types.ObjectId, default: null },
  uri: { type: String, default: null },
  expirationDate: { type: Date },
  addedDate: { type: Date, default: new Date().toISOString() },
  deletedDate: { type: Date, default: null },
});

export default mongoose.model('driver_document', DriverDocumentsSchema);
