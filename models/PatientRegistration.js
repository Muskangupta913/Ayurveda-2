// models/PatientRegistration.js
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  advance: { type: Number, default: 0 },
  pending: { type: Number, default: 0 }, // calculated
  createdAt: { type: Date, default: Date.now },
});

const patientRegistrationSchema = new mongoose.Schema(
  {
    // User who created the record
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Auto-generated fields
    invoiceNumber: { type: String, required: true, unique: true },
    invoicedDate: { type: Date, default: Date.now },
    invoicedBy: { type: String, required: true },

    // Patient Info
    emrNumber: { type: String, required: true },
    patientName: { type: String, required: true },
    mobileNumber: { type: String },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    doctor: { type: String, required: true },
    treatment: { type: String, required: true },
    patientType: { type: String, required: true, enum: ['New', 'Old'] },
    referredBy: { type: String },

    // Payments as array
    payments: { type: [paymentSchema], default: [] },

    // Insurance Details
    insurance: { type: String, enum: ['Yes', 'No'], default: 'No' },
    advanceGivenAmount: { type: Number, default: 0 },
    coPayPercent: { type: Number, default: 0 },
    advanceClaimStatus: { type: String, enum: ['Pending Release', 'Released'], default: 'Pending Release' },
    advanceClaimReleaseDate: { type: Date, default: null },
    advanceClaimReleasedBy: { type: String, default: null },

    // Optional audit fields
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'patient_registration' }
);

// Optional: update timestamps automatically
patientRegistrationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.PatientRegistration || mongoose.model('PatientRegistration', patientRegistrationSchema);
