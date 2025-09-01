import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    age: { type: Number },

    treatments: [
    {
      treatment: { type: mongoose.Schema.Types.ObjectId, ref: "Treatment", required: true },
      subTreatment: { type: String }, // store sub-treatment name
    },
  ],

    source: {
      type: String,
      enum: [
        "Instagram",
        "Facebook",
        "Google",
        "WhatsApp",
        "Walk-in",
        "Other",
      ],
      required: true,
      index: true,
    },
    customSource: { type: String }, // when source === "Other"

    offerTag: { type: String, index: true },

    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Booked",
        "Visited",
        "Follow-up",
        "Not Interested",
        "Other",
      ],
      default: "New",
      index: true,
    },
    customStatus: { type: String }, // when status === "Other"

    notes: { type: String },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);


export default mongoose.models.Lead || mongoose.model("Lead", LeadSchema);
