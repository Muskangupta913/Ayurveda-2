import dbConnect from "../../../lib/database";
import jwt from "jsonwebtoken";
import PatientRegistration from "../../../models/PatientRegistration";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !["staff", "doctorStaff", "clinic", "admin"].includes(decoded.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const members = await PatientRegistration.find({ membership: "Yes" })
      .select("firstName lastName emrNumber package treatment amount paid advance pending")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: members, count: members.length });
  } catch (error) {
    console.error("/api/staff/members error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}


