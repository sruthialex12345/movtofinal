import mongoose, { Schema } from 'mongoose';

/**
 * ServerConfig Schema
 */
const ServerConfigSchema = new Schema({
  type: { type: Schema.Types.Mixed },
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed },
});

export default mongoose.model('ServerConfig', ServerConfigSchema);
