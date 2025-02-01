import mongoose, { Schema } from 'mongoose';

/**
 * User Reservation Code Schema (Address book)
 */
const ReservationCodeSchema = new Schema({
    userIdAdmin: { type: Schema.Types.ObjectId, ref: 'User'},
    reservationCode: { type: String, default: null },
    name: { type: String, default: null },
    company_name: { type: String, default: null },
    email: { type: String, default: null },
    createdAt: { type: Date, default: new Date().toISOString() },
    updatedAt: { type: Date, default: new Date().toISOString() },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
});

export default mongoose.model('reservationCodes', ReservationCodeSchema);
