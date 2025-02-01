import mongoose, { Schema } from 'mongoose';

/**
 * User locations Schema (Address book)
 */
const DriverRouteTerminalSchema = new Schema({
  isSelected: { type: Boolean, default: false},
  driverId: { type: Schema.Types.ObjectId, ref: 'User' },
  adminId: { type: Schema.Types.ObjectId, ref: 'User' },
  loc: {type: [Number, Number], index: '2d'},
  address: { type: String, default: null },
  name: { type: String, default: null },
  // terminal(default) | waypoint | startTerminal | endTerminal
  type: { type: String, default: 'terminal' },
  createdAt: { type: Date, default: new Date().toISOString() },
  updatedAt: { type: Date, default: new Date().toISOString() },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  tripRequests: { type: [Schema.Types.Mixed], default: [] }
});

export default mongoose.model('driverRouteTerminals', DriverRouteTerminalSchema);
