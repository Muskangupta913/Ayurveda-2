import mongoose from "mongoose";

const patientRegistrationSchema = new mongoose.Schema(
  {
    // 🔹 Auto-generated fields
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    invoicedDate: {
      type: Date,
      default: Date.now,
    },
    invoicedBy: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // The admin or staff who created the invoice
    },

    // 🔹 Patient Details
    emrNumber: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit number"],
    },
    referredBy: {
      type: String,
      trim: true,
    },
    patientType: {
      type: String,
      enum: ["New", "Old"],
      default: "New",
    },

    // 🔹 Medical Details
    doctor: {
      type: String,
      required: true,
      trim: true,
    },
    service: {
      type: String,
      enum: ["Package", "Treatment"],
      required: true,
    },
    treatment: {
      type: String,
      trim: true,
    },
    package: {
      type: String,
      trim: true,
    },

    // 🔹 Payment Details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paid: {
      type: Number,
      required: true,
      min: 0,
    },
    advance: {
      type: Number,
      default: 0,
      min: 0,
    },
    pending: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "BT", "Tabby", "Tamara"],
      required: true,
    },

    // 🔹 Insurance Section
    insurance: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    advanceGivenAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    coPayPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    needToPay: {
      type: Number,
      default: 0,
      min: 0,
    },
    advanceClaimStatus: {
      type: String,
      enum: ["Pending", "Released", "Cancelled"],
      default: "Pending",
    },
    advanceClaimReleaseDate: {
      type: Date,
    },
    advanceClaimReleasedBy: {
      type: String,
      trim: true,
    },

    // 🔹 Status & Notes
    status: {
      type: String,
      enum: ["Active", "Cancelled", "Completed"],
      default: "Active",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

// 🔹 Pre-save Hook: Calculate pending and needToPay before saving
patientRegistrationSchema.pre("save", function (next) {
  if (this.amount && this.paid) {
    this.pending = Math.max(0, this.amount - (this.paid + this.advance));
  }
  if (this.insurance === "Yes") {
    const insuranceCover = (this.amount * this.coPayPercent) / 100;
    this.needToPay = Math.max(0, this.amount - insuranceCover - this.advanceGivenAmount);
  } else {
    this.needToPay = Math.max(0, this.amount - (this.paid + this.advance));
  }
  next();
});

// 🔹 Indexes for faster search
patientRegistrationSchema.index({ invoiceNumber: 1 });
patientRegistrationSchema.index({ firstName: 1, lastName: 1 });
patientRegistrationSchema.index({ mobileNumber: 1 });

export default mongoose.models.PatientRegistration ||
  mongoose.model("PatientRegistration", patientRegistrationSchema);
