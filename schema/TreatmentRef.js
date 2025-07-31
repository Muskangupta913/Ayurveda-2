// schemas/TreatmentRef.ts
import mongoose from "mongoose";

export const TreatmentRefSchema = new mongoose.Schema({
  mainTreatment: { type: String, required: true },
  mainTreatmentSlug: { type: String, required: true },
  subTreatment: { type: String },
  subTreatmentSlug: { type: String },
}, { _id: false });
