// models/Clinic.ts
import mongoose from "mongoose";

const ClinicSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: String,
  address: String,
  treatments: { type: [String], default: [] },
  servicesName: { type: [String], default: [] },
  pricing: String,
  timings: String,
  photos: [String],
  licenseDocumentUrl: { type: String, default: null },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true },
  },
  isApproved: { type: Boolean, default: false }, // New field
  declined: { type: Boolean, default: false },
}, { timestamps: true });

ClinicSchema.index({ location: "2dsphere" });

export default mongoose.models.Clinic || mongoose.model("Clinic", ClinicSchema);
