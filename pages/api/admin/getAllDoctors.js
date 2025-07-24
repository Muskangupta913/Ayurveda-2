import dbConnect from '../../../lib/database';
import DoctorProfile from '../../../models/DoctorProfile';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const doctorProfiles = await DoctorProfile.find()
      .populate('user', 'name email phone isApproved declined password') // ✅ include declined field
      .lean();

    res.status(200).json({ success: true, doctorProfiles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
