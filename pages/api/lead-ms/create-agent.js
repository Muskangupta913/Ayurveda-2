import dbConnect from '../../../lib/database';
import User from '../../../models/Users';
import { getUserFromReq, requireRole } from '../lead-ms/auth';
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  await dbConnect();

  const me = await getUserFromReq(req);
  if (!requireRole(me, ['lead']))
    return res.status(403).json({ success: false, message: 'Forbidden' });

  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password)
    return res.status(400).json({ success: false, message: 'Missing fields' });
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
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
    return res.status(400).json({ success: false, message: e.message });
  }
}
