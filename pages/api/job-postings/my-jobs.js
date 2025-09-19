// pages/api/job-postings/my-jobs.ts

import dbConnect from '../../../lib/database';
import JobPosting from '../../../models/JobPosting';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId } = decoded;

    const jobs = await JobPosting.find({ postedBy: userId }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, jobs });
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
