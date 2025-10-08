import mongoose from "mongoose";

const VendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
    },
    address: {
      type: String,
      default: "",
    },
    commissionPercentage: {
      type: Number,
      required: [true, "Commission percentage is required"],
      min: 0,
      max: 100,
    },
    note: {
      type: String,
      default: "",
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

export default mongoose.models.Vendor || mongoose.model("Vendor", VendorSchema);
