import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: false },
  role: {
    type: String,
    enum: ['user', 'clinic', 'admin', 'doctor'],
    default: 'user',
  },
  isApproved: { type: Boolean, default: false },
  declined: { type: Boolean, default: false },
}, { timestamps: true });

// Unique compound index on email + role
UserSchema.index({ email: 1, role: 1 }, { unique: true });

// Password hashing
UserSchema.pre('save', async function (next) {
  if (
    this.isModified('password') &&
    this.password &&
    !this.password.startsWith('$2b$')
  ) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
