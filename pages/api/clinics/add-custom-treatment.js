import dbConnect from '../../../lib/database';
import Treatment from '../../../models/Treatment';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const { treatment_name } = req.body;

    if (!treatment_name) {
      return res.status(400).json({ message: 'Treatment name is required' });
    }

    try {
      const exists = await Treatment.findOne({ treatment_name });
      if (exists) {
        return res.status(409).json({ message: 'Treatment already exists' });
      }

      const treatment = new Treatment({ treatment_name });
      await treatment.save();

      return res.status(201).json({ message: 'Treatment added successfully', treatment });
    } catch {
      return res.status(500).json({ success: false, message: 'Failed to add treatment' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
