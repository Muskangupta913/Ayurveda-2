import dbConnect from '../../../lib/database';
import User from '../../../models/Users';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const doctor = await User.findOne({ email, role: 'doctor' });

  // If no doctor found with that email and role
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found' });
  }

  // If password is not set yet
  if (!doctor.password) {
    return res.status(403).json({ message: 'Password not set. Please contact admin.' });
  }

  // If password does not match
  const isMatch = await bcrypt.compare(password, doctor.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  // If admin has not approved the account
  if (!doctor.isApproved) {
    return res.status(403).json({ message: 'Admin has not approved your account yet.' });
  }

  // If account is declined
  if (doctor.declined) {
    return res.status(403).json({ message: 'Your account has been declined by admin.' });
  }

  // Create JWT token
  const token = jwt.sign(
    {
      userId: doctor._id,
      email: doctor.email,
      role: doctor.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.status(200).json({
    message: 'Login successful',
    token,
    doctor: {
      id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
    },
  });
}
