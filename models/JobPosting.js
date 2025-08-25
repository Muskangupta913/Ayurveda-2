// models/JobPosting.ts
import mongoose from 'mongoose';

const JobPostingSchema = new mongoose.Schema({
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['clinic', 'doctor'],
    required: true,
  },
  companyName: { type: String, required: true },
  jobTitle: { type: String, required: true },
  department: {
    type: String,
    enum: ['Software', 'Dental', 'Cardiology', 'Pathology', 'Administration', 'Radiology', 'General Medicine'],
    required: true,
  },
  qualification: {
    type: String,
    enum: ['MBBS', 'BDS', 'BAMS', 'BHMS', 'MD', 'MS', 'PhD', 'Diploma', 'Other'],
    required: true,
  },
  jobType: {
    type: String,
    enum: ['Full Time', 'Part Time', 'Internship'],
    required: true,
  },
  workingDays: { type: String, default: '' },
  location: { type: String, required: true },
  jobTiming: { type: String, required: true },
  skills: [String],
  perks: [String],
  languagesPreferred: [String],
  description: { type: String },
  noOfOpenings: { type: Number, required: true },
  salary: { type: String, required: true },
  establishment: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending',
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

delete mongoose.models.JobPosting;
export default mongoose.models.JobPosting || mongoose.model('JobPosting', JobPostingSchema);
