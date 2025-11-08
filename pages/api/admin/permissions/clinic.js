// pages/api/admin/permissions/clinic.js
import dbConnect from "../../../../lib/database";
import ClinicPermission from "../../../../models/ClinicPermission";
import Clinic from "../../../../models/Clinic";
import User from "../../../../models/Users";
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
      const { clinicId } = req.query;
      
      if (clinicId) {
        // Get specific clinic permissions
        const permissions = await ClinicPermission.findOne({ clinicId }).populate('clinicId', 'name');
        return res.status(200).json({ success: true, data: permissions });
      } else {
        // Get all clinic permissions
        const permissions = await ClinicPermission.find({ isActive: true })
          .populate('clinicId', 'name')
          .populate('grantedBy', 'name email');
        return res.status(200).json({ success: true, data: permissions });
      }
    } catch (error) {
      console.error('Error fetching clinic permissions:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { clinicId, permissions } = req.body;

      console.log('Received clinic permission request:', { clinicId, permissions });

      if (!clinicId || !permissions) {
        return res.status(400).json({ success: false, message: 'Clinic ID and permissions are required' });
      }

      // Validate permissions structure
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ success: false, message: 'Permissions must be an array' });
      }

      // Validate each permission object
      for (const permission of permissions) {
        if (!permission.module || typeof permission.module !== 'string') {
          return res.status(400).json({ success: false, message: 'Each permission must have a valid module' });
        }
        
        if (!permission.actions || typeof permission.actions !== 'object') {
          return res.status(400).json({ success: false, message: 'Each permission must have actions object' });
        }

        // Validate actions structure
        const requiredActions = ['all', 'create', 'read', 'update', 'delete', 'print', 'export', 'approve'];
        for (const action of requiredActions) {
          if (typeof permission.actions[action] !== 'boolean') {
            return res.status(400).json({ success: false, message: `Action '${action}' must be a boolean` });
          }
        }

        // Validate sub-modules if present
        if (permission.subModules && Array.isArray(permission.subModules)) {
          for (const subModule of permission.subModules) {
            if (!subModule.name || typeof subModule.name !== 'string') {
              return res.status(400).json({ success: false, message: 'Sub-module must have a valid name' });
            }
            if (!subModule.actions || typeof subModule.actions !== 'object') {
              return res.status(400).json({ success: false, message: 'Sub-module must have actions object' });
            }
          }
        }
      }

      // Verify clinic exists
      const clinic = await Clinic.findById(clinicId);
      if (!clinic) {
        return res.status(404).json({ success: false, message: 'Clinic not found' });
      }

      // Get admin user ID from token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      console.log('Creating/updating clinic permissions for clinic:', clinicId);
      
      // Create or update clinic permissions
      const clinicPermission = await ClinicPermission.findOneAndUpdate(
        { clinicId },
        {
          clinicId,
          permissions,
          grantedBy: decoded.userId,
          lastModified: new Date(),
          isActive: true
        },
        { upsert: true, new: true }
      );

      console.log('Clinic permission saved successfully:', clinicPermission._id);

      return res.status(200).json({ 
        success: true, 
        message: 'Clinic permissions updated successfully',
        data: clinicPermission 
      });
    } catch (error) {
      console.error('Error updating clinic permissions:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { clinicId } = req.body;

      if (!clinicId) {
        return res.status(400).json({ success: false, message: 'Clinic ID is required' });
      }

      await ClinicPermission.findOneAndUpdate(
        { clinicId },
        { isActive: false }
      );

      return res.status(200).json({ 
        success: true, 
        message: 'Clinic permissions deactivated successfully' 
      });
    } catch (error) {
      console.error('Error deactivating clinic permissions:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
