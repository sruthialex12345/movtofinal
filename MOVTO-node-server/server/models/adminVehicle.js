import mongoose, { Schema } from 'mongoose';

const AdminVehicleSchema = new Schema({
  zone: {
    geometry: {
      location: {
        type: [Number, Number],
        index: '2d',
      },
    },
    formattedAddress: {
      type: Schema.Types.String,
      default: " "
    }
  },
  userIdAdmin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  accessCode: {type: String, default: null},
  name: { type: String, default: null, required: true },
  company: { type: String, default: null },
  carModel: { type: String, default: null },
  vehicleNo: { type: String, default: null },
  type: { type: String, default: null },
  regNo: { type: String, default: null },
  RC_ownerName: { type: String, default: null },
  color: { type: String, default: null },
  locationId: { type: Schema.Types.ObjectId, ref: 'AdminLocation' },
  regDate: { type: Date, default: null },
  imageUrl: { type: String, default: null },
  state: { type: String, default: null },
  country: { type: String, default: null },
  isAvailable: {type: Boolean, default: true},
  activeStatus: {type: Boolean, default: false},
  isDeleted: { type: Boolean, default: false },
  seats: { type: Number, default: 4 }
}, {timestamps: true});

export default mongoose.model('AdminVehicle', AdminVehicleSchema);
