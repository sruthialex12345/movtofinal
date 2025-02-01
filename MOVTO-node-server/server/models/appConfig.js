import mongoose, { Schema } from 'mongoose';

/**
 * AppConfig Schema
 */
const AppConfigSchema = new Schema({
  type: { type: Schema.Types.Mixed },
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed },
});

export default mongoose.model('AppConfig', AppConfigSchema);
