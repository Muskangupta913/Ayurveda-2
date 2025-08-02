// pages/api/job-postings/toggle.ts

import dbConnect from '../../../lib/database';
import JobPosting from '../../../models/JobPosting';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).json({ message: 'Method not allowed' });

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId } = decoded;

    const { jobId, isActive } = req.body;

    const job = await JobPosting.findOne({ _id: jobId, postedBy: userId });
    if (!job) return res.status(404).json({ message: 'Job not found or unauthorized' });

    job.isActive = isActive;
    await job.save();

    return res.status(200).json({ success: true, job });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
