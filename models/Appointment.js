import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientRegistration",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    status: {
      type: String,
      enum: ["booked", "enquiry", "Discharge", "Arrived" , "Consultation", "Cancelled", "Approved", "Rescheduled", "Waiting", "Rejected", "Completed"],
      required: true,
      default: "booked",
    },
    followType: {
      type: String,
      enum: ["first time", "follow up", "repeat"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    fromTime: {
      type: String,
      required: true, // Format: "HH:MM" (24-hour)
    },
    toTime: {
      type: String,
      required: true, // Format: "HH:MM" (24-hour)
    },
    referral: {
      type: String,
      enum: ["direct", "referral"],
      default: "direct",
    },
    emergency: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    arrivedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
AppointmentSchema.index({ clinicId: 1, startDate: 1, fromTime: 1 });
AppointmentSchema.index({ doctorId: 1, startDate: 1 });
AppointmentSchema.index({ roomId: 1, startDate: 1, fromTime: 1 });
AppointmentSchema.index({ patientId: 1 });

export default mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);

