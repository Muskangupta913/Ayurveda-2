import dbConnect from '../../../lib/database';
import Treatment from '../../../models/Treatment';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Treatment ID is required' });
    }

    try {
      const deleted = await Treatment.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Treatment not found' });
      }

      return res.status(200).json({ message: 'Treatment deleted successfully' });
    } catch {
      return res.status(500).json({ message: 'Error deleting treatment' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
