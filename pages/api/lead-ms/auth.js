// /lib/auth.js
import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";

export async function getUserFromReq(req) {
  await dbConnect();
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return null;

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload?.userId) return null;

    const user = await User.findById(payload.userId).lean();
    return user || null;
  } catch (e) {
    return null;
  }
}

export function signToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function requireRole(user, roles = []) {
  if (!user) return false;
  if (!roles.length) return true;
  return roles.includes(user.role);
}
