import mongoose from "mongoose";

const paymentHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  paid: { type: Number, required: true, min: 0 },
  advance: { type: Number, default: 0, min: 0 },
  pending: { type: Number, required: true, min: 0 },
  paymentMethod: {
    type: String,
    enum: ["Cash", "Card", "BT", "Tabby", "Tamara"],
    required: true,
  },
  updatedAt: { type: Date, default: Date.now },
});

const patientRegistrationSchema = new mongoose.Schema(
  {
    // Auto-generated fields
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    invoicedDate: { type: Date, default: Date.now },
    invoicedBy: { type: String, required: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Patient Details
    emrNumber: { type: String, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    email: { type: String, trim: true, lowercase: true },
    mobileNumber: { type: String, required: true, match: [/^[0-9]{10}$/, "Enter valid 10-digit number"] },
    referredBy: { type: String, trim: true },
    patientType: { type: String, enum: ["New", "Old"], default: "New" },

    // Medical Details
    doctor: { type: String, required: true, trim: true },
    service: { type: String, enum: ["Package", "Treatment"], required: true },
    treatment: { type: String, trim: true },
    package: { type: String, trim: true },

    // Payment Details
    amount: { type: Number, required: true, min: 0 },
    paid: { type: Number, required: true, min: 0 },
    advance: { type: Number, default: 0, min: 0 },
    pending: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, enum: ["Cash", "Card", "BT", "Tabby", "Tamara"], required: true },
    paymentHistory: [paymentHistorySchema],

    // Insurance Section
    insurance: { type: String, enum: ["Yes", "No"], default: "No" },
    advanceGivenAmount: { type: Number, default: 0, min: 0 },
    coPayPercent: { type: Number, default: 0, min: 0, max: 100 },
    needToPay: { type: Number, default: 0, min: 0 },
    advanceClaimStatus: { type: String, enum: ["Pending", "Released", "Cancelled"], default: "Pending" },
    advanceClaimReleaseDate: { type: Date },
    advanceClaimReleasedBy: { type: String, trim: true },

    // Status & Notes
    status: { type: String, enum: ["Active", "Cancelled", "Completed"], default: "Active" },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// 🔹 Pre-save hook: calculate pending & needToPay
patientRegistrationSchema.pre("save", function (next) {
  this.amount = this.amount ?? 0;
  this.paid = this.paid ?? 0;
  this.advance = this.advance ?? 0;
  this.advanceGivenAmount = this.advanceGivenAmount ?? 0;
  this.coPayPercent = this.coPayPercent ?? 0;

  // Calculate pending
  this.pending = Math.max(0, this.amount - (this.paid + this.advance));

  // Calculate needToPay for insurance
  if (this.insurance === "Yes") {
    const insuranceCover = (this.amount * this.coPayPercent) / 100;
    this.needToPay = Math.max(0, this.amount - insuranceCover - this.advanceGivenAmount);
  } else {
    this.needToPay = this.pending;
  }

  next();
});

// 🔹 Indexes for faster search
patientRegistrationSchema.index({ invoiceNumber: 1 });
patientRegistrationSchema.index({ firstName: 1, lastName: 1 });
patientRegistrationSchema.index({ mobileNumber: 1 });

export default mongoose.models.PatientRegistration ||
  mongoose.model("PatientRegistration", patientRegistrationSchema);
