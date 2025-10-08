import mongoose from "mongoose";

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

    // ✅ NEW FIELD
    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ✅ Automatically calculate total before saving
PettyCashSchema.pre("save", function (next) {
  const totalAllocated = this.allocatedAmounts.reduce(
    (acc, item) => acc + item.amount,
    0
  );
  const totalSpent = this.expenses.reduce(
    (acc, item) => acc + item.spentAmount,
    0
  );
  this.totalAmount = totalAllocated - totalSpent;
  next();
});
delete mongoose.models.PettyCash; 
export default mongoose.models.PettyCash ||
  mongoose.model("PettyCash", PettyCashSchema);
