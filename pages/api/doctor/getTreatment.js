import dbConnect from '../../../lib/database';
import Treatment from '../../../models/Treatment';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
        const treatments = await Treatment.find({}).lean();
      return res.status(200).json({ treatments }); 
    } catch {
      console.error("Error fetching treatments:", error);
      return res.status(500).json({ message: 'Error fetching treatments' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
