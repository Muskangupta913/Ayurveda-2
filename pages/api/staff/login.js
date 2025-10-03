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

    // find staff
    const staff = await User.findOne({ email, role: "staff" });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    // check approval
    if (!staff.isApproved || staff.declined) {
      return res.status(403).json({ success: false, message: "Staff account not approved" });
    }

    // check password
    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // generate token
    const token = signToken(staff);
    console.log("Generated token:", token); // Debugging line to check the token value

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      staff: { id: staff._id, name: staff.name, email: staff.email },
    });

  } catch (err) {
    console.error("Staff login error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
