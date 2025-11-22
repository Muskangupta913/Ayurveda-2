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
      index: true, // Indexed for fast patient history queries
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
      enum: ["booked", "enquiry", "Discharge", "Arrived", "Consultation", "Cancelled", "Approved", "Rescheduled", "Waiting", "Rejected", "Completed"],
      required: true,
      default: "booked",
      index: true, // Indexed for status-based queries
    },
    followType: {
      type: String,
      enum: ["first time", "follow up", "repeat"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true, // Indexed for date-based queries
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
    // Additional fields for better history tracking
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    // Track appointment sequence number for the patient
    appointmentNumber: {
      type: Number,
      default: null, // Will be auto-incremented per patient
    },
    // Link to previous appointment if this is a follow-up
    previousAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
  },
  { timestamps: true }
);

// Compound indexes for faster queries
AppointmentSchema.index({ clinicId: 1, startDate: 1, fromTime: 1 });
AppointmentSchema.index({ doctorId: 1, startDate: 1 });
AppointmentSchema.index({ roomId: 1, startDate: 1, fromTime: 1 });
AppointmentSchema.index({ patientId: 1, startDate: -1 }); // For patient history (newest first)
AppointmentSchema.index({ patientId: 1, status: 1 }); // For patient appointments by status
AppointmentSchema.index({ clinicId: 1, patientId: 1 }); // For clinic-specific patient history

// Virtual to get appointment duration in minutes
AppointmentSchema.virtual("durationMinutes").get(function () {
  if (!this.fromTime || !this.toTime) return null;
  const [fromHour, fromMin] = this.fromTime.split(":").map(Number);
  const [toHour, toMin] = this.toTime.split(":").map(Number);
  const fromTotal = fromHour * 60 + fromMin;
  const toTotal = toHour * 60 + toMin;
  return toTotal - fromTotal;
});

// Method to get patient's appointment history
AppointmentSchema.statics.getPatientHistory = async function (patientId, options = {}) {
  const { limit = 50, sort = { startDate: -1 } } = options;
  return this.find({ patientId })
    .populate("doctorId", "name email")
    .populate("roomId", "name")
    .sort(sort)
    .limit(limit)
    .lean();
};

// Pre-save hook to auto-increment appointment number for patient
AppointmentSchema.pre("save", async function (next) {
  if (this.isNew && !this.appointmentNumber) {
    try {
      const lastAppointment = await this.constructor
        .findOne({ patientId: this.patientId })
        .sort({ appointmentNumber: -1 })
        .select("appointmentNumber")
        .lean();
      
      this.appointmentNumber = lastAppointment?.appointmentNumber 
        ? lastAppointment.appointmentNumber + 1 
        : 1;
    } catch (error) {
      console.error("Error auto-incrementing appointment number:", error);
      // Continue without appointment number if there's an error
    }
  }
  next();
});

export default mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);
