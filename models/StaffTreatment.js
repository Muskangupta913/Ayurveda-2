import mongoose from "mongoose";

const StaffTreatmentSchema = new mongoose.Schema(
  {
    package: { type: String, trim: true, required: false },   // optional
    treatment: { type: String, trim: true, required: false }, // optional
  },
  { timestamps: true, collection: "staff_treatment" }
);

export default mongoose.models.staff_treatment ||
  mongoose.model("staff_treatment", StaffTreatmentSchema);
