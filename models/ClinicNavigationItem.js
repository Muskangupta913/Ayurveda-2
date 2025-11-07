import mongoose from 'mongoose';

const ClinicNavigationItemSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true
  },
  path: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  badge: {
    type: Number,
    default: null
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClinicNavigationItem',
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  moduleKey: {
    type: String,
    required: true,
    unique: true
  },
  subModules: [{
    name: {
      type: String,
      required: true
    },
    path: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      default: 0
    }
  }]
}, { timestamps: true });

// Index for efficient queries
ClinicNavigationItemSchema.index({ moduleKey: 1 });
ClinicNavigationItemSchema.index({ parentId: 1 });
ClinicNavigationItemSchema.index({ order: 1 });

export default mongoose.models.ClinicNavigationItem || mongoose.model('ClinicNavigationItem', ClinicNavigationItemSchema);
