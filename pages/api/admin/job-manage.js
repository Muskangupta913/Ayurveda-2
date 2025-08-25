// pages/api/admin/jobs/manage.ts
import dbConnect from '../../../lib/database';
import JobPosting from '../../../models/JobPosting';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { role } = decoded;

    if (role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized, admin only' });
    }

    // Fetch jobs grouped by status
    const pendingJobs = await JobPosting.find({ status: 'pending' }).populate('postedBy', 'name email role');
    const approvedJobs = await JobPosting.find({ status: 'approved' }).populate('postedBy', 'name email role');
    const declinedJobs = await JobPosting.find({ status: 'declined' }).populate('postedBy', 'name email role');

    res.status(200).json({
      success: true,
      pending: pendingJobs,
      approved: approvedJobs,
      declined: declinedJobs,
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
}
