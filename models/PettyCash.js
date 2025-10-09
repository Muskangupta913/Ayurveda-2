// models/PettyCash.js
import mongoose from "mongoose";
// adjust path if needed

const PettyCashSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    patientEmail: {
      type: String,
      required: true,
      trim: true,
    },
    patientPhone: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      default: "",
    },

    allocatedAmounts: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
      },
    ],

    expenses: [
      {
        description: { type: String, required: true },
        spentAmount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
      },
    ],

    // Per-record aggregates (kept updated automatically)
    totalAllocated: { type: Number, default: 0 }, // sum of allocatedAmounts
    totalSpent: { type: Number, default: 0 },     // sum of expenses
    totalAmount: { type: Number, default: 0 },    // totalAllocated - totalSpent
  },
  { timestamps: true }
);

// Automatically calculate totals before saving
PettyCashSchema.pre("save", function (next) {
  const totalAllocated = (this.allocatedAmounts || []).reduce(
    (acc, item) => acc + (item.amount || 0),
    0
  );
  const totalSpent = (this.expenses || []).reduce(
    (acc, item) => acc + (item.spentAmount || 0),
    0
  );
  this.totalAllocated = totalAllocated;
  this.totalSpent = totalSpent;
  this.totalAmount = totalAllocated - totalSpent;
  next();
});

delete mongoose.models.PettyCash;
export default mongoose.models.PettyCash ||
  mongoose.model("PettyCash", PettyCashSchema);
