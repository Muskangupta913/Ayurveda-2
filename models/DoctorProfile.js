// models/DoctorProfile.ts
import mongoose from "mongoose";
import { TreatmentRefSchema } from "../schemas/TreatmentRef";

const DoctorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  experience: Number,
  education: String,
  treatments: { type: [TreatmentRefSchema], default: [] },
  specialization: [String],
  fees: String,
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true },
  },
}, { timestamps: true });

DoctorProfileSchema.index({ location: "2dsphere" });
DoctorProfileSchema.index({ "treatments.mainTreatmentSlug": 1, "treatments.subTreatmentSlug": 1 });

export default mongoose.models.DoctorProfile || mongoose.model("DoctorProfile", DoctorProfileSchema);
