// /pages/api/get-agents
import dbConnect from '../../../lib/database';
import User from '../../../models/Users';
import Clinic from '../../../models/Clinic';   // ✅ import Clinic
import { getUserFromReq, requireRole } from './auth';

export default async function handler(req, res) {
  await dbConnect();

  const me = await getUserFromReq(req);
  if (!me) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

if (!requireRole(me, ['clinic', 'agent'])) {
  return res.status(403).json({ success: false, message: 'Access denied' });
}
  // ✅ Find clinic owned by logged-in user
 let clinic;
if (me.role === 'clinic') {
  clinic = await Clinic.findOne({ owner: me._id });
} else if (me.role === 'agent') {
  clinic = await Clinic.findById(me.clinicId);
}

if (!clinic) {
  return res
    .status(400)
    .json({ success: false, message: 'Clinic not found for this user' });
}

  // ---------------- GET Agents ----------------
  if (req.method === 'GET') {
    try {
      const agents = await User.find({
        role: 'agent',
        clinicId: clinic._id,   // ✅ tied to clinic
      }).select('_id name email phone isApproved declined');

      return res.status(200).json({ success: true, agents });
    } catch (err) {
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

    // ✅ ensure agent belongs to this clinic
    const agent = await User.findOne({ _id: agentId, role: 'agent', clinicId: clinic._id });
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found or not in your clinic' });
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
      agent.password = newPassword;
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
