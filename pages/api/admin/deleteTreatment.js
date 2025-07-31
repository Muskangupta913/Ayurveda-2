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
      // Find the treatment first to get its details
      const treatment = await Treatment.findById(id);
      if (!treatment) {
        return res.status(404).json({ message: 'Treatment not found' });
      }

      // Delete the treatment (this will also delete all its subcategories)
      const deleted = await Treatment.findByIdAndDelete(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Treatment not found' });
      }

      return res.status(200).json({ 
        message: `Treatment "${treatment.name}" and all its sub-treatments deleted successfully` 
      });
    } catch (error) {
      console.error('Error deleting treatment:', error);
      return res.status(500).json({ message: 'Error deleting treatment' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
