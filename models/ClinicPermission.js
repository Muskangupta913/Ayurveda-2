// models/ClinicPermission.js
import mongoose from 'mongoose';

const ModulePermissionSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true
  },
  subModules: [{
    name: { type: String, required: true },
    path: { type: String, default: '' },
    icon: { type: String, default: '📄' },
    order: { type: Number, default: 0 },
    actions: {
      all: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    }
  }],
  actions: {
    all: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false }
  }
});

const ClinicPermissionSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    unique: true
  },
  permissions: [ModulePermissionSchema],
  isActive: { type: Boolean, default: true },
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModified: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for efficient queries
ClinicPermissionSchema.index({ 'permissions.module': 1 });

export default mongoose.models.ClinicPermission || mongoose.model('ClinicPermission', ClinicPermissionSchema);
