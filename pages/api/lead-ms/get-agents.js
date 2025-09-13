import dbConnect from '../../../lib/database';
import User from '../../../models/Users';
import { getUserFromReq, requireRole } from './auth';

export default async function handler(req, res) {
  try {
    // Connect to DB
    try {
      await dbConnect();
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Database connection failed', error: err.message });
    }

    // Authenticate user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }

    // Check role
    if (!requireRole(me, ['clinic'])) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only lead admins can perform this action' });
    }

    // ---------------- GET Agents ----------------
    if (req.method === 'GET') {
      try {
        const agents = await User.find({ role: 'agent' })
          .select('_id name email phone isApproved declined');
        return res.status(200).json({ success: true, agents });
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch agents', error: err.message });
      }
    }

    // ---------------- PATCH Approve/Decline ----------------
    if (req.method === 'PATCH') {
      const { agentId, action } = req.body;

      // Validate input
      if (!agentId || typeof agentId !== 'string') {
        return res.status(400).json({ success: false, message: 'agentId is required and must be a string' });
      }
      if (!action || !['approve', 'decline'].includes(action)) {
        return res.status(400).json({ success: false, message: 'action must be either "approve" or "decline"' });
      }

      let agent;
      try {
        agent = await User.findById(agentId);
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Invalid agentId format', error: err.message });
      }

      if (!agent) {
        return res.status(404).json({ success: false, message: 'Agent not found' });
      }
      if (agent.role !== 'agent') {
        return res.status(400).json({ success: false, message: 'The provided user is not an agent' });
      }

      // Update status
      if (action === 'approve') {
        if (agent.isApproved && !agent.declined) {
          return res.status(400).json({ success: false, message: 'Agent is already approved' });
        }
        agent.isApproved = true;
        agent.declined = false;
      } else if (action === 'decline') {
        if (agent.declined && !agent.isApproved) {
          return res.status(400).json({ success: false, message: 'Agent is already declined' });
        }
        agent.isApproved = false;
        agent.declined = true;
      }

      try {
        await agent.save();
        return res.status(200).json({ success: true, agent });
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update agent status', error: err.message });
      }
    }

    // ---------------- Invalid Method ----------------
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed. Only GET and PATCH are supported.`,
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unexpected server error', error: err.message });
  }
}
