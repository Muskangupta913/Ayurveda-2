import dbConnect from '../../../lib/database'; // make sure this connects to MongoDB
import GetInTouch from '../../../models/GetInTouch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, phone, location, query } = req.body;

  if (!name || !phone || !location || !query) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  await dbConnect();

  try {
    const { name, phone, location, query } = req.body;

    if (!name || !phone || !location || !query) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newEntry = await GetInTouch.create({ name, phone, location, query });
    return res.status(201).json({ message: 'Query submitted successfully', data: newEntry });
  } catch (error) {
    console.error('❌ Error saving GetInTouch:', error); // Log full error
    return res.status(500).json({ message: 'Failed to submit query', error: error.message });
  }
}
