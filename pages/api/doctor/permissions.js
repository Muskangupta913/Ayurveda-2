// pages/api/doctor/permissions.js
// Returns permissions for doctor role
// For now, doctors have all permissions (no permission model yet)
// This can be extended later with DoctorPermission model if needed
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
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

    // For now, doctors have all permissions
    // Return a structure that matches what the frontend expects
    // The frontend checks for permissions array with module-based permissions
    return res.status(200).json({ 
      success: true, 
      data: {
        doctorId: me._id,
        permissions: [], // Empty array means all permissions (frontend handles this)
        isActive: true
      }
    });
  } catch (error) {
    console.error('Error fetching doctor permissions:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}

