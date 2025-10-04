// /api/auth/login.js
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import bcrypt from "bcryptjs";
import { signToken } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // find user (doctor or staff)
    const user = await User.findOne({ email });
    if (!user || !["staff", "doctor"].includes(user.role)) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // check approval for staff/doctor accounts
    if (!user.isApproved || user.declined) {
      return res.status(403).json({ success: false, message: "Account not approved" });
    }

    // check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // generate token with role
    const token = signToken(user); // signToken should include user.id + user.role

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
