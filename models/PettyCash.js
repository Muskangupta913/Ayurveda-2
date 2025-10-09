// models/PettyCash.js
import mongoose from "mongoose";

// Allocation schema (flat array)
const AllocSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  receipts: [{ type: String }], // array of Cloudinary URLs
  date: { type: Date, default: Date.now },
});

// Expense schema
const ExpenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  spentAmount: { type: Number, required: true },
  receipts: [{ type: String }], // array of Cloudinary URLs
  date: { type: Date, default: Date.now },
});

const PettyCashSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patientName: { type: String, required: true, trim: true },
    patientEmail: { type: String, required: true, trim: true },
    patientPhone: { type: String, required: true },
    note: { type: String, default: "" },

    // Flat allocated amounts array
    allocatedAmounts: [AllocSchema],

    // Expenses array
    expenses: [ExpenseSchema],

    // Totals (auto-calculated)
    totalAllocated: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 }, // remaining
  },
  { timestamps: true }
);

// Pre-save hook to calculate totals automatically
PettyCashSchema.pre("save", function (next) {
  // Sum allocated amounts
  const totalAllocated = (this.allocatedAmounts || []).reduce(
    (acc, alloc) => acc + (alloc.amount || 0),
    0
  );

  // Sum spent amounts
  const totalSpent = (this.expenses || []).reduce(
    (acc, exp) => acc + (exp.spentAmount || 0),
    0
  );

  this.totalAllocated = totalAllocated;
  this.totalSpent = totalSpent;
  this.totalAmount = totalAllocated - totalSpent;

  next();
});

// Avoid recompilation errors in Next.js
delete mongoose.models.PettyCash;
export default mongoose.models.PettyCash ||
  mongoose.model("PettyCash", PettyCashSchema);
