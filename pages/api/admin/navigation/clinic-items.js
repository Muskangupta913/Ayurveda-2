// pages/api/admin/navigation/clinic-items.js
import dbConnect from "../../../../lib/database";
import ClinicNavigationItem from "../../../../models/ClinicNavigationItem";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await dbConnect();

  const allowedRoles = ['admin', 'clinic', 'doctor'];

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
    console.error('Invalid admin token for clinic navigation items:', error);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  if (req.method === 'GET') {
    try {
      const { role, includeAdmin } = req.query;
      const filter = { isActive: true };

      if (role) {
        const normalizedRole = String(role).toLowerCase();
        if (!allowedRoles.includes(normalizedRole)) {
          return res.status(400).json({ success: false, message: 'Invalid role parameter' });
        }
        if (normalizedRole === 'clinic') {
          filter.$or = [{ role: normalizedRole }, { role: { $exists: false } }];
        } else {
          filter.role = normalizedRole;
        }
      } else if (includeAdmin !== 'true') {
        filter.role = { $ne: 'admin' };
      }

      const items = await ClinicNavigationItem.find(filter).sort({ order: 1 });
      return res.status(200).json({ success: true, data: items });
    } catch (error) {
      console.error('Error fetching clinic navigation items:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        label,
        path,
        icon,
        description,
        badge,
        parentId,
        order,
        moduleKey,
        role = 'clinic',
        subModules,
      } = req.body;

      const normalizedRole = String(role).toLowerCase();
      if (!allowedRoles.includes(normalizedRole)) {
        return res.status(400).json({ success: false, message: 'Invalid role provided' });
      }

      const navigationItem = new ClinicNavigationItem({
        label,
        path,
        icon,
        description,
        badge,
        parentId,
        order,
        moduleKey,
        role: normalizedRole,
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
      const { id, role, ...updateData } = req.body;

      if (role) {
        const normalizedRole = String(role).toLowerCase();
        if (!allowedRoles.includes(normalizedRole)) {
          return res.status(400).json({ success: false, message: 'Invalid role provided' });
        }
        updateData.role = normalizedRole;
      }

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
