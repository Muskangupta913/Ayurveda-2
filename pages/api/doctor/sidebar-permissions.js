// pages/api/doctor/sidebar-permissions.js
// Returns navigation items for doctor sidebar based on permissions
// For now, doctors see all their navigation items (no permission model yet)
// This can be extended later if needed
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import ClinicNavigationItem from "../../../models/ClinicNavigationItem";
import { getUserFromReq } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get the logged-in doctor user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }

    // Verify user is a doctor
    if (me.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Access denied. Doctor role required' });
    }

    // Get navigation items for doctor role
    const navigationItems = await ClinicNavigationItem.find({ 
      role: 'doctor', 
      isActive: true 
    }).sort({ order: 1 });

    // For now, doctors see all navigation items
    // This can be extended later with DoctorPermission model if needed
    return res.status(200).json({
      success: true,
      permissions: null,
      navigationItems: navigationItems.map(item => ({
        _id: item._id,
        label: item.label,
        path: item.path,
        icon: item.icon,
        description: item.description,
        order: item.order,
        moduleKey: item.moduleKey,
        subModules: item.subModules || []
      })),
      doctorId: me._id.toString()
    });

  } catch (error) {
    console.error('Error fetching doctor sidebar permissions:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}

