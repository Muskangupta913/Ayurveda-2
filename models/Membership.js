import mongoose from "mongoose";

const membershipTreatmentSchema = new mongoose.Schema({
  treatmentName: { type: String, required: true, trim: true },
  unitCount: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
  addedAt: { type: Date, default: Date.now }
});

const membershipSchema = new mongoose.Schema({
  // Link by EMR and optionally patient document id
  emrNumber: { type: String, required: true, index: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "PatientRegistration" },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Package selection
  packageName: { type: String, required: true, trim: true },
  packageAmount: { type: Number, required: true, min: 0 },

  // Treatments consumed under this membership
  treatments: [membershipTreatmentSchema],

  // Totals
  totalConsumedAmount: { type: Number, default: 0, min: 0 },
  remainingBalance: { type: Number, default: 0, min: 0 },

  // Payment details for this membership purchase
  paymentMethod: { type: String, enum: ["Cash", "Card", "BT", "Tabby", "Tamara", ""], default: "" },
  paidAmount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

// Keep totals in sync
membershipSchema.pre("save", function(next) {
  const consumed = (this.treatments || []).reduce((sum, t) => sum + (t.lineTotal || 0), 0);
  this.totalConsumedAmount = consumed;
  const pkg = Number(this.packageAmount || 0);
  this.remainingBalance = Math.max(0, pkg - consumed);
  next();
});

delete mongoose.models.Membership;
export default mongoose.models.Membership || mongoose.model("Membership", membershipSchema);


