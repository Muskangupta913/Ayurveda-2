// pages/api/admin/setDoctorCredentials.js

import dbConnect from '../../../lib/database';
import User from '../../../models/Users';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ message: 'userId and password are required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user || user.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    user.password = password; // Will be hashed by pre-save middleware
    await user.save();

    return res.status(200).json({ success: true, message: 'Credentials set successfully' });
  } catch (err) {
    console.error('Set credentials error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
