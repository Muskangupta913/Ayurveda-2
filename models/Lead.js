import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, index: true }, // often searched
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    age: { type: Number },

    
    treatments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Treatment",
        index: true, // filtering by treatment
      },
    ],

    // Where the lead came from
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
      index: true, // useful for filtering by source
    },

    // For tagging offers/campaigns
    offerTag: { type: String, index: true },

    // Lead status
    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Booked",
        "Visited",
        "Follow-up",
        "Not Interested",
      ],
      default: "New",
      index: true, // filter leads by status
    },

    // Custom notes
    notes: { type: String },

    // Assigning lead to a staff/agent
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true, // filtering leads by agent
    },

    // For filtering by date
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

LeadSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });

export default mongoose.models.Lead || mongoose.model("Lead", LeadSchema);
