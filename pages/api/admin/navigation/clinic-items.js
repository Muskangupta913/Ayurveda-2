// pages/api/admin/navigation/clinic-items.js
import dbConnect from "../../../../lib/database";
import ClinicNavigationItem from "../../../../models/ClinicNavigationItem";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await dbConnect();

  // Verify admin token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  if (req.method === 'GET') {
    try {
      const items = await ClinicNavigationItem.find({ isActive: true }).sort({ order: 1 });
      return res.status(200).json({ success: true, data: items });
    } catch (error) {
      console.error('Error fetching clinic navigation items:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { label, path, icon, description, badge, parentId, order, moduleKey, subModules } = req.body;

      const navigationItem = new ClinicNavigationItem({
        label,
        path,
        icon,
        description,
        badge,
        parentId,
        order,
        moduleKey,
        subModules
      });

      await navigationItem.save();
      return res.status(201).json({ success: true, data: navigationItem });
    } catch (error) {
      console.error('Error creating clinic navigation item:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;
      const navigationItem = await ClinicNavigationItem.findByIdAndUpdate(id, updateData, { new: true });
      
      if (!navigationItem) {
        return res.status(404).json({ success: false, message: 'Clinic navigation item not found' });
      }

      return res.status(200).json({ success: true, data: navigationItem });
    } catch (error) {
      console.error('Error updating clinic navigation item:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      const navigationItem = await ClinicNavigationItem.findByIdAndUpdate(id, { isActive: false }, { new: true });
      
      if (!navigationItem) {
        return res.status(404).json({ success: false, message: 'Clinic navigation item not found' });
      }

      return res.status(200).json({ success: true, message: 'Clinic navigation item deactivated' });
    } catch (error) {
      console.error('Error deleting clinic navigation item:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
