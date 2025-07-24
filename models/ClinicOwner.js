import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ClinicOwnerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

ClinicOwnerSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

export default mongoose.models.ClinicOwner || mongoose.model('ClinicOwner', ClinicOwnerSchema);
