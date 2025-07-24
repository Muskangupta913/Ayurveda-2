
// models/Treatment.ts
import mongoose from 'mongoose';

const TreatmentSchema = new mongoose.Schema({
  treatment_name: {
    type: String,
    required: true,
    unique: true,
  }
});

export default mongoose.models.Treatment || mongoose.model('Treatment', TreatmentSchema);
