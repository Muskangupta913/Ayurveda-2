// models/GetInTouch.ts
import mongoose from 'mongoose';

const GetInTouchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      match: [
        /^(?:\+971|00971|0)(50|52|54|55|56|58)\d{7}$/,
        'Please enter a valid UAE mobile number',
      ],
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    query: {
      type: String,
      required: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

export default mongoose.models.GetInTouch || mongoose.model('GetInTouch', GetInTouchSchema);
