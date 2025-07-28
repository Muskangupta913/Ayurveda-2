// models/Treatment.ts
import mongoose from "mongoose";

const SubcategorySchema = new mongoose.Schema({
  name: { type: String},
  slug: { type: String},
}, { _id: false });

const TreatmentSchema = new mongoose.Schema({
  name: { type: String, required: true},
  slug: { type: String },
  subcategories: [SubcategorySchema],
}, { timestamps: true });

export default mongoose.models.Treatment || mongoose.model("Treatment", TreatmentSchema);
