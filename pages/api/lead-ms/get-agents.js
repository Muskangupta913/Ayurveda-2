// /pages/api/get-agents
import dbConnect from '../../../lib/database';
import User from '../../../models/Users';
import Clinic from '../../../models/Clinic';   // ✅ import Clinic
import bcrypt from 'bcryptjs';
import { getUserFromReq, requireRole } from './auth';

export default async function handler(req, res) {
  await dbConnect();

  const me = await getUserFromReq(req);
  if (!me) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  // Allow admin, clinic, doctor, and agent roles
  if (!requireRole(me, ['admin', 'clinic', 'doctor', 'agent'])) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  // ---------------- GET Agents ----------------
  if (req.method === 'GET') {
    try {
      let query = { role: 'agent' };

      // Filter agents based on who is requesting
      if (me.role === 'admin') {
        // Admin sees all agents they created (without clinicId or with createdBy = admin)
        query.createdBy = me._id;
      } else if (me.role === 'clinic') {
        // Clinic sees agents from their clinic OR agents they created
        const clinic = await Clinic.findOne({ owner: me._id });
        if (clinic) {
          query.$or = [
            { clinicId: clinic._id },
            { createdBy: me._id }
          ];
        } else {
          // If no clinic found, only show agents they created
          query.createdBy = me._id;
        }
      } else if (me.role === 'doctor') {
        // Doctor sees agents from their clinic (if they have one) OR agents they created
        if (me.clinicId) {
          query.$or = [
            { clinicId: me.clinicId },
            { createdBy: me._id }
          ];
        } else {
          // If no clinicId, only show agents they created
          query.createdBy = me._id;
        }
      } else if (me.role === 'agent') {
        // Agent sees agents from their clinic
        if (me.clinicId) {
          query.clinicId = me.clinicId;
        } else {
          // If agent has no clinicId, return empty
          return res.status(200).json({ success: true, agents: [] });
        }
      }

      const agents = await User.find(query).select('_id name email phone isApproved declined clinicId createdBy');

      return res.status(200).json({ success: true, agents });
    } catch (err) {
      console.error('Error fetching agents:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch agents', error: err.message });
    }
  }

  // ---------------- PATCH Approve/Decline/Reset Password ----------------
  if (req.method === 'PATCH') {
    const { agentId, action, newPassword } = req.body;

    if (!agentId || typeof agentId !== 'string') {
      return res.status(400).json({ success: false, message: 'agentId is required and must be a string' });
    }
    if (!action || !['approve', 'decline', 'resetPassword'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be either "approve", "decline" or "resetPassword"' });
    }

    // Build query to find agent based on who is requesting
    let agentQuery = { _id: agentId, role: 'agent' };

    if (me.role === 'admin') {
      // Admin can only modify agents they created
      agentQuery.createdBy = me._id;
    } else if (me.role === 'clinic') {
      // Clinic can modify agents from their clinic OR agents they created
      const clinic = await Clinic.findOne({ owner: me._id });
      if (clinic) {
        agentQuery.$or = [
          { clinicId: clinic._id },
          { createdBy: me._id }
        ];
      } else {
        agentQuery.createdBy = me._id;
      }
    } else if (me.role === 'doctor') {
      // Doctor can modify agents from their clinic OR agents they created
      if (me.clinicId) {
        agentQuery.$or = [
          { clinicId: me.clinicId },
          { createdBy: me._id }
        ];
      } else {
        agentQuery.createdBy = me._id;
      }
    } else if (me.role === 'agent') {
      // Agent can only modify agents from their clinic
      if (me.clinicId) {
        agentQuery.clinicId = me.clinicId;
      } else {
        return res.status(403).json({ success: false, message: 'Agent has no clinic assigned' });
      }
    }

    const agent = await User.findOne(agentQuery);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found or you do not have permission to modify this agent' });
    }

    if (action === 'approve') {
      agent.isApproved = true;
      agent.declined = false;
    } else if (action === 'decline') {
      agent.isApproved = false;
      agent.declined = true;
    } else if (action === 'resetPassword') {
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Valid newPassword (min 6 chars) is required' });
      }
      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      agent.password = hashedPassword;
    }

    try {
      await agent.save();
      return res.status(200).json({ success: true, agent });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update agent status', error: err.message });
    }
  }

  return res.status(405).json({
    success: false,
    message: `Method ${req.method} not allowed. Only GET and PATCH are supported.`,
  });
}
