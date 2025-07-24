import dbConnect from '../../../lib/database';
import Treatment from '../../../models/Treatment';

export default async function handler(req, res) {
  await dbConnect();
  const { q } = req.query;

  if (!q) return res.status(400).json({ message: 'Query is required' });

  const regex = new RegExp(q, 'i');
  const results = await Treatment.find({ treatment_name: regex }).limit(10).lean();
  res.status(200).json({ success: true, treatments: results.map(t => t.treatment_name) });
}