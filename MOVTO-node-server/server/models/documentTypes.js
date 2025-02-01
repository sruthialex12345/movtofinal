import mongoose, { Schema } from 'mongoose';

/**
 * AppConfig Schema
 */
const DocumentTypeSchema = new Schema({
  name: { type: String, default: null },
  requiredForApproval: { type: Boolean, default: true },
  addedDate: { type: Date, default: new Date().toISOString() },
  deletedDate: { type: Date, default: null },
});

export default mongoose.model('document_types', DocumentTypeSchema);
