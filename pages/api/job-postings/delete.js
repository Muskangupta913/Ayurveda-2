// pages/api/job-postings/delete.ts
import dbConnect from '../../../lib/database';
import JobPosting from '../../../models/JobPosting';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ message: 'Method not allowed' });

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { jobId } = req.query;

    const job = await JobPosting.findOne({ _id: jobId, postedBy: userId });

    if (!job) return res.status(404).json({ message: 'Job not found or not authorized' });

    await JobPosting.deleteOne({ _id: jobId });

    res.status(200).json({ success: true, message: 'Job deleted' });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token', error: err.message });
  }
}
