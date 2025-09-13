import dbConnect from '../../../lib/database';
import User from '../../../models/Users';
import { getUserFromReq, requireRole } from '../lead-ms/auth';
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' });

  await dbConnect();

  const me = await getUserFromReq(req);
  if (!requireRole(me, ['clinic']))
    return res.status(403).json({ success: false, message: 'Forbidden' });

  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password)
    return res.status(400).json({ success: false, message: 'Missing fields' });

  try {
    // ✅ Check if an agent already exists with same email
    const existingAgent = await User.findOne({ email, role: 'agent' });
    if (existingAgent) {
      return res.status(400).json({
        success: false,
        message: 'An agent with this email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const agent = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'agent',
      isApproved: true,
    });

    await agent.save();

    return res.status(201).json({
      success: true,
      agent: { _id: agent._id, name: agent.name, email: agent.email },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
}
