import mongoose from 'mongoose';

const TimeSlotSchema = new mongoose.Schema({
  date: { type: String, required: false }, // e.g., "Today", "Tomorrow", "Fri, 4 Jul"
  availableSlots: { type: Number, required: false },
  sessions: {
    morning: [{ type: String }],
    evening: [{ type: String }]
  }
}, { _id: false });

const DoctorProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialization: { type: String, required: false },
  degree: { type: String, required: true },
  photos: [String],
  experience: { type: Number, required: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  treatment: [{ type: String }],
  consultationFee: { type: Number, required: false },
  clinicContact: { type: String, required: false },
  timeSlots: [TimeSlotSchema],
  resumeUrl: { type: String, required: true },
}, { timestamps: true });

DoctorProfileSchema.index({ location: '2dsphere' });

// ✅ Safely handle hot-reload and model caching in development
export default mongoose.models.DoctorProfile
  ? mongoose.model('DoctorProfile')
  : mongoose.model('DoctorProfile', DoctorProfileSchema);
